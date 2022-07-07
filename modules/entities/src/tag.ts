import {Vector2, Vector3} from "three";

import {TagType} from "@triss/entity-definition";
import {Orientation, TagDTO} from "@triss/dto";
import {gridToPosition} from "@triss/three-helper";

export class Tag {
  public readonly id: number;

  public type: TagType;
  public gridPosition: Vector2;
  public orientation: Orientation;

  constructor(id: number, type: TagType, gridPosition: Vector2, orientation: Orientation) {
    this.id = id;
    this.type = type;
    this.gridPosition = gridPosition;
    this.orientation = orientation;
  }

  get position() {
    const gp = this.gridPosition;
    const p = gridToPosition(gp.x, gp.y);
    return new Vector3(p[0], 0, p[1]);
  }

  getSerializeData(): TagDTO {
    const p = this.gridPosition;

    return {
      category: "TagDTO",
      id: this.id,
      type: this.type,
      gridPosition: [p.x, p.y],
      orientation: this.orientation,
    };
  }

  clone() {
    return new Tag(this.id, this.type, this.gridPosition.clone(), this.orientation);
  }
}

export function createTagFromData(data: TagDTO) {
  return new Tag(data.id, data.type, new Vector2(...data.gridPosition), data.orientation);
}
