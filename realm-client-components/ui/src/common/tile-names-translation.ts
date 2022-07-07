import {
  TILE_CURVE,
  TILE_FOUR_WAY,
  TILE_STRAIGHT,
  TILE_T_CROSSING,
} from "@triss/entity-definition";
import {
  TagType,
  TileType,
} from "@triss/entity-definition";

export const TILE_NAMES = new Map<TileType, string>([
  [TILE_STRAIGHT, "Gerade"],
  [TILE_CURVE, "Kurve"],
  [TILE_T_CROSSING, "T Kreuzung"],
  [TILE_FOUR_WAY, "Kreuzung"],
]);

export const TAG_NAMES = new Map<TagType, string>([
  ["SPAWN_AND_DESPAWN", "(De-)Spawn"]
]);
