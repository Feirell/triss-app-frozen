import {Action} from "redux";

import {LayoutStateDTO, RegisteredLayoutDTO} from "@triss/dto";

export interface CreateLayoutA extends Action {
  type: "create-layout";
  basingOn: number | undefined;
}

export interface AbortLayoutCreationA extends Action {
  type: "abort-layout";
}

export interface FinishedLayoutCreationA extends Action {
  type: "finished-layout-creation";
  name: string;
  description: string;
  layout: LayoutStateDTO;
}

export interface LayoutCreationRequestResultA extends Action {
  type: "layout-creation-request-result";
  request: FinishedLayoutCreationA;

  result:
    | {
    type: "succeeded";
    id: number;
  }
    | {
    type: "failed";
    reason: string;
  };
}

export interface ViewLayoutA extends Action {
  type: "view-layout";
  id: number;
}

export interface LoadedLayoutA extends Action {
  type: "loaded-layout";
  layout: RegisteredLayoutDTO;
}
