import {World} from "@triss/entities";

import {EntityIdentifier, ExportedAgentDataDTO} from "@triss/dto";

export interface AgentConstructor {
  new(): Agent;
}

export interface HandleFrameArguments {
  world: World;

  frameNumber: number;
  simulationTime: number;
  deltaMs: number;

  changedTraffic: () => void;
  changedLayout: () => void;
}

export interface Agent {
  handleFrame(args: HandleFrameArguments): World;

  getExportedAgentData(forEntities: EntityIdentifier[]): ExportedAgentDataDTO;
}
