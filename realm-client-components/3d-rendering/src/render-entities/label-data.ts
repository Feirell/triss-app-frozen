import {EntityDTO, EntityIdentifier, ExportedAgentEntityData, ExportedAgentEntityNotFound} from "@triss/dto";

export interface LabelProducerFunction {
  (
    container: HTMLElement,
    entity: EntityDTO,
    data: ExportedAgentEntityData | ExportedAgentEntityNotFound
  ): void;
}

export interface LabelData {
  entityIdentifier: EntityIdentifier;
  attachLabel: LabelProducerFunction;
}
