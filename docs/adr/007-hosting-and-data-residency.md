# ADR-007: Hosting and data residency

- Status: Proposed (decide staging by end of Sprint 1, production before Sprint 5)
- Date: 2026-10-25

## Context

The audience is in Vietnam. Personal data rules (Vietnam's Personal Data Protection Law,
in force since 2026-01-01, and Decree 13/2023) apply once accounts open and need legal
review. The spec requires separate web, API, worker and beat processes, managed
PostgreSQL with point-in-time recovery, managed Redis and staging + production.

## Options

- **A. AWS ap-southeast-1 (Singapore):** ECS Fargate (web, api, worker, beat), RDS
  PostgreSQL with PITR, ElastiCache/Valkey, CloudFront + WAF. Most control, most setup.
- **B. Managed container platform in Singapore** with managed PostgreSQL and Redis.
  Less operations work, lower cost at MVP scale.

## Recommendation

Singapore region for latency. Option B for staging now (a single VM with the Compose stack
is acceptable for staging), decide production between A and B before Sprint 5 with cost
estimates based on measured traffic.

## Consequences

- Images are built once and promoted unchanged, so the choice does not affect code.
- Legal review must confirm whether any data must stay in Vietnam before public signups.
