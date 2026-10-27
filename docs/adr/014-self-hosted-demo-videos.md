# ADR-014: Self-hosted demo videos

- Status: Accepted
- Date: 2026-10-27
- Supersedes: the playback point of [ADR-013](013-demo-watch-page-and-comments.md) for
  video demos

## Context

The owner wants a demo to start playing as soon as it is picked from the list. LinkedIn's
embed player has autoplay switched off, reads no autoplay option, and cannot be
controlled from the embedding page, so a viewer always had to press play a second time
inside the frame. Asked to choose (2026-10-27), the owner chose to download the videos
and play them on VietnamCV, keeping the credit and source link.

## Decision

- **Files.** Each video demo has `apps/web/public/demos/videos/<id>.mp4`. The file is
  LinkedIn's own MP4 rendition, picked at about 720p, downloaded once from the public
  embed page on the owner's machine. Image posts (13–15) have no video and keep
  LinkedIn's embed.
- **Playback.** `DemoPlayer` uses a native `<video>` with the thumbnail as poster.
  Picking a demo (`/demos/<id>`) starts it right away. If the browser blocks sound
  without a fresh press, it plays muted, with controls to unmute. `/demos` waits for a
  press, with `preload="none"`. A page that Next keeps mounted but hidden pauses its
  video.
- **Rights.** Credits (maker, poster), the date and the link to the original post stay
  next to every video. A video is removed as soon as its author asks; the thumbnail goes
  at the same time.

## Consequences

- No third-party player and no LinkedIn request while watching a video.
- The repository and the web image grow by the size of the videos. A unit test fails
  when a video demo has no file.
- A new video demo needs its MP4 committed next to its thumbnail.
- VietnamCV now redistributes other people's videos. This is the owner's decision; the
  takedown rule above is how it is handled.
