import {INITIAL_SERVER_STATE, ServerState} from "./server-state";
import {INITIAL_CLIENT_STATE, ClientState} from "./client-state";

export interface State {
  client: ClientState;
  server: ServerState;
}

export const INITIAL_STATE: State = {
  client: INITIAL_CLIENT_STATE,
  server: INITIAL_SERVER_STATE,
};
