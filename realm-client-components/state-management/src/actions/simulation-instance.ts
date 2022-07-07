import {Action} from "redux";

import {FrameDTO} from "@triss/dto";
import {EntityIdentifier} from "@triss/dto";
import {SimulationOperatingState} from "@triss/client-server-serializer";

export interface CreateSimulationInstanceA extends Action {
  type: "create-simulation-instance";
}

export interface FinishedSimulationInstanceCreationA extends Action {
  type: "finished-simulation-instance-creation";
  name: string;
  description: string;
  agent: number;
  layout: number;
}

export interface SimulationInstanceCreationRequestResultA extends Action {
  type: "simulation-instance-creation-request-result";
  request: FinishedSimulationInstanceCreationA;

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

export interface ChangeSimulationInstanceOperatingStateA extends Action {
  type: "change-simulation-instance-operating-state";
  instanceId: number;
  toState: SimulationOperatingState;
}

export interface ViewSimulationInstanceA extends Action {
  type: "view-simulation-instance";
  id: number;
  exportFor: EntityIdentifier[];
}

export interface CloseSimulationInstanceA extends Action {
  type: "close-simulation-instance";
}

export interface WorldStateConsumedA extends Action {
  type: "world-state-consumed";
}

// export interface StartRequestingFramesA extends Action {
//     type: 'start-requesting-frames';
//     id: number;
//     options: FrameOptions;
// }
//
export interface ReceivedFrameA extends Action {
  type: "received-frame";
  id: number;
  frame: FrameDTO;
}

//
// export interface StopRequestingFramesA extends Action {
//     type: 'stop-requesting-frames';
//     id: number;
// }
