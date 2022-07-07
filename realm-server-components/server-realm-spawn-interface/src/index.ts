import {Worker} from "worker_threads";

// As dynamic code function, to prevent transpilation of the import statement
const fixedImport = Function("id", "return import(id)");

export class RealmController<D extends { [key in string]: {path: string | URL} } = {[key: string]: {path: string | URL}}, T extends keyof D = string> {
  constructor(private readonly definition: D) {
  }

  isKeyOfRealmEntries(val: unknown): val is T {
    return typeof val == "string" && val in this.definition;
  }

  getRealmDef(id: T) {
    if (!this.isKeyOfRealmEntries(id))
      throw new Error("The requested realm with the id " + id + " was not found in the realm listing " + Object.keys(this.definition).join(", "));

    return this.definition[id];
  }

  spawnWorker(id: T) {
    const {path} = this.getRealmDef(id);
    return new Worker(path);
  }

  loadDirectly(id: T) {
    const {path} = this.getRealmDef(id);
    return fixedImport(path) as Promise<RealmStartFunction>;
  }
}

export interface RealmStartFunction {
  (spawn?: RealmController): void | Promise<void>;
}
