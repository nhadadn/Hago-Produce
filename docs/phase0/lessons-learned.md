# Lessons Learned - Phase 0

## What Worked Well
- **Automated Setup:** Using scripts and `railway.json` ensures consistent environments.
- **Parallel Work:** Separation of concerns (DevOps vs Architecture) allowed rapid progress.
- **Documentation First:** Creating ADRs early clarifies decision making.

## Challenges
- **Tooling:** Ensuring Windows compatibility for scripts (PowerShell vs Bash).
- **Context:** Migrating from legacy Supabase plan to Railway required updating documentation carefully.

## Improvements for Next Phases
- **Testing:** Implement actual tests immediately in Phase 1A.
- **Mocking:** Setup database mocks for easier local development without Railway connection.
