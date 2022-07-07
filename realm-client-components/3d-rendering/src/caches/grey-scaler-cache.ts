import {
  BufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
} from "three";

import {MarkedCache} from "../utility/marked-cache";
import {chainUsages} from "../utility/chain-usages";

import {createMergedCache} from "./merged-cache";

/*

    const avg = (msm.color.r + msm.color.g + msm.color.b) / 3;
    return new MeshStandardMaterial({color: new Color(avg, avg, avg)});

*/

export const createGreyScaledMaterialCache = () => {
  return new MarkedCache<false, number, MeshStandardMaterial>(
    false,
    avg => new MeshStandardMaterial({color: new Color(avg, avg, avg)}),
    (key, value) => value,
    (key, value) => value
  );
};

const colorAvg = (color: number | Color) => {
  const {r, g, b} = typeof color == "number" ? new Color(color) : color;
  return (r + g + b) / 3;
};

const isMeshStandardMaterial = (obj: any): obj is MeshStandardMaterial =>
  typeof obj == "object" && obj.isMeshStandardMaterial;

export const createGreyScalerCache = (mergedCache = createMergedCache()) => {
  const greyScaledMaterialCache = createGreyScaledMaterialCache();

  const mc = new MarkedCache<false, Object3D, Mesh<BufferGeometry, MeshBasicMaterial[]>>(
    false,
    obj => {
      const elem = mergedCache.getOrProduce(obj);

      elem.material = elem.material.map(original => {
        if (isMeshStandardMaterial(original)) {
          const avg = colorAvg(original.color);
          return greyScaledMaterialCache.getOrProduce(avg);
        } else return original;
      });

      return elem as Mesh<BufferGeometry, MeshBasicMaterial[]>;
    },
    (key, value) => value,
    (key, value) => value
  );

  return chainUsages(mc, greyScaledMaterialCache, mergedCache);
};
