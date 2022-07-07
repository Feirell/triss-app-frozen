import {Vector3, Object3D, Matrix4} from "three";

export interface Piece {
  getStart(): Vector3;

  getEnd(): Vector3;

  getPositionOnPathPercentage(perc: number): Vector3;

  getPositionOnPathDistance(dist: number): Vector3;

  getLength(): number;

  createTransformed(transform: Object3D | Matrix4): Piece;
}
