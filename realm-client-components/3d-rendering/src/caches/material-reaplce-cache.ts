import {BufferGeometry, Mesh, MeshBasicMaterial, Object3D} from "three";

import {MarkedCache} from "../utility/marked-cache";
import {chainUsages} from "../utility/chain-usages";

import {createMeshBasicMaterialCache} from "./mesh-basic-material-cache";
import {createMergedCache} from "./merged-cache";

export const createMaterialReplaceCache = (
  mergedCache = createMergedCache(),
  overrideMatCache = createMeshBasicMaterialCache()
) => {
  const mc = new MarkedCache<true, [Object3D, number], Mesh<BufferGeometry, MeshBasicMaterial[]>>(
    true,
    ([obj, color]) => {
      const elem = mergedCache.getOrProduce(obj);
      const overrideMat = overrideMatCache.getOrProduce(color);

      elem.material = elem.material.map(() => overrideMat);
      return elem as Mesh<BufferGeometry, MeshBasicMaterial[]>;
    },
    (key, value) => value,
    (key, value) => value
  );

  return chainUsages(mc, overrideMatCache, mergedCache);
};
