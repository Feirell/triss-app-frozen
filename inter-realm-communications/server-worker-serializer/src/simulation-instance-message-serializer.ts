import {
  FLOAT64_SERIALIZER,
  ObjectPartialSerializer,
  ObjectSerializer,
  PropertySwitchSerializer,
  SerializerType,
  STRING_SERIALIZER,
  UINT32_SERIALIZER
} from "serialization-generator";

import {FrameDTO, WorldStateDTO} from "@triss/dto";
import {
  FRAME_OPTIONS_SERIALIZER,
  FRAME_SERIALIZER,
  FrameOptions,
  WORLD_STATE_SERIALIZER
} from "@triss/entity-serializer";

// TODO extract this type into DTO or something else
import {ManifestAgentEntry} from "@triss/agent-loader";

interface SMCreateInstance {
  type: "sm-create-instance";

  instanceId: number;

  world: WorldStateDTO;

  manifestPath: string;
  loadedAgent: ManifestAgentEntry;
}

export const LOADED_AGENT_SERIALIZER = new ObjectSerializer<ManifestAgentEntry>()
  .append("id", FLOAT64_SERIALIZER)
  .append("name", STRING_SERIALIZER)
  .append("description", STRING_SERIALIZER);

export const SM_CREATE_INSTANCE_SERIALIZER = new ObjectSerializer<SMCreateInstance>()
  .appendStatic("type", "sm-create-instance")
  .append("instanceId", UINT32_SERIALIZER)
  .append("world", WORLD_STATE_SERIALIZER)
  .append("manifestPath", STRING_SERIALIZER)
  .append("loadedAgent", LOADED_AGENT_SERIALIZER);

interface SMProduceNextFrame {
  type: "sm-produce-next-frame";
  options: FrameOptions;
}

export const SM_PRODUCE_NEXT_FRAME_SERIALIZER = new ObjectSerializer<SMProduceNextFrame>()
  .appendStatic("type", "sm-produce-next-frame")
  .append("options", FRAME_OPTIONS_SERIALIZER);

export interface SMGetCurrentFrame {
  type: "sm-get-current-frame";
  options: FrameOptions;
}

export const SM_GET_CURRENT_FRAME_SERIALIZER = new ObjectSerializer<SMGetCurrentFrame>()
  .appendStatic("type", "sm-get-current-frame")
  .append("options", FRAME_OPTIONS_SERIALIZER);

export type ServerMessages = SMCreateInstance | SMProduceNextFrame | SMGetCurrentFrame;

export const FROM_SERVER_MESSAGES_SERIALIZER = new PropertySwitchSerializer<ServerMessages, "type">(
  "type"
)
  .register("sm-create-instance", SM_CREATE_INSTANCE_SERIALIZER)
  .register("sm-produce-next-frame", SM_PRODUCE_NEXT_FRAME_SERIALIZER)
  .register("sm-get-current-frame", SM_GET_CURRENT_FRAME_SERIALIZER)
  .finalize();

export type ServerMessagesByType<Type extends ServerMessages["type"]> = Extract<ServerMessages,
  {type: Type}>;

export const isServerMessage = <Type extends ServerMessages["type"]>(
  msg: any,
  type: Type
): msg is ServerMessagesByType<Type> => typeof msg == "object" && msg.type == type;

export interface WMReady {
  type: "wm-ready";
}

export const WM_READY_SERIALIZER = new ObjectSerializer<WMReady>().appendStatic("type", "wm-ready");

export interface WMFrame {
  type: "wm-frame";
  frame: FrameDTO;
}

export const WM_FRAME_SERIALIZER = new ObjectSerializer<WMFrame>()
  .appendStatic("type", "wm-frame")
  .append("frame", FRAME_SERIALIZER);

export const WM_FRAME_PARTIAL_SERIALIZER = new ObjectPartialSerializer(
  WM_FRAME_SERIALIZER,
  "frame"
);
export type WMFramePartial = SerializerType<typeof WM_FRAME_PARTIAL_SERIALIZER>;

export type WorkerMessages = WMReady | WMFrame;

export type WorkerMessagesByType<Type extends WorkerMessages["type"]> = Extract<WorkerMessages,
  {type: Type}>;

export const isWorkerMessage = <Type extends WorkerMessages["type"]>(
  msg: any,
  type: Type
): msg is WorkerMessagesByType<Type> => typeof msg == "object" && msg.type == type;

export const FROM_WORKER_MESSAGE_SERIALIZER = new PropertySwitchSerializer<WorkerMessages, "type">(
  "type"
)
  .register("wm-ready", WM_READY_SERIALIZER)
  .register("wm-frame", WM_FRAME_SERIALIZER)
  .finalize();

export type WorkerMessagesPartial = WMReady | WMFramePartial;

export type WorkerPartialMessagesByType<Type extends WorkerMessages["type"]> = Extract<WorkerMessages,
  {type: Type}>;

export const isWorkerPartialMessage = <Type extends WorkerMessages["type"]>(
  msg: any,
  type: Type
): msg is WorkerMessagesByType<Type> => typeof msg == "object" && msg.type == type;

export const FROM_WORKER_PARTIAL_MESSAGE_SERIALIZER = new PropertySwitchSerializer<WorkerMessagesPartial,
  "type">("type")
  .register("wm-ready", WM_READY_SERIALIZER)
  .register("wm-frame", WM_FRAME_PARTIAL_SERIALIZER)
  .finalize();
