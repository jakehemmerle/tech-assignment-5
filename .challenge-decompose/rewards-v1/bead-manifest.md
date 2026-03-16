# Bead Manifest: rewards-v1

## Stats
- Total beads: 50 (including 1 closed duplicate + 1 rig meta)
- Milestone epics: 3 (p1-ges, p1-3l2, p1-m08)
- Feature epics: 17 (8 M1, 5 M2, 4 M3)
- Tasks: ~75
- Human checkpoints: 17 (one per feature epic)

## Bead Map

### M1: Minimum Viable (p1-ges)

**M1.1: Foundation (p1-n4e)**
- p1-lym: Write test spec: points calculation from BB ranges
- p1-ss7: Rewrite constants.js — BB range point mapping
- p1-pym: Implement points service: awardPoints
- p1-6pp: Implement POST /api/v1/points/award route
- p1-6sy: Implement GET /api/v1/player/rewards route
- p1-qzi: Update dynamo.service.js — enhanced schema
- p1-a4g: CHECKPOINT: Verify M1.1 foundation e2e

**M1.2: Tier progression (p1-7qs)**
- p1-zv0: Write test spec: tier upgrade logic
- p1-47l: Implement checkTierProgression
- p1-0ee: Ensure multiplier applied before tier upgrade
- p1-5eg: Create tier_upgrade notification
- p1-4ix: CHECKPOINT: Verify M1.2 tier progression

**M1.3: Points history (p1-k6d)**
- p1-kj5: Write test spec: transaction history
- p1-975: Implement GET /player/rewards/history
- p1-6oh: Ensure transaction records include all spec fields
- p1-7zz: CHECKPOINT: Verify M1.3 points history

**M1.4: Leaderboard (p1-04r)**
- p1-4oh: Write test spec: leaderboard
- p1-s0g: Update points award to write leaderboard entries
- p1-eed: Implement GET /api/v1/leaderboard
- p1-ypo: Update seed script for leaderboard data
- p1-ou1: CHECKPOINT: Verify M1.4 leaderboard

**M1.5: Notifications (p1-lkt)**
- p1-fjz: Write test spec: notifications
- p1-2kv: Implement notification service
- p1-7nm: Implement GET /player/notifications
- p1-8ah: Add milestone check to points award flow
- p1-dw8: CHECKPOINT: Verify M1.5 notifications

**M1.6: Admin endpoints (p1-sf5)**
- p1-zu2: Write test spec: admin endpoints
- p1-on5: Add admin routes file
- p1-g9n: Implement GET /admin/players/:playerId/rewards
- p1-7oe: Implement POST /admin/points/adjust
- p1-3tz: Implement GET /admin/leaderboard
- p1-pxh: Implement POST /admin/tier/override
- p1-ki2: CHECKPOINT: Verify M1.6 admin endpoints

**M1.7: React dashboard (p1-7hh)**
- p1-luz: Write test spec: React dashboard components (RTL)
- p1-2v4: Create RTK Query API slice
- p1-liv: Implement Summary Card component
- p1-5yz: Implement Points History component
- p1-ny7: Implement Leaderboard Widget component
- p1-acp: Implement Notification Bell component
- p1-dpn: Wire dashboard components + verify Login
- p1-ugn: CHECKPOINT: Verify M1.7 React dashboard

**M1.8: Unity endpoints (p1-d6v)**
- p1-51k: Write test spec: Unity endpoint shapes
- p1-so9: Implement PATCH /player/notifications/:id/dismiss
- p1-4mf: Ensure all endpoints match spec response shapes
- p1-zt4: Add missing unit tests
- p1-9e9: CHECKPOINT: Verify M1.8 Unity endpoints + npm test

### M2: Strong Submission (p1-3l2)

**M2.1: Pagination (p1-149)**
- p1-31y: Write test spec: pagination
- p1-78z: Implement DynamoDB pagination
- p1-d4q: CHECKPOINT: Verify M2.1

**M2.2: Own rank (p1-rl8)**
- p1-w1x: Write test spec: own rank
- p1-4ug: Add playerRank to leaderboard
- p1-0gl: CHECKPOINT: Verify M2.2

**M2.3: Monthly reset (p1-09h)**
- p1-22l: Write test spec: monthly reset
- p1-26d: Implement monthly reset service
- p1-73e: Implement POST /admin/monthly-reset
- p1-60i: CHECKPOINT: Verify M2.3

**M2.4: Tier timeline (p1-8nv)**
- p1-3uh: Write test spec: tier timeline
- p1-0ud: Add GET /player/rewards/timeline endpoint
- p1-q6g: Implement TierTimeline React component
- p1-2hd: CHECKPOINT: Verify M2.4

**M2.5: Integration tests + docs (p1-gwh)**
- p1-6rr: Write integration tests: full award flow
- p1-8yp: Write integration tests: admin flow + edge cases
- p1-8fy: Create API documentation
- p1-4gs: CHECKPOINT: Verify M2.5

### M3: Bonus (p1-m08)

**M3.1: Redis caching (p1-d9c)**
- p1-qkc: Write test spec: leaderboard caching
- p1-8hs: Implement Redis cache
- p1-6q5: CHECKPOINT: Verify M3.1

**M3.2: Rate limiting (p1-lrw)**
- p1-i3l: Write test spec: rate limiting
- p1-hhh: Implement rate limiting middleware
- p1-btt: CHECKPOINT: Verify M3.2

**M3.3: Idempotency (p1-n34)**
- p1-1da: Write test spec: handId idempotency
- p1-5qg: Implement handId dedup
- p1-3nu: CHECKPOINT: Verify M3.3

**M3.4: CI pipeline (p1-a4u)**
- p1-db7: Create GitHub Actions CI workflow
- p1-xx3: CHECKPOINT: Verify M3.4

## Ready to Start
- p1-lym: Write test spec: points calculation from BB ranges (the ONLY actionable task)

## Critical Path
p1-lym → p1-ss7 → p1-pym → p1-6pp/p1-6sy/p1-qzi → p1-a4g (M1.1 complete)
→ p1-zv0 → ... → p1-4ix (M1.2) → p1-fjz → ... → p1-dw8 (M1.5)
→ p1-luz → ... → p1-ugn (M1.7) / p1-51k → ... → p1-9e9 (M1.8)
