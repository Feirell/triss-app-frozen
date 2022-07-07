import {EntityKeyMap} from "../utility/entity-key-map";

import {LabelData} from "./label-data";
import {HighlightEntity} from "./highlight-entity";
import {GreyScaleEntity} from "./grey-scale-entity";
import {ColorEntity} from "./color-entity";

export interface EntityModifications {
  labels: EntityKeyMap<LabelData>;
  highlighted: EntityKeyMap<HighlightEntity>;
  colored: EntityKeyMap<ColorEntity>;
  greyScaled: EntityKeyMap<GreyScaleEntity>;
}
