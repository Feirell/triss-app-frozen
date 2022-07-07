import {Vector3} from "three";

import {
  StraightPiece,
  PathPiece,
  CurvedPiece
} from "@triss/path-definition";

import {TileLaneDefinition} from "./tile-lane-definition";
import {TileType} from "../generated/tiles";


export const TILE_EMPTY = 84;
export const TILE_CURVE = 59;
export const TILE_DEAD_END = 103;
export const TILE_STRAIGHT = 34;
export const TILE_T_CROSSING = 27;
export const TILE_FOUR_WAY = 47;

export const TILES_NAME_MAPPING = new Map<string, TileType>([
  ["TILE_EMPTY", TILE_EMPTY],
  ["TILE_CURVE", TILE_CURVE],
  ["TILE_DEAD_END", TILE_DEAD_END],
  ["TILE_STRAIGHT", TILE_STRAIGHT],
  ["TILE_T_CROSSING", TILE_T_CROSSING],
  ["TILE_FOUR_WAY", TILE_FOUR_WAY],
]);

export const NAME_TILES_MAPPING = new Map<TileType, string>([
  [TILE_EMPTY, "TILE_EMPTY"],
  [TILE_CURVE, "TILE_CURVE"],
  [TILE_DEAD_END, "TILE_DEAD_END"],
  [TILE_STRAIGHT, "TILE_STRAIGHT"],
  [TILE_T_CROSSING, "TILE_T_CROSSING"],
  [TILE_FOUR_WAY, "TILE_FOUR_WAY"],
]);

export const TILES_AND_THEIR_CONNECTION = new Map<TileType, [boolean, boolean, boolean, boolean]>([
  [TILE_EMPTY, [false, false, false, false]],
  [TILE_CURVE, [false, false, true, true]],
  [TILE_DEAD_END, [false, false, false, true]],
  [TILE_STRAIGHT, [false, true, false, true]],
  [TILE_T_CROSSING, [true, false, true, true]],
  [TILE_FOUR_WAY, [true, true, true, true]],
]);

// export const TILE_LANE_DEFINITION = new Map<number, TileLaneDefinition>(
//     Array.from(TILES_AND_THEIR_CONNECTION.entries()).map(
//         ([key, value]) => [
//             key,
//             createLaneDefinitionFromConnections(2, .5, ...value)
//         ]
//     ));

const v = (x: number, z: number) => new Vector3(x, 0.2, z);

