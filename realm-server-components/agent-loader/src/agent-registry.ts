import fs from "fs";
import fsp from "fs/promises";
import {hasFieldWithBaseType} from "./type-guard-helper";
import {EventEmitter} from "event-emitter-typesafe";
import path from "path";

const SUPPORTED_MANIFEST_VERSION = 1;

export interface ManifestAgentEntry {
  id: number;
  name: string;
  description: string;
}

function ensureManifestAgentEntry(v: unknown): v is ManifestAgentEntry {
  if (typeof v != "object" || v === null)
    throw new Error("Entry is not an object");

  if (!hasFieldWithBaseType(v, "id", "number"))
    throw new Error("field description with type string is missing.");

  if (!hasFieldWithBaseType(v, "description", "string"))
    throw new Error("field description with type string is missing.");

  if (!hasFieldWithBaseType(v, "name", "string"))
    throw new Error("field name with type string is missing.");

  return true;
}

export interface Manifest {
  MANIFEST_VERSION: typeof SUPPORTED_MANIFEST_VERSION;
  nextId: number;
  agents: ManifestAgentEntry[];
}

function ensureManifest(v: unknown): v is Manifest {
  if (typeof v != "object" || v === null)
    throw new Error("Entry is not an object");

  if (!hasFieldWithBaseType(v, "MANIFEST_VERSION", "number"))
    throw new Error("field MANIFEST_VERSION with type number is missing.");

  if (v.MANIFEST_VERSION !== SUPPORTED_MANIFEST_VERSION)
    throw new Error("The given MANIFEST_VERSION is not the supported version '" + SUPPORTED_MANIFEST_VERSION + "'");

  if (!hasFieldWithBaseType(v, "nextId", "number"))
    throw new Error("field nextId with type number is missing.");

  if (!Number.isInteger(v.nextId))
    throw new Error("field nextId is not an integer");

  if (v.nextId < 0)
    throw new Error("field nextId is not greater or equal to zero");

  if (!hasFieldWithBaseType(v, "agents", "object"))
    throw new Error("field agents with type object is missing.");

  const agents = v.agents;

  if (!Array.isArray(agents))
    throw new Error("The value in the agents with is not an array");

  if (!agents.every(ensureManifestAgentEntry))
    // will never reach this, since it throws if it deos not return true
    throw new Error("The entries in the agents array are not all ManifestAgentEntry");

  return true;
}

const emptyManifest: Manifest = {
  MANIFEST_VERSION: SUPPORTED_MANIFEST_VERSION,
  nextId: 0,
  agents: []
};

interface AgentRegistryEvents {
  "written-manifest-changed": {};
}

const isENOTENTError = (e: unknown): e is {code: "ENOENT"} =>
  typeof e == "object" && e !== null && "code" in e && (e as any).code == "ENOENT";

export class AgentRegistry extends EventEmitter<AgentRegistryEvents> {

  private constructor(private readonly agentRegistryFilePath: string) {
    super();
  }

  static async createRegistry(manifestPath: string, createIfNotPresent = true) {
    manifestPath = path.resolve(manifestPath);

    const reg = new AgentRegistry(manifestPath);

    try {
      await reg.readManifest();
    } catch (e) {
      if (createIfNotPresent && isENOTENTError(e))
        await reg.writeManifest(emptyManifest);
      else
        throw e;
    }

    fs.watch(manifestPath, {persistent: false}, async type => {
      if (type != "change")
        return;

      // TODO this is a mitigation of the bug that sometimes the file content is empty
      //  maybe it was changed to empty, for this case the next change should be awaited
      //  and if it does not happen in the next x ms then an error should be raised
      const stat = await fsp.stat(manifestPath);
      if (stat.size > 0)
        reg.emit("written-manifest-changed", {});
    });

    reg.addEventListener("written-manifest-changed", async () => {
      await reg.readManifest();
    });

    return reg;
  }

  getManifestPath() {
    return this.agentRegistryFilePath;
  }

  async readManifest(): Promise<Manifest> {
    const fc = await fsp.readFile(this.agentRegistryFilePath, "utf-8");

    const jsonParsed = JSON.parse(fc);

    if (ensureManifest(jsonParsed))
      return jsonParsed;
    else
      // This error will never be thrown, since the check throws already if it does not return true
      throw new Error("Loaded manifest is not valid.");
  }

  async writeManifest(manifest: Manifest) {
    if (ensureManifest(manifest)) {
      const stringified = JSON.stringify(manifest, undefined, 2);
      await fsp.writeFile(this.agentRegistryFilePath, stringified, "utf-8");
    }
  }

  async addAgent(name: string, description: string) {
    const manifest = await this.readManifest();
    const agentEntry: ManifestAgentEntry = {id: manifest.nextId, name, description};

    await this.writeManifest({
      ...manifest,
      nextId: manifest.nextId + 1,
      agents: [
        ...manifest.agents,
        agentEntry
      ]
    });

    return agentEntry;
  }

  async getAgentById(id: number) {
    const manifest = await this.readManifest();
    for (const entry of manifest.agents)
      if (entry.id == id)
        return entry;

    throw new Error("Could not find an agent with the id " + id + " in the manifest file.");
  }
}
