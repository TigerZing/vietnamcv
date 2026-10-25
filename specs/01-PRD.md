# 01 — Product Requirements Document

## Vision
VietnamCV is a structured discovery and community platform for Vietnamese Computer Vision practitioners. It connects papers, code, models, datasets, tutorials, events, jobs, organizations and people through controlled taxonomy and provenance.

## Personas and jobs-to-be-done
- Learner: choose a learning path, understand concepts, run tutorials, build portfolio.
- CV engineer: find implementations by task, architecture, runtime and license.
- Researcher: discover recent work, related code/datasets and conference activity.
- Contributor: submit useful technical resources and correct metadata.
- Moderator: verify provenance, reject spam and resolve duplicates.
- Recruiter (later): share CV-specific opportunities and research collaborations.

## MVP P0
| ID | Feature | Acceptance criteria |
|---|---|---|
| P0-01 | Public home | Latest verified content; responsive; clear source attribution |
| P0-02 | Papers | arXiv ID, title, authors, abstract, publication date, canonical URL, topic tags; filters and detail page |
| P0-03 | News | RSS/API feed ingestion, original link, source/date, optional clearly labeled Vietnamese AI summary |
| P0-04 | Open source | GitHub repository identity, description, license when available, stars snapshot timestamp, original link |
| P0-05 | Taxonomy | Hierarchical task explorer, multidimensional filtering, aliases |
| P0-06 | Search | Query across title/summary, type/task/source/date filters, cursor or stable page pagination |
| P0-07 | Moderation | Admin review queue, approve/reject with reason, audit trail |
| P0-08 | Submission | Logged-in users propose links/resources; review before publication |
| P0-09 | Provenance | All published external content links to origin; last fetched and generated-content labels |
| P0-10 | Operations | Connector health, retries, dedupe, backup, CI, monitoring |

## P1 after MVP
Accounts/profiles, bookmarks, comments, topic follows, events, learning roadmaps, tutorials, jobs and notification digests.

## P2
Dataset/model catalog, benchmark comparisons with dataset/hardware provenance, semantic search, knowledge relations, research assistant grounded in citations, organization directory.

## P3
Community competitions, mentor matching, GPU playground with quota/security, advanced recommendations, partner integrations.

## User journeys
1. Visitor selects Object Detection → filters papers with code → reads summary → opens original paper/repository.
2. Contributor signs in → submits GitHub URL + description + task → duplicate check → pending moderation → moderator approves → item becomes public.
3. Moderator sees ingestion item flagged as ambiguous → checks source and existing records → merge or reject → audit event recorded.
4. Learner selects roadmap (P1) → studies curated lessons → bookmarks resources → returns for new materials.

## Editorial policy
Canonical metadata can be published automatically only from trusted allowlisted connectors after deterministic validation. AI-generated interpretations are labeled and require defined quality gates. Community content always starts in pending review. Users can report incorrect attribution or unsafe content.

## Product metrics
North Star: Weekly Engaged Users performing a meaningful action (open original resource, bookmark, contribute, or participate). Track search success, relevance precision, dedupe false merges, content freshness, review queue age and returning-user cohorts. Baseline targets are hypotheses, not proven outcomes.

## MVP release gates
- Three functioning external connectors (arXiv, GitHub, RSS or Hugging Face), with retry and replay.
- At least 100 curated records for staging demonstration; no fabricated production records.
- 100% public content has a valid provenance record.
- Duplicate handling tested for exact external ID and canonical URL.
- Admin can review/reject with reason and audit event.
- CI green, security checklist complete, restore tested, SLOs measured under representative load.
