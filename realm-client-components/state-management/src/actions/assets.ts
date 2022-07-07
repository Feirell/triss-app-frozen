import {Action} from "redux";

export interface AssetsLoadedA extends Action {
  type: "assets-loaded";
}

export interface AssetsProgressA extends Action {
  type: "assets-progress";
  loaded: number;
  needed: number;
}
