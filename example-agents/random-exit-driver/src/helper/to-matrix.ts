import {Matrix4, Quaternion, Vector2, Vector3} from "three";
import {Vehicle, Tile, Tag} from "@triss/entities";
import {VEHICLE_SCALE, TILE_SCALE} from "@triss/entity-definition";

const VEHICLE_SCALE_VEC = new Vector3(VEHICLE_SCALE, VEHICLE_SCALE, VEHICLE_SCALE);
const TILE_SCALE_VEC = new Vector3(TILE_SCALE, TILE_SCALE, TILE_SCALE);

export const gridVectorToPosition = (pos: Vector2, target: Vector2 = new Vector2()): Vector2 => {
  return target.copy(pos).multiplyScalar(TILE_SCALE);
};

export const tileToMatrix = (() => {
  const piHalf = Math.PI * 0.5;
  const q = new Quaternion();
  const yAxis = new Vector3(0, 1, 0);

  return (matrix: Matrix4, tile: Tile) => {
    const t = tile.position;

    const rot = piHalf * tile.orientation;

    q.setFromAxisAngle(yAxis, rot);

    matrix.compose(t, q, TILE_SCALE_VEC);

    return matrix;
  };
})();

export const tagToMatrix = (() => {
  const q = new Quaternion();

  return (matrix: Matrix4, tag: Tag) => {
    const t = tag.position;

    matrix.compose(t, q, TILE_SCALE_VEC);

    return matrix;
  };
})();

export const vehicleToMatrix = (() => {
  return (matrix: Matrix4, vehicle: Vehicle) => {
    const t = vehicle.position;
    const q = vehicle.orientation;

    matrix.compose(t, q, VEHICLE_SCALE_VEC);

    return matrix;
  };
})();
