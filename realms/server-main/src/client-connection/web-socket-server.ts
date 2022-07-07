import {IncomingMessage} from "http";

import WebSocket from "ws";

import {Server} from "../server/server";

import {
  FROM_SERVER_SERIALIZER,
  LayoutInformation,
  ServerMessages,
  SimulationInstanceInformation,
  SMServerState,
  VehicleAgentInformation,
} from "@triss/client-server-serializer";
import {ConnectionState} from "@triss/message-transport";
import {Log, Logger} from "@triss/logger";

import {IndividualWebSocketHandler} from "./individual-web-socket-handler";

export class WebSocketServer {
  @Log()
  private readonly logger!: Logger;
  private readonly webSocket: WebSocket.Server;

  private individualHandler: IndividualWebSocketHandler[] = [];

  constructor(private readonly server: Server, private readonly port = 8080) {
    this.webSocket = new WebSocket.Server({port});
    this.webSocket.on("connection", this.connectionOpened.bind(this));

    this.logger.log("Started web socket connection handler");
  }

  getAllHandler() {
    return this.individualHandler;
  }

  sendToAllClients(msg: ServerMessages) {
    const serialized = FROM_SERVER_SERIALIZER.valueToArrayBuffer(msg);

    for (const instance of this.individualHandler)
      if (instance.canSendMessages()) instance.sendMessage(serialized);
  }

  broadcastServerStateChange(state: {
    layouts: LayoutInformation[];
    vehicleAgents: VehicleAgentInformation[];
    simulationInstances: SimulationInstanceInformation[];
  }) {
    const serverState: SMServerState = {
      type: "sm-server-state",
      ...state,
    };

    this.sendToAllClients(serverState);
  }

  private connectionOpened(socket: WebSocket, request: IncomingMessage): void {
    const inst = new IndividualWebSocketHandler(this.server, socket);
    this.individualHandler.push(inst);
    this.logger.info(
      "added connection instance, current instances: " + this.individualHandler.length
    );

    const removeHandler = () => {
      this.individualHandler = this.individualHandler.filter(o => o != inst);
      this.logger.info(
        "removed connection instance since it was disconnected, remaining instances: " +
          this.individualHandler.length
      );
    };

    const listener = ({to}: {to: ConnectionState}) => {
      if (to == "closed") {
        inst.removeEventListener("state-changed", listener);
        removeHandler();
      }
    };

    inst.addEventListener("state-changed", listener);
  }
}
