import Explainer from "./Explainer.svelte";

// The upstream page binds smooth-scroll to every in-page link of the document and scrolls
// to its article sections. Embedded, the host page owns its links, so only the explicit
// "move to article section" scrolls are kept, and they land on the host's own sections.
window.SmoothScroll = function SmoothScroll() {
  this.animateScroll = (anchor) => {
    if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  };
};

window.CnnExplainer = {
  mount(target) {
    const app = new Explainer({ target });
    return () => app.$destroy();
  },
};
