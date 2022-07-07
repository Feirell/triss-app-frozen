import {Action} from "redux";

export interface CreateVehicleAgentA extends Action {
  type: "create-vehicle-agent";
}

export interface FinishedVehicleAgentCreationA extends Action {
  type: "finished-vehicle-agent-creation";
  associatedFiles: {fileName: string; fileContent: string}[];
}

export interface VehicleAgentCreationRequestResultA extends Action {
  type: "vehicle-agent-creation-request-result";
  request: FinishedVehicleAgentCreationA;

  result:
    | {
        type: "succeeded";
        id: number;
      }
    | {
        type: "failed";
        reason: string;
      };
}
