import {Tag, Tile} from "@triss/entities";

import {TwoDArray} from "./helper/two-d-array";
import {bothWayConnected} from "./helper/path-helper";
import {breadthWalker} from "./helper/breadth-search";

export type Route = (Tag | Tile)[];

export const typeAndIDToKey = (entity: Tag | Tile) => {
  return "" + entity.type + "-" + entity.id;
};

const offsets: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export class LayoutNavigator {
  private usingTiles: Tile[] = [];
  private usingTags: Tag[] = [];

  private tileGrid!: TwoDArray<Tile>;
  private tagGrid!: TwoDArray<Tag>;

  // private cachedPathTiles = createCachedTilesForPath();

  // private spawnToSpawnMap = new EdgeDataAttachment<Tag, Route[]>(t => t.type + '-' + t.id);

  private spawnToSpawnMap = new Map<string, Map<string, Route[]>>();
  private spawnViaTileMap = new Map<string, Map<string, Route[]>>();

  private reachableSpawnerCache = new Map<string, Tag[]>();

  setTilesAndTags(tiles: Tile[], tags: Tag[]) {
    if (this.usingTags == tags && this.usingTiles == tiles) return;

    this.buildCaches(tiles, tags);
  }

  buildSpawnerMapWithRoutes() {
    const rsc = this.reachableSpawnerCache;
    rsc.clear();

    const sts = this.spawnToSpawnMap;
    sts.clear();

    const svt = this.spawnViaTileMap;
    svt.clear();

    const allSpawner = this.usingTags.filter(t => t.type == "SPAWN_AND_DESPAWN");
    if (allSpawner.length == 0) return;

    // This is really expensive ...
    // All spawner * all reachable tiles can be quite close to O(n^2)
    for (const spawner of allSpawner) {
      const connectionsTo = new Map<string, Route[]>();
      const connectionsVia = new Map<string, Route[]>();

      const firstTiles = this.connectedAdjacent(spawner).tiles;

      for (const firstTile of firstTiles) {
        // const routes: Route[] = [];
        breadthWalker<Tag | Tile>(
          spawner,
          (node, path) => {
            if (node.type === "SPAWN_AND_DESPAWN" && node.id != spawner.id) {
              const endTagKey = typeAndIDToKey(node);
              const connectionsToArr = connectionsTo.get(endTagKey) || [];
              connectionsTo.set(endTagKey, [...connectionsToArr, path]);

              const viaTileKey = typeAndIDToKey(path[1]);
              const connectionsViaArr = connectionsVia.get(viaTileKey) || [];
              connectionsVia.set(viaTileKey, [...connectionsViaArr, path]);
            }

            return false;
          },
          node => {
            if (node.type === "SPAWN_AND_DESPAWN")
              if (node.id == spawner.id) return [firstTile];
              // If this is another spawner then do not get connected tiles
              else return [];

            const {tags, tiles} = this.connectedAdjacent(node);
            return (tags as (Tag | Tile)[]).concat(tiles);
          }
        );
      }

      const startTagKey = typeAndIDToKey(spawner);
      sts.set(startTagKey, connectionsTo);
      svt.set(startTagKey, connectionsVia);
    }
  }

  getAvailableConnections(fromSpawner: Tag) {
    const routes = this.spawnToSpawnMap.get(typeAndIDToKey(fromSpawner));
    if (!routes)
      throw new Error("Could not find spawner in route map, maybe it needs to be rebuild.");

    let res: Route[] = [];
    for (const additionalRoutes of routes.values()) res = res.concat(additionalRoutes);

    return res;
  }

  getReachableSpawnerForSpawner(fromSpawner: Tag) {
    const key = typeAndIDToKey(fromSpawner);

    const cachedResult = this.reachableSpawnerCache.get(key);
    if (cachedResult) return cachedResult;

    const routes = this.spawnToSpawnMap.get(key);
    if (!routes)
      throw new Error("Could not find spawner in route map, maybe it needs to be rebuild.");

    const res: Tag[] = [];

    // You could either use the key and split that and search in this.usedTags or you can
    // use the last entry in the array since it will be the spawner to which it leads.
    // Since all values (all Routes) are leading to the same spawner we can just use the first.
    for (const val of routes.values()) {
      const firstRoute = val[0];
      const destination = firstRoute[firstRoute.length - 1] as Tag;
      res.push(destination);
    }

    this.reachableSpawnerCache.set(key, res);
    return res;
  }

  getAvailableConnectionsToSpawner(fromSpawner: Tag, toSpawner: Tag): Route[] {
    const groupedByEndSpawner = this.spawnToSpawnMap.get(typeAndIDToKey(fromSpawner));
    if (!groupedByEndSpawner)
      throw new Error("Could not find spawner in route map, maybe it needs to be rebuild.");

    return groupedByEndSpawner.get(typeAndIDToKey(toSpawner)) || [];
  }

  getAvailableConnectionsViaTile(fromSpawner: Tag, tile: Tile): Route[] {
    const groupedByFirstTile = this.spawnViaTileMap.get(typeAndIDToKey(fromSpawner));
    if (!groupedByFirstTile)
      throw new Error("Could not find spawner in route map, maybe it needs to be rebuild.");

    return groupedByFirstTile.get(typeAndIDToKey(tile)) || [];
  }

  getAvailableRoutesGroupedByTile(fromSpawner: Tag): Route[][] {
    const groupedByFirstTile = this.spawnViaTileMap.get(typeAndIDToKey(fromSpawner));
    if (!groupedByFirstTile)
      throw new Error("Could not find spawner in route map, maybe it needs to be rebuild.");

    return Array.from(groupedByFirstTile.values());
  }

  private connectedAdjacent(entity: Tag | Tile) {
    const tags: Tag[] = [];
    const tiles: Tile[] = [];

    const {x, y} = entity.gridPosition;

    for (const [xd, yd] of offsets) {
      const tile = this.tileGrid.get(x + xd, y + yd);
      if (tile && bothWayConnected(entity, tile)) tiles.push(tile);

      const tag = this.tagGrid.get(x + xd, y + yd);
      if (tag && bothWayConnected(entity, tag)) tags.push(tag);
    }

    return {tags, tiles};
  }

  private buildCaches(tiles: Tile[], tags: Tag[]) {
    this.tileGrid = TwoDArray.createFromEntities(tiles);
    this.usingTiles = tiles;

    this.tagGrid = TwoDArray.createFromEntities(tags);
    this.usingTags = tags;
  }
}
