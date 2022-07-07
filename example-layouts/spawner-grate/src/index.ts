import {TILE_STRAIGHT} from "@triss/entity-definition";
import {LayoutStateDTO, TagDTO, TileDTO, Orientation} from "@triss/dto";

export function createSpawnerGrate (width = 5, height = width): LayoutStateDTO  {
  // width and height need to be uneven

  if (width % 2 == 0) width--;

  if (height % 2 == 0) height--;

  const tiles: TileDTO[] = [];
  let tileId = 0;
  for (let x = 0; x < width; x++)
    for (let y = (x + 1) % 2; y < height; y += 2)
      tiles.push({
        category: "TileDTO",
        id: tileId++,
        orientation: ((x + 1) % 2) as Orientation,
        type: TILE_STRAIGHT,
        gridPosition: [x, y],
      });

  const tags: TagDTO[] = [];
  let tagId = 0;
  for (let x = 0; x < width; x += 2)
    for (let y = 0; y < height; y += 2)
      tags.push({
        category: "TagDTO",
        id: tagId++,
        orientation: 0,
        type: "SPAWN_AND_DESPAWN",
        gridPosition: [x, y],
      });

  return {
    category: "LayoutStateDTO",
    tiles,
    tags,
  };
}
