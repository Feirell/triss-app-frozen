import {addRawActionReducer, State} from "../store/store";
import {Views} from "../state/client-state";

addRawActionReducer("navigate", (state, action) => {
  return {
    ...state,
    client: {
      ...state.client,
      view: action.view,
    },
  } as State;
});

addRawActionReducer("navigate-to-overview", (state, action) => {
  let view: Views;

  switch (action.view) {
    case "layouts":
      view = {name: "main-menu/server/layouts"};
      break;

    case "instances":
      view = {
        name: "main-menu/server/instances",
        creationState: {state: "initialized"},
      };
      break;

    case "vehicle-agents":
      view = {
        name: "main-menu/server/vehicle-agents",
        creationState: {state: "initialized"},
      };
      break;

    default:
      throw new Error('Could not map view "' + action.view + '" for action navigate-to-overview');
  }

  return {
    ...state,
    client: {
      ...state.client,
      view: view,
    },
  };
});
