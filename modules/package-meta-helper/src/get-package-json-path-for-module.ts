import {getPackageJsonPathForFileOrDirectory} from "./get-package-json-path-for-file-or-directory";

export async function getPackageJsonPathForModule(moduleId: string, require: {resolve(moduleId: string): string}) {
  try {
    const resolving = require.resolve(moduleId);
    return await getPackageJsonPathForFileOrDirectory(resolving);
  } catch (e) {
    if (e instanceof Error) {
      const stack = e.stack;
      if (typeof stack == "string") {
        const sourcePathMatcher = /\nSource path: (.+?)\n/;
        const match = sourcePathMatcher.exec(stack);
        if (match !== null) {
          const source: string = match[1];
          return await getPackageJsonPathForFileOrDirectory(source);
        }
      }
    }

    throw e;
  }
}
