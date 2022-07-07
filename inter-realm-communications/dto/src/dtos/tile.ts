import {TileType} from "@triss/entity-definition";
import {Orientation, Vector2ui} from "../common";

export interface TileDTO {
  category: "TileDTO";

  id: number;
  type: TileType;

  gridPosition: Vector2ui;
  orientation: Orientation;
}
