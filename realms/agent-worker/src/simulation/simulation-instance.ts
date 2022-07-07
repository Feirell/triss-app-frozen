import {World} from "@triss/entities";
import {AgentConstructor} from "@triss/agent-interface";
import {EntityIdentifier, FrameDTO} from "@triss/dto";

import {SimulationEngine} from "./simulation-engine";

export class SimulationInstance {
  private readonly simulationEngine: SimulationEngine;

  constructor(initialWorld: World, Agent: AgentConstructor) {
    this.simulationEngine = new SimulationEngine(initialWorld, new Agent());
  }

  getEngine() {
    return this.simulationEngine;
  }

  calculateNextFrame() {
    return this.simulationEngine.calculateNextFrame();
  }

  getCurrentFrame({
                    includeTraffic = true,
                    includeLayout = false,
                    includeExportedAgentDataFor = []
                  }: {
    includeTraffic?: boolean;
    includeLayout?: boolean;
    includeExportedAgentDataFor?: EntityIdentifier[];
  } = {}): FrameDTO {
    const se = this.simulationEngine;
    const world = se.getWorld();

    return {
      frameId: se.getCurrentFrameId(),
      simulationTime: se.getSimulationTime(),

      traffic: includeTraffic ? world.getTrafficState() : undefined,
      layout: includeLayout ? world.getLayoutState() : undefined,

      exportedAgentData: se.getExportedAgentData(includeExportedAgentDataFor)
    };
  }
}
