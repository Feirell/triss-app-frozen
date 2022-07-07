import {addActionListener, addRawActionReducer, State} from "../store/store";
import {GLOBAL_SERVER_CONNECTION} from "@triss/server-connection";

addRawActionReducer("finished-vehicle-agent-creation", (state, action) => {
  return {
    ...state,
    client: {
      ...state.client,
      view: {
        name: "main-menu/server/vehicle-agents",
        creationState: {
          state: "send-request",
        },
      },
    },
  } as State;
});

addActionListener("finished-vehicle-agent-creation", async (action, dispatch) => {
  const {associatedFiles} = action;
  const result = await GLOBAL_SERVER_CONNECTION.createVehicleAgent(
    associatedFiles
  );

  dispatch({
    type: "vehicle-agent-creation-request-result",
    request: action,
    result: result.successful
      ? {
          type: "succeeded",
          id: result.id!,
        }
      : {
          type: "failed",
          reason: result.reason!,
        },
  });
});

addRawActionReducer("vehicle-agent-creation-request-result", (state, action) => {
  return {
    ...state,
    client: {
      ...state.client,
      view: {
        name: "main-menu/server/vehicle-agents",
        creationState:
          action.result.type == "succeeded"
            ? {
                state: "was-successful",
                createdEntityId: action.result.id,
              }
            : {
                state: "was-unsuccessful",
                reason: action.result.reason,
              },
      },
    },
  } as State;
});

// addRawActionReducer('created-vehicle-agent', (state, action) => {
//     return {
//         ...state,
//         client: {
//             ...state.client,
//             currentUnableToCreateVehicleAgentReason: undefined,
//             currentlyCreatingVehicleAgent: false
//         }
//     } as State;
// });
//
// addRawActionReducer('unable-to-create-agent', (state, action) => {
//     return {
//         ...state,
//         client: {
//             ...state.client,
//             currentUnableToCreateVehicleAgentReason: action.reason,
//             currentlyCreatingVehicleAgent: false
//         }
//     } as State;
// });
//
// addActionListener('created-vehicle-agent', async (action, dispatch) => {
//     const instances = await GLOBAL_CLIENT.getServerState();
//
//     // TODO 'server.vehicle-agents' this is not type checked
//     dispatch({type: 'navigate', path: ['main-menu', 'server.vehicle-agents']});
// });
