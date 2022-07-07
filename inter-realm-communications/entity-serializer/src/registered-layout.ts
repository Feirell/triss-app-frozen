import {ArraySerializer, ObjectSerializer, STRING_SERIALIZER, UINT16_SERIALIZER} from "serialization-generator";
import {RegisteredLayoutDTO} from "@triss/dto";
import {TAG_SERIALIZER, TILE_SERIALIZER} from "./world-state-serailizer";

export const REGISTERED_LAYOUT_DTO_SERIALIZER = new ObjectSerializer<RegisteredLayoutDTO>()
  .append("id", UINT16_SERIALIZER)
  .append("name", STRING_SERIALIZER)
  .append("description", STRING_SERIALIZER)
  .append("tiles", new ArraySerializer(TILE_SERIALIZER))
  .append("tags", new ArraySerializer(TAG_SERIALIZER));
