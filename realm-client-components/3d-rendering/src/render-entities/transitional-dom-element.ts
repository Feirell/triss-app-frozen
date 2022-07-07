import {Matrix4, Quaternion, Vector3} from "three";

export interface TransitionalDOMElement<T> {
  element: HTMLElement;
  matrix: Matrix4;
  position: Vector3;
  rotation: Quaternion;
  entity: T;
}
