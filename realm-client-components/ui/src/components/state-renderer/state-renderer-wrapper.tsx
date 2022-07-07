import React, {useEffect, useState} from "react";

interface RendererDefinition {
  getContainer(): HTMLElement;

  cycle(): void;
}

const renderHandler = new (class RenderHandler {
  private renderer = new Set<RendererDefinition>();

  constructor() {
    const cycle = () => {
      requestAnimationFrame(cycle);
      this.callRenderer();
    };

    requestAnimationFrame(cycle);
  }

  addRenderer(renderer: RendererDefinition, wrapper: HTMLDivElement) {
    wrapper.appendChild(renderer.getContainer());
    this.renderer.add(renderer);
  }

  removeRenderer(renderer: RendererDefinition) {
    const parent = renderer.getContainer().parentElement;
    if (parent) parent.textContent = "";

    this.renderer.delete(renderer);
  }

  private callRenderer() {
    for (const render of this.renderer) render.cycle();
  }
})();

export const StateRendererWrapper = ({renderer}: {renderer: RendererDefinition}) => {
  const [elem, setElem] = useState<null | HTMLDivElement>(null);

  useEffect(() => {
    if (!elem) {
      renderHandler.removeRenderer(renderer);
    } else {
      renderHandler.addRenderer(renderer, elem);
      return () => renderHandler.removeRenderer(renderer);
    }
  }, [elem]);

  return <div className="react-state-render-wrapper" ref={setElem} />;
};
