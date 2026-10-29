// Builds only the interactive overview of CNN Explainer as one script that exposes
// `window.CnnExplainer.mount(element)`. Copied into the upstream checkout by build.sh.
import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import replace from "@rollup/plugin-replace";

export default {
  input: "src/embed.js",
  output: { format: "iife", name: "cnnExplainerEmbed", file: "dist/embed.js" },
  plugins: [
    svelte({
      css: (css) => {
        css.write("embed.css", false);
      },
    }),
    replace({ PUBLIC_URL: "/cnn-explainer" }),
    resolve({
      browser: true,
      dedupe: (name) => name === "svelte" || name.startsWith("svelte/"),
    }),
    commonjs(),
    terser(),
  ],
};
