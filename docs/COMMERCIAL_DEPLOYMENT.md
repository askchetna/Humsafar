# Humsafar — Commercial Deployment Guide

**Version:** v1.0.0-rc1  
**Audience:** Product, DevOps, Sales, Investors  
**Scope:** Single-tenant commercial ride platform (not multi-tenant SaaS)

This is the canonical operations and go-to-market runbook. Related docs:

| Document | Purpose |
|----------|---------|
| [`RELEASE_NOTES.md`](../RELEASE_NOTES.md) | RC1 features and breaking changes |
| [`CHANGELOG.md`](../CHANGELOG.md) | Version history |
| [`CTO_RELEASE_AUDIT.md`](CTO_RELEASE_AUDIT.md) | Technical audit and readiness score |

---

## Table of Contents

1. [Demo Checklist](#1-demo-checklist)
2. [Production Deployment Guide](#2-production-deployment-guide)
3. [VPS Deployment](#3-vps-deployment)
4. [Docker Deployment](#4-docker-deployment)
5. [Domain Setup](#5-domain-setup)
6. [SSL Setup](#6-ssl-setup)
7. [Backup Strategy](#7-backup-strategy)
8. [Monitoring Setup](#8-monitoring-setup)
9. [Business Packaging](#9-business-packaging)
10. [Investor Demo Script](#10-investor-demo-script)

---

## 1. Demo Checklist

Use this before every client demo, investor pitch, or city pilot launch.

### Environment prep (T-24h)

- [ ] Deploy latest `v1.0.0-rc1` tag (Docker or VPS)
- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] PostgreSQL running; Alembic at head
- [ ] Redis enabled (`REDIS_ENABLED=true`)
- [ ] HTTPS active on production domain
- [ ] CORS locked to demo domain only
- [ ] Run `python dev_testing/e2e_test.py` → expect **54/54 pass**
- [ ] Create admin: `python -m app.scripts.create_admin`
- [ ] Seed 2 demo accounts (rider + driver) with known passwords
- [ ] Approve demo driver in `/admin`
- [ ] Place demo driver **online** at demo city coordinates
- [ ] Verify map loads (OpenStreetMap tiles reachable)
- [ ] Verify geocoding (Nominatim reachable)
- [ ] Clear stale test rides from database if needed

### Demo accounts (recommended)

| Role | Phone | Notes |
|------|-------|-------|
| Admin | `03001234567` | Full dashboard access |
| Rider | `03001111111` | Pre-registered, logged in on Device A |
| Driver | `03002222222` | Approved, online on Device B |

### Live demo flow (15 min)

- [ ] Landing page `/home` loads with branding
- [ ] Rider login → map detects GPS (or use fixed city)
- [ ] Enter pickup + destination → fare estimate appears
- [ ] Request ride → status moves searching → assigned
- [ ] Driver receives WebSocket notification
- [ ] Driver accepts → rider sees status update
- [ ] Driver marks arrived → start → complete
- [ ] Rider pays (cash flow) → notification received
- [ ] Admin dashboard shows stats increment
- [ ] Show ride history on both sides

### Fallback plan

- [ ] Pre-recorded screen capture if GPS fails
- [ ] Second browser tab with driver already online
- [ ] Local fallback coordinates: Pune `18.5204, 73.8567`

---

## 2. Production Deployment Guide

### Architecture (commercial single-tenant)

```
                    ┌─────────────┐
   Users ──HTTPS──► │   Nginx     │  (web container / VPS)
                    │  :443/:80   │
                    └───┬────┬────┘
                        │    │
              /api,/ws  │    │  static SPA
                        ▼    ▼
                   ┌─────────┐  ┌──────────┐
                   │ FastAPI │  │  React   │
                   │  :8000  │  │  build   │
                   └────┬────┘  └──────────┘
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
      PostgreSQL     Redis      (optional
       (primary)    (geo cache)  S3/logs)
```

### Pre-flight checklist

| Step | Action |
|------|--------|
| 1 | Tag release: `v1.0.0-rc1` or GA tag |
| 2 | Copy `backend/.env.example` → `backend/.env` |
| 3 | Set `DATABASE_URL` to PostgreSQL (not SQLite) |
| 4 | Set `JWT_SECRET` (never commit) |
| 5 | Set `CORS_ORIGINS=https://yourdomain.com` |
| 6 | Set `REDIS_ENABLED=true` |
| 7 | Run `alembic upgrade head` from `backend/` |
| 8 | Create admin user via script |
| 9 | Build frontend (`npm run build`) or use Docker `web` service |
| 10 | Configure reverse proxy with WebSocket upgrade |
| 11 | Enable TLS (Let's Encrypt) |
| 12 | Run E2E suite against production URL |
| 13 | Enable backups and monitoring (sections 7–8) |

### Environment variables (production)

See [`backend/.env.example`](../backend/.env.example). Critical values:

```env
APP_NAME=Humsafar
DATABASE_URL=postgresql+psycopg2://user:pass@postgres:5432/humsafar
JWT_SECRET=<64-char-random-hex>
CORS_ORIGINS=https://app.yourdomain.com
REDIS_ENABLED=true
REDIS_URL=redis://redis:6379/0
GEOCODING_ENABLED=true
```

### Process model

| Component | Production command |
|-----------|-------------------|
| API | `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2` |
| Frontend | Nginx serving `frontend/dist` |
| DB migrations | `cd backend && alembic upgrade head` |
| Admin seed | `python -m app.scripts.create_admin` |

### Go-live gates

- E2E 100% pass on staging
- SSL A+ rating (SSLLabs)
- Backup restore tested once
- On-call contact defined
- Rollback plan documented (previous Docker image tag)

---

## 3. VPS Deployment

Target: Ubuntu 22.04/24.04 LTS, 2 vCPU, 4 GB RAM minimum (8 GB recommended).

### Step 1 — Server bootstrap

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ufw nginx certbot python3-certbot-nginx
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Step 2 — Install runtime

```bash
# Docker (recommended on VPS)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# OR native Python + Node
sudo apt install -y python3.11 python3.11-venv postgresql redis-server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 3 — Clone and configure

```bash
git clone <your-repo> /opt/humsafar
cd /opt/humsafar
git checkout v1.0.0-rc1

cp backend/.env.example backend/.env
nano backend/.env   # set production values
```

### Step 4 — Docker path (recommended)

```bash
cd /opt/humsafar
export POSTGRES_PASSWORD=$(openssl rand -hex 16)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> backend/.env

docker compose up -d --build
docker compose exec api alembic upgrade head
docker compose exec api python -m app.scripts.create_admin 03001234567 'YourSecurePass'
```

### Step 5 — Native path (alternative)

```bash
cd /opt/humsafar
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cd backend && alembic upgrade head
python -m app.scripts.create_admin 03001234567 'YourSecurePass'

cd ../frontend && npm ci && npm run build
sudo cp -r dist/* /var/www/humsafar/
```

Configure Nginx (see section 5–6) to proxy `/api`, `/ws`, and serve SPA.

### Step 6 — Systemd service (native API)

```ini
# /etc/systemd/system/humsafar-api.service
[Unit]
Description=Humsafar API
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/opt/humsafar/backend
Environment=PYTHONPATH=/opt/humsafar/backend
EnvironmentFile=/opt/humsafar/backend/.env
ExecStart=/opt/humsafar/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now humsafar-api
```

---

## 4. Docker Deployment

Files included in this repository:

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Full stack: postgres, redis, api, web |
| `backend/Dockerfile` | FastAPI application |
| `frontend/Dockerfile` | Multi-stage build + Nginx |
| `docker/nginx.conf` | SPA + API + WebSocket proxy |

### Quick start (local/staging)

```bash
cp backend/.env.example backend/.env
# Edit JWT_SECRET and POSTGRES_PASSWORD

docker compose up -d --build
docker compose logs -f api

# Migrations + admin
docker compose exec api alembic upgrade head
docker compose exec api python -m app.scripts.create_admin 03001234567 admin123
```

Open `http://localhost` (port 80).

### Production Docker on VPS

```bash
export HTTP_PORT=80
export POSTGRES_PASSWORD=$(openssl rand -hex 16)
export CORS_ORIGINS=https://app.yourdomain.com

docker compose -f docker-compose.yml up -d --build
```

### Useful commands

```bash
docker compose ps
docker compose logs api --tail=100
docker compose restart api
docker compose exec postgres pg_dump -U humsafar humsafar > backup.sql
docker compose pull && docker compose up -d --build   # upgrade
```

### Rollback

```bash
git checkout v1.0.0-rc1
docker compose up -d --build
```

---

## 5. Domain Setup

### DNS records

Replace `yourdomain.com` with your commercial domain.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `<VPS_IP>` | 300 |
| A | `app` | `<VPS_IP>` | 300 |
| A | `api` | `<VPS_IP>` | 300 (optional subdomain) |
| CNAME | `www` | `app.yourdomain.com` | 300 |

**Recommended layout:**

| URL | Serves |
|-----|--------|
| `https://app.yourdomain.com` | Rider/Driver/Admin SPA + proxied API |
| `https://yourdomain.com` | Redirect → `app.yourdomain.com` |

### Nginx server block (VPS native)

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    root /var/www/humsafar;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Update `CORS_ORIGINS` in `.env` to match `https://app.yourdomain.com`.

---

## 6. SSL Setup

### Option A — Certbot + Nginx (VPS)

```bash
sudo certbot --nginx -d app.yourdomain.com -d yourdomain.com
sudo certbot renew --dry-run
```

Certbot auto-renews via systemd timer. Force HTTPS redirect is added automatically.

### Option B — Docker + Certbot sidecar

Mount certificates into Nginx:

```bash
sudo certbot certonly --standalone -d app.yourdomain.com
# Copy certs or use nginx-proxy / traefik for automatic TLS
```

For production at scale, consider **Cloudflare** (DNS + SSL proxy + DDoS).

### SSL hardening checklist

- [ ] TLS 1.2+ only
- [ ] HSTS header enabled (`max-age=31536000`)
- [ ] HTTP → HTTPS redirect
- [ ] WebSocket works over `wss://`
- [ ] Mixed content none (all assets HTTPS)
- [ ] `JWT_SECRET` rotated from default

### Verify

```bash
curl -I https://app.yourdomain.com/health
# WebSocket test: open rider dashboard, confirm live connection
```

---

## 7. Backup Strategy

### What to back up

| Asset | Priority | Method |
|-------|----------|--------|
| PostgreSQL database | **P0** | `pg_dump` daily |
| Redis AOF | P1 | RDB/AOF volume snapshot |
| `.env` secrets | **P0** | Encrypted vault (not git) |
| Application code | P2 | Git tags |
| Nginx/SSL certs | P1 | Certbot auto-renew + archive |

### Automated PostgreSQL backup (cron)

```bash
# /etc/cron.d/humsafar-backup
0 2 * * * root docker compose -f /opt/humsafar/docker-compose.yml exec -T postgres \
  pg_dump -U humsafar humsafar | gzip > /backups/humsafar_$(date +\%F).sql.gz

# Retain 14 days
0 3 * * * root find /backups -name 'humsafar_*.sql.gz' -mtime +14 -delete
```

### Restore procedure

```bash
gunzip -c /backups/humsafar_2026-06-14.sql.gz | \
  docker compose exec -T postgres psql -U humsafar humsafar
```

### RTO / RPO targets (commercial MVP)

| Metric | Target |
|--------|--------|
| RPO (max data loss) | 24 hours |
| RTO (max downtime) | 4 hours |
| Backup test frequency | Monthly restore drill |

### Off-site backup

Sync `/backups/` to S3, Backblaze B2, or Azure Blob with lifecycle rules.

---

## 8. Monitoring Setup

### Health endpoints (built-in)

| Endpoint | Expected |
|----------|----------|
| `GET /health` | `{"status":"ok"}` |
| `GET /` | API root JSON |
| Frontend `/home` | HTTP 200 |

### Minimum viable monitoring stack

| Tool | Purpose | Cost |
|------|---------|------|
| **Uptime Kuma** (self-hosted) | Uptime + alerts | Free |
| **Sentry** | Error tracking (API) | Free tier |
| **Docker logs** | `docker compose logs` | Free |
| **PostgreSQL** | `pg_stat_activity` | Free |

### Uptime checks to configure

1. `https://app.yourdomain.com/health` — every 60s
2. `https://app.yourdomain.com/home` — every 5 min
3. WebSocket smoke test — daily cron calling E2E suite

### Alert channels

- Email for P2 (degraded)
- SMS/WhatsApp for P1 (down > 5 min)
- Slack webhook for engineering team

### Key metrics to watch

| Metric | Warning | Critical |
|--------|---------|----------|
| API response time | > 2s p95 | > 5s p95 |
| Error rate (5xx) | > 1% | > 5% |
| Disk usage | > 70% | > 90% |
| PostgreSQL connections | > 80% pool | exhausted |
| Active WebSocket connections | drop > 50% | drop > 90% |
| Failed ride dispatch | > 10/hr | > 50/hr |

### Log aggregation (optional)

```bash
# Ship Docker logs to file
docker compose logs -f api >> /var/log/humsafar/api.log 2>&1
```

For scale, add **Grafana + Loki** or **Datadog**.

---

## 9. Business Packaging

### Product positioning

**Humsafar** — AI-powered ride and delivery platform for emerging markets. White-label ready for city operators, fleet owners, and transport unions.

### Commercial tiers (suggested)

| Tier | Target | Includes | Price model |
|------|--------|----------|-------------|
| **Pilot** | 1 city, ≤50 drivers | Core ride + admin + 30 days support | Fixed setup fee + monthly |
| **Growth** | 1 region, ≤500 drivers | + Delivery + Fleet + Redis + SLA 99.5% | Monthly SaaS fee + per-ride fee |
| **Enterprise** | Multi-city operator | + Custom domain + priority support + analytics export | Annual contract |

### Revenue levers (current platform)

| Stream | Status in RC1 |
|--------|---------------|
| Per-ride commission | Ready (track via admin stats) |
| Driver subscription | Manual (no billing module) |
| Delivery surcharge | Ready (delivery ride type + pricing) |
| Fleet management fee | Ready (fleet module) |
| Payment processing margin | **Not ready** — cash only |

### Legal/compliance checklist (commercial)

- [ ] Terms of Service + Privacy Policy published
- [ ] Driver independent contractor agreement
- [ ] Insurance documentation (motor/carrier liability)
- [ ] Local transport authority permits
- [ ] Data protection registration (GDPR/local equivalent)
- [ ] PCI scope assessment if adding card payments

### Sales collateral bundle

| Asset | Location |
|-------|----------|
| Release notes | `RELEASE_NOTES.md` |
| Technical audit | `docs/CTO_RELEASE_AUDIT.md` |
| Demo checklist | Section 1 (this doc) |
| E2E proof | `dev_testing/e2e_test.py` + `report.md` |
| Architecture diagram | `docs/CTO_RELEASE_AUDIT.md` |

### White-label knobs (no code change)

- Landing page copy (`frontend/src/pages/Home.jsx`)
- Brand color (Tailwind amber → client color)
- Domain + SSL on client domain
- `APP_NAME` env variable

---

## 10. Investor Demo Script

**Duration:** 12–15 minutes  
**Audience:** Angels, seed VCs, strategic transport partners  
**Devices:** Laptop (presenter) + phone (driver simulation)

### Opening (1 min)

> "Humsafar is a production-ready ride and delivery platform — think Uber-grade dispatch, built for markets where fleet operators need control, not just an app store listing. We're at release candidate with 54 automated tests passing and a full admin operations layer."

### Problem (1 min)

> "Legacy operators run on phone calls and WhatsApp. Riders want live tracking and fair fares. Drivers want steady dispatch. Admins have zero visibility. Existing global apps don't localize fleet relationships."

### Live demo (8 min)

| Min | Action | Talk track |
|-----|--------|------------|
| 0:00 | Open `app.yourdomain.com/home` | "Public landing — white-label ready." |
| 0:30 | Login as **rider** | "Phone + password auth, JWT secured." |
| 1:00 | Show map + GPS | "Real-time Leaflet map, OpenStreetMap." |
| 1:30 | Enter destination, show fare | "Distance-based pricing + geocoding — no guesswork." |
| 2:00 | Request ride | "Dispatch engine finds nearest approved driver." |
| 2:30 | Switch to **driver** phone | "Driver gets instant WebSocket notification." |
| 3:00 | Driver accepts | "Full state machine — assigned, accepted, arrived, started, completed." |
| 4:00 | Show rider map tracking | "Live driver location streamed over authenticated WebSocket." |
| 5:00 | Complete ride + payment | "Cash flow today; payment gateway is next sprint." |
| 5:30 | Open **admin** dashboard | "Operator sees users, revenue, pending driver KYC." |
| 6:00 | Approve a pending driver | "Fleet onboarding is controlled — not open marketplace chaos." |
| 6:30 | Show delivery ride type | "Same platform handles parcel delivery." |
| 7:00 | Mention fleet module | "Fleet owners assign drivers to managed groups." |

### Technology proof (2 min)

> "Under the hood: FastAPI, React, PostgreSQL, Redis geo cache, Docker-deployable, CI pipeline, Alembic migrations, rate limiting, and a 54-test E2E suite. Production readiness score: 7.8 out of 10 at RC1."

Show (optional, 30 sec): GitHub CI green, E2E report 54/54.

### Business model (2 min)

> "We charge a setup fee for city pilots, monthly platform fee, and per-ride commission. Delivery and fleet modules increase ARPU. Payment integration unlocks processing margin."

### Traction / roadmap (1 min)

> "RC1 is staging-approved. GA blocked on payment gateway and production hardening — 4–6 weeks. Target: 1 city pilot with 100 drivers."

### Close (1 min)

> "We're raising [X] to fund GA launch, first city pilot, and driver acquisition. Happy to run a live ride in your city coordinates right now."

### Q&A prep

| Question | Answer |
|----------|--------|
| How is this different from Uber? | Fleet-controlled, white-label, operator admin layer |
| Is it production-ready? | RC1 — staging yes, GA after payment + PCI |
| Can it scale? | PostgreSQL + Redis + Docker; horizontal API scaling next |
| Revenue today? | Pre-revenue; platform ready for pilot contracts |
| Team? | [Your team slide] |
| Ask? | [Your raise amount and use of funds] |

---

## Quick Reference Commands

```bash
# Full Docker deploy
docker compose up -d --build
docker compose exec api alembic upgrade head
docker compose exec api python -m app.scripts.create_admin <phone> <password>

# E2E validation
python dev_testing/e2e_test.py

# Backup
docker compose exec -T postgres pg_dump -U humsafar humsafar | gzip > backup.sql.gz

# SSL
sudo certbot --nginx -d app.yourdomain.com
```

---

*Maintained by Product CTO — update this document when deployment topology changes.*
