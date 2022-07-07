import {
  ArraySerializer,
  EnumSerializer,
  ObjectPartialSerializer,
  ObjectSerializer,
  PropertySwitchSerializer,
  SerializerType,
  STRING_SERIALIZER,
  UINT16_SERIALIZER,
  UINT8_SERIALIZER
} from "serialization-generator";


import {
  FRAME_OPTIONS_SERIALIZER,
  FRAME_SERIALIZER,
  FrameOptions,
  LAYOUT_STATE_SERIALIZER,
  REGISTERED_LAYOUT_DTO_SERIALIZER
} from "@triss/entity-serializer";

import {FrameDTO, LayoutStateDTO, RegisteredLayoutDTO} from "@triss/dto";
import {createEnum} from "@triss/entity-helper";


// TODO extract message definitions to own module

//
// From Client
//
export interface CMGetRegisteredLayout {
  type: "cm-get-registered-layout";
  id: number;
}

export const CM_GET_REGISTERED_LAYOUT = new ObjectSerializer<CMGetRegisteredLayout>().append(
  "id",
  UINT16_SERIALIZER
);

export interface CMCreateLayout {
  type: "cm-create-layout";
  name: string;
  description: string;
  layout: LayoutStateDTO;
}

export const CM_CREATE_LAYOUT = new ObjectSerializer<CMCreateLayout>()
  .append("name", STRING_SERIALIZER)
  .append("description", STRING_SERIALIZER)
  .append("layout", LAYOUT_STATE_SERIALIZER);

export interface CMCreateVehicleAgent {
  type: "cm-create-vehicle-agent";
  associatedFiles: {fileName: string; fileContent: string}[];
}

export const CM_CREATE_VEHICLE_AGENT = new ObjectSerializer<CMCreateVehicleAgent>()
  .append(
    "associatedFiles",
    new ArraySerializer(
      new ObjectSerializer<CMCreateVehicleAgent["associatedFiles"][number]>()
        .append("fileName", STRING_SERIALIZER)
        .append("fileContent", STRING_SERIALIZER)
    )
  );

export interface CMCreateSimulationInstance {
  type: "cm-create-simulation-instance";
  name: string;
  description: string;
  layout: number;
  agent: number;
}

export const CM_CREATE_SIMULATION_INSTANCE = new ObjectSerializer<CMCreateSimulationInstance>()
  .append("name", STRING_SERIALIZER)
  .append("description", STRING_SERIALIZER)
  .append("layout", UINT16_SERIALIZER)
  .append("agent", UINT16_SERIALIZER);

export const SimulationOperatingStateEnum = createEnum("paused", "running");
export type SimulationOperatingState = typeof SimulationOperatingStateEnum.ENUM_TYPE;
export const SIMULATION_OPERATING_STATE_SERIALIZER = new EnumSerializer(
  SimulationOperatingStateEnum.getAllValid() as SimulationOperatingState[]
);

export interface CMChangeSimulationOperatingState {
  type: "cm-change-simulation-operating-state";
  instanceId: number;
  toState: SimulationOperatingState;
}

export const CM_CHANGE_SIMULATION_OPERATING_STATE =
  new ObjectSerializer<CMChangeSimulationOperatingState>()
    .append("instanceId", UINT16_SERIALIZER)
    .append("toState", SIMULATION_OPERATING_STATE_SERIALIZER);

export interface CMStartSendingFrames {
  type: "cm-start-sending-frames";
  instanceId: number;
  options: FrameOptions;
}

export const CM_START_SENDING_FRAMES = new ObjectSerializer<CMStartSendingFrames>()
  .append("instanceId", UINT16_SERIALIZER)
  .append("options", FRAME_OPTIONS_SERIALIZER);

export interface CMStopSendingFrames {
  type: "cm-stop-sending-frames";
  instanceId: number;
}

