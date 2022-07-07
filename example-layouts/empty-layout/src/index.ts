import {LayoutStateDTO} from "@triss/dto";

export function emptyLayout(): LayoutStateDTO {
  return {
    category: "LayoutStateDTO",
    tiles: [],
    tags: [
      {
        category: "TagDTO",
        id: 0,
        type: "SPAWN_AND_DESPAWN",
        gridPosition: [0, 0],
        orientation: 0
      }
    ]
  };
}
