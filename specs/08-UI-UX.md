# 08 — UI/UX and Frontend Implementation

## Design direction
Editorial-tech aesthetic: clear typography, neutral background, restrained blue/teal accent, dense but readable data cards, strong search and filters. Vietnamese-first copy; English paper titles preserved. Mobile responsive and keyboard accessible.

## MVP routes
| Route | Content |
|---|---|
| `/` | Hero search, trending tasks, latest papers/news/repos, community CTA |
| `/discover` | Unified feed, type/date/source filters |
| `/papers` | Paper list, task/period filters, sorting |
| `/papers/[slug]` | Metadata, abstract, Vietnamese summary label, sources, related repos |
| `/open-source` | Repo directory with license/task filters |
| `/news` | News feed, source/date labels |
| `/tasks` | Hierarchical taxonomy explorer |
| `/tasks/[slug]` | Unified topic page (papers/news/repos) |
| `/search` | Search results and facets |
| `/submit` | Authenticated submission form |
| `/me/submissions` | Status history |
| `/admin/review` | Moderation queue |
| `/admin/ingestion` | Connector/run status |

## Components
`SiteHeader`, `GlobalSearch`, `ContentCard`, `PaperCard`, `RepoCard`, `TaxonomyChip`, `FacetPanel`, `SourceAttribution`, `AiSummaryNotice`, `Pagination`, `EmptyState`, `ErrorState`, `SubmissionForm`, `ModerationTable`, `IngestionHealth`.

## Page requirements
- Paper: title, authors, source publication date, abstract, AI summary label, arXiv/DOI links, task tags, source provenance, code link if verified.
- Repository: description, license if known, star snapshot timestamp, official link, related tasks/papers.
- Task: intro, curated filters, grouped resources; avoid empty categories with no content.
- Admin: filter by status, see duplicate candidates, original URL, audit history, review reason.

## UX states
Every page: loading skeleton, empty state with next action, error/retry, unauthorized handling, pagination, shareable filter URL. Search supports keyboard and accessible labels. Avoid misleading 'latest' claims if ingestion is stale; show last-updated timestamps.

## SEO/performance
SSR/ISR where appropriate, canonical URLs, sitemap, robots, Open Graph, structured data when accurate, accessible headings, optimized images. Target Lighthouse audits and measured Core Web Vitals; no hard-coded performance claims.

## Design acceptance
360px and desktop layouts, keyboard navigation, visible focus, adequate contrast, no horizontal overflow, Vietnamese diacritics render correctly, content provenance above fold on detail pages.
