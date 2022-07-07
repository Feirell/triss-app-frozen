import {
  ArraySerializer,
  EnumSerializer,
  FLOAT32_SERIALIZER,
  ObjectSerializer,
  UINT16_SERIALIZER,
  UINT8_SERIALIZER,
  ValueSerializer,
  VectorSerializer,
} from "serialization-generator";

import {
  TagType,
  TileType,
  VehicleType,
} from "@triss/entity-definition";

import {
  EntityIdentifier,
  LayoutStateDTO,
  Orientation,
  TagDTO,
  TileDTO,
  TrafficStateDTO,
  VehicleDTO,
  WorldStateDTO,
} from "@triss/dto";
import {tagTypeValues, vehicleTypeValues} from "@triss/entity-definition";
import {entityCategoryValues} from "@triss/dto";

export const TILE_TYPE_SERIALIZER = UINT16_SERIALIZER as ValueSerializer<TileType>;

export const VEHICLE_TYPE_SERIALIZER = new EnumSerializer(vehicleTypeValues);

export const TAG_TYPE_SERIALIZER = new EnumSerializer(tagTypeValues);

const ORIENTATION_SERIALIZER = UINT8_SERIALIZER as ValueSerializer<Orientation>;



export const CATEGORY_SERIALIZER = new EnumSerializer(entityCategoryValues);

export const ENTITY_IDENTIFIER_SERIALIZER = new ObjectSerializer<EntityIdentifier>()
  .appendStatic("category", "EntityIdentifier")
  .append("idCategory", CATEGORY_SERIALIZER)
  .append("idNumber", UINT16_SERIALIZER);

export const TILE_SERIALIZER = new ObjectSerializer<TileDTO>({
  id: UINT16_SERIALIZER,
  type: TILE_TYPE_SERIALIZER,
  gridPosition: new VectorSerializer(UINT8_SERIALIZER, 2),
  orientation: ORIENTATION_SERIALIZER,
}).appendStatic("category", "TileDTO");

export const TAG_SERIALIZER = new ObjectSerializer<TagDTO>({
  id: UINT16_SERIALIZER,
  type: TAG_TYPE_SERIALIZER,
  gridPosition: new VectorSerializer(UINT8_SERIALIZER, 2),
  orientation: ORIENTATION_SERIALIZER,
}).appendStatic("category", "TagDTO");

export const VEHICLE_SERIALIZER = new ObjectSerializer<VehicleDTO>({
  id: UINT16_SERIALIZER,
  type: VEHICLE_TYPE_SERIALIZER,
  position: new VectorSerializer(FLOAT32_SERIALIZER, 3),
  rotation: new VectorSerializer(FLOAT32_SERIALIZER, 4),
}).appendStatic("category", "VehicleDTO");

export const LAYOUT_STATE_SERIALIZER = new ObjectSerializer<LayoutStateDTO>({
  tiles: new ArraySerializer(TILE_SERIALIZER),
  tags: new ArraySerializer(TAG_SERIALIZER),
}).appendStatic("category", "LayoutStateDTO");

export const TRAFFIC_STATE_SERIALIZER = new ObjectSerializer<TrafficStateDTO>({
  vehicles: new ArraySerializer(VEHICLE_SERIALIZER),
}).appendStatic("category", "TrafficStateDTO");

export const WORLD_STATE_SERIALIZER = new ObjectSerializer<WorldStateDTO>({
  layout: LAYOUT_STATE_SERIALIZER,
  traffic: TRAFFIC_STATE_SERIALIZER,
}).appendStatic("category", "WorldStateDTO");
