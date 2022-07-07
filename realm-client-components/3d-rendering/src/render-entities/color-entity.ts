import {Color} from "three";

import {EntityIdentifier} from "@triss/dto";

export interface ColorEntity {
  entityIdentifier: EntityIdentifier;
  color: Color;
}
