import {FullFrameStateDTO} from "@triss/dto";
import {LayoutStateDTO} from "@triss/dto";
import {SimulationInstanceInformation} from "@triss/client-server-serializer";
import {createEnum} from "@triss/entity-helper";

export const mainMenuViews = createEnum(
  // 'server/overview',
  "server/instances",
  "server/layouts",
  "server/vehicle-agents"

  // 'other/github',
  // 'other/documentation',
  // 'other/about'
);

export type MainMenuViews = typeof mainMenuViews["ENUM_TYPE"];

export type CreationState =
  | {state: "initialized"}
  | {state: "send-request"}
  | {state: "was-successful"; createdEntityId: number}
  | {state: "was-unsuccessful"; reason: string};

export interface ClientState {
  view:
    | {
        name: "loading-assets";
        state: "initialized" | "loading" | "finished";
        total: number;
        loaded: number;
      }
    | {
        name: "connecting";
        lastFailMessage: string | undefined;
      }

    // { name: 'main-menu/server/overview' } |
    | {
        name: "main-menu/server/instances";
        creationState: CreationState;
      }
    | {name: "main-menu/server/layouts"}
    | {
        name: "main-menu/server/vehicle-agents";
        creationState: CreationState;
      }
    // { name: 'main-menu/other/github' } |
    // { name: 'main-menu/other/documentation' } |
    // { name: 'main-menu/other/about' } |
    | {
        name: "compose-layout";
        basis: LayoutStateDTO | "loading" | undefined;
      }
    | {
        name: "view-layout";
        layout: LayoutStateDTO;
      }
    | {
        name: "show-simulation";
        simulation: SimulationInstanceInformation;

        frame: FullFrameStateDTO;
      };
}

export type Views = ClientState["view"];
export type ViewNames = Views["name"];

export type View<Name extends ViewNames> = Extract<Views, {name: Name}>;

export const isView = <Name extends ViewNames>(value: any, name: Name): value is View<Name> =>
  typeof value == "object" && value.name == name;

export const INITIAL_CLIENT_STATE: ClientState = {
  view: {
    name: "loading-assets",
    state: "initialized",
    total: 0,
    loaded: 0,
  },
};
