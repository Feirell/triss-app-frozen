import {Action} from "redux";

import {
  LayoutInformation,
  SimulationInstanceInformation,
  VehicleAgentInformation,
} from "@triss/client-server-serializer";

export interface GotServerStateA extends Action {
  type: "got-server-state";
  simulationInstances: SimulationInstanceInformation[];
  vehicleAgents: VehicleAgentInformation[];
  layouts: LayoutInformation[];
}
