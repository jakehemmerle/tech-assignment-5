# Spec Alignment Round 2: Technical Requirements + Out-of-Scope

## Technical Requirements Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Node.js 22 | RESPECTED | Docker uses node:22-alpine |
| NestJS framework | VIOLATED (justified) | Using Express from skeleton; deviation documented in Architecture Decisions |
| TypeScript strict | VIOLATED (justified) | Using JS from skeleton; deviation documented |
| DynamoDB (AWS SDK v3) | RESPECTED | Already in dependencies |
| class-validator + class-transformer | UNADDRESSED | Not applicable for Express/JS; manual validation added instead |
| JWT auth guard (stub) | RESPECTED | auth.js already implements X-Player-Id stub |
| Jest | RESPECTED | Configured in package.json |
| React 18+ TypeScript | RESPECTED | Frontend already TS/Vite |
| Redux Toolkit | RESPECTED | store.ts scaffolded |
| React Testing Library | RESPECTED (after fix) | Added RTL specification to M1.7 |
| Players table schema | RESPECTED | M1.1 task 6 adds all spec fields |
| Transactions table schema | RESPECTED | M1.1/M1.3 cover all spec fields + handId |
| Leaderboard table schema | RESPECTED | M1.4 creates entries matching spec |
| Notifications table schema | RESPECTED | M1.5 matches spec |
| Unity REST endpoints | RESPECTED | All 5 endpoints mapped to M1 epics |
| Points award payload shape | RESPECTED | M1.1 accepts spec's payload format |

## Out-of-Scope Enforcement

| Item | Status |
|------|--------|
| User registration / auth system | CLEAN — not building |
| Email/push notification delivery | CLEAN — not building |
| Game engine integration | CLEAN — not building |
| Unity client implementation | CLEAN — not building |
| Payment/real-money | CLEAN — not building |
| Backoffice UI for admin | CLEAN — API only |
| Production deployment | CLEAN — not building |

No scope creep detected. All M3 items are in the spec's Could Have list.

## Fixes Applied

1. **M1.1 Task 4**: Added explicit input validation requirements (require and type-check all payload fields)
2. **M1.7 Task 1**: Specified React Testing Library for frontend tests
3. Architecture Decisions section already documents NestJS/TS deviations — no further changes needed
