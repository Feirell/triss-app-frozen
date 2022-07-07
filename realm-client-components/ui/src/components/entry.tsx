import {Provider, useSelector} from "react-redux";
import React, {StrictMode} from "react";

import {State, store} from "@triss/state-management";
import {ClientState, ViewNames} from "@triss/state-management";

import {ViewLayout} from "./view-layout/view-layout";
import {ShowSimulation} from "./show-simulation/show-simulation";
import {MainMenu} from "./main-menu/main-menu";
import {LoadingAssets} from "./loading-assets/loading-assets";
import {Connect} from "./connect/connect";
import {ComposeLayout} from "./compose-layout/compose-layout";

const viewSelector = (state: State) => state.client.view;

const mainViewName = (name: ViewNames) => name.split("/")[0];

const mapView = (view: ClientState["view"]["name"]) => {
  if (view == "loading-assets") return <LoadingAssets />;

  if (view == "connecting") return <Connect />;

  if (view == ("main-menu" as any)) return <MainMenu />;

  if (view == "compose-layout") return <ComposeLayout />;

  if (view == "view-layout") return <ViewLayout />;

  if (view == "show-simulation") return <ShowSimulation />;

  throw new Error("Could not find a view for the name " + view);
};

const resetAnimation = (ref: HTMLDivElement, className: string) => {
  // hack taken from https://css-tricks.com/restart-css-animation/#update-another-javascript-method-to-restart-a-css-animation
  ref.classList.remove(className);
  void ref.offsetWidth;
  ref.classList.add(className);
};

const resetAnimCb = (playAnim: boolean, className: string) => (node: HTMLDivElement | null) => {
  if (node != null && playAnim) {
    resetAnimation(node, className);
  }
};

const ViewSelector = () => {
  const view = useSelector(viewSelector);
  const name = mainViewName(view.name);
  // const viewRef = useCallback(resetAnimCb(name != 'loading-assets', name), [view]);

  return <div className={"view-wrapper " + name} /*ref={viewRef}*/>{mapView(name as any)}</div>;
};

export const Entry = (
  <StrictMode>
    <Provider store={store}>
      <ViewSelector />
    </Provider>
  </StrictMode>
);
