import {BackSide, MeshBasicMaterial} from "three";

import {MarkedCache} from "../utility/marked-cache";

export const createMeshBasicMaterialBackside = () => {
  return new MarkedCache<false, number, MeshBasicMaterial>(
    false,
    color => new MeshBasicMaterial({color, side: BackSide}),
    (key, value) => value,
    (key, value) => value
  );
};
