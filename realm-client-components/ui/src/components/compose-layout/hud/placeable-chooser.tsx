import React from "react";

import {sorter} from "../name-sortert";
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

import {Pickable, PickableType, REMOVE} from "./pickable";

import {tags, tagTypeValues, tiles, tileTypeValues} from "@triss/entity-definition";

const noop = () => undefined;

const DEFAULT_FAVORITES: (TagType | TileType)[] = [
  TILE_STRAIGHT,
  TILE_CURVE,
  TILE_T_CROSSING,
  TILE_FOUR_WAY,

  "SPAWN_AND_DESPAWN",
];

export type PossiblePicked = PickableType | undefined;

export const PlaceableChooser = ({
  onPicked = noop,
  favorites = DEFAULT_FAVORITES,
  picked = undefined,
}: {
  onPicked?: (nr: PossiblePicked) => void;
  favorites?: (TagType | TileType)[];
  picked?: PossiblePicked;
} = {}) => {
  const onPlaceablePicked = (id: PossiblePicked) => {
    picked = id;
    onPicked(id);
  };

  const favoritesSorted = favorites.slice().sort(sorter);

  const nonFavorites = ([] as (TileType | TagType)[])
    .concat(tileTypeValues, tagTypeValues)
    .filter(k => !favorites.includes(k))
    .sort(sorter);

  const allFavoritePickables = favoritesSorted.map(k => (
    <Pickable picked={k == picked} key={k} onPicked={onPlaceablePicked} favorite={true} id={k} />
  ));

  return (
    <div className="placeable-chooser">
      <div className="favorites">
        {/*{favoritesSorted.map(k => <CloseableDisplay key={k} onPicked={onPlaceablePicked} favorite={true} id={k}/>)}*/}
        {allFavoritePickables}
      </div>
      {/*<div className="other">*/}
      {/*    {nonFavorites.map(k => <CloseableDisplay key={k} favorite={false} id={k}/>)}*/}
      {/*</div>*/}

      <div className="special-actions">
        <Pickable
          picked={REMOVE == picked}
          key={REMOVE}
          onPicked={onPlaceablePicked}
          favorite={true}
          id={REMOVE}
        />
      </div>
    </div>
  );
};
