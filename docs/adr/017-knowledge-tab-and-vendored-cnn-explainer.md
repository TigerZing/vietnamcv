# ADR-017: Knowledge tab and a vendored CNN Explainer

- Status: Accepted
- Date: 2026-10-29

## Context

The owner asked for a "Kiến thức" (Knowledge) tab that explains CNNs and Transformers,
and for the CNN part to be illustrated with
[CNN Explainer](https://poloclub.github.io/cnn-explainer/), an interactive visualization
by the Polo Club of Data Science (Georgia Tech) released under the MIT License. CNN
Explainer is a prebuilt Svelte app that loads its own files from absolute
`/cnn-explainer/...` paths and pulls d3, TensorFlow.js, Bulma, Font Awesome, MathJax and
smooth-scroll from CDNs. Its hosted page also loads Google Analytics, a script from the
`polyfill.io` domain (which served malicious code in 2024) and a recommender overlay.

Options considered:

1. Iframe the hosted page. No files to keep, but every visitor would load Polo Club's
   analytics and the `polyfill.io` script, and the illustration breaks when GitHub Pages
   or a CDN is unreachable.
2. Port it into React components. Large effort, and we would maintain a fork of a
   research tool.
3. Serve an unmodified copy of the built app from our origin and embed it in an iframe.

## Decision

- **Vendored copy (option 3).** The built files from the upstream `gh-pages` branch
  (commit `76879ce0`) live in `apps/web/public/cnn-explainer/`, so the app's absolute
  paths work as they are. Only `index.html` changes: the libraries load from
  `public/cnn-explainer/vendor/` (taken from their npm packages, licences in
  `vendor/THIRD_PARTY_LICENSES.txt`), and the analytics tag, the `polyfill.io` script and
  the recommender overlay are removed. The upstream licence is kept as `LICENSE.txt`
  (a file without an extension would be caught by the locale middleware). The folder's
  `README.md` records the source commit and how to update. Prettier and ESLint skip it.
- **Attribution.** The embed on `/knowledge/cnn` names the authors and links the MIT
  licence, the paper, the source and the original site directly under the iframe.
- **Isolation.** The app runs in an iframe so its global CSS (Bulma) and scripts cannot
  touch the site. The axe checks exclude the iframe: it is third-party content we keep
  unmodified.
- **Pages.** `/knowledge` lists topics; `/knowledge/cnn` and `/knowledge/transformer`
  are static articles. Copy lives in `messages/{vi,en}.json` under `Knowledge`; section
  bodies are plain strings (blank line = new paragraph, lines starting with `- ` = list)
  read through `useMessages`, so they are not parsed as ICU messages. Sections reuse
  roadmap illustrations where one fits. The Transformer page has its own small
  interactive piece, a toy self-attention over 16 image patches (`lib/attention-toy.ts`),
  instead of embedding Transformer Explainer, which downloads a GPT-2 model and is
  about text, not images.

## Consequences

- About 17 MB of static files in the repository (13 MB of it upstream, mostly three
  animated GIFs in the article part). Visitors download the TensorFlow.js model and
  libraries only when the iframe scrolls into view (`loading="lazy"`).
- CNN Explainer is designed for wide screens; on phones the page says so and offers a
  full-screen link.
- Updating CNN Explainer means copying a new upstream build over the folder and
  comparing `index.html` with upstream for new libraries.
- Knowledge copy is AI-assisted and needs editorial review like the roadmap entries.
