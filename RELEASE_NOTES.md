# Humsafar v1.0.0-rc1 — Release Notes

**Tag:** `v1.0.0-rc1`  
**Date:** 2026-06-14  
**Status:** Release Candidate — Staging QA  
**Production:** Not approved (see checklist below)

---

## Overview

Humsafar v1.0.0-rc1 is the first release candidate of the AI Ride Platform. It delivers a complete ride-hailing MVP: rider and driver dashboards, admin operations, real-time WebSocket tracking, fare estimation, geocoding, notifications, fleet management, and delivery ride support.

This build is **approved for staging and QA environments**. It is **not** approved for public production deployment without completing the production checklist.

---

## Validation Summary

| Metric | Result |
|--------|--------|
| E2E automated tests | **54 / 54 passed (100%)** |
| Backend import check | Pass |
| Frontend production build | Pass |
| Production readiness score | **7.8 / 10** |
| SaaS multi-tenant readiness | 4 / 10 (single-tenant product) |

Run validation locally:

```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev

# E2E suite
python dev_testing/e2e_test.py
```

---

## What's Included

### Rider Experience
- Register / login with JWT authentication
- Request standard or delivery rides with fare estimate
- Address geocoding for destination pins
- Real-time ride status timeline (searching → completed)
- Live driver tracking on map with route polyline
- Ride history and post-trip cash payment
- In-app notifications

### Driver Experience
- Profile setup (license, vehicle type, plate number)
- Go online / offline with GPS location
- Incoming ride requests via WebSocket
- Accept → Arrive → Start → Complete workflow
- Location streaming to rider during active rides
- Ride history

### Admin Experience
- Dashboard with platform stats (users, drivers, revenue)
- Pending driver approval workflow
- Fleet creation and driver assignment
- Full ride and user visibility

### Platform Infrastructure
- REST API at `/api/v1/*`
- WebSocket at `/ws/rides/{id}` and `/ws/drivers/{id}` (JWT required)
- GitHub Actions CI pipeline
- Alembic scaffold for PostgreSQL migration
- Configurable CORS, Redis geo cache, rate limiting

---

## Upgrade / Install

### Requirements
- Python 3.11+
- Node.js 20+
- SQLite (dev) or PostgreSQL (staging/prod)

### Backend setup

```bash
cd backend
cp .env.example .env
# Edit JWT_SECRET and DATABASE_URL

pip install -r ../requirements.txt
uvicorn app.main:app --reload
```

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

### Create admin user

```bash
cd backend
python -m app.scripts.create_admin 03001234567 YourSecurePassword
```

### PostgreSQL (staging)

```bash
# Set in .env:
# DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/humsafar

cd backend
alembic upgrade head
```

---

## Breaking Changes from Pre-RC Builds

| Change | Migration |
|--------|-----------|
| `frontend/src/services/api.js` removed | Use `frontend/src/api/axios.js` |
| `frontend/src/services/socket.js` removed | Use `frontend/src/services/socketService.js` |
| WebSocket requires `?token=` query param | Update any custom WS clients |
| Drivers require admin approval | Approve via `/admin` before they receive rides |
| `go-online` requires Bearer token | Update any scripts calling this endpoint |

---

## Known Issues (RC1)

1. **Payment gateway** — Cash simulation only; no external payment processor
2. **Rate limiter** — In-memory per process; resets on restart
3. **Geocoding** — Depends on Nominatim; may fail offline or under rate limits
4. **Stale DB state** — Dev SQLite may accumulate test users; reset `humsafar.db` if dispatch behaves unexpectedly
5. **Browser E2E** — Map UI not tested headless; manual QA recommended

---

## Production Checklist (before v1.0.0 GA)

See **[`docs/COMMERCIAL_DEPLOYMENT.md`](docs/COMMERCIAL_DEPLOYMENT.md)** for the full commercial deployment runbook:

- Demo checklist, VPS/Docker deploy, domain + SSL
- Backup, monitoring, business packaging, investor demo script

Quick gates:

- [ ] Set strong `JWT_SECRET` in production environment
- [ ] Deploy PostgreSQL and run Alembic migrations
- [ ] Enable Redis (`REDIS_ENABLED=true`)
- [ ] Restrict `CORS_ORIGINS` to production domain
- [ ] Integrate real payment gateway
- [ ] Add monitoring (Sentry/Uptime) and HTTPS/WAF
- [ ] Complete manual QA on map and mobile browsers
- [ ] Docker or VPS deploy verified (`docker compose up -d --build`)

---

## Documentation

| Document | Purpose |
|----------|---------|
| `CHANGELOG.md` | Full version history |
| `docs/COMMERCIAL_DEPLOYMENT.md` | **Commercial deploy, demo, investor script** |
| `docs/CTO_RELEASE_AUDIT.md` | Architecture audit and production readiness |
| `backend/.env.example` | Environment variable reference |
| `docker-compose.yml` | Docker production stack |
| `dev_testing/e2e_test.py` | Automated regression suite |

---

## Contributors

Built by the Humsafar engineering team.

---

## Feedback

Report issues against the `v1.0.0-rc1` milestone before GA sign-off.

**Next planned release:** `v1.0.0` (GA) — pending production checklist completion.
