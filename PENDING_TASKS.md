# Pending Tasks - IndieGamerHub Production Launch

**Branch**: feat/production-readiness-fixes
**Priority Levels**: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 🔴 Critical Blockers — RESOLVED

1. **Admin panel status** — Investigated commit `8b25413`. The games/users management
   tabs were an intentional UI redesign (Steam curation focus), not a regression —
   the backend controllers/routes and client service methods were never removed,
   only the UI stopped rendering them. Decision: restored the tabs (see AdminPanel.jsx),
   reusing the already-working backend.
2. **Steam API legal risk** — The integration uses Valve's undocumented storefront API
   (gray area, no formal ToS, used by SteamDB etc. for years without issue). Decision:
   accept the risk, added a "not affiliated with Valve/Steam" footer disclaimer and a
   minimal `/privacy` page.
3. **Admin panel restoration** — Done as part of #1.

## 🟠 High Priority — DONE

- `npm install` (both packages) — fixed `pino-http@^8.7.1` in server/package.json,
  that version doesn't exist on npm; bumped to versions that actually resolve.
- `.env` setup — added `NODE_ENV`/`LOG_LEVEL` to existing `server/.env`; created a
  root `.env` for docker-compose (gitignored, dev-only defaults).
- Docker build — both images build clean.
- Docker compose test — full stack (mongo/server/client) verified end-to-end:
  health checks pass, Pino JSON logging confirmed, Helmet security headers confirmed,
  nginx→server API proxy confirmed. Fixed two bugs found during this test:
  `CLOUDINARY_NAME` → `CLOUDINARY_CLOUD_NAME` mismatch in docker-compose.yml, and
  a hardcoded host port 5000 that collided with a local dev server (now
  parametrized via `SERVER_HOST_PORT`).

## 🟡 Medium Priority

- CSP headers — validated during the docker-compose test (headers present, correctly
  scoped, no console violations observed).
- Rate limiting — added: 100 req/15min default on `/api`, 10 req/15min on `/api/auth`.
- Database indexing — added `Game.steamAppId` (admin curation upsert was doing a full
  collection scan) and `Review.game` (game detail page's review list wasn't served by
  the existing compound index).
- Integration tests — **skipped**. No test framework exists in either package, and the
  bug fixes were one-line operator changes (`||` → `??`); extracting them into testable
  pure functions purely for coverage would be new abstraction surface not otherwise
  needed. Correctness was instead verified by: syntax-checking every edited file,
  confirming both Docker images build (meaning Vite compiles the JSX with no errors),
  and manually re-grepping each fix. Add a real test runner (Vitest, since Vite's
  already the build tool) when there's enough surface area to justify the setup cost.

## 🟢 Low Priority

- CI/CD — added `.github/workflows/ci.yml`: lints + builds the client, syntax-checks
  the server, and builds both Docker images on every push/PR to main.
- Database backups — added `server/scripts/backup-db.sh` (mongodump wrapper, keeps
  last 14 backups). Wire it to cron/a scheduler when there's a real deployment target.
- Error tracking (Sentry/Rollbar), log aggregation (Datadog/ELK), APM — **not set up**.
  These need real third-party accounts and API keys that don't exist yet; faking the
  integration would just be dead code. Add when you actually sign up for one — see
  INFRASTRUCTURE.md for the wiring.
- Load testing — **not run**. No deployed environment to point it at yet; a load test
  against localhost measures Docker-for-Mac's network stack, not anything real. Run
  this once there's a staging deployment.

## Known pre-existing issues (not introduced by this branch, not fixed)

- `npm audit` on the server shows 5 vulnerabilities (cloudinary, express's `qs`
  dependency) — all require breaking major-version upgrades (Cloudinary 2.x,
  Express 5.x) that weren't part of the original bug list and weren't tested here.
  Flagging rather than blind-upgrading.
