import {
  CreateVehicleAgentA,
  FinishedVehicleAgentCreationA,
  VehicleAgentCreationRequestResultA,
} from "./vehicle-agent";
import {
  ChangeSimulationInstanceOperatingStateA,
  CloseSimulationInstanceA,
  CreateSimulationInstanceA,
  FinishedSimulationInstanceCreationA,
  ReceivedFrameA,
  SimulationInstanceCreationRequestResultA,
  ViewSimulationInstanceA,
  WorldStateConsumedA,
} from "./simulation-instance";
import {GotServerStateA} from "./server-pushed";
import {NavigateA, NavigateToOverviewA} from "./navigation";
import {StoreInitializedA} from "./meta";
import {
  AbortLayoutCreationA,
  CreateLayoutA,
  FinishedLayoutCreationA,
  LayoutCreationRequestResultA,
  LoadedLayoutA,
  ViewLayoutA,
} from "./layout";
import {
  ConnectedA,
  ConnectionFailedA,
  DisconnectA,
  DisconnectedA,
  TryToConnectConnectA,
} from "./connection";
import {AssetsLoadedA, AssetsProgressA} from "./assets";

export type AllActionTypes =
  | StoreInitializedA
  | NavigateA
  | NavigateToOverviewA
  | GotServerStateA
  | AssetsLoadedA
  | AssetsProgressA
  | TryToConnectConnectA
  | ConnectionFailedA
  | ConnectedA
  | DisconnectA
  | DisconnectedA
  | CreateLayoutA
  | FinishedLayoutCreationA
  | LayoutCreationRequestResultA
  | ViewLayoutA
  | AbortLayoutCreationA
  | LoadedLayoutA
  | CreateSimulationInstanceA
  | FinishedSimulationInstanceCreationA
  | SimulationInstanceCreationRequestResultA
  | ChangeSimulationInstanceOperatingStateA
  | ViewSimulationInstanceA
  | CloseSimulationInstanceA
  | WorldStateConsumedA
  | ReceivedFrameA
  | CreateVehicleAgentA
  | FinishedVehicleAgentCreationA
  | VehicleAgentCreationRequestResultA;

export type ActionByType<Type extends AllActionTypes["type"]> = Extract<AllActionTypes, {type: Type}>;
