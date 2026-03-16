# Project Decomposition: rewards-v1

## Overview

Poker rewards system: players earn points from gameplay, progress through tiers (Bronze→Platinum), view status on a React dashboard, and interact via Unity-facing REST endpoints. Backend-heavy challenge built on Express + DynamoDB (via serverless-offline) with a React + MUI + Redux frontend.

Decomposition follows **tracer-bullet** methodology — each epic delivers a vertical slice of end-to-end functionality that a human can manually verify. M1 covers all "must have" acceptance criteria. M2 covers "should have." M3 covers "could have."

## Architecture Decisions

1. **Stay with Express + JS**: The skeleton provides Express with plain JS via serverless-offline. Converting to NestJS + TypeScript adds significant scaffolding work with no functional benefit for a time-boxed challenge. The spec explicitly allows deviation from suggested architecture. Trade-off documented.

2. **DynamoDB single-table-ish approach**: Use the 4 pre-provisioned tables (players, transactions, leaderboard, notifications) as-is. They're already created by docker-compose init. No need for full single-table design — separate tables per concern is clearer for this scope.

3. **Points calculation from BB ranges**: Rewrite the skeleton's event-type-based point rules to match the spec's BB-range-based calculation with tier multiplier. This is a core spec requirement.

4. **Leaderboard via dedicated table**: Use `rewards-leaderboard` table (PK: monthKey, SK: playerId). Update it on every points award. Query by monthKey and sort by monthlyPoints (requires scan+sort within partition since DynamoDB doesn't support sorting by non-key attributes without a GSI — or add a GSI). For M1, scan+sort is acceptable for top 100.

5. **Notifications via dedicated table**: Use `rewards-notifications` table (PK: playerId, SK: notificationId). ULID for notificationId gives time-ordering.

6. **Admin endpoints**: Separate `/admin/` route prefix, no auth required (spec says "no UI required" and doesn't prescribe admin auth).

7. **Monthly reset**: Manual endpoint for M2 (triggered via admin API), Lambda cron for M3.

## Milestone Summary

| Milestone | Epics | Est. Tasks | What It Proves |
|-----------|-------|------------|----------------|
| M1 (Minimum) | 8 | ~45 | Core points engine, tiers, leaderboard, dashboard, notifications, admin, Unity endpoints all work e2e |
| M2 (Strong) | 5 | ~25 | Pagination, own-rank, notification dismiss, monthly reset, tier timeline, integration tests, API docs |
| M3 (Bonus) | 4 | ~16 | Caching, real-time notifications, rate limiting, idempotency, CI |

---

## M1: Minimum Viable (Must Have)

### Epic M1.1: Foundation — Project scaffold + thinnest e2e path
**Tracer bullet:** POST points award → read from ledger → see it reflected in player profile
**Depends on:** None (foundation)
**Human checkpoint:** `curl -X POST localhost:5000/api/v1/points/award -H 'Content-Type: application/json' -H 'X-Player-Id: test-player-1' -d '{"tableId":1,"tableStakes":"2/5","bigBlind":5.00,"handId":"hand-001"}'` → returns `{playerId, earnedPoints, totalMonthlyPoints, tier, transaction}`. Then `curl localhost:5000/api/v1/player/rewards -H 'X-Player-Id: test-player-1'` → shows the updated points and tier.

**Tasks:**
1. [ ] Write test spec: points calculation from BB ranges (unit tests for calculateBasePoints, applyMultiplier), player creation on first award
2. [ ] Rewrite `constants.js` — BB range → base points mapping per spec, tier definitions with numbered tiers (1-4)
3. [ ] Implement points service: `awardPoints(playerId, tableStakes, bigBlind, handId)` — calculate base, lookup/create player (with displayName from request or default to playerId), apply multiplier, write transaction, update player totals. Define standardized error response shape {error, message, statusCode} for all endpoints
4. [ ] Implement `POST /api/v1/points/award` route — validate request body (require playerId/tableId/tableStakes/bigBlind/handId, validate types). Note: playerId comes from request body (game processor calls), not from auth header. Call points service, return response shape
5. [ ] Implement `GET /api/v1/player/rewards` route — lookup player, calculate progress to next tier, return summary
6. [ ] Update `dynamo.service.js` — add monthKey (YYYY-MM) to transactions, add monthlyPoints/lifetimePoints/currentTier/tierFloor fields to player. Store handId in each transaction record for future idempotency (M3.3)
7. [ ] Green tests + verify via curl: award points, check player profile reflects them

**Acceptance criteria:**
- Points calculated correctly from BB ranges: $0.10-0.25 → 1pt, $0.50-1.00 → 2pt, $2.00-5.00 → 5pt, $10.00+ → 10pt
- Tier multiplier applied: earned = base × multiplier
- Transaction written to ledger (immutable)
- Player monthlyPoints and lifetimePoints updated
- New players auto-created at Bronze tier on first award
- GET /player/rewards returns correct tier, points, progress to next tier

---

### Epic M1.2: Tier progression — automatic upgrade on threshold
**Tracer bullet:** Award enough points to cross Silver threshold → player tier upgrades to Silver automatically → multiplier changes for subsequent awards
**Depends on:** M1.1
**Human checkpoint:** Award 500+ points to a Bronze player (multiple calls with high-stakes hands). GET /player/rewards → tier is now "Silver". Award another hand → multiplier should be 1.25x (visible in transaction response).

**Tasks:**
1. [ ] Write test spec: tier upgrade logic — player crosses 500pt threshold → tier becomes Silver, crosses 2000 → Gold, crosses 10000 → Platinum. Include test for multi-tier jump (e.g., large admin adjustment pushes Bronze past Silver+Gold directly to Gold)
2. [ ] Implement tier check in points service: after updating monthlyPoints, call `checkTierProgression(player)` → returns {upgraded: bool, newTier, oldTier}
3. [ ] Ensure multiplier used in points calculation reflects current tier BEFORE the award (not after potential upgrade)
4. [ ] Create notification on tier upgrade (write to rewards-notifications table)
5. [ ] Green tests + verify: award points across threshold, confirm tier upgrade and notification created

**Acceptance criteria:**
- Tier upgrades happen immediately when monthly points threshold is reached
- Multiplier at time of earning is the player's current tier (before upgrade check)
- Notification record created with type "tier_upgrade" and appropriate message
- Player can progress through multiple tiers (Bronze → Silver → Gold → Platinum)

---

### Epic M1.3: Points ledger immutability + transaction history
**Tracer bullet:** Award multiple hands → GET /player/rewards/history returns all transactions in reverse chronological order with correct fields
**Depends on:** M1.1
**Human checkpoint:** Award 5 hands with different stakes. `curl localhost:5000/api/v1/player/rewards/history?limit=20 -H 'X-Player-Id: test-player-1'` → returns all 5 transactions with date, tableStakes, basePoints, multiplier, earnedPoints fields. Verify no delete/update endpoint exists for transactions.

**Tasks:**
1. [ ] Write test spec: transaction history returns correct shape, sorted by timestamp desc, respects limit param
2. [ ] Implement `GET /api/v1/player/rewards/history` route with limit/offset query params
3. [ ] Ensure transaction records include all spec fields: type, basePoints, multiplier, earnedPoints, tableId, tableStakes, monthKey, createdAt
4. [ ] Green tests + verify via curl

**Acceptance criteria:**
- Transactions returned in reverse chronological order
- Each transaction shows: timestamp, tableId, tableStakes, basePoints, multiplier, earnedPoints, type, handId
- No endpoint exists to modify or delete transactions (immutable ledger)
- Default limit=20, supports custom limit

---

### Epic M1.4: Leaderboard — top players by monthly points
**Tracer bullet:** Multiple players earn points → GET /leaderboard returns top players sorted by monthly points
**Depends on:** M1.1
**Human checkpoint:** Use seed script or award points to 3+ players. `curl localhost:5000/api/v1/leaderboard?limit=10` → returns players sorted by monthlyPoints descending with rank, displayName, tier, monthlyPoints.

**Tasks:**
1. [ ] Write test spec: leaderboard returns players sorted by monthly points, respects limit param, returns correct fields
2. [ ] Update points award flow to write/update leaderboard table entry (monthKey=YYYY-MM, playerId, monthlyPoints, tier, displayName)
3. [ ] Implement `GET /api/v1/leaderboard` route — query leaderboard table by current monthKey, scan all items in partition, sort by monthlyPoints desc in memory (acceptable for <1000 players), add rank field
4. [ ] Update seed script to populate leaderboard table with current month data and ensure player records have displayName/username
5. [ ] Green tests + verify via curl with seeded data

**Acceptance criteria:**
- Returns top players sorted by monthly points (descending)
- Each entry: rank (1-indexed), displayName, tier, monthlyPoints
- Respects `limit` query param (default 100)
- Only returns data for current month (monthKey = YYYY-MM)

---

### Epic M1.5: Notifications — tier change + milestone alerts
**Tracer bullet:** Player upgrades tier → notification created → GET /player/notifications returns it with correct fields
**Depends on:** M1.2
**Human checkpoint:** Trigger a tier upgrade. `curl localhost:5000/api/v1/player/notifications -H 'X-Player-Id: test-player-1'` → returns tier upgrade notification with title, description, type, dismissed=false, createdAt.

**Tasks:**
1. [ ] Write test spec: notification creation on tier upgrade, notification retrieval, milestone notifications (500pts, 1000pts, 2500pts, 5000pts, 10000pts)
2. [ ] Implement notification service: createNotification(playerId, type, title, description), getNotifications(playerId, unread?)
3. [ ] Implement `GET /api/v1/player/notifications` route with `?unread=true` filter
4. [ ] Add milestone check to points award flow: after updating totals, check if a milestone threshold was crossed
5. [ ] Define 3 milestones: 500, 1000, 5000 lifetime points (spec says 3-5; start lean)
6. [ ] Green tests + verify: award points past milestone → notification created

**Acceptance criteria:**
- Notification created on tier upgrade with type "tier_upgrade"
- Notification created on tier downgrade with type "tier_downgrade"
- Milestone notifications at 500, 1000, 2500, 5000, 10000 lifetime points
- GET /notifications returns all notifications for player
- ?unread=true filters to only undismissed notifications
- Each notification has: notificationId, type, title, description, dismissed, createdAt

---

### Epic M1.6: Admin endpoints
**Tracer bullet:** Admin views player profile → manually adjusts points → sees adjustment reflected in player profile and ledger
**Depends on:** M1.1, M1.2, M1.4
**Human checkpoint:** `curl localhost:5000/admin/players/test-player-1/rewards` → full rewards profile. `curl -X POST localhost:5000/admin/points/adjust -H 'Content-Type: application/json' -d '{"playerId":"test-player-1","points":100,"reason":"manual bonus"}'` → adjustment recorded. GET player again → points updated. Leaderboard reflects change.

**Tasks:**
1. [ ] Write test spec: admin player lookup, admin points adjustment (credit + debit), admin leaderboard with extra fields, admin tier override
2. [ ] Add admin routes file: `src/routes/admin.js`
3. [ ] Implement `GET /admin/players/:playerId/rewards` — full profile with all fields
4. [ ] Implement `POST /admin/points/adjust` — { playerId, points (positive=credit, negative=debit), reason } → write transaction with type "adjustment", update totals. Recalculate tier after adjustment (debit may cause tier downgrade)
5. [ ] Implement `GET /admin/leaderboard` — same as player leaderboard but includes playerId and email fields
6. [ ] Implement `POST /admin/tier/override` — { playerId, tier, expiresAt } → set player tier directly
7. [ ] Mount admin routes in handler.js (no auth middleware)
8. [ ] Green tests + verify via curl

**Acceptance criteria:**
- GET /admin/players/:playerId/rewards returns full rewards profile
- POST /admin/points/adjust records an adjustment transaction and updates player totals
- GET /admin/leaderboard includes playerId field (and email if available)
- POST /admin/tier/override sets player tier with optional expiry

---

### Epic M1.7: React dashboard — summary + history + leaderboard widget
**Tracer bullet:** Player logs in → sees tier, points, progress bar, transaction history table, top 10 leaderboard
**Depends on:** M1.1, M1.3, M1.4, M1.5
**Human checkpoint:** Open http://localhost:4000 → enter a player ID (or use login page) → Dashboard shows: summary card (tier badge, monthly points, progress to next tier), recent transactions table, top 10 leaderboard widget, notification bell with unread count.

**Tasks:**
1. [ ] Write test spec (React Testing Library): Dashboard component renders tier info, points, progress bar; PointsHistory renders transaction rows; LeaderboardWidget renders top 10
2. [ ] Create RTK Query API slice for rewards endpoints (player/rewards, player/rewards/history, leaderboard, player/notifications)
3. [ ] Implement Summary Card component: tier name + badge, monthly points, lifetime points, progress bar to next tier with "X points to go"
4. [ ] Implement Points History component: table with columns (date, table, stakes, base pts, multiplier, earned pts)
5. [ ] Implement Leaderboard Widget component: top 10 list with rank, name, tier, points
6. [ ] Implement Notification Bell component: icon with unread count badge
7. [ ] Wire all components into Dashboard page with proper layout. Verify Login page (from skeleton) sets playerId in localStorage correctly
8. [ ] Green tests + visual verification in browser (use seeded player e.g. "player-001")

**Acceptance criteria:**
- Summary card shows current tier, tier badge, monthly points, points to next tier, progress bar
- Points history table shows recent transactions with all fields
- Leaderboard widget shows top 10 players
- Notification bell shows unread notification count
- Dashboard loads data from API on mount

---

### Epic M1.8: Unity REST endpoint shapes + backend tests
**Tracer bullet:** All Unity-facing endpoints return correct response shapes matching spec
**Depends on:** M1.1, M1.3, M1.4, M1.5
**Human checkpoint:** Call each Unity endpoint and verify response shape matches spec:
- `GET /api/v1/player/rewards` → { currentTier, monthlyPoints, lifetimePoints, progress }
- `GET /api/v1/player/rewards/history?limit=20&offset=0` → { transactions: [...], total }
- `GET /api/v1/leaderboard?limit=10` → { leaderboard: [...] }
- `GET /api/v1/player/notifications?unread=true` → { notifications: [...] }
- `PATCH /api/v1/player/notifications/:id/dismiss` → { success: true }

**Tasks:**
1. [ ] Write test spec: each Unity endpoint returns correct shape, validates required fields, handles missing player
2. [ ] Implement `PATCH /api/v1/player/notifications/:id/dismiss` — mark notification as dismissed
3. [ ] Ensure all existing endpoints match spec response shapes (adjust if needed)
4. [ ] Add any missing unit tests for points calculation and tier progression logic (complement M1.1/M1.2 tests, don't duplicate)
5. [ ] Verify `npm test` passes with all new tests (both locally and in Docker environment)
6. [ ] Green tests + verify all 5 Unity endpoints via curl

**Acceptance criteria:**
- All 5 Unity REST endpoints return correct data shapes per spec
- PATCH /notifications/:id/dismiss marks notification as dismissed (returns 404 for non-existent notification)
- Unit tests cover: points calculation (all BB ranges), tier progression (all thresholds), multiplier application
- `npm test` passes cleanly in Docker environment

---

## M2: Strong Submission (Should Have)

### Epic M2.1: Points history pagination
**Tracer bullet:** GET /player/rewards/history with limit=5&offset=5 returns correct page of results
**Depends on:** All M1
**Human checkpoint:** Award 15+ transactions. Query with limit=5 → returns 5. Query with limit=5&offset=5 → returns next 5 (different set). Total count is correct.

**Tasks:**
1. [ ] Write test spec: pagination returns correct page, offset skips correct records, total reflects full count
2. [ ] Implement DynamoDB pagination using ExclusiveStartKey / LastEvaluatedKey for efficient paging
3. [ ] Add `total` field to response (requires a count query or tracking)
4. [ ] Green tests + verify

**Acceptance criteria:**
- Pagination works correctly with limit and offset params
- Response includes `total` count of all transactions
- Results remain in reverse chronological order across pages

---

### Epic M2.2: Leaderboard — player's own rank
**Tracer bullet:** Player requests leaderboard → response includes their own rank even if not in top 100
**Depends on:** All M1
**Human checkpoint:** Seed 150+ players. Player outside top 100 calls GET /leaderboard → response includes `playerRank` field showing their position.

**Tasks:**
1. [ ] Write test spec: own rank returned for player in top 100, own rank returned for player outside top 100
2. [ ] Add `playerRank` field to leaderboard response — scan full month's leaderboard, find player's position
3. [ ] Add `playerEntry` object showing the requesting player's leaderboard data
4. [ ] Green tests + verify with seeded data

**Acceptance criteria:**
- Player's own rank included in leaderboard response
- Works for players inside and outside top 100
- Response shape: { leaderboard: [...], playerRank: N, playerEntry: {...} }

---

### Epic M2.3: Monthly tier reset with floor protection
**Tracer bullet:** Admin triggers monthly reset → all players' tiers reset with floor protection → notifications sent
**Depends on:** All M1
**Human checkpoint:** Set player to Platinum. Trigger `POST /admin/monthly-reset`. Player tier resets to Gold (one tier below max, floor protection). Notification created with type "tier_downgrade". Monthly points reset to 0.

**Tasks:**
1. [ ] Write test spec: reset logic — Platinum→Gold floor, Gold→Silver floor, Silver→Bronze floor, Bronze stays Bronze. Monthly points zeroed.
2. [ ] Implement monthly reset service: scan all players, calculate new tier (max of Bronze, one_tier_below_previous_highest), zero monthlyPoints, set tierFloor, write tier_downgrade notifications
3. [ ] Implement `POST /admin/monthly-reset` endpoint
4. [ ] Ensure leaderboard table gets a new monthKey for new month
5. [ ] Green tests + verify

**Acceptance criteria:**
- Players cannot drop more than one tier at reset (floor protection)
- Monthly points reset to 0
- Tier downgrade notifications created for affected players
- Previous month's tier stored as tierFloor
- Works correctly for all tier combinations

---

### Epic M2.4: Dashboard tier timeline (6 months)
**Tracer bullet:** Dashboard shows a visual timeline of tier progression over the last 6 months
**Depends on:** All M1, M2.3
**Human checkpoint:** Open dashboard → see tier timeline showing tier for each of last 6 months (even if most are empty/Bronze for new players).

**Tasks:**
1. [ ] Write test spec: TierTimeline component renders 6 months, shows correct tier per month
2. [ ] Add backend endpoint: `GET /api/v1/player/rewards/timeline` → returns tier history by month
3. [ ] Store tier history: on monthly reset, snapshot player's tier for that month (or derive from transaction data)
4. [ ] Implement TierTimeline React component with visual representation (chart or step display)
5. [ ] Green tests + visual verification

**Acceptance criteria:**
- Shows last 6 months of tier history
- Each month shows the tier name/level
- Visual representation (chart, step indicator, or timeline)
- Gracefully handles months with no data (shows Bronze)

---

### Epic M2.5: Integration tests + API documentation
**Tracer bullet:** Full points award → tier upgrade → leaderboard update → notification flow tested e2e. API docs generated.
**Depends on:** All M1
**Human checkpoint:** Run `npm test` → integration tests pass, covering the full award flow. Open API docs (markdown or generated spec) → all endpoints documented with request/response shapes.

**Tasks:**
1. [ ] Write integration tests: full flow — award points → check player → check leaderboard → check notifications
2. [ ] Write integration tests: admin flow — adjust points → verify balance → override tier
3. [ ] Write integration tests: edge cases — award to non-existent player, duplicate handId, negative points
4. [ ] Create API documentation: markdown file with all endpoints, request/response shapes, error codes
5. [ ] Document Unity-specific endpoint shapes explicitly
6. [ ] Green tests + verify docs accuracy

**Acceptance criteria:**
- Integration tests cover full points award flow end-to-end
- Integration tests pass with DynamoDB Local running
- API documentation covers all endpoints with request/response examples
- Error responses documented (400, 401, 404, 500)

---

## M3: Bonus (Could Have)

### Epic M3.1: Leaderboard caching with Redis
**Tracer bullet:** First leaderboard query is slow (DynamoDB scan) → subsequent queries within TTL are fast (Redis hit)
**Depends on:** All M1 + M2
**Human checkpoint:** Query leaderboard, note response time. Query again within 60s → faster. Wait for TTL expiry → next query rebuilds cache.

**Tasks:**
1. [ ] Write test spec: cache hit returns same data, cache miss queries DynamoDB, TTL expires correctly
2. [ ] Implement Redis cache layer for leaderboard: cache key = `leaderboard:${monthKey}`, TTL = 60s
3. [ ] Invalidate cache on points award (or accept staleness within TTL)
4. [ ] Green tests + verify with timing checks

**Acceptance criteria:**
- Leaderboard cached in Redis with configurable TTL
- Cache invalidated or expires appropriately
- Fallback to DynamoDB on cache miss

---

### Epic M3.2: Rate limiting on points award endpoint
**Tracer bullet:** Rapid-fire calls to POST /points/award → rate limited after threshold
**Depends on:** All M1 + M2
**Human checkpoint:** Send 20 rapid requests → first N succeed, remaining get 429 Too Many Requests.

**Tasks:**
1. [ ] Write test spec: rate limit kicks in after threshold, returns 429, resets after window
2. [ ] Implement rate limiting middleware (token bucket or sliding window via Redis)
3. [ ] Apply to POST /points/award endpoint
4. [ ] Green tests + verify

**Acceptance criteria:**
- POST /points/award rate limited (e.g., 100 req/min per player)
- Returns 429 with retry-after header when limited
- Rate limit tracked per player ID

---

### Epic M3.3: Idempotency on points award (handId dedup)
**Tracer bullet:** Same handId submitted twice → points only awarded once
**Depends on:** All M1 + M2
**Human checkpoint:** Call POST /points/award with handId "hand-abc" twice. First returns 200. Second returns 200 with same data (idempotent) or 409. Player points only increased once.

**Tasks:**
1. [ ] Write test spec: duplicate handId returns same result, no double-counting
2. [ ] Add handId tracking: DynamoDB conditional write (attribute_not_exists) or separate dedup table
3. [ ] Return cached response for duplicate handId
4. [ ] Green tests + verify

**Acceptance criteria:**
- Duplicate handId does not double-award points
- Returns original transaction data on retry
- Works correctly with concurrent requests

---

### Epic M3.4: GitHub Actions CI pipeline
**Tracer bullet:** Push to main → CI runs tests → passes
**Depends on:** All M1 + M2
**Human checkpoint:** Push a commit → check GitHub Actions → tests pass, lint passes.

**Tasks:**
1. [ ] Create `.github/workflows/ci.yml` — install deps, start DynamoDB Local, run tests
2. [ ] Add lint step (eslint or similar)
3. [ ] Verify pipeline passes on push
4. [ ] Green CI + verify in GitHub Actions UI

**Acceptance criteria:**
- CI runs on push to main and on PRs
- Runs unit tests and integration tests
- Starts DynamoDB Local for integration tests
- Reports pass/fail status

---

## Dependency Graph

```
M1.1 (Foundation: points + player)
 ├──► M1.2 (Tier progression)
 │     └──► M1.5 (Notifications)
 ├──► M1.3 (Points history)
 ├──► M1.4 (Leaderboard)
 └──► M1.6 (Admin endpoints) [depends: M1.1, M1.2, M1.4]

M1.1 + M1.3 + M1.4 + M1.5 ──► M1.7 (React dashboard)
M1.1 + M1.3 + M1.4 + M1.5 ──► M1.8 (Unity endpoints + backend tests)

All M1 ──► M2.1 (Pagination)
All M1 ──► M2.2 (Own rank)
All M1 ──► M2.3 (Monthly reset)
All M1 ──► M2.5 (Integration tests + API docs)
All M1 + M2.3 ──► M2.4 (Tier timeline)

All M1+M2 ──► M3.1 (Redis caching)
All M1+M2 ──► M3.2 (Rate limiting)
All M1+M2 ──► M3.3 (Idempotency)
All M1+M2 ──► M3.4 (CI pipeline)
```

**Critical path**: M1.1 → M1.2 → M1.5 → M1.7/M1.8 (longest chain in M1)

**Parallelizable within M1**: M1.3 and M1.4 can run parallel with M1.2 (all depend only on M1.1).

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| DynamoDB Local tables not matching production schema | Medium | Verify all tables created by docker-compose init; add GSIs as needed |
| Leaderboard scan performance at scale | Low (dev only) | Acceptable for 100 players; M3.1 adds Redis cache for production |
| Monthly reset edge cases (midnight UTC, concurrent awards) | Medium | Thorough test coverage in M2.3; document known limitations |
| Skeleton seed script schema mismatch | Low | Update seed script to match new schema in M1.1 |
| Frontend MUI/Redux boilerplate time sink | Medium | Use RTK Query to minimize boilerplate; keep dashboard minimal for M1 |
| DynamoDB pagination with offset (not natively supported) | Medium | Use scan-and-skip for M1; optimize with ExclusiveStartKey in M2.1 |

## Open Questions for Human

1. **NestJS migration**: The spec calls for NestJS but the skeleton uses Express. We're recommending Express to ship faster. Is that acceptable, or is NestJS alignment critical?
2. **TypeScript conversion**: Same trade-off — spec says TS strict, skeleton is JS. Recommend JS for speed. Acceptable?
3. **Player display names**: The spec mentions display names but the stub auth doesn't include one. Should we use playerId as display name, or add a registration/profile endpoint?
4. **Tier multiplier timing**: Spec says "player's current tier multiplier is applied." Does the multiplier apply BEFORE or AFTER a potential tier upgrade from this same award? We assume BEFORE (multiplier at time of earning, tier checked after).
