import {TagType, TileType, VehicleType} from "@triss/entity-definition";

import {VehicleDTO} from "./dtos/vehicle";
import {TagDTO} from "./dtos/tag";
import {TileDTO} from "./dtos/tile";
import {EntityIdentifier} from "./dtos/entity-identifier";

export type EntityDTO = VehicleDTO | TagDTO | TileDTO;
export type EntityType = VehicleType | TagType | TileType;

export const isEntity = (entity: EntityDTO, entityIdentifier: EntityIdentifier) =>
  entity.category == entityIdentifier.idCategory && entity.id == entityIdentifier.idNumber;
