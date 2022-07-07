import {Quaternion, Vector3} from "three";

import {VehicleType} from "@triss/entity-definition";
import {VehicleDTO} from "@triss/dto";

export class Vehicle {
  public readonly id: number;

  public type: VehicleType;
  public position: Vector3;
  public orientation: Quaternion;

  constructor(id: number, type: VehicleType, position: Vector3, orientation: Quaternion) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.orientation = orientation;
  }

  getSerializeData(): VehicleDTO {
    const p = this.position;
    const o = this.orientation;

    return {
      category: "VehicleDTO",
      id: this.id,
      type: this.type,
      position: [p.x, p.y, p.z],
      rotation: [o.x, o.y, o.z, o.w],
    };
  }

  clone() {
    return new Vehicle(this.id, this.type, this.position.clone(), this.orientation.clone());
  }
}

export function createVehicleFromData(data: VehicleDTO) {
  return new Vehicle(
    data.id,
    data.type,
    new Vector3(...data.position),
    new Quaternion(...data.rotation)
  );
}
