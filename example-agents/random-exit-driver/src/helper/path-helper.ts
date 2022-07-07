import {Matrix4, Quaternion, Vector2, Vector3} from "three";


import {gridVectorToPosition, tileToMatrix} from "./to-matrix";
import {Tile} from "@triss/entities";
import {Tag} from "@triss/entities";
import {isTag} from "@triss/entity-definition";
import {isTile, TILES_AND_THEIR_CONNECTION} from "@triss/entity-definition";
import {ROAD_LEVEL, TILE_LANE_DEFINITION, TILE_SCALE} from "@triss/entity-definition";
import {Piece} from "@triss/path-definition";
import {rotateTo} from "@triss/three-helper";
import {VEHICLE_SCALE} from "@triss/entity-definition";
import {Vehicle} from "@triss/entities";


const getConnectionArray = (ft: Tile | Tag) => {
  const type = ft.type;

  if (isTag(type)) {
    if (type != "SPAWN_AND_DESPAWN") throw new Error("Can not get the connection for tag " + type);

    return [true, true, true, true];
  } else if (isTile(type)) {
    const connections = TILES_AND_THEIR_CONNECTION.get(type)!;
    if (!connections)
      throw new Error("There are no connection defined for the tile with the type " + type);

    return connections;
  } else throw new Error("The type is neither recognized as Tile or Tag type.");
};

export const isConnected = (ft: Tile | Tag, pos: Vector2) => {
  const gp = ft.gridPosition;
  if (Math.abs(gp.x - pos.x) > 1 || Math.abs(gp.y - pos.y) > 1) return false;

  const to = orientationToCell(ft.gridPosition, pos);

  const connections = getConnectionArray(ft);

  const or = ft.orientation;

  const co = ((or + 3 - to + 2) % 4) as any;
  return connections[co];
};

export const orientationToCell = (from: Vector2, to: Vector2): 0 | 1 | 2 | 3 => {
  const deltaX = to.x - from.x;
  if (deltaX < -1 || deltaX > 1)
    throw new Error(
      "The orientation is ambiguous since it is more then one tile away in the x direction."
    );

  const deltaY = to.y - from.y;
  if (deltaY < -1 || deltaY > 1) {
    throw new Error(
      "The orientation is ambiguous since it is more then one tile away in the y direction."
    );
  }

  if (deltaX == 0 && deltaY == 0) throw new Error("From and to are identical.");

  if (deltaX != 0 && deltaY != 0)
    throw new Error("To is diagonal to from and therefore has no correct direction.");

  //   1
  // 2   0
  //   3

  if (deltaY == 0) {
    if (deltaX > 0) return 0;
    else return 2;
  } else {
    if (deltaY > 0) return 3;
    else return 1;
  }
};

export const getLaneDefinition = (tile: Tile) => {
  const laneDef = TILE_LANE_DEFINITION.get(tile.type);
  if (!laneDef) return undefined;

  const mat = new Matrix4();

  return laneDef.createTransformed(tileToMatrix(mat, tile));
};

export const getIntersectionPointForTiles = (toGrid: Vector2, fromGrid: Vector2): Vector3 => {
  const fromCenter = gridVectorToPosition(fromGrid);
  const toCenter = gridVectorToPosition(toGrid);

  const spawnCenterVector = new Vector3(toCenter.x, ROAD_LEVEL * TILE_SCALE, toCenter.y);
  const tileCenterVector = new Vector3(fromCenter.x, ROAD_LEVEL * TILE_SCALE, fromCenter.y);

  const fromToTile = tileCenterVector.clone().sub(spawnCenterVector);

  return (
    spawnCenterVector
      .clone()
      .add(
        fromToTile
          .clone()
          // go back TILE_SCALE / 2 (half a tile) back with the vector which is the border of the tile
          .setLength(fromToTile.length() - TILE_SCALE / 2)
      )

      // 90 deg right turn by y axis is: (x, y, z) => (-z, y, x);
      .add(
        new Vector3(-fromToTile.z, fromToTile.y, fromToTile.x)
          // 8 since the lane should start to the right 1/8 of a tile
          .setLength(TILE_SCALE / 8)
      )
  );
};

export const getLanesStartingAtOfTile = (at: Vector3, tile: Tile) => {
  const laneDef = getLaneDefinition(tile);

  if (!laneDef) throw new Error("could not get the lane definition for tile type " + tile.type);

  const lanes: Piece[] = [];

  for (const def of laneDef.getLanes()) {
    const startDist = def.getStart().distanceTo(at);
    if (startDist < 0.01) lanes.push(def);
  }

  return lanes;
};

export const getLanesEndingAtOfTile = (at: Vector3, tile: Tile) => {
  const laneDef = getLaneDefinition(tile);

  if (!laneDef) throw new Error("could not get the lane definition for tile type " + tile.type);

  const lanes: Piece[] = [];

  for (const def of laneDef.getLanes()) {
    const startDist = def.getEnd().distanceTo(at);
    if (startDist < 0.01) lanes.push(def);
  }

  return lanes;
};

export const pickRandomItem = <K>(prng: {double(): number}, items: K[]) => {
  if (items.length == 0) throw new Error("There are no options left to choose from.");

  const chosenIndex = Math.floor(prng.double() * items.length);
  return items[chosenIndex];
};

export const quaternionFromVector = (v: Vector3) => {
  const mat = new Matrix4();
  rotateTo(mat, new Vector3(0, 1, 0), v);

  const q = new Quaternion();
  q.setFromRotationMatrix(mat);

  return q;
};

export const getVehiclePositionOnRoute = (route: Piece, distance: number) => {
  const back = route.getPositionOnPathDistance(distance);
  const front = route.getPositionOnPathDistance(distance + VEHICLE_SCALE * 0.8);

  const vecFromBackToFront = front.clone().sub(back);
  const orientation = quaternionFromVector(vecFromBackToFront);

  const position = back.clone().add(vecFromBackToFront.clone().multiplyScalar(0.5));

  return {position, orientation};
};

export const placeVehicleOnRoute = (vehicle: Vehicle, route: Piece, atDistance: number) => {
  const {position, orientation} = getVehiclePositionOnRoute(route, atDistance);
  vehicle.position = position;
  vehicle.orientation = orientation;
};

export const bothWayConnected = (a: Tile | Tag, b: Tile | Tag) =>
  isConnected(a, b.gridPosition) && isConnected(b, a.gridPosition);
