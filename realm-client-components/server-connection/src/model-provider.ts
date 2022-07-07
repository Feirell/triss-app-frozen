import {Object3D} from "three";

import {createMerged, MergedMesh} from "@triss/instanced-models";
import {TagType, TileType, VehicleType} from "@triss/entity-definition";

export class ModelProvider<Types> {
  private registry = new Map<Types, Object3D>();
  private mergedRegistry = new Map<Types, MergedMesh>();

  get(type: Types) {
    return this.registry.get(type);
  }

  set(type: Types, model: Object3D) {
    if (!model.name || model.name.length == 0) model.name = type + "-model";
    this.registry.set(type, model);
  }

  getMerged(type: Types) {
    if (!this.mergedRegistry.has(type) && this.registry.has(type))
      this.mergedRegistry.set(type, createMerged(this.registry.get(type)!));

    return this.mergedRegistry.get(type);
  }
}

export const GLOBAL_MODEL_PROVIDER = new ModelProvider<TileType | TagType | VehicleType>();
