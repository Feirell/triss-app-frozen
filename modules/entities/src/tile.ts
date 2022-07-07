import {Vector2, Vector3} from "three";

import {TileType} from "@triss/entity-definition";
import {Orientation, TileDTO} from "@triss/dto";
import {gridToPosition} from "@triss/three-helper";

export class Tile {
  public readonly id: number;

  public type: TileType;
  public gridPosition: Vector2;
  public orientation: Orientation;

  constructor(id: number, type: TileType, gridPosition: Vector2, orientation: Orientation) {
    this.id = id;
    this.type = type;
    this.gridPosition = gridPosition;
    this.orientation = orientation;
  }

  get position() {
    const gp = this.gridPosition;
    const p = gridToPosition(gp.x, gp.y);
    return new Vector3(p[0], 0, p[1]);
  }

  getSerializeData(): TileDTO {
    const p = this.gridPosition;

    return {
      category: "TileDTO",
      id: this.id,
      type: this.type,
      gridPosition: [p.x, p.y],
      orientation: this.orientation,
    };
  }

  clone() {
    return new Tile(this.id, this.type, this.gridPosition.clone(), this.orientation);
  }
}

export function createTileFromData(data: TileDTO) {
  return new Tile(data.id, data.type, new Vector2(...data.gridPosition), data.orientation);
}
