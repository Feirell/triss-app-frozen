import process from "process";
import path from "path";
import {Stats} from "fs";
import fsp from "fs/promises";

import {Box3} from "three";

import {pipe} from "./bin/iterator-pipe";
import {itemsToTypeUnionLiteral, mapToTSLiteral, toJSLiteral} from "./bin/stringification";
import {Dimensions, TagEntry, TileEntry, VehicleEntry} from "./common/generated-definition";
import {
  getAllAvailableEntries,
  TAG_MODEL_FILE_NAMES,
  TILE_MODEL_FILE_NAMES,
  VEHICLE_MODEL_FILE_NAMES
} from "@triss/models";

// import

// Polyfill for the GLTF Loader
// see: https://github.com/mrdoob/three.js/blob/860af3c012915be534f8a5c37d745e2dff339e04/examples/jsm/loaders/GLTFLoader.js#L2319-L2322
(global as any).navigator = {
  userAgent: ""
};


const importWrapped = Function("moduleId", "return import(moduleId)");
const importGLTFImp = () => importWrapped("three/examples/jsm/loaders/GLTFLoader.js") as Promise<typeof import("three/examples/jsm/loaders/GLTFLoader")>;

async function processFiles<T>(
  dirPath: string,
  idConv: (fileName: string) => undefined | T,
  proc: (entry: {id: T, fileName: string, fullPath: string, stats: Stats}) => unknown
) {
  const dir = await fsp.readdir(dirPath);

  await Promise.all(dir.map(async fileName => {
    const id = idConv(fileName);

    if (id === undefined)
      return;

    const fullPath = path.join(dirPath, fileName);
    const stats = await fsp.stat(fullPath);

    if (!stats.isFile())
      return;

    await proc({id, fileName, stats, fullPath});
  }));
}

function createImportPath(file: string, referencedFile: string) {
  const relative = path.relative(path.dirname(file), path.dirname(referencedFile));
  return path.join(relative, path.basename(referencedFile, ".ts")).replace(/\\/g, "/");
}


function createDefinitionFile<K, V extends {}>(base: string, name: string, map: Map<K, V>, valueSerializer: (v: V) => string = toJSLiteral) {
  const capitalized = name.slice(0, 1).toUpperCase() + name.slice(1);

  const defFile = path.join(base, "src", "common", "generated-definition.ts");
  const entitiesRegPath = path.join(base, "src", "generated", "new-" + name + ".ts");

  const importPath = createImportPath(entitiesRegPath, defFile);

  const typeIdentifier = capitalized + "Type";
  const entityEntryType = capitalized + "Entry";
  //
  // const valueStringifier = toJSLiteral(map.values());

  const entityRegContentMap = mapToTSLiteral(map, {
    keyType: typeIdentifier,
    valueType: entityEntryType,
    valueStringifier: valueSerializer
  });

  const typeDef = itemsToTypeUnionLiteral(pipe(map).map(v => v[0]));

  return `import {${entityEntryType}} from "${importPath}";

export type ${typeIdentifier} =
${typeDef}
;

export const ${name}s = ${entityRegContentMap};

export const ${name}TypeValues: ${typeIdentifier}[] = Array.from(${name}s.keys());

export function is${capitalized}(value: unknown): value is ${typeIdentifier} {
  return ${name}s.has(value as any);
}
`;
}

async function processTiles(base: string) {
  const tilesMap = new Map<number, TileEntry>();

  const entries = await getAllAvailableEntries(TILE_MODEL_FILE_NAMES);

  await Promise.all(entries.map(async (
    {id, stats, fullPath, fileName}
  ) => {
    const {size} = stats;
    tilesMap.set(id, {size});
  }));

  const tilesRegPath = path.join(base, "src", "generated", "tiles.ts");
  const tileEntryStr = ({size}: TileEntry): string =>
    `{size: ${size.toString().padStart(5, " ")}}`;
  const tilesRegContent = createDefinitionFile(base, "tile", tilesMap, tileEntryStr);

  await fsp.writeFile(tilesRegPath, tilesRegContent, "utf-8");
}

async function processTags(base: string) {
  const tagsMap = new Map<string, TagEntry>();

  const entries = await getAllAvailableEntries(TAG_MODEL_FILE_NAMES);

  await Promise.all(entries.map(async (
    {id, stats, fullPath, fileName}
  ) => {
    const {size} = stats;
    tagsMap.set(id, {size});
  }));

  const tagsRegPath = path.join(base, "src", "generated", "tags.ts");
  const tagEntryStr = ({size}: TagEntry): string =>
    `{size: ${size.toString().padStart(5, " ")}}`;
  const tagsRegContent = createDefinitionFile(base, "tag", tagsMap, tagEntryStr);

  await fsp.writeFile(tagsRegPath, tagsRegContent, "utf-8");
}

async function processVehicles(base: string) {
  const vehiclesMap = new Map<string, VehicleEntry>();

  const {GLTFLoader} = await importGLTFImp();

  const loader = new GLTFLoader();

  const parse = (buffer: Buffer): Promise<any> =>
    new Promise((resolve, reject) => loader.parse(buffer.buffer, "", resolve, reject));

  const entries = await getAllAvailableEntries(VEHICLE_MODEL_FILE_NAMES);

  await Promise.all(entries.map(async (
    {id, stats, fullPath, fileName}
  ) => {
    const {size} = stats;

    const fileContent = await fsp.readFile(fullPath, null);
    const model = await parse(fileContent);

    const {min, max} = new Box3().setFromObject(model.scene);

    const dimensions: Dimensions = {
      min: [min.x, min.y, min.z],
      max: [max.x, max.y, max.z]
    };

    vehiclesMap.set(id, {size, dimensions});
  }));

  const vehiclesRegPath = path.join(base, "src", "generated", "vehicles.ts");

  const frmt = new Intl.NumberFormat("en-US", {minimumFractionDigits: 4, maximumFractionDigits: 4});
  const frm = (v: number) => frmt.format(v).padStart(7, " ");
  const vehicleEntryStr = ({size, dimensions: {min, max}}: VehicleEntry): string =>
    `{size: ${size}, dimensions: {max: [${max.map(frm).join(", ")}], min: [${min.map(frm).join(", ")}]}}`;

  const vehiclesRegContent = createDefinitionFile(base, "vehicle", vehiclesMap, vehicleEntryStr);

  await fsp.writeFile(vehiclesRegPath, vehiclesRegContent, "utf-8");
}

async function runAll() {
  const base = process.cwd();

  const tilesEntriesP = processTiles(base);
  const tagsEntriesP = processTags(base);
  const vehiclesEntriesP = processVehicles(base);

  await tilesEntriesP;
  await tagsEntriesP;
  await vehiclesEntriesP;
}

runAll()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });




