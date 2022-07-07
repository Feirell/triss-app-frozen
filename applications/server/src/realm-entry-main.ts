import start from "@triss/server-main";
import {configuredRealmController} from "./spawner";
import * as process from "process";

async function spawnAgentWorker() {
  if (typeof start != "function")
    throw new Error("The default export of the agent worker is not a function.");

  await start(configuredRealmController);
}

spawnAgentWorker().catch(e => {
  console.error(e);
  process.exit(1);
});
