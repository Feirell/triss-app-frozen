import {World} from "@triss/entities";
import {Agent, HandleFrameArguments} from "@triss/agent-interface";
import {EntityIdentifier} from "@triss/dto";

export class SimulationEngine {
  private frameNr = 0;

  constructor(private world: World, private frameHandler: Agent, private readonly hz = 60) {}

  getSimulationTime() {
    return (this.frameNr * 1000) / this.hz;
  }

  initialize() {
    this.frameNr = -1;
    this.calculateNextFrame();
  }

  getWorld() {
    return this.world;
  }

  getFrameHandler() {
    return this.frameHandler;
  }

  getExportedAgentData(forEntities: EntityIdentifier[]) {
    return this.frameHandler.getExportedAgentData(forEntities);
  }

  getCurrentFrameId() {
    return this.frameNr;
  }

  calculateNextFrame() {
    this.frameNr++;

    let hasTrafficChanged = false;
    const changedTraffic = () => (hasTrafficChanged = true);

    let hasLayoutChanged = false;
    const changedLayout = () => (hasLayoutChanged = true);

    const args: HandleFrameArguments = {
      world: this.world,

      frameNumber: this.frameNr,
      simulationTime: this.getSimulationTime(),
      deltaMs: 1000 / this.hz,

      changedTraffic,
      changedLayout,
    };

    this.world = this.frameHandler.handleFrame(args);

    return {
      hasTrafficChanged,
      hasLayoutChanged,
    };
  }
}
