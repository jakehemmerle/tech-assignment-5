# Spec Alignment Round 1: Functional Requirements + Acceptance Criteria

## Functional Requirements Coverage

| FR | Sub-requirement | Status | Epic(s) |
|----|----------------|--------|---------|
| FR-1 | 4 tiers with thresholds/multipliers | COVERED | M1.1 |
| FR-1 | Players start at Bronze | COVERED | M1.1 |
| FR-1 | Tier upgrades immediately on threshold | COVERED | M1.2 |
| FR-1 | Monthly reset at 00:00 UTC | COVERED | M2.3 |
| FR-1 | Floor protection (max 1 tier drop) | COVERED | M2.3 |
| FR-1 | Tier changes trigger notification | COVERED | M1.2, M1.5 |
| FR-2 | Points per hand based on BB ranges | COVERED | M1.1 |
| FR-2 | Only for dealt-in hands | N/A | Out of scope (game processor responsibility) |
| FR-2 | Tier multiplier applied | COVERED | M1.1 |
| FR-2 | Monthly + lifetime tracking | COVERED | M1.1 |
| FR-2 | Immutable ledger | COVERED | M1.3 |
| FR-3 | Top 100 by monthly points | COVERED | M1.4 |
| FR-3 | Shows rank, name, tier, points | COVERED | M1.4 |
| FR-3 | Refreshes on read | COVERED | M1.4 |
| FR-3 | Own rank outside top 100 | COVERED | M2.2 |
| FR-4 | Summary card (tier, points, progress) | COVERED | M1.7 |
| FR-4 | Points history table | COVERED | M1.7 |
| FR-4 | Tier timeline (6 months) | COVERED | M2.4 |
| FR-4 | Leaderboard widget (top 10 + rank) | COVERED | M1.7 |
| FR-5 | Tier upgrade notification | COVERED | M1.2, M1.5 |
| FR-5 | Tier downgrade notification | COVERED | M2.3 |
| FR-5 | Milestone achievements (3-5) | COVERED | M1.5 |
| FR-5 | Stored + API-retrievable | COVERED | M1.5 |
| FR-5 | Bell with unread count | COVERED | M1.7 |
| FR-6 | GET /admin/players/:id/rewards | COVERED | M1.6 |
| FR-6 | POST /admin/points/adjust | COVERED | M1.6 |
| FR-6 | GET /admin/leaderboard | COVERED | M1.6 |
| FR-6 | POST /admin/tier/override | COVERED | M1.6 |

## Acceptance Criteria Alignment

| Criterion | Tier | Status | Mapped To |
|-----------|------|--------|-----------|
| Points awarded correctly (stakes + multiplier) | Must | ALIGNED | M1.1 |
| Tier progression on threshold | Must | ALIGNED | M1.2 |
| Points ledger immutable | Must | ALIGNED | M1.3 |
| Leaderboard top players sorted | Must | ALIGNED | M1.4 |
| Dashboard: tier, points, progress | Must | ALIGNED | M1.7 |
| Dashboard: transaction history | Must | ALIGNED | M1.7 |
| Notification on tier change | Must | ALIGNED | M1.2/M1.5 |
| Unity REST correct shapes | Must | ALIGNED | M1.8 |
| Admin view player rewards | Must | ALIGNED | M1.6 |
| Admin adjust points | Must | ALIGNED | M1.6 |
| Unit tests on points/tier | Must | ALIGNED | M1.1/M1.8 |
| Docker Compose + npm test | Must | ALIGNED | M1.1/M1.8 |
| Pagination | Should | ALIGNED | M2.1 |
| Own rank | Should | ALIGNED | M2.2 |
| Notification dismiss + unread count | Should | ALIGNED | M1.5/M1.8 |
| Monthly reset | Should | ALIGNED | M2.3 |
| Tier timeline (6 months) | Should | ALIGNED | M2.4 |
| Integration tests on award flow | Should | ALIGNED | M2.5 |
| API docs | Should | ALIGNED | M2.5 |
| Leaderboard caching | Could | ALIGNED | M3.1 |
| Real-time WebSocket/SSE | Could | DEPRIORITIZED | Not included (complex, low ROI) |
| Rate limiting | Could | ALIGNED | M3.2 |
| Idempotency (handId dedup) | Could | ALIGNED | M3.3 |
| CI pipeline | Could | ALIGNED | M3.4 |
| Monthly reset as Lambda | Could | PARTIAL | M2.3 is manual; Lambda cron noted in M3 |

## Fixes Applied

1. **M1.1 Task 6**: Added "Store handId in each transaction record for future idempotency (M3.3)"
2. **M1.3 Acceptance criteria**: Added handId to transaction fields list

## Items Not Fixed (Acceptable)

1. **"dealt-in hands" validation**: Out of scope — the points award endpoint trusts the game processor to only call it for dealt-in hands. This is documented in the recon report's constraints section.
2. **Real-time WebSocket/SSE**: Deprioritized from M3 — adds significant complexity (new service, WebSocket infrastructure) for a "could have" feature. Time better spent on idempotency and rate limiting.
3. **Monthly reset as Lambda cron**: M2.3 covers the logic as a manual trigger. Converting to a scheduled Lambda is noted as M3 stretch work but doesn't have its own epic — it's a task within M3 scope if time permits.
