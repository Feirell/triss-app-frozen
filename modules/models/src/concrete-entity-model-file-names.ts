import {EntityModelCamelCaseName, EntityModelPadNumberName} from "./entity-model-file-names";

class TileModelFileNames extends EntityModelPadNumberName {
  constructor() {
    super("tile");
  }
}

export const TILE_MODEL_FILE_NAMES = new TileModelFileNames();

class TagModelFileNames extends EntityModelCamelCaseName {
  constructor() {
    super("tag");
  }
}

export const TAG_MODEL_FILE_NAMES = new TagModelFileNames();

class VehicleModelFileNames extends EntityModelCamelCaseName {
  constructor() {
    super("vehicle");
  }
}

export const VEHICLE_MODEL_FILE_NAMES = new VehicleModelFileNames();
