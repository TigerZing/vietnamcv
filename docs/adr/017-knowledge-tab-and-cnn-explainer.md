# ADR-017: Knowledge tab and CNN Explainer built into the page

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

1. Iframe the hosted page. Every visitor would load Polo Club's analytics and the
   `polyfill.io` script, and the illustration breaks when GitHub Pages or a CDN is
   unreachable.
2. Rewrite it in React. Large effort, and we would maintain a fork of a research tool.
3. Build only its interactive overview from the upstream source and mount it into our
   page.

## Decision

The first version (PR #37) served the whole upstream page from `public/cnn-explainer` in
an iframe. The owner asked for only the interactive part, integrated directly into the
site rather than through another page, so it is now built from source and mounted
inline:

- **Build from source.** `tools/cnn-explainer/build.sh` checks out the upstream source
  at a pinned commit, removes the long-form article from `Overview.svelte`, and builds a
  separate entry (`tools/cnn-explainer/embed.js`) that only exposes
  `window.CnnExplainer.mount(element)`. The header, the article, the analytics tag, the
  `polyfill.io` script and the recommender overlay are not part of the build. The output
  (`embed.js`, `embed.css`, the model, the sample images, d3, TensorFlow.js and Font
  Awesome from npm) goes to `apps/web/public/cnn-explainer/`, about 3 MB. The upstream
  licence is kept there as `LICENSE.txt`, the libraries' licences in
  `THIRD_PARTY_LICENSES.txt`. Prettier and ESLint skip the generated folder.
- **Mounted in the page.** `components/knowledge/cnn-explainer.tsx` loads the scripts
  once and mounts the Svelte app into a `div` that React leaves alone; it unmounts on
  navigation. No iframe.
- **Style isolation.** `scope.mjs` prefixes every rule of Bulma, the app's `global.css`
  and its component CSS with `.cnn-explainer`, so nothing reaches the site, and resizes
  the network to its container instead of the viewport. The drawing keeps a 1100 px
  minimum width and scrolls sideways inside its box on narrower screens.
- **Links into the site.** Upstream binds a smooth-scroll library to every in-page link
  of the document. The embed replaces it with a stub that only performs the "move to
  article section" scrolls, and the CNN page puts the `#article-*` ids those scrolls look
  for on its own Vietnamese/English sections.
- **Hyperparameter playground.** The same bundle also exposes
  `mountHyperparameters`, the convolution hyperparameter widget from the upstream
  article, which the CNN page shows inside its convolution section.
- **Dark theme.** Under the site's dark theme the scoped CSS inverts the visualization
  (`invert(1) hue-rotate(180deg)`) and inverts photos, feature maps and the network's
  colour legends back, so they keep their real colours on a black background.
- **Attribution.** The authors, the MIT licence, the paper, the source and the original
  site are credited directly under the visualization. The axe checks exclude
  `.cnn-explainer`: it is third-party markup we do not modify.
- **Pages.** `/knowledge` lists topics; `/knowledge/cnn` and `/knowledge/transformer`
  are static articles. Copy lives in `messages/{vi,en}.json` under `Knowledge`; section
  bodies are plain strings (blank line = new paragraph, lines starting with `- ` = list)
  read through `useMessages`, so they are not parsed as ICU messages. Sections reuse
  roadmap illustrations where one fits. The Transformer page has its own small
  interactive piece, a toy self-attention over 16 image patches (`lib/attention-toy.ts`),
  instead of embedding Transformer Explainer, which downloads a GPT-2 model and is
  about text, not images.

## Consequences

- About 3 MB of generated static files in the repository; the CNN page downloads about
  2 MB of scripts and the model when it opens.
- Labels inside the visualization stay in English; the explanations around it are
  bilingual.
- The visualization relies on global ids (`#cnn-svg`) and globals (`d3`, `tf`), so only
  one instance can be on a page.
- Updating CNN Explainer means changing the pinned commit in `build.sh`, rerunning it
  and checking that the `Overview.svelte` patch still applies.
- Knowledge copy is AI-assisted and needs editorial review like the roadmap entries.
