import {useSelector} from "react-redux";
import React from "react";

import {StateRendererWrapper} from "../state-renderer/state-renderer-wrapper";
import {useInstance} from "../../hooks/use-instance";
import {State} from "@triss/state-management";
import {useThunkDispatch} from "../../hooks/use-thunk";
import {GLOBAL_MODEL_PROVIDER} from "@triss/server-connection";
import {RenderPipelineHandler} from "@triss/3d-rendering";
import {LayoutStateDTO} from "@triss/dto";

class ComposeLayoutController {
  private readonly renderer = new RenderPipelineHandler(GLOBAL_MODEL_PROVIDER);

  setLayout(layout: LayoutStateDTO) {
    this.renderer.replaceLayout(layout);
  }

  cycle() {
    if (this.renderer.isContainerAttached()) this.frame();
  }

  getContainer() {
    return this.renderer.getContainer();
  }

  getRenderer() {
    return this.renderer;
  }

  destroy() {
    // no need to destroy anything
  }

  private frame() {
    this.renderer.update();
  }
}

const viewSelector = (state: State) => state.client.view;

const createController = () => new ComposeLayoutController();

export const ViewLayout = () => {
  const view = useSelector(viewSelector);

  if (view.name != "view-layout") throw new Error("The view name needs to be view-layout");

  const layout = view.layout;

  const clc = useInstance(createController);

  clc.setLayout(layout);

  const dispatch = useThunkDispatch();

  const abortCreation = () => dispatch({type: "navigate-to-overview", view: "layouts"});

  return (
    <>
      <div className="scene-container">
        <StateRendererWrapper renderer={clc} />
      </div>
      <div className="ui-container">
        <div className="left-ui">
          <div className="abort-wrapper">
            <button className="abort" onClick={abortCreation}>
              Zurück
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
