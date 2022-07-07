import path from "node:path";

function modelsBasePath() {
  // We use this module (@triss/models) entry file as anchor
  const entryFile = require.resolve("@triss/models");
  const libDir = path.dirname(entryFile);
  const packageDir = path.dirname(libDir);
  return path.resolve(packageDir, "models");
}

export const MODELS_BASE_PATH = modelsBasePath();
