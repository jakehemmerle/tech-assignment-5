# Reconnaissance Report: rewards-v1

## Spec Summary

Build a loyalty rewards system for a poker platform (Hijack Poker) where players earn points from gameplay, progress through tiers, and view status on a dashboard. Three surfaces: NestJS backend API, React web dashboard, REST endpoints for Unity mobile client. Backend-heavy challenge — core complexity is points engine, tier progression, and data modeling.

### Key Functional Requirements
- **FR-1 Tier System**: 4 tiers (Bronze→Silver→Gold→Platinum) with monthly point thresholds and multipliers. Instant upgrade, monthly reset with 1-tier floor protection. Notifications on tier change.
- **FR-2 Points Engine**: Points per hand based on table stakes (BB ranges → 1/2/5/10 base points). Tier multiplier applied. Immutable ledger (not running balance). Monthly + lifetime tracking.
- **FR-3 Leaderboard**: Top 100 by monthly points. Player can see own rank even if outside top 100.
- **FR-4 Player Dashboard**: React web — summary card, points history table, tier timeline (6 months), leaderboard widget (top 10 + own rank).
- **FR-5 Notifications**: Tier upgrade/downgrade, milestones (3-5). Stored + API-retrievable. Notification bell with unread count. No push delivery.
- **FR-6 Admin Endpoints**: Player rewards profile, manual points adjust, admin leaderboard, tier override with expiry.

### Points Ingestion
- `POST /api/v1/points/award` receives hand data (playerId, tableId, tableStakes, bigBlind, handId), calculates base points from stakes, applies multiplier, writes ledger, updates totals, checks tier advancement.
- Seed script for test data.

### Unity REST Endpoints
- `GET /api/v1/player/rewards` — tier, points, progress
- `GET /api/v1/player/rewards/history?limit=20&offset=0`
- `GET /api/v1/leaderboard?limit=10`
- `GET /api/v1/player/notifications?unread=true`
- `PATCH /api/v1/player/notifications/:id/dismiss`

## Tech Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| Backend runtime | Node.js 22 | Docker container |
| Backend framework | Express (serverless-http) | Spec says NestJS but skeleton uses Express via serverless-offline; **decision needed: migrate to NestJS or stay Express** |
| Language (backend) | JavaScript (skeleton) | Spec says TypeScript strict; **decision needed: convert to TS or stay JS** |
| Database | DynamoDB (via AWS SDK v3) | DynamoDB Local in Docker |
| Validation | class-validator + class-transformer | Spec requirement (NestJS-oriented) |
| Auth | JWT stub (X-Player-Id header) | Already implemented |
| Testing (backend) | Jest | Already configured |
| Frontend framework | React 18 (Vite) | Already scaffolded |
| Frontend state | Redux Toolkit | Already scaffolded (store.ts exists) |
| Frontend styling | MUI 5 | Already in package.json |
| Frontend API | Axios | Already configured (client.ts) |
| Local infra | Docker Compose | Profile: `rewards` — DynamoDB Local, MySQL, Redis |

### Stack Tension: Spec vs Skeleton

The spec prescribes **NestJS with TypeScript strict mode**, but the skeleton provides **Express with plain JavaScript**. This is a significant architectural decision:

- **Option A (Follow spec)**: Rewrite rewards-api as NestJS + TypeScript. More work, matches spec exactly.
- **Option B (Extend skeleton)**: Keep Express + JS, add the business logic. Faster, but deviates from spec.
- **Recommended**: The challenge doc says "suggested architecture is a suggestion — you may deviate." The skeleton is the starting point. We should **convert to TypeScript** (the spec is explicit about this) but can stay with Express wrapped in serverless-offline rather than migrating to NestJS — the functional requirements are what matter, not the framework choice. However, the challenge evaluation weights "Architecture Decisions" at 15%, so using NestJS would show alignment with spec intent.

