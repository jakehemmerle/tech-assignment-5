# Plan Self-Review Round 2: Risk + Scope-Creep

## Risk Assessment

| Risk | Impact | Likelihood | Status |
|------|--------|------------|--------|
| DynamoDB Local quirks | MEDIUM | LOW | Mitigated by early M1.1 foundation |
| Leaderboard scan performance | LOW | LOW | Acceptable for dev; M3.1 adds caching |
| M1.7 frontend epic size | MEDIUM | MEDIUM | Mitigated: keep minimal, MUI defaults |
| M1.1 critical path blocker | HIGH | LOW | Mitigated: straightforward CRUD patterns |
| monthKey UTC boundary | LOW | LOW | Test boundary cases in M1.1 |

No new spike/POC tasks needed. Risks are well-mitigated by existing structure.

## Scope Creep Assessment

| Item | Verdict | Action |
|------|---------|--------|
| 5 milestones (spec says 3-5) | SIMPLIFY | Reduced to 3 milestones (500, 1000, 5000) |
| M1.8 "comprehensive" unit tests | SIMPLIFY | Changed to "add missing" tests, don't duplicate M1.1/M1.2 |
| Admin tier override with expiry | KEEP | Spec explicitly includes this |
| Risk register in decomposition | KEEP | Useful documentation |
| Open Questions for Human | KEEP | For human review gate |

## Fixes Applied

1. M1.5 task 5: Reduced milestones from 5 to 3
2. M1.8 task 4: Clarified "add missing" instead of "comprehensive" to avoid duplication
