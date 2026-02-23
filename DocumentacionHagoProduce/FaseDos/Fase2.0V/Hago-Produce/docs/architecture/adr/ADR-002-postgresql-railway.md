# ADR-002: PostgreSQL on Railway

## Status
Accepted

## Context
We require a relational database. We moved from Supabase to Railway for hosting the application.

## Decision
We will use **PostgreSQL** managed by Railway.

## Consequences
**Pros:**
- Deep integration with Railway services (private networking).
- Easy provisioning and variables management.
- Cost-effective for initial phases.

**Cons:**
- Managed backups and point-in-time recovery might require higher plans compared to specialized DBaaS like Neon or Supabase (though Railway offers backups).
- Less "batteries-included" features than Supabase (e.g., no built-in Auth or Realtime out of the box, need to implement via libraries).
