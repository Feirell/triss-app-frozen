import "source-map-support/register";

import {isMainThread, parentPort} from "worker_threads";

import {RealmController} from "@triss/server-realm-spawn-interface";
import {SimulationInstance} from "./simulation/simulation-instance";
import {Logger} from "@triss/logger";
import {createMeasureFrameRate} from "@triss/frame-rate-diagnostics";
import {
  FROM_SERVER_MESSAGES_SERIALIZER,
  FROM_WORKER_MESSAGE_SERIALIZER,
  isServerMessage,
  ServerMessages,
  WorkerMessages
} from "@triss/server-worker-serializer";
import {createWorldFromData} from "@triss/entities";
import {AgentLoader} from "@triss/agent-loader";
import {awaitType, ChannelConnectorMessageChannel} from "@triss/message-transport";

class SimulationInstanceWorkerConnector extends ChannelConnectorMessageChannel<WorkerMessages,
  ServerMessages> {
}

const calcMeasure = createMeasureFrameRate("calc");
const sendMeasure = createMeasureFrameRate("send");

export default async function start(rc: RealmController) {
  if (isMainThread) throw new Error("This file needs to be called as a worker");

  // parent port is present when this is called as a worker
  const pp = parentPort!;

  const connector = new SimulationInstanceWorkerConnector(
    pp,
    FROM_WORKER_MESSAGE_SERIALIZER,
    FROM_SERVER_MESSAGES_SERIALIZER
  );

  const {payload: initialMessage, messageId} = await awaitType(
    connector,
    "sm-create-instance",
    false
  );


  const agentLoader = await AgentLoader.createAgentLoader(initialMessage.manifestPath);

  const agent = await initialMessage.loadedAgent;
  const world = createWorldFromData(initialMessage.world);

  const frameHandler = await agentLoader.loadAgent(agent.id, undefined);

  const simInstance = new SimulationInstance(world, frameHandler);

  connector.sendMessage({type: "wm-ready"}, messageId);

  const logger = new Logger("ENTRY");

  connector.addEventListener("received-message", ev => {
    const msg = ev.message;
    const payload = msg.payload;

    if (
      isServerMessage(payload, "sm-produce-next-frame") ||
      isServerMessage(payload, "sm-get-current-frame")
    ) {
      const opt = payload.options;

      if (payload.type == "sm-produce-next-frame") {
        calcMeasure.measureTime(() => {
          const changed = simInstance.calculateNextFrame();

          if (changed.hasTrafficChanged) opt.includeTraffic = true;

          if (changed.hasLayoutChanged) opt.includeLayout = true;
        });
      }

      const frame = simInstance.getCurrentFrame(opt);

      sendMeasure.measureTime(() =>
        connector.sendMessage(
          {
            type: "wm-frame",
            frame
          },
          msg.messageId
        )
      );

      if (frame.frameId % 120 == 0) logger.debug(calcMeasure.generateLog());
      if (frame.frameId % 120 == 0) logger.debug(sendMeasure.generateLog());
    } else {
      throw new Error("Unknown message received: " + payload);
    }
  });
}
