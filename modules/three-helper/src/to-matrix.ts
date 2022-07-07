import {Matrix4, Quaternion, Vector3} from "three";

import {isTag, isTile, isVehicle, TILE_SCALE, VEHICLE_SCALE} from "@triss/entity-definition";
import {TagDTO, TileDTO, VehicleDTO} from "@triss/dto";

export function rotateTo(matrix: Matrix4, lookAt: Vector3, up: Vector3) {
  const center = new Vector3();
  const m = new Matrix4();
  m.lookAt(center, lookAt, up);

  matrix.multiplyMatrices(matrix, m);

  // TODO remove the need for flip
  // This is equal to:
  // const flip = new Matrix4();
  // flip.makeRotationX(Math.PI * -.5);
  // matrix.multiplyMatrices(matrix, flip);

  const e = matrix.elements;

  // prettier-ignore
  matrix.elements = [
    e[0], e[1], e[2], e[3],
    -e[8], -e[9], -e[10], -e[11],
    e[4], e[5], e[6], e[7],
    e[12], e[13], e[14], e[15]
  ];

  return matrix;
}

export function lookAtQuaternion(q: Quaternion, lookAt: Vector3, up: Vector3) {
  const m = new Matrix4();

  rotateTo(m, lookAt, up);
  q.setFromRotationMatrix(m);
  return q;
}

export function positionToGrid(x: number, y: number): [number, number] {
  const xg = Math.round(x / TILE_SCALE);
  const yg = Math.round(y / TILE_SCALE);

  return [xg, yg];
}

export function gridToPosition(xg: number, yg: number): [number, number] {
  const x = Math.round(xg) * TILE_SCALE;
  const y = Math.round(yg) * TILE_SCALE;

  return [x, y];
}

const VEHICLE_SCALE_VEC = new Vector3(VEHICLE_SCALE, VEHICLE_SCALE, VEHICLE_SCALE);
const TILE_SCALE_VEC = new Vector3(TILE_SCALE, TILE_SCALE, TILE_SCALE);
const yAxis = new Vector3(0, 1, 0);

export function tileDataToMatrix(matrix: Matrix4, tile: TileDTO, t = new Vector3(), q = new Quaternion()) {
  const [gx, gy] = tile.gridPosition;
  t.set(TILE_SCALE * gx, 0, TILE_SCALE * gy);

  const rot = Math.PI * 0.5 * tile.orientation;

  q.setFromAxisAngle(yAxis, rot);

  matrix.compose(t, q, TILE_SCALE_VEC);

  return matrix;
}

export function tagDataToMatrix(matrix: Matrix4, tag: TagDTO, t = new Vector3(), q = new Quaternion()) {
  const [gx, gy] = tag.gridPosition;
  t.set(TILE_SCALE * gx, 0, TILE_SCALE * gy);

  matrix.compose(t, q, TILE_SCALE_VEC);

  return matrix;
}

export function vehicleDataToMatrix(matrix: Matrix4, vehicle: VehicleDTO, t = new Vector3(), q = new Quaternion()) {
  const [x, y, z] = vehicle.position;
  t.set(x, y, z);

  const r = vehicle.rotation;
  q.set(r[0], r[1], r[2], r[3]);

  matrix.compose(t, q, VEHICLE_SCALE_VEC);

  return matrix;
}

export type EntityMatrixMapper =
  | ((matrix: Matrix4, tile: TileDTO, t?: Vector3, q?: Quaternion) => Matrix4)
  | ((matrix: Matrix4, tag: TagDTO, t?: Vector3, q?: Quaternion) => Matrix4)
  | ((matrix: Matrix4, vehicle: VehicleDTO, t?: Vector3, q?: Quaternion) => Matrix4);

export function anyDataToMatrix(matrix: Matrix4, data: VehicleDTO | TagDTO | TileDTO) {
  if (isVehicle(data.type))
    return vehicleDataToMatrix(matrix, data as VehicleDTO);

  if (isTag(data.type))
    return tagDataToMatrix(matrix, data as TagDTO);

  if (isTile(data.type))
    return tileDataToMatrix(matrix, data as TileDTO);

  throw new Error("could not find a matching matrix converter");
}
