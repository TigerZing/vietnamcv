#!/usr/bin/env bash
# Rebuilds apps/web/public/cnn-explainer from the upstream CNN Explainer source
# (https://github.com/poloclub/cnn-explainer, MIT License): only the interactive
# overview, mounted into a VietnamCV page instead of the original standalone site.
# Needs git, node and network access to GitHub and the npm registry. See README.md.
set -euo pipefail

COMMIT=d0971f9447ed9806022a3d47587b62394682bc51
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/../../apps/web/public/cnn-explainer"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

git clone --quiet https://github.com/poloclub/cnn-explainer.git "$WORK/src"
git -C "$WORK/src" checkout --quiet "$COMMIT"
cd "$WORK/src"

# The embed drops the long-form article (VietnamCV has its own sections).
sed -i "/import Article from '..\/article\/Article.svelte';/d; /^<Article\/>$/d" \
  src/overview/Overview.svelte
cp "$HERE/embed.js" src/embed.js
cp "$HERE/rollup.embed.config.js" rollup.embed.config.js
npm install --no-audit --no-fund --silent
npx rollup -c rollup.embed.config.js

# Libraries the overview expects as globals, from their npm packages.
mkdir -p "$WORK/lib" && cd "$WORK/lib"
npm pack --silent d3@5.16.0 @tensorflow/tfjs@1.0.0 bulma@0.8.0 \
  @fortawesome/fontawesome-free@5.3.1 >/dev/null
for archive in *.tgz; do
  mkdir "${archive%.tgz}" && tar xzf "$archive" -C "${archive%.tgz}"
done
npm install --no-audit --no-fund --silent postcss@8.5.32 postcss-prefix-selector@2.2.1

cp "$HERE/scope.mjs" scope.mjs
node scope.mjs .cnn-explainer "$WORK/embed.css" \
  bulma-0.8.0/package/css/bulma.min.css \
  "$WORK/src/public/global.css" \
  "$WORK/src/dist/embed.css"

rm -rf "$OUT"
mkdir -p "$OUT/vendor" "$OUT/assets/img"
cp "$WORK/src/dist/embed.js" "$OUT/embed.js"
cp "$WORK/embed.css" "$OUT/embed.css"
cp -r "$WORK/src/public/assets/data" "$OUT/assets/data"
cp "$WORK/src/public/assets/img/"*.jpeg "$WORK/src/public/assets/img/"*.svg "$OUT/assets/img/"
cp "$WORK/src/LICENSE" "$OUT/LICENSE.txt"
cp d3-5.16.0/package/dist/d3.min.js "$OUT/vendor/d3-5.16.0.min.js"
cp tensorflow-tfjs-1.0.0/package/dist/tf.min.js "$OUT/vendor/tfjs-1.0.0.min.js"
cp fortawesome-fontawesome-free-5.3.1/package/js/all.min.js "$OUT/vendor/fontawesome-5.3.1.min.js"
{
  for entry in \
    "d3 5.16.0 (vendor/d3-5.16.0.min.js):d3-5.16.0/package/LICENSE" \
    "TensorFlow.js 1.0.0 (vendor/tfjs-1.0.0.min.js):tensorflow-tfjs-1.0.0/package/LICENSE" \
    "Font Awesome Free 5.3.1 (vendor/fontawesome-5.3.1.min.js):fortawesome-fontawesome-free-5.3.1/package/LICENSE.txt" \
    "Bulma 0.8.0 (scoped into embed.css):bulma-0.8.0/package/LICENSE"; do
    echo "================================================================"
    echo "${entry%%:*}"
    echo "================================================================"
    cat "${entry##*:}"
    echo
  done
} > "$OUT/THIRD_PARTY_LICENSES.txt"
cp "$HERE/README.public.md" "$OUT/README.md"
echo "Built $OUT"
