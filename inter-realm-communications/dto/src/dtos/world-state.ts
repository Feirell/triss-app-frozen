import {LayoutStateDTO} from "./layout-state";
import {TrafficStateDTO} from "./traffic-state";

export interface WorldStateDTO {
  category: "WorldStateDTO";

  layout: LayoutStateDTO;
  traffic: TrafficStateDTO;
}


