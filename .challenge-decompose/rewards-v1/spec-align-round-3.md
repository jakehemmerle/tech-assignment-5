# Spec Alignment Round 3: Edge Cases + Suggested Architecture

## Edge Cases Review

| Edge Case | Status | Notes |
|-----------|--------|-------|
| Multiplier applied before tier upgrade check | COVERED | M1.2 task 3 explicitly handles |
| Multi-tier jump (e.g., massive adjustment) | COVERED (after fix) | Added test case to M1.2 |
| New player first award | COVERED | M1.1 auto-creates at Bronze |
| Negative points adjustment + tier impact | COVERED (after fix) | M1.6 task 4 now recalculates tier |
| Tier override expiry | PARTIAL | Noted: check on player read. Low priority for time-boxed challenge |
| Monthly reset empty state | COVERED | Scan returns empty, no-op |
| Concurrent points awards | PARTIAL | Documented as risk; DynamoDB update expressions are atomic for counters |
| Leaderboard < 100 players | COVERED | Returns what exists |
| Dismiss non-existent notification | COVERED (after fix) | Added 404 handling to M1.8 criteria |
| Empty transaction history | COVERED | Returns empty array |
| monthKey boundary (UTC midnight) | COVERED | Uses UTC date for monthKey |

## Architecture Alignment

| Element | Status |
|---------|--------|
| Module structure | DEVIATED (sound) — Express route files ≈ NestJS modules |
| DynamoDB table schemas | ALIGNED — all 4 tables match spec |
| Points ingestion endpoint | ALIGNED — matches spec payload |
| Seed script | ALIGNED |
| Shared code pattern | ALIGNED |
| serverless-offline | ALIGNED |
| CORS | ALIGNED |
| Vertical slice architecture | ALIGNED — each epic is a tracer bullet through all layers |
| Dependency graph | ALIGNED — build order matches architecture needs |

No missing integration glue epics. Architecture is coherent.

## Fixes Applied

1. **M1.2 Task 1**: Added multi-tier jump test case
2. **M1.6 Task 4**: Added tier recalculation after points adjustment
3. **M1.8 Acceptance criteria**: Added 404 handling for dismiss of non-existent notification

## Spec Alignment Complete (3 rounds)

- Round 1 (functional requirements + acceptance criteria): 2 fixes applied
- Round 2 (technical requirements + out-of-scope): 2 fixes applied
- Round 3 (edge cases + architecture): 3 fixes applied
- Total: 7 fixes applied, 0 must-fix items remaining
