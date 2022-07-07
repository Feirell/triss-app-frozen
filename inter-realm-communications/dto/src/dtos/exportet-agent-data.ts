import {EntityIdentifier} from "./entity-identifier";

export interface PercentageEntry {
  type: "percentage";
  value: number;
}

export interface FloatEntry {
  type: "float";
  value: number;
}

export interface IntegerEntry {
  type: "integer";
  value: number;
}

export interface StringEntry {
  type: "string";
  value: string;
}

export interface BooleanEntry {
  type: "boolean";
  value: boolean;
}

export interface PathEntry {
  type: "path";
  // TODO come up with a way to identify the path piece
  value: string;
}

export interface VehicleRefEntry {
  type: "vehicle-ref";
  value: number;
}

export interface TileRefEntry {
  type: "tile-ref";
  value: number;
}

export interface TagRefEntry {
  type: "tag-ref";
  value: number;
}

// EAE ExportedAgentEntity

export type EAEBase =
  | PercentageEntry
  | FloatEntry
  | IntegerEntry
  | StringEntry
  | BooleanEntry
  | PathEntry
  | VehicleRefEntry
  | TileRefEntry
  | TagRefEntry;

// TODO transform those *-ref items to an EntityIdentifier
export const isEAEBase = (val: any): val is EAEBase =>
  typeof val == "object" &&
  [
    "percentage",
    "float",
    "integer",
    "string",
    "boolean",
    "path",
    "vehicle-ref",
    "tile-ref",
    "tag-ref",
  ].includes(val.type);

export interface EAEDataObject {
  type: "data-object";
  entries: EAEDataObjectEntry[];
}

export interface EAEDataObjectEntry {
  label: string;
  value: EAEBase | EAEData;
}

export const isEAEDataObjectEntry = (val: any): val is EAEDataObjectEntry =>
  typeof val == "object" && typeof val.label == "string";

export interface EAEDataArray {
  type: "data-array";
  entries: EAEDataArrayEntry[];
}

export interface EAEDataArrayEntry {
  index: number;
  value: EAEBase | EAEData;
}

export const isEAEDataArrayEntry = (val: any): val is EAEDataArrayEntry =>
  typeof val == "object" && typeof val.index == "number";

export type EAEData = EAEDataObject | EAEDataArray;

// TODO improve check
export const isEAEData = (val: any): val is EAEData =>
  typeof val == "object" && (val.type == "data-object" || val.type == "data-array");

export interface ExportedAgentEntityData {
  type: "exported-agent-entity-data";
  forEntity: EntityIdentifier;

  attachedData: EAEData;
}

export interface ExportedAgentEntityNotFound {
  type: "exported-agent-entity-not-found";
  forEntity: EntityIdentifier;
}

export type ExportedAgentDataDTO = (ExportedAgentEntityData | ExportedAgentEntityNotFound)[];
