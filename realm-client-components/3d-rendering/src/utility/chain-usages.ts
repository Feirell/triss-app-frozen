import {MarkedCache} from "./marked-cache";

export const chainUsages = <T extends MarkedCache<any, any, any>>(
  superMc: T,
  ...subMcs: MarkedCache<any, any, any>[]
): T => {
  const mau = superMc.markAllUnused;
  const rau = superMc.removeAllUnused;

  return {
    markAllUnused() {
      for (const sub of subMcs) sub.markAllUnused();
      mau.call(superMc);
    },
    getOrProduce(key: any): any {
      return superMc.getOrProduce.call(superMc, key);
    },
    removeAllUnused(): [any, any][] {
      for (const sub of subMcs) sub.removeAllUnused();
      return rau.call(superMc);
    },
  } as T;
};
