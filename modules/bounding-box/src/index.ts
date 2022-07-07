import {vehicles, VehicleType} from "@triss/entity-definition";
import {Box3, Vector3} from "three";
import {VEHICLE_SCALE} from "@triss/entity-definition";

const boxes = new Map(
  Array.from(vehicles.entries())
    .map(
      ([type, {dimensions: {min, max}}]) => ([
        type,
        new Box3(new Vector3(...min), new Vector3(...max))
      ]))
);

export function getBoundingBox(type: VehicleType): Box3 {
  return boxes.get(type)!;
}

const modelLengths = new Map(
  Array.from(vehicles.entries())
    .map(
      ([type, {dimensions: {min, max}}]) => ([
        type,
        (max[2] - min[2]) * VEHICLE_SCALE
      ]))
);

export function getModelLength(type: VehicleType) {
  return modelLengths.get(type)!;
}

// export const getModelLength = (() => {
//   const dimensions = new Vector3();
//
//   return (type: VehicleType, scale = VEHICLE_SCALE) => {
//     const bb = getBoundingBox(type);
//     bb.getSize(dimensions);
//     return dimensions.z * scale;
//   };
// })();
