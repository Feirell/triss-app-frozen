import {ExportedAgentDataDTO} from "./exportet-agent-data";
import {LayoutStateDTO} from "./layout-state";
import {TrafficStateDTO} from "./traffic-state";

export interface FrameDTO {
  frameId: number;
  simulationTime: number;

  traffic: TrafficStateDTO | undefined;
  layout: LayoutStateDTO | undefined;

  exportedAgentData: ExportedAgentDataDTO;
}

export interface FullFrameStateDTO {
  frameId: number;
  simulationTime: number;

  traffic: TrafficStateDTO;
  layout: LayoutStateDTO;

  exportedAgentData: ExportedAgentDataDTO;
}
