import {VehicleType} from "@triss/entity-definition";
import {Vector3f, Vector4f} from "../common";

export interface VehicleDTO {
  category: "VehicleDTO";

  id: number;
  type: VehicleType;

  position: Vector3f;
  rotation: Vector4f;
}
