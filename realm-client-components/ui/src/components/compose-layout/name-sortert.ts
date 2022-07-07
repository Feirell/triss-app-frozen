import {TAG_NAMES, TILE_NAMES} from "../../common/tile-names-translation";
import {TagType, TileType} from "@triss/entity-definition";

const sortString = (a: string, b: string) => a.localeCompare(b);

export const sorter = (a: string | number, b: string | number): number => {
  const aNumber = typeof a == "number";
  const bNumber = typeof b == "number";

  if (aNumber && bNumber) {
    if (TILE_NAMES.has(a as TileType) && TILE_NAMES.has(b as TileType))
      return sortString(
        TILE_NAMES.get(a as TileType) as string,
        TILE_NAMES.get(b as TileType) as string
      );
    else return (a as number) - (b as number);
  }

  if (aNumber && !bNumber) return 1;

  if (!aNumber && bNumber) return -1;

  if (TAG_NAMES.has(a as TagType)) a = TAG_NAMES.get(a as TagType) as string;

  if (TAG_NAMES.has(b as TagType)) b = TAG_NAMES.get(b as TagType) as string;

  return sortString(a as string, b as string);
};
