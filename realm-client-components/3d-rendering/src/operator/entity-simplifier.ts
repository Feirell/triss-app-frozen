import {Matrix4, Quaternion, Vector3} from "three";

import {TransitionalRenderable} from "../render-entities/transitional-renderable";
import {GLOBAL_MODEL_PROVIDER, ModelProvider} from "@triss/server-connection";
import {EntityDTO} from "@triss/dto";

import {Operator} from "./operator";

export class EntitySimplifier<EntityType extends EntityDTO> extends Operator<
  EntityType,
  TransitionalRenderable<EntityType>
> {
  constructor(
    private readonly matrixMapper: (
      matrix: Matrix4,
      entity: EntityType,
      position: Vector3,
      quaternion: Quaternion
    ) => void,
    private readonly modelProvider: ModelProvider<EntityType["type"]> = GLOBAL_MODEL_PROVIDER
  ) {
    super();
  }

  process(entity: EntityType): TransitionalRenderable<EntityType> {
    const mesh = this.modelProvider.get(entity.type);
    if (mesh == undefined)
      throw new Error("Could not find the model for the tile id " + entity.type);

    const position = new Vector3();
    const rotation = new Quaternion();
    const matrix = new Matrix4();

    this.matrixMapper(matrix, entity, position, rotation);

    return {
      mesh,
      matrix,
      position,
      rotation,
      entity,
    };
  }
}
