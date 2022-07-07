import {Action} from "redux";

import {Views} from "../state/client-state";

export interface NavigateA extends Action {
  type: "navigate";
  view: Views;
}

export interface NavigateToOverviewA extends Action {
  type: "navigate-to-overview";
  view: "vehicle-agents" | "layouts" | "instances";
}
