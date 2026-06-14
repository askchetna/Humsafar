# Changelog

All notable changes to the Humsafar AI Ride Platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc1] - 2026-06-14

Release candidate for staging QA. Core ride-hailing platform operational with 54/54 E2E tests passing.

### Added

#### Backend
- Admin module: stats, user/ride lists, driver approval workflow, pending drivers API
- Payments module: create, complete, and list payments (cash flow MVP)
- Notifications module: in-app notifications with unread count and mark-read
- Fleet module: create fleet and assign drivers (admin)
- Ride pricing engine with distance-based fare estimation (`POST /rides/estimate`)
- Geocoding via OpenStreetMap Nominatim (`POST /rides/geocode`)
- Delivery ride type with package description support
- Retry dispatch engine (15s timeout, driver reassignment)
- JWT-authenticated WebSocket endpoints for riders and drivers
- Rate limiting on login (10/min) and ride request (20/min) per IP
- Optional Redis geo cache for driver locations (`REDIS_ENABLED`)
- Alembic migration scaffold for PostgreSQL deployment
- Structured logging configuration
- SQLite column auto-migration on startup
- Admin user seed script (`python -m app.scripts.create_admin`)
- `.env.example` with documented configuration keys

#### Frontend
- Public landing page at `/home`
- Admin dashboard with stats, pending driver approvals, fleet management
- Driver onboarding wizard (profile creation modal)
- Rider ride panel with fare estimate, delivery mode, and geocoded destinations
- Live map with pickup/drop markers and OSRM route polylines
- Notification bell with unread badge in navbar
- Post-ride cash payment UI
- `useLocation` hook, `constants.js`, and `map.js` utilities
- Consolidated `socketService` with JWT token, Vite proxy, and reconnect backoff

#### DevOps & QA
- GitHub Actions CI: backend import, E2E suite, frontend build and lint
- Live E2E test suite (`dev_testing/e2e_test.py`) — 54 automated checks
- CTO release audit documentation (`docs/CTO_RELEASE_AUDIT.md`)

### Changed

- WebSocket messages now send JSON objects (fixed double-encoding bug)
- Rider WebSocket is receive-only (removed cross-rider broadcast)
- Driver disconnect handler fixed (`disconnect_driver` instead of missing `disconnect`)
- `go-online` / `go-offline` require authenticated driver profile ownership
- Ride accept enforces assigned-driver authorization
- Driver approval defaults to `False` (admin must approve before dispatch)
- CORS origins configurable via `CORS_ORIGINS` environment variable
- Replaced deleted `api.js` / `socket.js` with `api/axios.js` and `services/socketService.js`
- Matching engine: 15 km radius filter, vehicle-type scoring, delivery driver preference
- `ProtectedRoute` redirects admin users to `/admin`

### Fixed

- Rider WebSocket connection using `user.user_id` instead of undefined `user.id`
- `fetchRide` not destructured in `RidePanel`
- Hardcoded WebSocket URL bypassing Vite proxy
- Hardcoded ride coordinates; now uses GPS + geocoding
- Payment API response serialization via Pydantic `response_model`
- Notification polling on public/unauthenticated routes
- E2E test helper SQLite path for driver approval fallback
- Duplicate SQLAlchemy `Base` removed from `session.py`
- `vehicle_number` persisted on driver profile creation

### Security

- WebSocket connections require valid JWT query parameter
- Unauthenticated `go-online` returns 401
- Admin role blocked from public registration API
- Invalid roles rejected at registration

### Deprecated

- `frontend/src/services/api.js` — replaced by `frontend/src/api/axios.js`
- `frontend/src/services/socket.js` — replaced by `frontend/src/services/socketService.js`

### Known Limitations (RC1)

- Payment gateway is simulated (cash only); no Stripe/JazzCash integration
- SQLite used in development; PostgreSQL required for production
- Geocoding depends on external Nominatim API availability
- In-memory rate limiter (not distributed); use Redis in production
- No SMS/OTP verification despite schema stubs
- Map UI not covered by automated browser tests

---

## [0.1.0] - Prior history

### Added
- Initial FastAPI backend with auth, drivers, vehicles, rides modules
- React frontend with rider and driver dashboards
- Leaflet map integration
- WebSocket connection manager and ride state machine
- Basic driver matching by distance scoring

[1.0.0-rc1]: https://github.com/your-org/humsafar/releases/tag/v1.0.0-rc1
