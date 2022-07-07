import {InstancedMesh, Object3D} from "three";

import {MarkedCache} from "../utility/marked-cache";
import {groupByProperty} from "../utility/group-by-property";
import {TransitionalRenderable} from "../render-entities/transitional-renderable";
import {InstancedModel, createMerged} from "@triss/instanced-models";
import {EntityDTO} from "@triss/dto";

import {Operator} from "./operator";

const createInstancedMeshCache = () => {
  return new MarkedCache<false, Object3D, InstancedModel>(
    false,
    obj => {
      const elem = createMerged(obj);
      return new InstancedModel(elem);
    },
    (key, value) => {
      const mesh = value.getMesh();
      const parent = mesh.parent;

      if (parent) parent.remove(mesh);

      return value;
    },
    (key, value) => value
  );
};

export class MeshMerger<EntityType extends EntityDTO> extends Operator<
  TransitionalRenderable<EntityType>[],
  InstancedMesh[]
> {
  private readonly cache = createInstancedMeshCache();

  process(data: TransitionalRenderable<EntityType>[]): InstancedMesh[] {
    this.cache.markAllUnused();

    const instancedMeshes: InstancedMesh[] = [];

    for (const [mesh, trs] of groupByProperty("mesh", data)) {
      const instanced = this.cache.getOrProduce(mesh);

      instanced.setInstances(trs.length);
      const instancedMesh = instanced.getMesh();

      const entityMapping = new Map<number, EntityType>();

      instancedMesh.userData = entityMapping;
      instancedMesh.name = "merged-" + mesh.name;

      for (let i = 0; i < trs.length; i++) {
        const tr = trs[i];

        instancedMesh.setMatrixAt(i, tr.matrix);
        entityMapping.set(i, tr.entity);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;

      instancedMeshes.push(instanced.getMesh());
    }

    this.cache.removeAllUnused();

    return instancedMeshes;
  }
}
