import Explainer from "./Explainer.svelte";
import HyperparameterView from "./detail-view/Hyperparameterview.svelte";

// The upstream page binds smooth-scroll to every in-page link of the document and scrolls
// to its article sections. Embedded, the host page owns its links, so only the explicit
// "move to article section" scrolls are kept, and they land on the host's own sections.
window.SmoothScroll = function SmoothScroll() {
  this.animateScroll = (anchor) => {
    if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  };
};

function mounter(Component) {
  return (target) => {
    const app = new Component({ target });
    return () => app.$destroy();
  };
}

window.CnnExplainer = {
  /** The network overview and its detail views. */
  mount: mounter(Explainer),
  /** The convolution hyperparameter playground from the upstream article. */
  mountHyperparameters: mounter(HyperparameterView),
};