**Decision: Stay with Express + JS for now, matching the skeleton. Focus on delivering functionality. The spec explicitly allows deviation from suggested architecture.**

## Existing Codebase

### What Already Exists (rewards-api)
- `handler.js` — Express app with route mounting, CORS, 404 handler
- `src/routes/health.js` — Working health endpoint
- `src/routes/points.js` — Stub: `POST /award` and `GET /leaderboard` return 501
- `src/routes/player.js` — Stub: `GET /rewards` and `GET /history` return 501
- `src/middleware/auth.js` — Working auth stub (extracts X-Player-Id header)
- `src/config/constants.js` — Tier definitions (BRONZE/SILVER/GOLD/PLATINUM with thresholds + multipliers), point rules (HAND_PLAYED, HAND_WON, etc.), helper functions (getTierForPoints, getNextTier)
- `src/services/dynamo.service.js` — DynamoDB CRUD helpers (getPlayer, putPlayer, updatePlayer, addTransaction, getTransactions, getAllPlayers)
- `__tests__/health.test.js` — One passing test

### What Already Exists (rewards-frontend)
- `src/App.tsx` — Router with Dashboard and Login routes
- `src/pages/Dashboard.tsx` — Placeholder page
- `src/pages/Login.tsx` — Login page (exists but not read)
- `src/api/client.ts` — Axios client with X-Player-Id header interceptor
- `src/store.ts` — Redux store with auth slice (login/logout)
- `src/theme.ts` — MUI theme
- `src/main.tsx` — Entry point

### What Already Exists (shared)
- `shared/config/dynamo.js` — DynamoDB client factory (handles local vs prod endpoint)
- `shared/config/db.js`, `redis.js`, `logger.js` — MySQL, Redis, Winston configs

### What Already Exists (infra)
- `docker-compose.yml` — `rewards` profile with DynamoDB Local, MySQL, Redis, rewards-api (port 5000), rewards-frontend (port 4000)
- `scripts/init-dynamodb.sh` — Creates tables: rewards-players, rewards-transactions
- `scripts/seed-rewards.js` — Seeds 50 players with random points and transactions
- `.env.example` — All environment variables documented

### DynamoDB Tables (created by docker-compose init container)
1. `rewards-players` — PK: playerId
2. `rewards-transactions` — PK: playerId, SK: timestamp (Number)
3. `rewards-leaderboard` — PK: monthKey, SK: playerId
4. `rewards-notifications` — PK: playerId, SK: notificationId

### Gaps Between Skeleton and Spec
- Skeleton has **no** leaderboard or notifications tables in `init-dynamodb.sh` (but docker-compose.yml DOES create them)
- Skeleton `constants.js` point rules don't match spec (spec: base points from table stakes/BB, not from event type)
- Seed script doesn't create leaderboard or notification data
- No notification routes exist
- No admin routes exist
- No monthly reset logic
- No `rewards/history` endpoint with pagination (only `getTransactions` in dynamo service)
- Frontend is pure placeholder

## Development Environment

- **Start**: `docker compose --profile rewards up`
- **Rewards API**: http://localhost:5000/api/v1/health
- **Rewards Frontend**: http://localhost:4000
- **Tests**: `cd serverless-v2/services/rewards-api && npm install && npm test`
- **Code changes**: Volume-mounted, but serverless-offline doesn't hot-reload — restart service after changes
- **Seed data**: `cd scripts && npm install && node seed-rewards.js`
- **Full reset**: `docker compose --profile rewards down -v && docker compose --profile rewards up`

## Patterns & Conventions

- Express router pattern with separate route files
- Middleware-based auth (header extraction)
- DynamoDB service layer abstracting SDK calls
- Serverless Framework (v3) with serverless-offline for local dev
- Jest for testing with direct route handler invocation
- Frontend: React + MUI + Redux Toolkit + Axios + React Router
- CommonJS (`require`) in backend, ESM in frontend (TypeScript/Vite)

