import {Color} from "three";

import {EntityIdentifier} from "@triss/dto";

export interface HighlightEntity {
  entityIdentifier: EntityIdentifier;
  highlightColor: Color;
}
