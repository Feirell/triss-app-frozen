import path from "path";
import {pathToFileURL} from "url";
import {RealmController} from "@triss/server-realm-spawn-interface";

const relFile = (rel: string) => pathToFileURL(path.resolve(__dirname, rel));

export const configuredRealmController = new RealmController({
  SERVER_MAIN: {
    path: relFile("realm-entry-main.js")
  },
  AGENT_WORKER: {
    path: relFile("realm-entry-worker.js")
  },
  AGENT_SANDBOX: {
    path: relFile("realm-entry-sandbox.js")
  }
});
