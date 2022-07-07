import {LayoutStateDTO} from "@triss/dto";
import {
  LayoutInformation,
  SimulationInstanceInformation,
  VehicleAgentInformation,
} from "@triss/client-server-serializer";

export interface ServerState {
  layouts: LayoutInformation[];
  vehicleAgents: VehicleAgentInformation[];
  instances: SimulationInstanceInformation[];

  currentlyRequesting: boolean;
  setup: LayoutStateDTO | undefined;
}

export const INITIAL_SERVER_STATE: ServerState = {
  vehicleAgents: [],
  layouts: [],
  instances: [],

  currentlyRequesting: false,
  setup: undefined,
};
