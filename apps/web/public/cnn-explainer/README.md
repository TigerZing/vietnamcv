# CNN Explainer (vendored)

[CNN Explainer](https://poloclub.github.io/cnn-explainer/) is an interactive visualization
of a small convolutional neural network by Zijie J. Wang, Robert Turko, Omar Shaikh,
Haekyu Park, Nilaksh Das, Fred Hohman, Minsuk Kahng and Duen Horng (Polo) Chau
(Polo Club of Data Science, Georgia Tech). It is released under the MIT License; the
licence text is in [`LICENSE.txt`](LICENSE.txt).

> Wang et al., "CNN Explainer: Learning Convolutional Neural Networks with Interactive
> Visualization", IEEE TVCG, 2020. https://arxiv.org/abs/2004.15004

VietnamCV serves a copy at `/cnn-explainer/index.html` and embeds it on the Knowledge
page (`/[locale]/knowledge/cnn`), so the illustration keeps working when the original
host or a CDN is unreachable.

## What was copied

The built files from the `gh-pages` branch of
https://github.com/poloclub/cnn-explainer at commit
`76879ce0721022000c300c2fb8372224822ef70d`: `bundle.js`, `bundle.css`, `global.css` and
`assets/` (without source maps and the stale `assets/js` and `assets/css` copies). The app
loads its files from absolute `/cnn-explainer/...` paths, which is why it lives here.

## What was changed

Only `index.html`:

- d3 5.16.0, TensorFlow.js 1.0.0, Bulma 0.8.0, Font Awesome Free 5.3.1, MathJax 3.2.2 and
  smooth-scroll 15.0.0 load from `vendor/` (taken from their npm packages) instead of CDNs.
  Their licences are in `vendor/THIRD_PARTY_LICENSES.txt`.
- The Google Analytics tag, the `polyfill.io` script and the `recommender-overlay` script
  are removed.

## Updating

Copy the new build from the `gh-pages` branch over these files, keep this `index.html`
(compare its `<head>` with upstream for new libraries) and update the commit above.
