import {addActionListener, addRawActionReducer, State} from "../store/store";
import {isView} from "../state/client-state";
import {AssetsProgressA} from "../actions/assets";
import {ALL_ASSETS_LOADER} from "@triss/server-connection";

addActionListener("store-initialized", (action, dispatch, getState) => {
  ALL_ASSETS_LOADER.addEventListener("loading-finished", () => {
    console.timeEnd("loading assets");
    dispatch({type: "assets-loaded"});
  });

  ALL_ASSETS_LOADER.addEventListener("loading-progress", ev => {
    const prog = ev.loader.getProgress();

    dispatch({
      type: "assets-progress",
      loaded: prog.totalBytesLoaded,
      needed: prog.totalBytesNeeded,
    });
  });

  console.time("loading assets");
  ALL_ASSETS_LOADER.beginLoading();
});

addActionListener("assets-loaded", (action, dispatch) => {
  dispatch({
    type: "navigate",
    view: {name: "connecting", lastFailMessage: undefined},
  });
});

addRawActionReducer("assets-progress", (state, action: AssetsProgressA) => {
  if (!isView(state.client.view, "loading-assets")) return state;

  return {
    ...state,
    client: {
      ...state.client,
      view: {
        ...state.client.view,
        state: "loading",
        total: action.needed,
        loaded: action.loaded,
      },
    },
  } as State;
});
