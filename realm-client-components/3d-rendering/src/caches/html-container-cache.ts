import {MarkedCache} from "../utility/marked-cache";
import {EntityIdentifier} from "@triss/dto";

export const createHTMLElementCache = (element = "div") => {
  return new MarkedCache<
    true,
    [EntityIdentifier["idCategory"], EntityIdentifier["idNumber"]],
    HTMLElement
  >(
    true,
    ([cat, id]) => {
      return document.createElement(element);
    },
    (key, value) => {
      value.innerHTML = "";
      return value;
    },
    (key, value) => value
  );
};
