import {OBB} from "../hard-imported/obb";
import {Box3, Matrix4, Vector3} from "three";
import {Vehicle} from "@triss/entities";
import {TILE_SCALE, VEHICLE_SCALE} from "@triss/entity-definition";

import {getBoundingBox} from "@triss/bounding-box";

export interface VehicleVolumeDescription {
  vehicle: Vehicle;

  // The chunks in which this vehicle in registered
  chunks: [number, number][];

  // axis aligned bounding box, faster to check
  aabb: Box3;

  // oriented bounding box, slower to check but more accurate
  obb: OBB;
}

const CHUNK_SIZE = TILE_SCALE;

const getAABBForChunk = (x: number, y: number) =>
  new Box3(
    new Vector3((x - 0.5) * CHUNK_SIZE, -200, (y - 0.5) * CHUNK_SIZE),
    new Vector3((x + 0.5) * CHUNK_SIZE, 200, (y + 0.5) * CHUNK_SIZE)
  );

const vehicleToMatrix = (vehicle: Vehicle) =>
  new Matrix4().compose(
    vehicle.position,
    vehicle.orientation,
    new Vector3(VEHICLE_SCALE, VEHICLE_SCALE, VEHICLE_SCALE)
  );

export const getOBBFromBBAndMatrix = (bb: Box3, matrix: Matrix4) =>
  new OBB().fromBox3(bb).applyMatrix4(matrix);

export const getAABBFromBBAndMatrix = (bb: Box3, matrix: Matrix4) =>
  new Box3().copy(bb).applyMatrix4(matrix);

export const getVehicleVolumeDescriptionForVehicle = (
  vehicle: Vehicle
): VehicleVolumeDescription => {
  const bb = getBoundingBox(vehicle.type);
  const mat = vehicleToMatrix(vehicle);

  const obb = getOBBFromBBAndMatrix(bb, mat);
  const aabb = getAABBFromBBAndMatrix(bb, mat);

  // dividing by tile scale to make the grid more easier to compute
  const bMinX = Math.round(aabb.min.x / TILE_SCALE);

  // z since the plane, if seen from above has uses x, y but in
  // three d but three uses z for the other place axis and y as the height.
  const bMinY = Math.round(aabb.min.z / TILE_SCALE);

  const bMaxX = Math.round(aabb.max.x / TILE_SCALE);
  const bMaxY = Math.round(aabb.max.z / TILE_SCALE);

  const chunks: [number, number][] = [];

  for (let x = bMinX; x <= bMaxX; x++)
    for (let y = bMinY; y <= bMaxY; y++)
      if (obb.intersectsBox3(getAABBForChunk(x, y))) chunks.push([x, y]);

  return {vehicle, chunks, aabb, obb};
};

export const doesVVDIntersect = (
  vvdA: VehicleVolumeDescription,
  vvdB: VehicleVolumeDescription
) => {
  if (!vvdA.aabb.intersectsBox(vvdB.aabb)) return false;

  if (!vvdA.obb.intersectsOBB(vvdB.obb, 1e-5)) return false;

  return true;
};
