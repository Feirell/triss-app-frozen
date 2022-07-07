import {
  ArraySerializer,
  FLOAT32_SERIALIZER,
  INT16_SERIALIZER,
  ObjectSerializer,
  PropertySwitchSerializer,
  STRING_SERIALIZER,
  SwitchSerializer,
  UINT16_SERIALIZER
} from "serialization-generator";

import {
  EAEBase,
  EAEData,
  EAEDataArray,
  EAEDataArrayEntry,
  EAEDataObject,
  EAEDataObjectEntry,
  ExportedAgentEntityData,
  ExportedAgentEntityNotFound,
  isEAEBase,
  isEAEData
} from "@triss/dto";
import {BOOLEAN_SERIALIZER} from "@triss/additional-serializer";

import {ENTITY_IDENTIFIER_SERIALIZER} from "./world-state-serailizer";

type getSub<K extends EAEBase["type"]> = Extract<EAEBase, {type: K}>;

export const EAE_DATA_BASE_SERIALIZER = new PropertySwitchSerializer<EAEBase, "type">("type")
  .register(
    "percentage",
    new ObjectSerializer<getSub<"percentage">>().append("value", FLOAT32_SERIALIZER)
  )
  .register("float", new ObjectSerializer<getSub<"float">>().append("value", FLOAT32_SERIALIZER))
  .register("integer", new ObjectSerializer<getSub<"integer">>().append("value", INT16_SERIALIZER))
  .register("string", new ObjectSerializer<getSub<"string">>().append("value", STRING_SERIALIZER))
  .register(
    "boolean",
    new ObjectSerializer<getSub<"boolean">>().append("value", BOOLEAN_SERIALIZER)
  )
  // TODO Removed path component, re-add it when the dto is fixed
  // .register("path", new ObjectSerializer<getSub<"path">>().append("value", PATH_PIECE_SERIALIZER))
  .register(
    "vehicle-ref",
    new ObjectSerializer<getSub<"vehicle-ref">>().append("value", UINT16_SERIALIZER)
  )
  .register(
    "tile-ref",
    new ObjectSerializer<getSub<"tile-ref">>().append("value", UINT16_SERIALIZER)
  )
  .register("tag-ref", new ObjectSerializer<getSub<"tag-ref">>().append("value", UINT16_SERIALIZER))
  .finalize();

const isArrayOf =
  <K>(tester: (val: any) => val is K) =>
    (val: any): val is K[] =>
      Array.isArray(val) && val.every(tester);

export const EAE_DATA_ARRAY_ENTRY = new ObjectSerializer<EAEDataArrayEntry>();
export const EAE_DATA_OBJECT_ENTRY = new ObjectSerializer<EAEDataObjectEntry>();

export const EAE_DATA_ARRAY = new ObjectSerializer<EAEDataArray>().append(
  "entries",
  new ArraySerializer(EAE_DATA_ARRAY_ENTRY)
);

export const EAE_DATA_OBJECT = new ObjectSerializer<EAEDataObject>().append(
  "entries",
  new ArraySerializer(EAE_DATA_OBJECT_ENTRY)
);

export const EAE_DATA_SERIALIZER = new PropertySwitchSerializer<EAEData, "type">("type")
  .register("data-array", EAE_DATA_ARRAY)
  .register("data-object", EAE_DATA_OBJECT)
  .finalize();

const EAE_DATA_BASE_AND_EAE_DATA_SERIALIZER = new SwitchSerializer<EAEBase | EAEData>()
  .register(isEAEBase, EAE_DATA_BASE_SERIALIZER)
  .register(isEAEData, EAE_DATA_SERIALIZER)
  .finalize();

EAE_DATA_ARRAY_ENTRY.append("index", UINT16_SERIALIZER).append(
  "value",
  EAE_DATA_BASE_AND_EAE_DATA_SERIALIZER
);

EAE_DATA_OBJECT_ENTRY.append("label", STRING_SERIALIZER).append(
  "value",
  EAE_DATA_BASE_AND_EAE_DATA_SERIALIZER
);

export const EXPORTED_AGENT_ENTITY_DATA_SERIALIZER = new ObjectSerializer<ExportedAgentEntityData>()
  .appendStatic("type", "exported-agent-entity-data")
  .append("forEntity", ENTITY_IDENTIFIER_SERIALIZER)
  .append("attachedData", EAE_DATA_SERIALIZER);

export const EXPORTED_AGENT_ENTITY_NOT_FOUND_SERIALIZER =
  new ObjectSerializer<ExportedAgentEntityNotFound>()
    .appendStatic("type", "exported-agent-entity-not-found")
    .append("forEntity", ENTITY_IDENTIFIER_SERIALIZER);

export const EXPORTED_AGENT_DATA_SERIALIZER = new ArraySerializer(
  new PropertySwitchSerializer<ExportedAgentEntityData | ExportedAgentEntityNotFound, "type">(
    "type"
  )
    .register("exported-agent-entity-data", EXPORTED_AGENT_ENTITY_DATA_SERIALIZER)
    .register("exported-agent-entity-not-found", EXPORTED_AGENT_ENTITY_NOT_FOUND_SERIALIZER)
    .finalize()
);
