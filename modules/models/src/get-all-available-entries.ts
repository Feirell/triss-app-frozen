import {readdir, stat} from "node:fs/promises";
import {Stats} from "node:fs";
import {join, resolve} from "node:path";
import {BaseEntityModelsDirectory} from "./entity-model-file-names";
import {MODELS_BASE_PATH} from "./models-base-path";

export async function getAllAvailableEntries<K extends BaseEntityModelsDirectory<any>>(helper: K, base = MODELS_BASE_PATH) {
  const dirPath = resolve(base, helper.getDirectoryName());
  const dir = await readdir(dirPath);

  type O = K extends BaseEntityModelsDirectory<infer T> ? T : never;

  const collected: {
    id: O;
    stats: Stats;
    fileName: string;
    fullPath: string;
  }[] = [];

  const fn = (fn: string) => {
    try {
      return helper.fileNameToId(fn);
    } catch (e) {
    }

    return undefined;
  };

  await Promise.all(dir.map(async fileName => {
    const id = fn(fileName);

    if (id === undefined)
      return;

    const fullPath = join(dirPath, fileName);
    const stats = await stat(fullPath);

    if (!stats.isFile())
      return;

    collected.push({id, stats, fileName, fullPath});
  }));

  return collected;
}
