import {Vector3, Object3D, Matrix4} from "three";

import {Piece} from "./piece";

export class StraightPiece implements Piece {
  /**
   * @internal
   */
  public TYPE_PINPOINT: "STRAIGHT_PIECE" = "STRAIGHT_PIECE";

  private readonly length: number;

  constructor(private readonly start: Vector3, private readonly end: Vector3) {
    this.length = this.start.distanceTo(this.end);
  }

  getStart(): Vector3 {
    return this.start;
  }

  getEnd(): Vector3 {
    return this.end;
  }

  getPositionOnPathPercentage(n: number): Vector3 {
    return this.start.clone().add(this.end.clone().sub(this.start).multiplyScalar(n));
  }

  getPositionOnPathDistance(dist: number): Vector3 {
    return this.getPositionOnPathPercentage(dist / this.getLength());
  }

  getLength(): number {
    return this.length;
  }

  createTransformed(transform: Object3D | Matrix4): StraightPiece {
    if ("matrixWorld" in transform) transform = transform.matrixWorld;

    return new StraightPiece(
      this.getStart().clone().applyMatrix4(transform),
      this.getEnd().clone().applyMatrix4(transform)
    );
  }
}
