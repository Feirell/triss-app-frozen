import {addActionListener, addRawActionReducer, State} from "../store/store";
import {GLOBAL_SERVER_CONNECTION} from "@triss/server-connection";
import {LayoutStateDTO} from "@triss/dto";

addActionListener("create-layout", async (action, dispatch) => {
  if (action.basingOn === undefined)
    dispatch({
      type: "navigate",
      view: {name: "compose-layout", basis: undefined},
    });
  else {
    dispatch({
      type: "navigate",
      view: {name: "compose-layout", basis: "loading"},
    });
    const {layout} = await GLOBAL_SERVER_CONNECTION.loadLayout(action.basingOn);
    dispatch({type: "loaded-layout", layout});
    const layoutStateDTO: LayoutStateDTO = {
      category: "LayoutStateDTO",
      tags: layout.tags,
      tiles: layout.tiles,
    };
    dispatch({
      type: "navigate",
      view: {name: "compose-layout", basis: layoutStateDTO},
    });
  }
});

addActionListener("loaded-layout", (action, dispatch, getState) => {
  /* Nothing to do */
});

addActionListener("finished-layout-creation", async (action, dispatch, getState) => {
  const resp = await GLOBAL_SERVER_CONNECTION.createLayout(
    action.name,
    action.description,
    action.layout
  );
  // resp.id
  dispatch({type: "navigate-to-overview", view: "layouts"});
});

addActionListener("view-layout", async (action, dispatch, getState) => {
  const res = await GLOBAL_SERVER_CONNECTION.loadLayout(action.id);

  dispatch({
    type: "loaded-layout",
    layout: res.layout,
  });
});

addRawActionReducer("loaded-layout", (state, action) => {
  const {
    layout: {tiles, tags},
  } = action;

  const layoutDTO: LayoutStateDTO = {
    category: "LayoutStateDTO",
    tiles,
    tags,
  };

  return {
    ...state,
    client: {
      ...state.client,
      view: {
        name: "view-layout",
        layout: layoutDTO,
      },
    },
  } as State;
});