export const TILE_LANE_DEFINITION = new Map<TileType, TileLaneDefinition>([
  [TILE_EMPTY, new TileLaneDefinition([], [])],
  [
    TILE_DEAD_END,
    new TileLaneDefinition(
      [
        new PathPiece([
          new StraightPiece(v(-0.5, 0.125), v(0, 0.125)),
          new CurvedPiece(v(0, 0.125), v(0.125, 0.125), v(0.125, 0)),
          new CurvedPiece(v(0.125, 0), v(0.125, -0.125), v(0, -0.125)),
          new StraightPiece(v(0, -0.125), v(-0.5, -0.125)),
        ]),
      ],
      [new StraightPiece(v(-0.5, 0), v(0, 0))]
    ),
  ],
  [
    TILE_CURVE,
    new TileLaneDefinition(
      [
        new CurvedPiece(v(0.125, 0.5), v(0.125, -0.125), v(-0.5, -0.125)),
        new CurvedPiece(v(-0.5, 0.125), v(-0.125, 0.125), v(-0.125, 0.5)),
      ],
      [new CurvedPiece(v(0, 0.5), v(0, 0), v(-0.5, 0))]
    ),
  ],
  [
    TILE_STRAIGHT,
    new TileLaneDefinition(
      [
        new StraightPiece(v(0.5, -0.125), v(-0.5, -0.125)),
        new StraightPiece(v(-0.5, 0.125), v(0.5, 0.125)),
      ],
      [new StraightPiece(v(0.5, 0), v(-0.5, 0))]
    ),
  ],
  [
    TILE_T_CROSSING,
    new TileLaneDefinition(
      [
        new PathPiece([
          new StraightPiece(v(0.125, 0.5), v(0.125, 0.25)),
          new CurvedPiece(v(0.125, 0.25), v(0.125, -0.125), v(-0.25, -0.125)),
          new StraightPiece(v(-0.25, -0.125), v(-0.5, -0.125)),
        ]),
        new StraightPiece(v(0.125, 0.5), v(0.125, -0.5)),
        new PathPiece([
          new StraightPiece(v(-0.5, 0.125), v(-0.25, 0.125)),
          new CurvedPiece(v(-0.25, 0.125), v(-0.125, 0.125), v(-0.125, 0.25)),
          new StraightPiece(v(-0.125, 0.25), v(-0.125, 0.5)),
        ]),
        new PathPiece([
          new StraightPiece(v(-0.5, 0.125), v(-0.25, 0.125)),
          new CurvedPiece(v(-0.25, 0.125), v(0.125, 0.125), v(0.125, -0.25)),
          new StraightPiece(v(0.125, -0.25), v(0.125, -0.5)),
        ]),
        new StraightPiece(v(-0.125, -0.5), v(-0.125, 0.5)),
        new PathPiece([
          new StraightPiece(v(-0.125, -0.5), v(-0.125, -0.25)),
          new CurvedPiece(v(-0.125, -0.25), v(-0.125, -0.125), v(-0.25, -0.125)),
          new StraightPiece(v(-0.25, -0.125), v(-0.5, -0.125)),
        ]),
      ],
      [new StraightPiece(v(0, -0.5), v(0, 0.5)), new StraightPiece(v(-0.5, 0), v(0, 0))]
    ),
  ],
  [
    TILE_FOUR_WAY,
    new TileLaneDefinition(
      [
        new PathPiece([
          new StraightPiece(v(-0.125, -0.5), v(-0.125, -0.25)),
          new CurvedPiece(v(-0.125, -0.25), v(-0.125, 0.125), v(0.25, 0.125)),
          new StraightPiece(v(0.25, 0.125), v(0.5, 0.125)),
        ]),
        new StraightPiece(v(-0.125, -0.5), v(-0.125, 0.5)),
        new PathPiece([
          new StraightPiece(v(-0.125, -0.5), v(-0.125, -0.25)),
          new CurvedPiece(v(-0.125, -0.25), v(-0.125, -0.125), v(-0.25, -0.125)),
          new StraightPiece(v(-0.25, -0.125), v(-0.5, -0.125)),
        ]),
        new PathPiece([
          new StraightPiece(v(0.5, -0.125), v(0.25, -0.125)),
          new CurvedPiece(v(0.25, -0.125), v(-0.125, -0.125), v(-0.125, 0.25)),
          new StraightPiece(v(-0.125, 0.25), v(-0.125, 0.5)),
        ]),
        new StraightPiece(v(0.5, -0.125), v(-0.5, -0.125)),
        new PathPiece([
          new StraightPiece(v(0.5, -0.125), v(0.25, -0.125)),
          new CurvedPiece(v(0.25, -0.125), v(0.125, -0.125), v(0.125, -0.25)),
          new StraightPiece(v(0.125, -0.25), v(0.125, -0.5)),
        ]),
        new PathPiece([
          new StraightPiece(v(0.125, 0.5), v(0.125, 0.25)),
          new CurvedPiece(v(0.125, 0.25), v(0.125, -0.125), v(-0.25, -0.125)),
          new StraightPiece(v(-0.25, -0.125), v(-0.5, -0.125)),
        ]),
        new StraightPiece(v(0.125, 0.5), v(0.125, -0.5)),
        new PathPiece([
          new StraightPiece(v(0.125, 0.5), v(0.125, 0.25)),
          new CurvedPiece(v(0.125, 0.25), v(0.125, 0.125), v(0.25, 0.125)),
          new StraightPiece(v(0.25, 0.125), v(0.5, 0.125)),
        ]),
        new PathPiece([
          new StraightPiece(v(-0.5, 0.125), v(-0.25, 0.125)),
          new CurvedPiece(v(-0.25, 0.125), v(0.125, 0.125), v(0.125, -0.25)),
          new StraightPiece(v(0.125, -0.25), v(0.125, -0.5)),
        ]),
        new StraightPiece(v(-0.5, 0.125), v(0.5, 0.125)),
        new PathPiece([
          new StraightPiece(v(-0.5, 0.125), v(-0.25, 0.125)),
          new CurvedPiece(v(-0.25, 0.125), v(-0.125, 0.125), v(-0.125, 0.25)),
          new StraightPiece(v(-0.125, 0.25), v(-0.125, 0.5)),
        ]),
      ],
      [new StraightPiece(v(0, -0.5), v(0, 0.5)), new StraightPiece(v(-0.5, 0), v(0.5, 0))]
    ),
  ],
]);
