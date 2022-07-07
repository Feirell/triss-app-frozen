import {BufferGeometry, InstancedMesh, Material, Object3D} from "three";

import {createMerged, MergedMesh} from "./create-merged";

export class InstancedModel {
  private instances = 0;
  private instancedMesh: InstancedMesh<BufferGeometry, Material[]>;

  constructor(
    private readonly mergedMesh: MergedMesh,
    private name: string = mergedMesh.name || ""
  ) {
    const {geometry, material} = this.mergedMesh;
    this.instancedMesh = new InstancedMesh(geometry, material, 0);
    this.instancedMesh.name = this.name;
  }

  static createFromModel(model: Object3D, name = model.name || "") {
    return new InstancedModel(createMerged(model), name);
  }

  getInstances() {
    return this.instances;
  }

  setInstances(newInstances: number) {
    if (this.instances == newInstances) return false;

    const previous = this.instancedMesh;
    this.instances = newInstances;

    const attachedScene = previous.parent;

    const {geometry, material} = this.mergedMesh;
    const newIM = new InstancedMesh(geometry, material, newInstances);
    newIM.name = this.name;

    if (attachedScene) {
      attachedScene.remove(previous);
      attachedScene.add(newIM);
    }

    this.instancedMesh = newIM;
    this.instances = newInstances;

    // TODO check that this will not destroy the geometry and material
    previous.dispose();

    return true;
  }

  getMesh() {
    return this.instancedMesh;
  }

  clone() {
    return new InstancedModel(this.mergedMesh, this.name);
  }
}
