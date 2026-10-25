# VietnamCV — Claude Code Implementation Pack

Version 1.0 | 2026-10-25 | Language: Vietnamese specifications; English code/comments.

## Mission
Build VietnamCV, a Vietnamese-first Computer Vision knowledge and community hub. Hybrid: automated aggregation of papers/news/open source plus moderated community contributions.

## Read in this order
1. `CLAUDE.md` — non-negotiable engineering rules and execution workflow.
2. `01-PRD.md` — product scope and acceptance criteria.
3. `02-ARCHITECTURE.md` — boundaries and runtime design.
4. `03-DATABASE.md` — entities and invariants.
5. `04-API.md` — REST contracts.
6. `05-INGESTION.md` — ingestion, enrichment and publication.
7. `06-TAXONOMY.md` — controlled vocabulary.
8. `07-COMMUNITY.md` — moderation and permissions.
9. `08-UI-UX.md` — routes and interfaces.
10. `09-DELIVERY.md` — implementation sequence and definition of done.
11. `10-OPERATIONS.md` — security, QA and deployment.
12. `PROMPTS.md` — copy-paste prompts for Claude Code.

## Operating approach
Use Claude Code in a repository. Give it the entire directory, ask it to read `CLAUDE.md`, and execute one phase at a time. Do not ask it to build everything in one turn. Every phase must conclude with passing tests and an updated implementation report.

## MVP boundaries
**In:** public homepage, paper/news/repository discovery, canonical content records, task explorer, lexical search, basic ingestion connectors, moderated submissions, admin review, provenance, responsive SEO pages, observability.
**Out:** GPU-hosted playground, full social network, job application ATS, personalized recommender, production RAG assistant, billing, complex leaderboard.

## Decisions to confirm before production
Hosting region/provider, project domain, email sender, OAuth provider, LLM provider and budget, initial editorial source allowlist, legal/privacy review. Use environment variables and local mocks until decisions are made.
