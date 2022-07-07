import {MeshBasicMaterial} from "three";

import {MarkedCache} from "../utility/marked-cache";

export const createMeshBasicMaterialCache = () => {
  return new MarkedCache<false, number, MeshBasicMaterial>(
    false,
    color => new MeshBasicMaterial({color}),
    (key, value) => value,
    (key, value) => value
  );
};
