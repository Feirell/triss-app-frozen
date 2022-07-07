import {addActionListener, addRawActionReducer, dispatch, State} from "../store/store";
import {GLOBAL_SERVER_CONNECTION} from "@triss/server-connection";
import {FrameDTO, FullFrameStateDTO, LayoutStateDTO} from "@triss/dto";
import {SMFrame} from "@triss/client-server-serializer";

addRawActionReducer("finished-simulation-instance-creation", (state, action) => {
  return {
    ...state,
    client: {
      ...state.client,
      view: {
        name: "main-menu/server/instances",
        creationState: {
          state: "send-request"
        }
      }
    }
  } as State;
});

addActionListener("finished-simulation-instance-creation", async (action, dispatch) => {
  const {name, description, agent, layout} = action;
  const result = await GLOBAL_SERVER_CONNECTION.createInstance(name, description, agent, layout);

  dispatch({
    type: "simulation-instance-creation-request-result",
    request: action,
    result: result.successful
      ? {
        type: "succeeded",
        id: result.id!
      }
      : {
        type: "failed",
        reason: result.reason!
      }
  });
});

addRawActionReducer("simulation-instance-creation-request-result", (state, action) => {
  return {
    ...state,
    client: {
      ...state.client,
      view: {
        name: "main-menu/server/instances",
        creationState:
          action.result.type == "succeeded"
            ? {
              state: "was-successful",
              createdEntityId: action.result.id
            }
            : {
              state: "was-unsuccessful",
              reason: action.result.reason
            }
      }
    }
  } as State;
});

const putFramesIn = (frames: FrameDTO[], add: FrameDTO): FrameDTO[] => {
  const newFrames = frames.concat([add]).sort((a, b) => a.frameId - b.frameId);

  for (let i = 1; i < newFrames.length; i++) {
    if (newFrames[i - 1].frameId != newFrames[i].frameId - 1)
      console.warn(
        "the frames are not in a continues order",
        newFrames.map(f => f.frameId)
      );
  }

  return newFrames;
};

addActionListener("view-simulation-instance", (action, dispatch) => {
  // dispatch({type: 'navigate', view: {name: 'show-simulation', }});
  GLOBAL_SERVER_CONNECTION.startSendingFrames(action.id, {
    includeLayout: false,
    includeTraffic: false,
    includeExportedAgentDataFor: action.exportFor || []
  });
});

const DEFAULT_INSTANCE_DATA: FullFrameStateDTO = {
  frameId: 0,
  simulationTime: 0,
  traffic: {
    category: "TrafficStateDTO",
    vehicles: []
  },
  layout: {
    category: "LayoutStateDTO",
    tiles: [],
    tags: []
  } as LayoutStateDTO,
  exportedAgentData: []
};

addRawActionReducer("view-simulation-instance", (st, ac) => {
  const sel = st.server.instances.find(si => si.id == ac.id);
  if (sel == undefined) throw new Error("could not find the instance which was selected");

  if (st.client.view.name == "show-simulation" && st.client.view.simulation == sel) return st;

  return {
    ...st,
    client: {
      ...st.client,
      view: {
        name: "show-simulation",
        simulation: sel,

        frame: DEFAULT_INSTANCE_DATA
      }
    }
  } as State;
});

addActionListener("close-simulation-instance", (action, dispatch, getState) => {
  const view = getState().client.view;
  if (view.name == "show-simulation")
    GLOBAL_SERVER_CONNECTION.stopSendingFrames(view.simulation.id);

  dispatch({type: "navigate-to-overview", view: "instances"});
});

GLOBAL_SERVER_CONNECTION.createFilteredWrapperCallback(
  (msg: any): msg is SMFrame => msg.type == "sm-frame",
  msg => {
    dispatch({
      type: "received-frame",
      id: msg.instanceId,
      frame: msg.frame
    });
  }
);

addActionListener("change-simulation-instance-operating-state", (action, dispatch, getState) => {
  GLOBAL_SERVER_CONNECTION.changeSimulationOperatingState(action.instanceId, action.toState);
});

addActionListener("received-frame", (action, dispatch, getState) => {
  if (getState().client.view.name != "show-simulation")
    dispatch({type: "close-simulation-instance"});
});

addRawActionReducer("received-frame", (state, action) => {
  const view = state.client.view;

  if (view.name != "show-simulation") return state;

  const {traffic: storedTraffic, layout: storedLayout} = view.frame;

  const {
    frameId,
    simulationTime,

    traffic,
    layout,
    exportedAgentData
  } = action.frame;

  const ffs: FullFrameStateDTO = {
    frameId,
    simulationTime,

    traffic: traffic || storedTraffic,
    layout: layout || storedLayout,
    exportedAgentData: exportedAgentData
  };

  return {
    ...state,
    client: {
      ...state.client,
      view: {
        name: "show-simulation",
        simulation: view.simulation,

        frame: ffs
      }
    }
  };
});
