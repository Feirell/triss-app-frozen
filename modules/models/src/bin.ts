import fsp from "fs/promises";
import process from "process";

import "./three-js-polyfill";
import {Scene} from "three";
// import {GLTFExporter} from "three/examples/jsm/exporters/GLTFExporter";
import path from "path";
import {TAG_MODEL_FILE_NAMES} from "./concrete-entity-model-file-names";
import {MODELS_BASE_PATH} from "./models-base-path";
import {tags} from "./tag-scene-specifications";


const importWrapped = Function("moduleId", "return import(moduleId)");
const importGLTFExp = () => importWrapped("three/examples/jsm/exporters/GLTFExporter.js") as Promise<typeof import("three/examples/jsm/exporters/GLTFExporter")>;

function convertSceneToGLB(scenes: Scene | Scene[]) {
  return importGLTFExp().then(({GLTFExporter}) =>
    new Promise<ArrayBuffer>((res, rej) => {
      const exporter = new GLTFExporter();
      exporter.parse(scenes, ret => {
        if (ret instanceof ArrayBuffer)
          res(ret);
        else
          rej(new Error("Could not generate ArrayBuffer from scene"));

      }, rej, {binary: true});
    }));
}

async function generateTags() {
  const generators = tags;

  const generatedPaths: string[] = [];

  const tagsDir = path.join(MODELS_BASE_PATH, TAG_MODEL_FILE_NAMES.getDirectoryName());

  await Promise.all(generators.map(async gen => {
    const scene = gen();
    const glb = await convertSceneToGLB(scene);
    const filePath = path.join(tagsDir, TAG_MODEL_FILE_NAMES.idToFileName(gen.name));
    generatedPaths.push(filePath);
    await fsp.writeFile(filePath, Buffer.from(glb));
  }));

  let ignoreContent = "";
  for (const elem of generatedPaths) {
    const p = path.relative(tagsDir, elem);
    ignoreContent += p + "\n";
  }
  const ignorePath = path.join(tagsDir, ".gitignore");

  await fsp.writeFile(ignorePath, ignoreContent, "utf-8");
}

generateTags()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
