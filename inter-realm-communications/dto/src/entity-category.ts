import {EntityDTO} from "./convenience";

import {VehicleDTO} from "./dtos/vehicle";
import {TileDTO} from "./dtos/tile";
import {TagDTO} from "./dtos/tag";

export type EntityCategory = EntityDTO["category"];
export const entityCategoryValues: EntityCategory[] = ["TagDTO", "TileDTO", "VehicleDTO"];

export type DTOToCategory<Data extends EntityDTO> = Data extends VehicleDTO
  ? VehicleDTO["category"]
  : Data extends TileDTO
    ? TileDTO["category"]
    : Data extends TagDTO
      ? TagDTO["category"]
      : never;

export type CategoryToDTO<Cat extends EntityCategory> = Cat extends VehicleDTO["category"]
  ? VehicleDTO
  : Cat extends TileDTO["category"]
    ? TileDTO
    : Cat extends TagDTO["category"]
      ? TagDTO
      : never;
