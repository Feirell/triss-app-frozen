import {CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer";
import {Matrix4, Object3D} from "three";

import {TransitionalDOMElement} from "../render-entities/transitional-dom-element";
import {createCSSObjectCache} from "../caches/css-object-cache";
import {EntityDTO} from "@triss/dto";

import {Operator} from "./operator";

export interface LabelCreatorInput<EntityType extends EntityDTO> {
  labelDefinitions: TransitionalDOMElement<EntityType>[];
}

export interface LabelProducerOutput<EntityType extends EntityDTO> {
  results: CSS2DObject[];
}

function setMatrixOfObject3D(obj: Object3D, matrix: Matrix4) {
  obj.matrix.copy(matrix);

  // De activating to prevent the overwrite of the matrix with this.position, this.quaternion, this.scale
  // since the setting of the matrix does not update those values. See:
  // https://github.com/mrdoob/three.js/blob/5ad3317bf251bf0520d73704f2af66fafb770a77/src/core/Object3D.js#L565-L571
  obj.matrixAutoUpdate = false;

  // Once setting the matrix world needs update, to ensure that the new Matrix will be included in the new render
  obj.matrixWorldNeedsUpdate = true;
}

export class LabelCreator<EntityType extends EntityDTO> extends Operator<
  LabelCreatorInput<EntityType>,
  CSS2DObject[]
> {
  private readonly cssObjectCache = createCSSObjectCache();

  process(args: LabelCreatorInput<EntityType>): CSS2DObject[] {
    const {labelDefinitions} = args;

    const results: CSS2DObject[] = [];

    this.cssObjectCache.markAllUnused();

    for (const elem of labelDefinitions) {
      const cssObject = this.cssObjectCache.getOrProduce(elem.element);

      cssObject.name = elem.entity.category + "-label";

      setMatrixOfObject3D(cssObject, elem.matrix);

      results.push(cssObject);
    }

    this.cssObjectCache.removeAllUnused();

    return results;
  }
}
