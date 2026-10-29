// Scopes the CNN Explainer styles (Bulma, its global.css and the Svelte component CSS)
// under one root class so they cannot reach the host page. Usage:
//   node scope.mjs <root selector> <output.css> <input.css>...
import fs from "node:fs";

import postcss from "postcss";
import prefixer from "postcss-prefix-selector";

const [root, out, ...inputs] = process.argv.slice(2);
const css = inputs.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const result = await postcss([
  prefixer({
    prefix: root,
    transform(prefix, selector, prefixed) {
      // Page-level rules (Bulma's reset, the app's html/body/:root) apply to the root.
      if (/^(:root|html|body)$/.test(selector)) return prefix;
      if (/^(html|body)[\s>.]/.test(selector))
        return prefix + selector.replace(/^(html|body)/, "");
      return prefixed;
    },
  }),
]).process(css, { from: undefined });

// The root is a block inside a page, not the viewport: undo the page-level sizing and
// scrolling those rules gave it, and let a wide network scroll sideways inside it.
const host = `
${root} {
  position: relative;
  width: 100%;
  height: auto;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  background: #fff;
  color: #333;
  font-size: 16px;
  line-height: 1.5;
}
${root} img, ${root} svg, ${root} canvas { display: inline; max-width: none; }
/* Upstream sizes the network to the viewport (100vw); here it fills the root. */
${root} #cnn-svg { width: 100%; }
`;
fs.writeFileSync(out, result.css + host);
