# 07 — Community, Moderation and Trust

## MVP community-lite
Authenticated contributor can submit a URL, type, optional title/description and existing taxonomy tags. The submission is queued. Moderator checks duplicate, source safety, relevance and attribution; approves (creating/updating canonical content) or rejects with reason. User sees status/history.

## Roles
- Guest: read published content.
- Member: submit content, view own submissions; P1 bookmark/comment/report.
- Moderator: review submissions, edit metadata, unpublish harmful/incorrect content, audit actions.
- Admin: source/taxonomy/user-role management, moderator oversight.

## States
Submission: `pending -> approved|rejected|changes_requested`; `changes_requested -> pending` after edit. Content: `draft -> pending_review -> published|rejected`; `published -> archived` for takedown/unpublish. Log every transition.

## P1 community features
Profile (bio, skills, GitHub), comments threaded to depth limit, topic follows, bookmarks, reporting, technical Q&A. Apply rate limits and abuse controls before enabling broad commenting.

## Safety and quality
- Sanitize Markdown/HTML to prevent XSS; do not allow arbitrary embeds/scripts.
- URL preview fetch must block SSRF and limit response size.
- Prevent vote brigading; don't launch reputation until sufficient moderation capacity.
- Support copyright/takedown reports, correction requests and moderator appeal.
- Do not expose email or private profile fields by default.

## Moderation acceptance tests
Unauthorized approve -> 403; approve duplicate -> merge or 409 with actionable error; every approve/reject produces audit record; rejected content never appears publicly; archived content disappears from search and cache; moderator can explain decision to contributor.
