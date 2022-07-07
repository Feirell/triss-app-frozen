import {Matrix4, Quaternion, Vector3} from "three";

import {EntityKeyMap} from "../utility/entity-key-map";
import {TransitionalRenderable} from "../render-entities/transitional-renderable";
import {TransitionalDOMElement} from "../render-entities/transitional-dom-element";
import {LabelData} from "../render-entities/label-data";
import {createHTMLElementCache} from "../caches/html-container-cache";
import {EntityDTO, ExportedAgentDataDTO, identifierFromEntity, isEntity} from "@triss/dto";

import {Operator} from "./operator";

export interface LabelProducerInput<EntityType extends EntityDTO> {
  labelData: EntityKeyMap<LabelData>;
  exportedAgentData: ExportedAgentDataDTO;
  transitionalRenderable: TransitionalRenderable<EntityType>[];
}

export interface LabelProducerOutput<EntityType extends EntityDTO> {
  results: TransitionalDOMElement<EntityType>[];
}

export class LabelProducer<EntityType extends EntityDTO> extends Operator<LabelProducerInput<EntityType>,
  LabelProducerOutput<EntityType>> {
  private readonly htmlElementCache = createHTMLElementCache();

  process(args: LabelProducerInput<EntityType>): LabelProducerOutput<EntityType> {
    const verticalLabelOffset = new Vector3(3, 0, 0);
    const labelRotation = new Quaternion();

    const {transitionalRenderable, labelData, exportedAgentData} = args;

    const results: TransitionalDOMElement<EntityType>[] = [];

    this.htmlElementCache.markAllUnused();

    for (const elem of transitionalRenderable) {
      const identifier = identifierFromEntity(elem.entity);

      const label = labelData.get(identifier);
      if (!label) continue;

      const agent = exportedAgentData.find(v => isEntity(elem.entity, v.forEntity));
      if (!agent) continue;

      const htmlElement = this.htmlElementCache.getOrProduce([
        elem.entity.category,
        elem.entity.id
      ]);

      label.attachLabel(htmlElement, elem.entity, agent);

      const pos = verticalLabelOffset.clone().add(elem.position);

      const mat = new Matrix4().multiply(new Matrix4().makeTranslation(pos.x, pos.y, pos.z));

      results.push({
        entity: elem.entity,
        matrix: mat,
        element: htmlElement,
        position: pos,
        rotation: labelRotation
      });
    }

    this.htmlElementCache.removeAllUnused();

    return {results};
  }
}
