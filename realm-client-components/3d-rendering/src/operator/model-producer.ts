import {Matrix4} from "three";

import {EntityKeyMap} from "../utility/entity-key-map";
import {TransitionalRenderable} from "../render-entities/transitional-renderable";
import {HighlightEntity} from "../render-entities/highlight-entity";
import {GreyScaleEntity} from "../render-entities/grey-scale-entity";
import {ColorEntity} from "../render-entities/color-entity";
import {createMeshBasicMaterialBackside} from "../caches/mesh-basic-material-cache-backside";
import {createMergedCache} from "../caches/merged-cache";
import {createMaterialReplaceCache} from "../caches/material-reaplce-cache";
import {createGreyScalerCache} from "../caches/grey-scaler-cache";
import {EntityDTO, identifierFromEntity} from "@triss/dto";

import {Operator} from "./operator";

type MergedCache = ReturnType<typeof createMergedCache>;

const createColoredObjectsCache = (mergedCache: MergedCache) => {
  return createMaterialReplaceCache(mergedCache);
};

const createHighlightedObjectsCache = (mergedCache: MergedCache) => {
  const overrideMat = createMeshBasicMaterialBackside();

  return createMaterialReplaceCache(mergedCache, overrideMat);
};

const createGreyScaledCache = (mergedCache: MergedCache) => {
  return createGreyScalerCache(mergedCache);
};

export interface ModelProducerInput<EntityType extends EntityDTO> {
  transitionalRenderable: TransitionalRenderable<EntityType>[];
  highlights: EntityKeyMap<HighlightEntity>;
  colors: EntityKeyMap<ColorEntity>;
  greys: EntityKeyMap<GreyScaleEntity>;
}

export interface ModelProducerOutput<EntityType extends EntityDTO> {
  nonModified: TransitionalRenderable<EntityType>[];
  halos: TransitionalRenderable<EntityType>[];
  colored: TransitionalRenderable<EntityType>[];
  greyScaled: TransitionalRenderable<EntityType>[];
}

export class ModelProducer<EntityType extends EntityDTO> extends Operator<
  ModelProducerInput<EntityType>,
  ModelProducerOutput<EntityType>
> {
  private mergedCache = createMergedCache();

  private highlightsCache = createHighlightedObjectsCache(this.mergedCache);
  private coloredCache = createColoredObjectsCache(this.mergedCache);
  private greyScaledCache = createGreyScaledCache(this.mergedCache);

  process(args: ModelProducerInput<EntityType>): ModelProducerOutput<EntityType> {
    // for detailed information see the applyPseudoSceneMeshesToThreeScene method of the MergeRenderer
    const {transitionalRenderable, highlights, colors, greys} = args;

    const nonModified: TransitionalRenderable<EntityType>[] = [];
    const halos: TransitionalRenderable<EntityType>[] = [];
    const colored: TransitionalRenderable<EntityType>[] = [];
    const greyScaled: TransitionalRenderable<EntityType>[] = [];

    // scale for the "halo" object
    const scale = new Matrix4().makeScale(1.05, 1.05, 1.05);

    this.highlightsCache.markAllUnused();
    this.coloredCache.markAllUnused();
    this.greyScaledCache.markAllUnused();

    for (const elem of transitionalRenderable) {
      const identifier = identifierFromEntity(elem.entity);

      const highlight = highlights.get(identifier);
      if (highlight) {
        const color = highlight.highlightColor.getHex();

        const mesh = this.highlightsCache.getOrProduce([elem.mesh, color]);

        mesh.name = elem.mesh.name + "-halo";

        const mat = new Matrix4();
        mat.copy(elem.matrix);
        mat.multiplyMatrices(mat, scale);

        halos.push({
          ...elem,
          mesh: mesh,
          matrix: mat,
        });
      }

      const color = colors.get(identifier);
      const grey = greys.get(identifier);
      if (color) {
        const mesh = this.coloredCache.getOrProduce([elem.mesh, color.color.getHex()]);

        mesh.name = elem.mesh.name + "-colored";

        colored.push({
          ...elem,
          mesh: mesh,
        });
      } else if (grey) {
        const mesh = this.greyScaledCache.getOrProduce(elem.mesh);

        mesh.name = elem.mesh.name + "-greyscaled";

        greyScaled.push({
          ...elem,
          mesh: mesh,
        });
      } else {
        nonModified.push(elem);
      }
    }

    this.highlightsCache.removeAllUnused();
    this.coloredCache.removeAllUnused();
    this.greyScaledCache.removeAllUnused();

    return {nonModified, halos, colored, greyScaled};
  }
}
