import {Quaternion, Vector3} from "three";

import {EntityIdentifier, ExportedAgentDataDTO} from "@triss/dto";

import {Vehicle, World} from "@triss/entities";

import {Logger} from "@triss/logger";
import {Agent, AgentConstructor, HandleFrameArguments} from "@triss/agent-interface";


export function createAgent(): AgentConstructor {
  const logger = new Logger("SPAWN-MANY");

  return class VASpawnMany implements Agent {
    private readonly amountOfVeh = 10000;
    private readonly cyclesPerSecond = 1 / 6;
    private readonly width = Math.floor(Math.sqrt(this.amountOfVeh));

    constructor() {
    }

    getExportedAgentData(forEntities: EntityIdentifier[]): ExportedAgentDataDTO {
      return [];
    }

    handleFrame(args: HandleFrameArguments) {
      const {world, frameNumber, simulationTime, deltaMs} = args;

      args.changedTraffic();

      this.spawnHandler(world, frameNumber, simulationTime, deltaMs);

      this.moveVehicle(world, frameNumber, simulationTime, deltaMs);

      return world;
    }

    private moveVehicle(world: World, frame: number, simulationTime: number, deltaMs: number) {
      const rowWidth = 4.5;
      const columnWidth = 2.5;

      const cycleNr = simulationTime / 1000;

      const animProg = cycleNr * this.cyclesPerSecond * Math.PI * 2;
      const rows = Math.ceil(world.vehicles.length / this.width);
      const waveH: number[] = new Array(rows).fill(0);

      for (let i = 0; i < rows; i++) {
        waveH[i] = Math.sin(animProg * 2 + i / 2) * 3;
      }

      for (const vehicle of world.vehicles) {
        const row = Math.floor(vehicle.id / this.width);
        const evenRow = (row & 1) !== 0;
        const column = vehicle.id - row * this.width;

        const rowP = row * rowWidth;
        const colP = column * columnWidth + (evenRow ? columnWidth * 0.5 : 0);
        const height = 10 + waveH[row];
        vehicle.position.set(colP, height, rowP);
      }
    }

    private spawnHandler(world: World, frame: number, simulationTime: number, deltaMs: number) {
      if (world.vehicles.length > 0) return world;

      for (let i = 0; i < this.amountOfVeh; i++)
        world.vehicles.push(new Vehicle(i, "VAN", new Vector3(0, 0, 0), new Quaternion()));
    }
  };
}
