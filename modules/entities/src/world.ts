import {LayoutStateDTO, TrafficStateDTO, WorldStateDTO} from "@triss/dto";

import {createVehicleFromData, Vehicle} from "./vehicle";
import {createTileFromData, Tile} from "./tile";
import {createTagFromData, Tag} from "./tag";

export class World {
  public vehicles: Vehicle[] = [];
  public tiles: Tile[] = [];
  public tags: Tag[] = [];

  getTrafficState(): TrafficStateDTO {
    return {
      category: "TrafficStateDTO",
      vehicles: this.vehicles.map(v => v.getSerializeData())
    };
  }

  getLayoutState(): LayoutStateDTO {
    return {
      category: "LayoutStateDTO",
      tiles: this.tiles.map(t => t.getSerializeData()),
      tags: this.tags.map(t => t.getSerializeData())
    };
  }

  getSerializeData(): WorldStateDTO {
    return {
      category: "WorldStateDTO",
      layout: this.getLayoutState(),
      traffic: this.getTrafficState()
    };
  }

  clone() {
    const world = new World();

    world.tiles = this.tiles.map(e => e.clone());
    world.vehicles = this.vehicles.map(e => e.clone());
    world.tags = this.tags.map(e => e.clone());

    return world;
  }
}

export function createWorldFromData(data: WorldStateDTO) {
  const w = new World();

  w.vehicles = data.traffic.vehicles.map(createVehicleFromData);
  w.tiles = data.layout.tiles.map(createTileFromData);
  w.tags = data.layout.tags.map(createTagFromData);

  return w;
}
