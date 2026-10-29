# CNN Explainer embed build

`build.sh` turns the source of [CNN Explainer](https://github.com/poloclub/cnn-explainer)
(MIT License, Polo Club of Data Science) into the files in
`apps/web/public/cnn-explainer/`, which the Knowledge page mounts directly (ADR-017).

What it changes compared with the upstream site:

- Builds `src/embed.js` instead of `src/main.js`: only the interactive overview and its
  detail views, without the header, the long article, analytics or the recommender
  overlay. `embed.js` also replaces the global smooth-scroll library, which upstream
  binds to every in-page link of the document, with a stub that only scrolls the
  "move to article section" clicks to the host page's own `#article-*` anchors.
- Scopes every style (Bulma, `global.css`, the Svelte component CSS) under
  `.cnn-explainer` with `scope.mjs`, so nothing leaks into the site.
- Takes d3, TensorFlow.js and Font Awesome from npm instead of CDNs.

Run `tools/cnn-explainer/build.sh` and commit the result. To move to a newer upstream
version, change `COMMIT` in the script and check that the patch to `Overview.svelte`
still applies.
