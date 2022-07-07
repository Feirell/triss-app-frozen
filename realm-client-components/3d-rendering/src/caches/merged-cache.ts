import {BufferGeometry, Material, Mesh, Object3D} from "three";

import {MarkedCache} from "../utility/marked-cache";
import {createMerged} from "@triss/instanced-models";

export const createMergedCache = () => {
  return new MarkedCache<false, Object3D, Mesh<BufferGeometry, Material[]>>(
    false,
    obj => createMerged(obj),
    (key, value) => value,
    (key, value) => value
  );
};
