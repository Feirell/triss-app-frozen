import {isTile, TagType, TileType} from "@triss/entity-definition";
import {LayoutStateDTO, Orientation, TagDTO, TileDTO, Vector2ui} from "@triss/dto";

export function removeElementOnGrid<K extends TagDTO | TileDTO>(
  tiles: K[],
  gridPosition: Vector2ui
): K[] {
  for (let i = 0; i < tiles.length; i++) {
    const gp = tiles[i].gridPosition;

    if (gp[0] == gridPosition[0] && gp[1] == gridPosition[1]) {
      const copy = tiles.slice();
      copy.splice(i, 1);
      return copy;
    }
  }

  return tiles;
}

export function removePlaceableInSetup(
  setup: LayoutStateDTO,
  gridPosition: Vector2ui
): LayoutStateDTO {
  const options = ["tiles", "tags"] as const;

  for (const original of options) {
    const arr = setup[original];
    const removedFromOriginal = removeElementOnGrid(arr as TileDTO[], gridPosition);

    if (removedFromOriginal.length != arr.length) {
      return {...setup, [original]: removedFromOriginal} as LayoutStateDTO;
    }
  }

  return setup;
}

export function setPlaceableInSetup(
  setup: LayoutStateDTO,
  gridPosition: Vector2ui,
  nextId: number,
  type: TileType | TagType,
  orientation: Orientation
): LayoutStateDTO {
  // could not fix typescript issues, this is essentially the same code but type correct
  if (isTile(type)) {
    const removed = removeElementOnGrid(setup.tiles, gridPosition);

    const t: TileDTO = {
      type: type,
      category: "TileDTO",
      id: nextId + 1,
      orientation: orientation,
      gridPosition: gridPosition
    };

    return {...setup, tiles: removed.concat(t)};
  } else {
    const removed = removeElementOnGrid(setup.tags, gridPosition);

    const t: TagDTO = {
      type: type as TagType,
      category: "TagDTO",
      id: nextId + 1,
      orientation: orientation,
      gridPosition: gridPosition
    };

    return {...setup, tags: removed.concat(t)};
  }
}
