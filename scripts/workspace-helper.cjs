const {cwd, env, argv} = require("node:process");
// const {readFileSync, writeFileSync} = require("node:fs");
const {stat, writeFile, readFile, mkdir} = require("node:fs/promises");
const {resolve, dirname} = require("node:path");
const {exec} = require("node:child_process");

const {promisify} = require("node:util");
const yargs = require("yargs");
const {hideBin} = require("yargs/helpers");

const chalk = require("chalk");


const execP = promisify(exec);

function* dirAndParentDirs(dir) {
  let currentDir = resolve(dir);
  while (true) {
    yield currentDir;

    const nextDir = dirname(currentDir);
    if (nextDir == currentDir)
      break;
    currentDir = nextDir;
  }
}

function isENOENTError(e) {
  return typeof e == "object" && e !== null && "code" in e && e.code == "ENOENT";
}

async function statOrUndefined(p) {
  try {
    return await stat(p);
  } catch (e) {
    if (isENOENTError(e))
      return undefined;
    else
      throw e;
  }
}

async function getParentPlugAndPlayStats(dir = process.cwd()) {
  // do them all in parallel
  const requests = [...dirAndParentDirs(dir)]
    .map(d => statOrUndefined(resolve(d, ".pnp.cjs")));

  for (const e of requests) {
    const stat = await e;
    if (e === undefined)
      continue;

    return stat;
  }

  throw new Error("Could not find any .pnp.cjs files in the parent directories.");
}

async function readWorkspaces() {
  return (await execP("yarn workspaces list --json", {encoding: "utf-8"}))
    .stdout
    .split("\n")
    .filter(e => typeof e == "string")
    .map(e => e.trim())
    .filter(e => e.length > 0)
    .map(s => JSON.parse(s));
}

const cachePath = resolve("./.cache/workspace-cache.json");

async function writeWorkspacesToCache(workspaces) {
  await mkdir(dirname(cachePath), {recursive: true});
  await writeFile(cachePath, JSON.stringify(workspaces, undefined, 2), "utf-8");
}

async function readWorkspacesFromCache() {
  return JSON.parse(await readFile(cachePath, "utf-8"));
}

exports.getWorkspaces = async function getWorkspaces() {
  const cacheStats = await statOrUndefined(cachePath);
  if (cacheStats === undefined) {
    const workspaces = await readWorkspaces();
    await writeWorkspacesToCache(workspaces);
    return workspaces;
  }

  const parentPNPStats = await getParentPlugAndPlayStats();
  if (parentPNPStats.mtime > cacheStats.mtime) {
    const workspaces = await readWorkspaces();
    await writeWorkspacesToCache(workspaces);
    return workspaces;
  }

  return readWorkspacesFromCache();
}
