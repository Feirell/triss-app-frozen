import path from "path";
import fsp from "fs/promises";

export async function getPackageJsonPathForFileOrDirectory(start: string) {
  start = path.resolve(start);

  if (!(await fsp.stat(start)).isDirectory())
    start = path.dirname(start);

  const pkg = "package.json";

  let dir = start;
  while (true) {
    const potential = path.resolve(dir, pkg);

    try {
      const stat = await fsp.stat(potential);
      if (stat.isFile())
        return potential;
    } catch (e) {
      if (typeof e != "object" || (e as any).code != "ENOENT")
        throw e;

      const newDir = path.resolve(dir, "..");
      if (newDir == dir)
        throw new Error("Could not find the package.json for the directory " + start);

      dir = newDir;
    }
  }
}
