import "source-map-support/register";

import {isMainThread, MessagePort, parentPort} from "worker_threads";
import {RealmController} from "@triss/server-realm-spawn-interface";
import {Logger} from "@triss/logger";

import {isTryAgentMessage} from "@triss/server-sandbox-messages";
import {AgentLoader} from "@triss/agent-loader";


function waitForMessage(port: MessagePort) {
  return new Promise<any>(res => {
    port.on("message", res);
  });
}

export default async function start(rc: RealmController) {
  const logger = new Logger("AGENT-SANDBOX");

  logger.debug("Agent Sandbox started");

  if (isMainThread)
    throw new Error("This file should not be loaded in the main thread.");

  const pp = parentPort;

  if (!pp)
    throw new Error("There is no parent port.");

  try {
    const loadMsg = await waitForMessage(pp);

    if (!isTryAgentMessage(loadMsg))
      throw new Error("Message is malformed");

    const {id} = loadMsg;

    const al = await AgentLoader.createAgentLoader();
    logger.debug("Created AgentLoader");

    const info = await al.getAgentInformationById(id);

    const AgentConstructor = await al.loadAgent(id);
    logger.debug("Loaded agent entry file for agent " + info.name);

    new AgentConstructor();
    logger.debug("Constructed agent " + info.name);

    pp.postMessage({
      type: "try-agent-succeeded"
    });
  } catch (e) {
    pp.postMessage({
      type: "try-agent-failed",
      msg: (e as Error).message
    });
  }
}
