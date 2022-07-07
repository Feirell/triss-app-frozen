import {TagType} from "@triss/entity-definition";

import {Orientation, Vector2ui} from "../common";

export interface TagDTO {
  category: "TagDTO";

  id: number;
  type: TagType;

  gridPosition: Vector2ui;
  orientation: Orientation;
}
