import {TILE_FOUR_WAY} from "@triss/entity-definition";
import {LayoutStateDTO, TagDTO, TileDTO} from "@triss/dto";

export function createCheeseGrate(width = 5, height = width): LayoutStateDTO {
  const tiles: TileDTO[] = [];
  let tileId = 0;
  for (let x = 1; x < width - 1; x++)
    for (let y = 1; y < height - 1; y++)
      tiles.push({
        category: "TileDTO",
        id: tileId++,
        orientation: 0,
        type: TILE_FOUR_WAY,
        gridPosition: [x, y]
      });

  const tags: TagDTO[] = [];
  let tagId = 0;
  for (let x = 1; x < width - 1; x++)
    for (const y of [0, height - 1])
      tags.push({
        category: "TagDTO",
        id: tagId++,
        orientation: 0,
        type: "SPAWN_AND_DESPAWN",
        gridPosition: [x, y]
      });

  for (let y = 1; y < height - 1; y++)
    for (const x of [0, width - 1])
      tags.push({
        category: "TagDTO",
        id: tagId++,
        orientation: 0,
        type: "SPAWN_AND_DESPAWN",
        gridPosition: [x, y]
      });

  return {
    category: "LayoutStateDTO",
    tiles,
    tags
  };
}
