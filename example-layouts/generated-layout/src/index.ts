import {
  TILE_DEAD_END,
  TILE_EMPTY,
  TILES_AND_THEIR_CONNECTION,
  TILES_NAME_MAPPING,
  TileType
} from "@triss/entity-definition";
import {LayoutStateDTO, TagDTO, TileDTO} from "@triss/dto";

import {PseudoRandomNumberGenerator, WaveSolver} from "./wave-solver";

const conIdentical = (a: boolean[], b: boolean[]) =>
  a[0] == b[0] && a[1] == b[1] && a[2] == b[2] && a[3] == b[3];

export function generateLayout(dimension = 4): LayoutStateDTO {
  interface TileOption {
    tile: TileType;
    rotation: number;
    connections: boolean[];
  }

  const tileOptions: TileOption[] = [];

  for (const [name, id] of TILES_NAME_MAPPING.entries()) {
    const connections = TILES_AND_THEIR_CONNECTION.get(id);
    if (!connections)
      throw new Error(
        "Wanted to add " + name + " to the options but could not get the connections."
      );

    let rotated = connections.slice(0);

    for (let rotation = 0; rotation < 4; rotation++) {
      // making sure this connection type is not already in the rotatedPossibilities list
      if (!tileOptions.find(o => o.tile == id && conIdentical(o.connections, rotated))) {
        const connections = rotated.slice();
        tileOptions.push({tile: id, rotation, connections});
      }

      const [a, b, c, d] = rotated;
      rotated = [b, c, d, a];
    }
  }

  type Con = undefined | true | false;

  const filterOptionsByConnections = (
    allOptions: TileOption[],
    tn: Con,
    rn: Con,
    bn: Con,
    ln: Con
  ): TileOption[] => {
    const filteredOptions: TileOption[] = [];
    for (const c of allOptions) {
      const [t, r, b, l] = c.connections;

      if (
        (tn !== undefined && t != tn) ||
        (rn !== undefined && r != rn) ||
        (bn !== undefined && b != bn) ||
        (ln !== undefined && l != ln)
      )
        continue;

      filteredOptions.push(c);
    }

    return filteredOptions;
  };

  // const emptyOption: TileOption = {tile: TILE_EMPTY, rotation: 0, connections: [false,false,false,false]};

  const prng = new PseudoRandomNumberGenerator("wave-solver");

  const ws = new WaveSolver<TileOption>(
    dimension,
    tileOptions,
    cells => {
      const cell = prng.pickRandom(cells);

      const dedicatedChance = [
        {group: (t: TileType) => t == TILE_EMPTY, share: 35},
        {group: (t: TileType) => t == TILE_DEAD_END, share: 1},
        {group: (t: TileType) => true, share: 64}
      ];

      const grouped: {share: number; options: TileOption[]}[] = dedicatedChance.map(g => ({
        share: g.share,
        options: []
      }));

      for (const option of cell.options)
        for (let i = 0; i < dedicatedChance.length; i++)
          if (dedicatedChance[i].group(option.tile)) {
            grouped[i].options.push(option);
            break;
          }

      const groupsWithElems = grouped.filter(g => g.options.length > 0);
      const volume = groupsWithElems.reduce((p, c) => p + c.share, 0);

      const rolled = prng.next() * volume;
      let sum = 0;
      for (const g of groupsWithElems) {
        sum += g.share;
        if (rolled <= sum) {
          const option = prng.pickRandom(g.options);
          return {...cell, options: [option]};
        }
      }

      throw new Error("Could not find a a good option");
    },
    (x, y, current, top, right, bottom, left) => {
      const TOP = 0;
      const RIGHT = 1;
      const BOTTOM = 2;
      const LEFT = 3;

      type Con = undefined | true | false;

      const getCon = (list: TileOption[] | "edge", cor: 0 | 1 | 2 | 3): Con => {
        if (list == "edge") return false;

        if (list.length == 1) return list[0].connections[cor];

        return undefined;
      };

      return filterOptionsByConnections(
        current,
        getCon(top, BOTTOM),
        getCon(right, LEFT),
        getCon(bottom, TOP),
        getCon(left, RIGHT)
      );
    },
    (a, b) => a.tile == b.tile && a.rotation == b.rotation
  );

  // limiting the edge tiles

  for (let i = 1; i < dimension - 2; i++) {
    // y == 0 => bottom row
    ws.changeCellOptions(
      i,
      0,
      filterOptionsByConnections(tileOptions, undefined, undefined, false, undefined)
    );

    // y == dimension - 1 => top row
    ws.changeCellOptions(
      i,
      dimension - 1,
      filterOptionsByConnections(tileOptions, false, undefined, undefined, undefined)
    );

    // x == 0 => left row
    ws.changeCellOptions(
      0,
      i,
      filterOptionsByConnections(tileOptions, undefined, undefined, undefined, false)
    );

    // x == dimension - 1 => right row
    ws.changeCellOptions(
      dimension - 1,
      i,
      filterOptionsByConnections(tileOptions, undefined, false, undefined, undefined)
    );
  }

  // limiting the corner tiles

  // bottom left
  ws.changeCellOptions(
    0,
    0,
    filterOptionsByConnections(tileOptions, undefined, undefined, false, false)
  );

  // bottom right
  ws.changeCellOptions(
    dimension - 1,
    0,
    filterOptionsByConnections(tileOptions, undefined, false, false, undefined)
  );

  // top left
  ws.changeCellOptions(
    0,
    dimension - 1,
    filterOptionsByConnections(tileOptions, false, undefined, undefined, false)
  );

  // top right
  ws.changeCellOptions(
    dimension - 1,
    dimension - 1,
    filterOptionsByConnections(tileOptions, false, false, undefined, undefined)
  );

  ws.solve();

  const tiles: TileDTO[] = [];

  for (let x = 0; x < dimension; x++)
    for (let y = 0; y < dimension; y++) {
      const options = ws.getField().get(x, y);
      if (options && options.length == 1) {
        const c = options[0];

        tiles.push({
          id: tiles.length,
          category: "TileDTO",
          type: c.tile,
          gridPosition: [x, dimension - 1 - y],
          orientation: c.rotation as 0 | 1 | 2 | 3
        });
      }
    }

  const desiredSpawnerCount = Math.max(4, Math.floor(dimension / 3));

  const spawner: TagDTO[] = [];

  // const deadEnds = tiles.filter(t => t.type === TILE_DEAD_END);
  // const nonDeadEnds = tiles.filter(t => t.type !== TILE_DEAD_END && t.type !== TILE_EMPTY);
  const nonDeadEnds = tiles.filter(t => t.type !== TILE_EMPTY);

  // while (spawner.length < desiredSpawnerCount) {
  //   const de = deadEnds.pop();
  //   if (!de)
  //     break;
  //
  //   spawner.push({
  //     category: "TagDTO",
  //     id: spawner.length,
  //     type: "SPAWN_AND_DESPAWN",
  //     gridPosition: de.gridPosition,
  //     orientation: 0
  //   });
  // }

  while (spawner.length < desiredSpawnerCount) {
    const i = prng.intInRange(0, nonDeadEnds.length);
    const spliced = nonDeadEnds.splice(i, 1);
    if (spliced.length == 0) break;

    const picked = spliced[0];

    spawner.push({
      category: "TagDTO",
      id: spawner.length,
      type: "SPAWN_AND_DESPAWN",
      gridPosition: picked.gridPosition,
      orientation: 0
    });
  }

  return {
    category: "LayoutStateDTO",
    tiles: tiles.filter(
      ({gridPosition: [tx, ty]}) =>
        !spawner.find(({gridPosition: [sx, sy]}) => tx == sx && ty == sy)
    ),
    tags: spawner
  };
}