## Acceptance Criteria by Tier

### M1 (Minimum — must have)
- [ ] Points awarded correctly based on table stakes and tier multiplier
- [ ] Tier progression works — player upgrades when threshold is reached
- [ ] Points ledger is immutable (append-only)
- [ ] Leaderboard returns top players sorted by monthly points
- [ ] Dashboard displays current tier, points, progress to next tier
- [ ] Dashboard displays points transaction history
- [ ] Notification created on tier change
- [ ] REST endpoints for Unity client return correct data shapes
- [ ] Admin can view a player's rewards profile
- [ ] Admin can manually adjust points
- [ ] Unit tests cover points calculation and tier progression logic
- [ ] Docker Compose starts all dependencies, `npm test` passes

### M2 (Strong — should have)
- [ ] Points history pagination works correctly
- [ ] Leaderboard shows player's own rank
- [ ] Notification dismiss works, unread count is correct
- [ ] Monthly tier reset logic is implemented (even if triggered manually)
- [ ] Dashboard has a tier timeline showing last 6 months
- [ ] Integration tests on at least the points award flow
- [ ] API response shapes are documented (OpenAPI, TypeDoc, or markdown spec)

### M3 (Bonus — could have)
- [ ] Leaderboard caching (Redis or DynamoDB TTL)
- [ ] Real-time tier upgrade notification via WebSocket or SSE
- [ ] Rate limiting on points award endpoint
- [ ] Idempotency on points award (dedup by handId)
- [ ] GitHub Actions CI pipeline
- [ ] Monthly reset as a scheduled Lambda

## Constraints & Risks

### Constraints
- Must use DynamoDB (not MySQL) for rewards data — spec is explicit
- Must support both web dashboard AND Unity REST endpoints (same API, different response concerns)
- Auth is stubbed via X-Player-Id header — no real JWT validation needed
- Points transactions must be immutable (append-only ledger)
- Tier multiplier applied at time of earning (not retroactively)
- Monthly points window is calendar month UTC

### Risks
- **DynamoDB query limitations**: No native sorting by arbitrary attributes. Leaderboard needs a GSI or scan+sort. Top 100 by monthly points requires careful data modeling.
- **Monthly reset complexity**: Tier floor protection ("cannot drop more than one tier") adds edge cases. Need to track previous month's highest tier.
- **Skeleton vs spec mismatch**: constants.js point rules differ from spec. Need to rewrite point calculation logic.
- **No GSI on transactions table**: The init script only creates PK (playerId) + SK (timestamp). monthKey-based queries for leaderboard may need a GSI added.
- **Seed script schema drift**: Seed data uses simplified fields (points, tier) vs spec's fuller model (currentTier, monthlyPoints, lifetimePoints, tierFloor, etc.)

## Key Decisions to Make

1. **NestJS vs Express**: Spec says NestJS, skeleton provides Express. Recommend staying Express for speed, document the trade-off.
2. **TypeScript vs JavaScript**: Spec says TS strict. Skeleton is JS. Recommend staying JS since skeleton is JS and conversion is high effort for a time-boxed challenge.
3. **Points calculation rewrite**: Skeleton constants use event-type-based points; spec uses BB-range-based points with tier multiplier. Must rewrite.
4. **Leaderboard data model**: Use the existing `rewards-leaderboard` table (PK: monthKey, SK: playerId) or query `rewards-players` with a GSI? The dedicated table is already provisioned.
5. **Notification ID format**: ULID vs UUID — spec suggests either. ULID gives time-ordering for free.
6. **Admin auth**: Separate admin middleware or just different route prefix? Spec doesn't require admin auth — just endpoints.
7. **Monthly reset trigger**: Manual endpoint (M2) vs Lambda cron (M3). Start with manual.
8. **Frontend auth flow**: Login page sets playerId in localStorage. Keep simple.
