import {
  addActionListener,
  addRawActionReducer,
  dispatch,
  INITIAL_STATE,
  State,
} from "../store/store";
import {GLOBAL_SERVER_CONNECTION} from "@triss/server-connection";
import {SMServerState} from "@triss/client-server-serializer";

GLOBAL_SERVER_CONNECTION.addEventListener("state-changed", ({to}) => {
  if (to == "open") dispatch({type: "connected"});
  else dispatch({type: "disconnected"});
});

GLOBAL_SERVER_CONNECTION.createFilteredWrapperCallback(
  (msg): msg is SMServerState => msg.type == "sm-server-state",
  serverState => {
    const {layouts, vehicleAgents, simulationInstances} = serverState;

    dispatch({
      type: "got-server-state",
      layouts,
      vehicleAgents,
      simulationInstances,
    });
  }
);

addActionListener("connect", async (ac, dispatch) => {
  try {
    await GLOBAL_SERVER_CONNECTION.connect(ac.url);
  } catch (e) {
    if (GLOBAL_SERVER_CONNECTION.getState() != "open")
      dispatch({type: "connection-failed", reason: (e as Error).message});
  }
});

addActionListener("connected", (action, dispatch) => {
  // dispatch({type: 'navigate', view: {name: 'main-menu/server/overview'}});
  dispatch({type: "navigate-to-overview", view: "instances"});
});

addRawActionReducer("connected", (st, csc) => {
  return {
    ...st,
    server: INITIAL_STATE.server,
  } as State;
});

addRawActionReducer("disconnected", (st, csc) => {
  return {
    ...st,
    client: {
      ...st.client,
      view: {
        name: "connecting",
        lastFailMessage: undefined,
      },
    },
    server: INITIAL_STATE.server,
  } as State;
});

addRawActionReducer("connect", (st, csc) => {
  return {
    ...st,
    client: {
      ...st.client,
      view: {
        name: "connecting",
        lastFailMessage: undefined,
      },
    },
    server: INITIAL_STATE.server,
  } as State;
});

addRawActionReducer("connection-failed", (st, csc) => {
  return {
    ...st,
    client: {
      ...st.client,
      view: {
        name: "connecting",
        lastFailMessage: csc.reason,
      },
    },
    server: INITIAL_STATE.server,
  } as State;
});

addRawActionReducer("got-server-state", (st, ac) => {
  return {
    ...st,
    server: {
      ...st.server,
      vehicleAgents: ac.vehicleAgents,
      layouts: ac.layouts,
      instances: ac.simulationInstances,
    },
  } as State;
});