export const CM_STOP_SENDING_FRAMES = new ObjectSerializer<CMStopSendingFrames>().append(
  "instanceId",
  UINT16_SERIALIZER
);

export interface CMServerState {
  type: "cm-server-state";
}

export const CM_SERVER_STATE = new ObjectSerializer<CMServerState>();

export type ClientMessages =
  | CMGetRegisteredLayout
  | CMCreateVehicleAgent
  | CMCreateLayout
  | CMCreateSimulationInstance
  | CMChangeSimulationOperatingState
  | CMStartSendingFrames
  | CMStopSendingFrames
  | CMServerState;

export type ClientMessageByType<Type extends ClientMessages["type"]> = Extract<ClientMessages,
  {type: Type}>;

export const FROM_CLIENT_SERIALIZER = new PropertySwitchSerializer<ClientMessages, "type">("type")
  .register("cm-get-registered-layout", CM_GET_REGISTERED_LAYOUT)

  .register("cm-create-vehicle-agent", CM_CREATE_VEHICLE_AGENT)
  .register("cm-create-layout", CM_CREATE_LAYOUT)
  .register("cm-create-simulation-instance", CM_CREATE_SIMULATION_INSTANCE)

  .register("cm-change-simulation-operating-state", CM_CHANGE_SIMULATION_OPERATING_STATE)

  .register("cm-start-sending-frames", CM_START_SENDING_FRAMES)
  .register("cm-stop-sending-frames", CM_STOP_SENDING_FRAMES)

  .register("cm-server-state", CM_SERVER_STATE)
  .finalize();

//
// From Server
//

export interface SMRegisteredLayout {
  type: "sm-registered-layout";
  layout: RegisteredLayoutDTO;
}

export const SM_REGISTERED_LAYOUT = new ObjectSerializer<SMRegisteredLayout>().append(
  "layout",
  REGISTERED_LAYOUT_DTO_SERIALIZER
);

export interface SMCreatedLayout {
  type: "sm-created-layout";
  id: number;
}

export const SM_CREATED_LAYOUT = new ObjectSerializer<SMCreatedLayout>().append(
  "id",
  UINT16_SERIALIZER
);

export interface SMCreatedVehicleAgent {
  type: "sm-created-vehicle-agent";
  id: number;
}

export const SM_CREATED_VEHICLE_AGENT = new ObjectSerializer<SMCreatedVehicleAgent>().append(
  "id",
  UINT16_SERIALIZER
);

export interface SMUnableToCreateVehicleAgent {
  type: "sm-unable-to-create-vehicle-agent";
  reason: string;
}

export const SM_UNABLE_TO_CREATE_VEHICLE_AGENT =
  new ObjectSerializer<SMUnableToCreateVehicleAgent>().append("reason", STRING_SERIALIZER);

export interface SMCreatedSimulationInstance {
  type: "sm-created-simulation-instance";
  id: number;
}

export const SM_CREATED_SIMULATION_INSTANCE =
  new ObjectSerializer<SMCreatedSimulationInstance>().append("id", UINT16_SERIALIZER);

export interface SMFrame {
  type: "sm-frame";
  instanceId: number;
  frame: FrameDTO;
}

export const SM_FRAME = new ObjectSerializer<SMFrame>()
  // not including the type since it will be transferred by the SwitchSerializer
  .append("instanceId", UINT16_SERIALIZER)
  .append("frame", FRAME_SERIALIZER);

export const SM_FRAME_PARTIAL = new ObjectPartialSerializer(SM_FRAME, "frame");

export type SMFramePartial = SerializerType<typeof SM_FRAME_PARTIAL>;

export interface LayoutInformation {
  id: number;
  name: string;
  description: string;
}

export const LAYOUT_INFORMATION_SERIALIZER = new ObjectSerializer<LayoutInformation>()
  .append("id", UINT16_SERIALIZER)
  .append("name", STRING_SERIALIZER)
  .append("description", STRING_SERIALIZER);

