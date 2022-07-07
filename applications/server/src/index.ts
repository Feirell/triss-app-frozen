import {configuredRealmController} from "./spawner";

import console from "console";
import process from "process";

async function start() {
  await configuredRealmController.loadDirectly("SERVER_MAIN");
}

start().catch(e => {
  console.error(e);
  process.exit(1);
});

