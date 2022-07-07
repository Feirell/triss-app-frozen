import {Vector3} from "three";

import {getIntersectionPointForTiles, getLanesStartingAtOfTile} from "./path-helper";
import {isTag, isTile} from "./entity-distinguish";
import {PathPiece, Piece} from "@triss/path-definition";
import {Tag, Tile} from "@triss/entities";

const vectorDiffIn = (a: Vector3, b: Vector3, range: number) => b.clone().sub(a).length() < range;

export const convertTileArrayToPath = (path: (Tag | Tile)[]) => {
  const pieces: Piece[] = [];

  if (path.length < 3)
    throw new Error(
      "Can not create a path for a route which does not conform to Tag-Tile+-Tag pattern. There needs " +
        "to be at least one tile with a tag at the start and the end."
    );

  const startTag = path[0];
  if (!isTag(startTag)) throw new Error("The first element of a path needs to be a tag.");

  const tiles = path.slice(1, -1);
  if (!tiles.every(isTile))
    throw new Error(
      "All elements which are not the first or the last element in the path need to be a tile."
    );

  const endTag = path[path.length - 1];
  if (!isTag(endTag)) throw new Error("The last element in the path needs to be a tag.");

  const firstTile = tiles[0];

  const laneStartPoint = getIntersectionPointForTiles(
    startTag.gridPosition,
    firstTile.gridPosition
  );
  const lanesStarting = getLanesStartingAtOfTile(laneStartPoint, firstTile);

  let lastTile = firstTile;
  let lastAvailableLanes = lanesStarting;

  for (let i = 1; i < tiles.length; i++) {
    const currentTile = tiles[i];

    const conPoint = getIntersectionPointForTiles(lastTile.gridPosition, currentTile.gridPosition);

    // those are lanes which started with the previous intersection point and are ending in this intersection point
    const correctLane = lastAvailableLanes.filter(l => vectorDiffIn(l.getEnd(), conPoint, 0.01));

    if (correctLane.length != 1) {
      throw new Error("found more than one valid lane");
    }

    pieces.push(correctLane[0]);

    lastTile = currentTile;

    lastAvailableLanes = getLanesStartingAtOfTile(conPoint, currentTile);
    // debugger;
  }

  const pathEndPoint = getIntersectionPointForTiles(lastTile.gridPosition, endTag.gridPosition);

  const lastPiece = lastAvailableLanes.filter(l => vectorDiffIn(l.getEnd(), pathEndPoint, 0.01));
  if (lastPiece.length != 1) throw new Error("the last piece could not connect to the spawner");

  pieces.push(lastPiece[0]);

  return new PathPiece(pieces);
};
