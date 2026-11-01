# ADR-019: Short video feed from the owner's local library

- Status: Accepted
- Date: 2026-11-02

## Context

The owner keeps Facebook videos with translated subtitles in `fb_videos/`, outside this
repository, and watches them through a small local server (`fb_videos/xem.sh`, port 8765).
They asked for a tab that shows those videos in a vertical swipe feed at the 9:16 Reel
ratio, with control over caption size and playback speed, plus likes and comments.

## Decision

- **Data.** `/videos` is a static page. The browser reads the list, subtitles and video
  files directly from `http://localhost:8765`. The videos are not copied into the
  repository, the Docker image or the database. `serve.py` allows `localhost:3000` as a
  CORS origin on its JSON endpoints.
- **Feed.** Scroll snapping with one slide per video. Only the active video and its
  neighbours hold a media element. Text size, speed and caption mode apply to every video
  and are remembered in `localStorage`.
- **Comments and likes.** A video becomes a `contents` row of type `video` the first time
  somebody likes or comments on it; reads never create rows, so the database does not have
  to mirror a folder that changes. The slug comes from the file name (`video-...`).
  Comments reuse the existing rules, rate limits and moderation queue. Likes live in
  `video_likes`, one row per video and visitor, where a visitor is the SHA-256 of a random
  id in an httpOnly cookie, so no sign-in is needed.

## Consequences

- The tab only works on a machine running `xem.sh`. A public deployment shows the
  "cannot reach the video server" state until videos have a hosted home, and an https site
  cannot call the http local server at all. Hosting these videos publicly would also need
  a rights review, since they belong to their Facebook authors.
- Clearing cookies or changing browser makes a visitor new, and a script could inflate
  likes with new ids within the rate limit. Likes are a light signal, not a metric.
- Renaming a video file starts a new thread and like count.
- Moderation lists a video by its slug, because the title stays on the local server.
