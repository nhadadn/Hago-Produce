# ADR-003: Integration with Make.com via Webhooks

## Status
Accepted

## Context
We need to integrate with external tools and automate workflows without writing custom code for every integration.

## Decision
We will use **Make.com** triggered via Webhooks from our Next.js API.

## Consequences
**Pros:**
- Decouples core logic from third-party integrations.
- rapid prototyping of workflows.

**Cons:**
- Adds external dependency/latency.
- Debugging can be split between logs and Make history.
