import {Worker} from "worker_threads";
import path from "path";
import child_process from "child_process";
import fsp from "fs/promises";

import {Logger} from "@triss/logger";
import {AgentConstructor} from "@triss/agent-interface";

import {isTryAgentFailedMessage, isTryAgentSucceededMessage, TryAgent} from "@triss/server-sandbox-messages";
import {
  ensureUsablePackageJson,
  getPackageJsonPathForFileOrDirectory,
  getPackageJsonPathForModule
} from "@triss/package-meta-helper";
import {promisify} from "util";
import {AgentRegistry, ManifestAgentEntry} from "./agent-registry";
import {EventEmitter} from "event-emitter-typesafe";

const cc = console;

const logger = new Logger("AGENT-LOADER", undefined, cc);

const exec = promisify(child_process.exec);

interface File {
  fileName: string;
  fileContent: string;
}

type Files = Array<File>;

export interface AgentInformation {
  name: string;
  description: string;
  packageJsonPath: string;
}

interface AgentLoaderEvents {
  "agents-changed": {agents: ManifestAgentEntry[]};
}


const common = <T>(a: T[], b: T[]) => {
  const common: T[] = [];

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] != b[i])
      break;

    common.push(a[i]);
  }

  return common;
};

export class AgentLoader extends EventEmitter<AgentLoaderEvents> {

  private constructor(
    private readonly agentRegistry: AgentRegistry,
    private readonly spawnSandbox: undefined | (() => Worker)
  ) {
    super();
    this.agentRegistry.addEventListener("written-manifest-changed", async () => {
      const {agents} = await this.agentRegistry.readManifest();
      this.emit("agents-changed", {agents});
    });
    logger.debug("Created AgentLoader in workspace");
  }

  static async createAgentLoader(manifestPath = "./agent-manifest.json", spawnSandbox: undefined | (() => Worker) = undefined) {
    const agentRegistry = await AgentRegistry.createRegistry(manifestPath);
    return new AgentLoader(agentRegistry, spawnSandbox);
  }

  getManifestPath() {
    return this.agentRegistry.getManifestPath();
  }


  /**
   * Warning
   *
   * This function should not be called within the main thread but the designated worker for this agent.
   *
   * @param id
   * @param context
   */
  public async loadAgent(
    id: number,
    context = /*TODO createDynamicAgentContext(agentDef.name)*/ undefined as any
  ): Promise<AgentConstructor> {
    const IMPORT_NAME = "createAgent";

    const agentEntry = await this.agentRegistry.getAgentById(id);

    // used dynamic js code to prevent transpilation
    const entryImport = await Function("name", "return import(name)")(agentEntry.name);

    if (!(IMPORT_NAME in entryImport))
      throw new Error("There is no \"" + IMPORT_NAME + "\" export on the entry file");

    const importedAgent = entryImport[IMPORT_NAME];
    if (typeof importedAgent != "function")
      throw new Error(
        "The exported member \"" + IMPORT_NAME + "\" on the entry file is not a function"
      );

    const agent = importedAgent(context);

    if (typeof agent != "function")
      throw new Error(
        "The return value of the function exported by the name " +
        IMPORT_NAME +
        " was not of type function (an Agent)"
      );

    return agent;
  }

  private async testAgentAPI(id: number) {
    const sandboxSpawner = this.spawnSandbox;
    if (!sandboxSpawner)
      throw new Error("Not sandboxspawner given, can not test api");

    const sandbox = sandboxSpawner();
    const tryMessage: TryAgent = {
      type: "try-agent",
      id
    };

    sandbox.postMessage(tryMessage);

    const msg = await new Promise<any>(res => sandbox.on("message", res));

    if (isTryAgentSucceededMessage(msg)) {
      return id;
    } else if (isTryAgentFailedMessage(msg)) {
      await this.deleteAgentFiles(id);
      throw new Error(msg.msg);
    } else {
      await this.deleteAgentFiles(id);
      throw new Error("Received a malformed message");
    }
  }

  private async installAndLink(name: string) {
    const rootWD = await this.getWorkspaceDirectory();

    // First make yarn recognise the new package (the agent, which was placed in the dynamic-agents directory)
    // and install all missing dependencies
    await exec("yarn install", {cwd: rootWD});

    // Second link this dependency to the agent-loader so it can import it
    // Since we use Yarn PnP, this step really does about nothing but change the .pnp.cjs file
    await exec("yarn workspace @triss/agent-loader add " + name, {cwd: rootWD});
  }

  private cleanAndGetPackageJson(files: Files) {
    const {entry, parsed} = this.getPackageJson(files);

    const {dependencies = {}} = parsed;

    const filteredDep: {[key: string]: string} = {};

    for (let [dep, ver] of Object.entries(dependencies)) {
      if (dep.startsWith("@triss/"))
        ver = "workspace:^";

      filteredDep[dep] = ver;
    }

    if (Object.keys(filteredDep).length > 0)
      parsed.dependencies = filteredDep;
    else
      delete parsed.dependencies;

    entry.fileContent = JSON.stringify(parsed, undefined, 2) + "\n";

    return {files, parsed};
  }

