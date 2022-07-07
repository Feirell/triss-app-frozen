import {ArraySerializer, FLOAT64_SERIALIZER, ObjectSerializer, UINT32_SERIALIZER} from "serialization-generator";

import {EntityIdentifier, FrameDTO} from "@triss/dto";
import {BOOLEAN_SERIALIZER, OR_UNDEFINED_SERIALIZER} from "@triss/additional-serializer";

import {
  ENTITY_IDENTIFIER_SERIALIZER,
  LAYOUT_STATE_SERIALIZER,
  TRAFFIC_STATE_SERIALIZER
} from "./world-state-serailizer";
import {EXPORTED_AGENT_DATA_SERIALIZER} from "./exported-agent-data-serializer";

export interface FrameOptions {
  includeTraffic: boolean;
  includeLayout: boolean;

  includeExportedAgentDataFor: EntityIdentifier[];
}

export const FRAME_OPTIONS_SERIALIZER = new ObjectSerializer<FrameOptions>()
  .append("includeTraffic", BOOLEAN_SERIALIZER)
  .append("includeLayout", BOOLEAN_SERIALIZER)
  .append("includeExportedAgentDataFor", new ArraySerializer(ENTITY_IDENTIFIER_SERIALIZER));

export const FRAME_SERIALIZER = new ObjectSerializer<FrameDTO>()
  .append("frameId", UINT32_SERIALIZER)
  .append("simulationTime", FLOAT64_SERIALIZER)
  .append("traffic", OR_UNDEFINED_SERIALIZER(TRAFFIC_STATE_SERIALIZER))
  .append("layout", OR_UNDEFINED_SERIALIZER(LAYOUT_STATE_SERIALIZER))
  .append("exportedAgentData", EXPORTED_AGENT_DATA_SERIALIZER);
