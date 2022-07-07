import {Group} from "three";

import {MarkedCache} from "../utility/marked-cache";

export const createGroupCache = () => {
  return new MarkedCache<false, string, Group>(
    false,
    obj => new Group(),
    (key, value) => value,
    (key, value) => {
      value.clear();
      return value;
    }
  );
};