  /**
   * This method is used to write the agent files, create a sandbox, test the exports and then generate a metadata object
   * if everything was successful.
   *
   * @param associatedFiles
   */
  public async importAgent(associatedFiles: Files) {
    const {name} = await this.writeAgentFiles(associatedFiles);
    return await this.linkAlreadyWrittenAgent(name);
  }

  public async linkAlreadyWrittenAgent(name: string) {
    await this.installAndLink(name);
    const info = await this.getPackageInformationByName(name);
    const reg = await this.agentRegistry.addAgent(info.name, info.description);
    await this.testAgentAPI(reg.id);

    return reg;
  }

  public async getPackageInformationByName(packageName: string): Promise<AgentInformation> {
    const packageJsonPath = await getPackageJsonPathForModule(packageName, require);

    const fc = await fsp.readFile(packageJsonPath, "utf-8");
    const parsed = JSON.parse(fc);
    if (!ensureUsablePackageJson(parsed))
      throw new Error("Package json for name " + packageName + " does not have the right format");

    const {name = "", description = ""} = parsed;
    return {name, description, packageJsonPath};
  }


  private async deleteAgentFiles(id: number): Promise<void> {
    const {name} = await this.agentRegistry.getAgentById(id);
    const pkg = await this.getPackageInformationByName(name);
    const packageDirPath = path.dirname(pkg.packageJsonPath);

    logger.debug("removing agent \"" + name + "\" contained in directory " + packageDirPath);

    await fsp.rm(packageDirPath, {recursive: true});
  }

  private async getWorkspaceDirectory() {
    const ownPkg = await getPackageJsonPathForModule("@triss/agent-loader", require);
    const workspace = await getPackageJsonPathForFileOrDirectory(path.dirname(path.dirname(ownPkg)));

    return path.dirname(workspace);
  }

  private getPackageJson(files: Files) {

    console.log("files", files);
    for (const entry of files) {
      const onlyFile = path.basename(entry.fileName);
      if (onlyFile == "package.json") {
        if (onlyFile !== entry.fileName)
          throw new Error("fileName contains package.json but is not in root");

        const parsed = JSON.parse(entry.fileContent);
        if (ensureUsablePackageJson(parsed))
          return {entry, parsed};
      }
    }

    throw new Error("Files does not contain a package.json");
  }

  private reduceFilePathsToFirstCommon(files: Files) {
    const normalized = [];

    for (let {fileName, ...rest} of files) {
      if (fileName.includes("\\"))
        throw new Error("Path '" + fileName + "' contained a \\ which is not allowed");

      fileName = path.resolve(fileName);
      normalized.push({fileName, ...rest});
    }

    const dir = (n: string) => n
      .split("/")
      .slice(0, -1);

    if (normalized.length == 0)
      return [];

    let maxPath = dir(normalized[0].fileName);

    for (const {fileName} of normalized) {
      const d = dir(fileName);
      maxPath = common(maxPath, d);
    }

    const shortened = [];
    const fullCommonPath = maxPath.map(s => s + "/").join("");
    const sliceLength = fullCommonPath.length;

    for (let {fileName, ...rest} of normalized) {
      fileName = fileName.slice(sliceLength);

      shortened.push({fileName, ...rest});
    }

    return shortened;
  }

  private async writeAgentFiles(
    associatedFiles: Files
  ) {
    associatedFiles = this.reduceFilePathsToFirstCommon(associatedFiles);

    const {files, parsed: {name, description}} = this.cleanAndGetPackageJson(associatedFiles);

    const dirName = /^(?:@.+?\/)?(.+)$/.exec(name)?.[1];

    if (!dirName)
      throw new Error("Could not parse the package name " + name);

    const dirPath = path.resolve(await this.getWorkspaceDirectory(), "dynamic-agents", dirName);

    const stat = await (async () => {
      try {
        return await fsp.stat(dirPath);
      } catch (e) {
        if ((e as any).code != "ENOENT")
          throw e;
      }

      return undefined;
    })();

    if (stat)
      throw new Error("The directory name '" + dirPath + "' is already in use");

    try {
      await fsp.mkdir(dirPath, {recursive: true});

      logger.debug("Created agent directory: %s", dirName);

      await Promise.all(files.map(async (entry) => {
        const {fileName, fileContent} = entry;
        const fullPath = path.resolve(dirPath, fileName);
        const fileDirectory = path.dirname(fullPath);

        await fsp.mkdir(fileDirectory, {recursive: true});
        await fsp.writeFile(fullPath, fileContent, "utf-8");

        logger.debug("Wrote file: " + fileName);
      }));

      logger.debug("Wrote all files for the agent ");

      return {name, description, dirPath};
    } catch (e) {
      try {
        await fsp.rm(dirPath, {recursive: true});
      } catch (e) {
      }

      throw e;
    }
  }

  getAgentInformationById(id: number) {
    return this.agentRegistry.getAgentById(id);
  }

  async getAllAvailableAgents() {
    return (await this.agentRegistry.readManifest()).agents;
  }
}
