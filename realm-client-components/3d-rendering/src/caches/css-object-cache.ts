import {CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer";

import {MarkedCache} from "../utility/marked-cache";

export const createCSSObjectCache = () => {
  return new MarkedCache<false, HTMLElement, CSS2DObject>(
    false,
    elem => {
      return new CSS2DObject(elem);
    },
    (key, value) => value,
    (key, value) => value
  );
};
