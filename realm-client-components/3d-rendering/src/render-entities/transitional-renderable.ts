import {Matrix4, Object3D, Quaternion, Vector3} from "three";

export interface TransitionalRenderable<T> {
  mesh: Object3D;
  matrix: Matrix4;
  position: Vector3;
  rotation: Quaternion;
  entity: T;
}
