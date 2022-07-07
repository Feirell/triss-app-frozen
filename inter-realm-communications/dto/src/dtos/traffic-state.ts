import {VehicleDTO} from "./vehicle";

export interface TrafficStateDTO {
  category: "TrafficStateDTO";

  vehicles: VehicleDTO[];
}
