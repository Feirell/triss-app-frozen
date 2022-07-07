import {VehicleCollisionMap} from "./vehicle-collision-map";
import {LayoutNavigator, Route} from "./layout-navigator";
import {getVehiclePositionOnRoute, pickRandomItem, placeVehicleOnRoute} from "./helper/path-helper";
import {convertTileArrayToPath} from "./helper/convert-tile-array-to-path";
import {PathPiece} from "@triss/path-definition";
import {getModelLength} from "@triss/bounding-box";


import {EntityIdentifier, ExportedAgentDataDTO} from "@triss/dto";

import {VEHICLE_SCALE, VehicleType} from "@triss/entity-definition";

import seedrandom from "seedrandom";

import {Agent} from "@triss/agent-interface";
import {Piece} from "@triss/path-definition";
import {AgentConstructor, HandleFrameArguments} from "@triss/agent-interface";
import {Tile, Vehicle, World} from "@triss/entities";

interface RandomExitDriverAgentData {
  goal: number;
  spawnedAt: number;
  route: PathPiece;
  currentDistance: number;
}

export function createAgent(): AgentConstructor {

  return class VARandomExitDriver implements Agent {
    private vehicleId = 0;

    private agentData = new Map<number, RandomExitDriverAgentData>();

    private rngPickSpawner = seedrandom("spawner-pick");

    private nextVehicleType = 0;
    private subVehicleTypes: VehicleType[] = [
      // "AMBULANCE",
      // "DELIVERY",
      // "DELIVERY_FLAT",
      "POLICE",
      "SEDAN",
      "SEDAN_SPORTS",
      "HATCHBACK_SPORTS",
      "SUV",
      "SUV_LUXURY",
      "TAXI"
      // "TRACTOR",

      // "TRUCK",
      // "TRUCK_FLAT"
    ];

    private navigator: LayoutNavigator | undefined = undefined;
    private vehicleCollision: VehicleCollisionMap = new VehicleCollisionMap();
    private routeCache = new Map<string, Piece>();

    constructor() {
    }

    getExportedAgentData(forEntities: EntityIdentifier[]): ExportedAgentDataDTO {
      const res: ExportedAgentDataDTO = [];

      for (const entityId of forEntities) {
        const agentData = this.getAgentDataFor(entityId);

        if (agentData === undefined)
          res.push({
            type: "exported-agent-entity-not-found",
            forEntity: entityId
          });
        else
          res.push({
            type: "exported-agent-entity-data",
            forEntity: entityId,

            attachedData: {
              type: "data-object",
              entries: [
                {
                  label: "Goal",
                  value: {
                    type: "tag-ref",
                    value: agentData.goal
                  }
                },
                {
                  label: "Spawned At",
                  value: {
                    type: "tag-ref",
                    value: agentData.spawnedAt
                  }
                },
                // TODO Fix memory leak
                // There is a memory leak in the frontend
                // {
                //     label: 'Route',
                //     value: {
                //         type: "path",
                //         value: value.route
                //     }
                // },
                {
                  label: "Current Distance",
                  value: {
                    type: "float",
                    value: agentData.currentDistance
                  }
                }
              ]
            }
          });
      }

      return res;
    }

    handleFrame(args: HandleFrameArguments) {
      const {world, frameNumber, simulationTime, deltaMs} = args;
      /*
            Without the vehicle collide helper

            Frame #1
              handle spawn: 3.459s
              handle move: 6.712s
            Frame #2
              handle spawn: 3.287s
              handle move: 6.472s
            Frame #3
              handle spawn: 3.281s
              handle move: 6.404s
            Frame #4
              handle spawn: 3.224s
              handle move: 6.328s
            Frame #5
              handle spawn: 3.181s
              handle move: 6.247s
            Frame #6
              handle spawn: 3.188s
              handle move: 6.336s
            Frame #7
              handle spawn: 3.148s
              handle move: 6.381s

            Frame #31
              handle spawn: 7.691s
              handle move: 13.606s
            Frame #32
              handle spawn: 9.694s
              handle move: 16.905s
            Frame #33
              handle spawn: 9.886s
              handle move: 16.873s
            Frame #34
              handle spawn: 10.159s
              handle move: 16.334s
            Frame #35
              handle spawn: 10.303s
              handle move: 16.256s
            Frame #36
              handle spawn: 10.094s
              handle move: 17.833s

             */
      const shouldLog = frameNumber < 20 || frameNumber % 120 == 0;

      if (shouldLog) console.group("Frame #" + frameNumber);
      if (shouldLog) console.time("frame");
      // if (shouldLog) console.time('resetting collision helper');
      // this.vehicleCollision.setFromVehicles(world.vehicles);
      // if (shouldLog) console.timeEnd('resetting collision helper');

      if (!this.navigator) {
        console.log("Building navigator");
        console.time("navigator build time");
        const nav = (this.navigator = new LayoutNavigator());
        nav.setTilesAndTags(world.tiles, world.tags);
        nav.buildSpawnerMapWithRoutes();
        console.timeEnd("navigator build time");
      }

      args.changedTraffic();

      if (shouldLog) console.time("handle spawn");
      this.spawnHandler(world, frameNumber, simulationTime, deltaMs);
      if (shouldLog) console.timeEnd("handle spawn");

      if (shouldLog) console.time("handle move");
      this.moveVehicle(world, frameNumber, simulationTime, deltaMs);
      if (shouldLog) console.timeEnd("handle move");

      if (shouldLog) console.timeEnd("frame");
      if (shouldLog) console.log("Number of vehicles: " + world.vehicles.length);
      if (shouldLog) console.groupEnd();
      return world;
    }

    private getAgentDataFor(id: EntityIdentifier) {
      if (id.idCategory != "VehicleDTO") return undefined;

      return this.agentData.get(id.idNumber);
    }

    private getAgentData(veh: Vehicle): RandomExitDriverAgentData | undefined {
      return this.agentData.get(veh.id);
    }

    private removeAgentData(veh: Vehicle) {
      return this.agentData.delete(veh.id);
    }

    private moveVehicle(world: World, frame: number, simulationTime: number, deltaMs: number) {
      // const copy = world.clone();

      const speed = /* 30 km / h in m / ms */ (30 * 1000) / 60 / 60 / 1000;

      const updatedVehicles: Vehicle[] = [];

      for (const vehicle of world.vehicles) {
        const driverState = this.getAgentData(vehicle);
        if (!driverState) continue;

        const route = driverState.route;
        const curDistance = driverState.currentDistance;
        const routeMaxLength = route.getLength() - 0.8 * VEHICLE_SCALE;

        if (curDistance == routeMaxLength) {
          // If the vehicle has reached the end of its path it is removed (despawned).
          const index = world.vehicles.findIndex(v => v.id == vehicle.id);
          world.vehicles.splice(index, 1);
          this.removeAgentData(vehicle);
          this.vehicleCollision.removeVehicle(vehicle);
          continue;
        }

        let newVehiclePostionDistance = curDistance + deltaMs * speed;

        if (newVehiclePostionDistance > routeMaxLength) newVehiclePostionDistance = routeMaxLength;

        const modelLength = getModelLength(vehicle.type);

        // Vehicles look for space in .4 * their model length in fron on the given route.
        let projectedPathPoint = newVehiclePostionDistance + modelLength * 0.4;

        if (projectedPathPoint > routeMaxLength) projectedPathPoint = routeMaxLength;

        const shadowVehicle = vehicle.clone();
        placeVehicleOnRoute(shadowVehicle, route, projectedPathPoint);

        if (!this.vehicleCollision.doesVehicleIntersect(shadowVehicle)) {
          driverState.currentDistance = newVehiclePostionDistance;
          placeVehicleOnRoute(vehicle, route, newVehiclePostionDistance);
          updatedVehicles.push(vehicle);
        }
      }

      /*
       * The reason we update the collision map after moving all is to mitigate any ordering issues.
       * The goal of an agent is to compute the same result for the same setup (the agent should be pure)
       * but the ordering of the vehicles can make this impossible if the agent uses the already modified
       * intermediate state as base, since another vehicle could already have been moved and now indicate a collision.
       *
       * To prevent this the agent does not update the vehicle collision helper immediately.
       * Even though this could introduce a whole set of other problems it also allows for multithreading.
       */
      for (const vehicle of updatedVehicles) this.vehicleCollision.updateOrSetVehicle(vehicle);
    }

    private getPathFromRoute(route: Route) {
      let key = "";
      for (let i = 0; i < route.length; i++) {
        if (i > 0) key += "_";

        const ent = route[i];

        const categoryId =
          ent instanceof Tile
            ? "i" // tIle
            : "a"; // tAg

        key += categoryId + "-" + ent.id;
      }

      const cached = this.routeCache.get(key);

      if (cached) return cached;

      const path = convertTileArrayToPath(route);
      this.routeCache.set(key, path);
      return path;
    }

    private spawnHandler(world: World, frame: number, simulationTime: number, deltaMs: number) {
      /*
       * One could try to do the same style of mitigation as done in the move vehicles but that is not really necessary
       * since the vehicles which could prevent the spawning are not moved in process. So even when the order would change
       * the outcome would remain the same.
       *
       * TODO check if the order of the spawner change the outcome (probably by having a different order calling the
       *  randomizer
       */
      const allSpawner = world.tags.filter(t => t.type == "SPAWN_AND_DESPAWN");

      if (allSpawner.length == 0) return;

      const nav = this.navigator;
      if (!nav) throw new Error("No navigator created");

      const prng = this.rngPickSpawner;

      for (const spawner of allSpawner) {
        for (const routes of nav.getAvailableRoutesGroupedByTile(spawner)) {
          const chosenRoute = pickRandomItem(prng, routes);

          const goal = chosenRoute[chosenRoute.length - 1];

          const path = this.getPathFromRoute(chosenRoute);

          const {position, orientation} = getVehiclePositionOnRoute(path, 0);

          const id = this.vehicleId;

          const agentData = {
            spawnedAt: spawner.id,
            goal: goal.id,
            route: path,
            currentDistance: 0
          } as RandomExitDriverAgentData;

          const picked = this.subVehicleTypes[this.nextVehicleType];
          const vehicle = new Vehicle(id, picked, position, orientation);

          // console.time('vehicleIntersection');
          const doesVehicleCollide = this.vehicleCollision.doesVehicleIntersect(vehicle);
          // console.timeEnd('vehicleIntersection');

          if (doesVehicleCollide) continue;

          this.nextVehicleType++;
          if (this.nextVehicleType >= this.subVehicleTypes.length) this.nextVehicleType = 0;
          this.vehicleId++;
          this.vehicleCollision.updateOrSetVehicle(vehicle);
          world.vehicles.push(vehicle);
          this.agentData.set(id, agentData);
        }
      }
    }
  };

  // return class Instance implements FrameHandler {
  //     handleFrame(we: SimulationEngine, world: World, frame: number, simulationTime: number, deltaMs: number): World {
  //         return world;
  //     }
  //
  //
  //     getAgentVehicleData() {
  //         return [];
  //     }
  // };
}