export interface VehicleAgentInformation {
  id: number;
  name: string;
  description: string;
}

export const VEHICLE_AGENT_INFORMATION_SERIALIZER = new ObjectSerializer<VehicleAgentInformation>()
  .append("id", UINT16_SERIALIZER)
  .append("name", STRING_SERIALIZER)
  .append("description", STRING_SERIALIZER);

export interface SimulationInstanceInformation {
  id: number;
  name: string;
  description: string;
  operatingState: SimulationOperatingState;
}

export const SIMULATION_INSTANCE_INFORMATION_SERIALIZER =
  new ObjectSerializer<SimulationInstanceInformation>()
    .append("id", UINT16_SERIALIZER)
    .append("name", STRING_SERIALIZER)
    .append("description", STRING_SERIALIZER)
    .append("operatingState", SIMULATION_OPERATING_STATE_SERIALIZER);

export interface SMServerState {
  type: "sm-server-state";
  layouts: LayoutInformation[];
  vehicleAgents: VehicleAgentInformation[];
  simulationInstances: SimulationInstanceInformation[];
}

export const SM_SERVER_STATE = new ObjectSerializer<SMServerState>()
  .append("layouts", new ArraySerializer(LAYOUT_INFORMATION_SERIALIZER))
  .append("vehicleAgents", new ArraySerializer(VEHICLE_AGENT_INFORMATION_SERIALIZER))
  .append("simulationInstances", new ArraySerializer(SIMULATION_INSTANCE_INFORMATION_SERIALIZER));

// TODO add "unable to" messages for all creation processes

export type ServerMessages =
  | SMRegisteredLayout
  | SMCreatedLayout
  | SMCreatedVehicleAgent
  | SMUnableToCreateVehicleAgent
  | SMCreatedSimulationInstance
  | SMFrame
  | SMServerState;

export type ServerMessagesPartial =
  | SMRegisteredLayout
  | SMCreatedLayout
  | SMCreatedVehicleAgent
  | SMUnableToCreateVehicleAgent
  | SMCreatedSimulationInstance
  | SMFramePartial
  | SMServerState;

export type ServerMessagesByType<Type extends ServerMessages["type"]> = Extract<ServerMessages,
  {type: Type}>;

export const FROM_SERVER_SERIALIZER = new PropertySwitchSerializer<ServerMessages, "type">("type")
  .register("sm-registered-layout", SM_REGISTERED_LAYOUT)

  .register("sm-created-layout", SM_CREATED_LAYOUT)
  .register("sm-created-vehicle-agent", SM_CREATED_VEHICLE_AGENT)
  .register("sm-unable-to-create-vehicle-agent", SM_UNABLE_TO_CREATE_VEHICLE_AGENT)
  .register("sm-created-simulation-instance", SM_CREATED_SIMULATION_INSTANCE)

  .register("sm-frame", SM_FRAME)

  .register("sm-server-state", SM_SERVER_STATE)
  .finalize();

export const FROM_SERVER_PARTIAL_SERIALIZER = new PropertySwitchSerializer<ServerMessagesPartial,
  "type">("type")
  .register("sm-registered-layout", SM_REGISTERED_LAYOUT)

  .register("sm-created-layout", SM_CREATED_LAYOUT)
  .register("sm-created-vehicle-agent", SM_CREATED_VEHICLE_AGENT)
  .register("sm-unable-to-create-vehicle-agent", SM_UNABLE_TO_CREATE_VEHICLE_AGENT)
  .register("sm-created-simulation-instance", SM_CREATED_SIMULATION_INSTANCE)

  .register("sm-frame", SM_FRAME_PARTIAL)

  .register("sm-server-state", SM_SERVER_STATE)
  .finalize();

export type MessageByType<MessageGroup extends ServerMessages | ClientMessages,
  Type extends MessageGroup["type"]> = Extract<MessageGroup, {type: Type}>;
