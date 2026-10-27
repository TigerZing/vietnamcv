# ADR-012: Demo products page from curated LinkedIn posts

- Status: Accepted; Data and Playback superseded by [ADR-013](013-demo-watch-page-and-comments.md)
- Date: 2026-10-26

## Context

The owner asked for a "Sản phẩm demo" (demo products) tab listing computer vision demos
from a Google Sheet. The sheet holds 19 LinkedIn post links and nothing else. The page
should look like a YouTube video grid: picture cards that play the video in place when
pressed, without opening another page. LinkedIn video and image URLs are signed and
expire, and LinkedIn blocks server-side fetching, so neither the API nor the web server
can read the posts at request time.

## Decision

- **Data.** The list lives in `apps/web/src/lib/demos.ts`: the LinkedIn update URN,
  author, a short Vietnamese and English title written by the editor from the post, the
  kind (`video` or `image`) and the video length. Order follows the owner's sheet. No
  database table or API endpoint until demos need submissions or moderation.
- **Thumbnails.** `apps/web/public/demos/NN.webp` (640×360) are frames taken from each
  post's video, or its image for the three image posts, letterboxed on a blurred copy of
  the frame. They were captured once in the owner's signed-in browser.
- **Playback.** Pressing a card replaces its thumbnail with LinkedIn's official embed
  player (`/embed/feed/update/<urn>?compact=1`) in the same card. One demo plays at a
  time; Escape or the close button stops it. Nothing loads from LinkedIn before a
  viewer presses play. Each card also links to the post on LinkedIn.
- **Navigation.** The tab is `/demos`. With six or more main links the desktop menu
  needs more room, so it shows from 1024px (`lg`); narrower screens use the menu button.

## Consequences

- Adding or removing a demo is a code change: edit `demos.ts` and add a thumbnail.
- LinkedIn's player may need a second press to start, and some browsers block its
  third-party cookies; the "View on LinkedIn" link is the fallback.
- A post the author deletes or makes private shows LinkedIn's error inside the card
  until it is removed from the list.
- Thumbnails are frames of other people's posts shown with a link to the source, the
  same as a link preview. Remove one when its author asks.
