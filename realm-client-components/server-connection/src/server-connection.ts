import {LayoutStateDTO} from "@triss/dto";
import {FrameOptions} from "@triss/entity-serializer";
import {
  ClientMessages,
  FROM_CLIENT_SERIALIZER,
  FROM_SERVER_SERIALIZER,
  ServerMessages,
  SimulationOperatingState,
  SMCreatedLayout,
  SMCreatedSimulationInstance,
  SMCreatedVehicleAgent,
  SMFrame,
  SMRegisteredLayout,
  SMServerState,
  SMUnableToCreateVehicleAgent,
} from "@triss/client-server-serializer";
import {ChannelConnectorWebsocket} from "@triss/message-transport";
import {createMeasureFrameRate} from "@triss/frame-rate-diagnostics";
import {Logger} from "@triss/logger";
import {Log} from "@triss/logger";

const isSmFrame = (val: unknown): val is SMFrame =>
  typeof val == "object" && (val as any).type == "sm-frame";

export class ServerConnection extends ChannelConnectorWebsocket<ClientMessages, ServerMessages> {
  @Log()
  private logger!: Logger;

  constructor() {
    super(undefined, FROM_CLIENT_SERIALIZER, FROM_SERVER_SERIALIZER);

    const frameDesMeasure = createMeasureFrameRate("frame-des");

    this.addEventListener("received-message", ev => {
      const wrapped = ev.message;
      const payload = wrapped.payload;

      if (isSmFrame(payload)) {
        frameDesMeasure.addMeasure(ev.start, ev.end);

        if (payload.frame.frameId % 120 == 0) this.logger.debug(frameDesMeasure.generateLog());
      }
    });
  }

  canOpenANewConnection() {
    const state = this.getState();
    return state == "uninitialized" || state == "closed";
  }

  async connect(url: string) {
    const channel = new WebSocket(url);
    channel.binaryType = "arraybuffer";

    this.replaceChannel(channel, true);
  }

  async createLayout(name: string, description: string, layout: LayoutStateDTO) {
    const msg = this.sendMessage({
      type: "cm-create-layout",
      name,
      description,
      layout,
    });

    return await msg.awaitPayload<SMCreatedLayout>();
  }

  async createVehicleAgent(
    associatedFiles: {fileName: string; fileContent: string}[]
  ) {
    const msg = this.sendMessage({
      type: "cm-create-vehicle-agent",
      associatedFiles,
    });

    const response = await msg.awaitPayload<SMCreatedVehicleAgent | SMUnableToCreateVehicleAgent>();
    if (response.type == "sm-created-vehicle-agent")
      return {name, successful: true, id: response.id};
    else return {name, successful: false, reason: response.reason};
  }

  async createInstance(name: string, description: string, agent: number, layout: number) {
    const msg = this.sendMessage({
      type: "cm-create-simulation-instance",
      name,
      description,
      layout,
      agent,
    });

    // TODO couldn't there be an error while creating?
    //  this needs to be handled!
    const response = await msg.awaitPayload<SMCreatedSimulationInstance>();

    if (response.type == "sm-created-simulation-instance")
      return {name, successful: true, id: response.id};
    else
      return {
        name,
        successful: false,
        reason: "Could not create the simulation instance",
      };
  }

  changeSimulationOperatingState(instanceId: number, toState: SimulationOperatingState) {
    this.sendMessage({
      type: "cm-change-simulation-operating-state",
      instanceId,
      toState,
    });
  }

  startSendingFrames(instanceId: number, options: FrameOptions) {
    this.sendMessage({
      type: "cm-start-sending-frames",
      instanceId,
      options,
    });
  }

  stopSendingFrames(instanceId: number) {
    this.sendMessage({
      type: "cm-stop-sending-frames",
      instanceId,
    });
  }

  async getServerState() {
    const msg = this.sendMessage({
      type: "cm-server-state",
    });

    const {layouts, vehicleAgents, simulationInstances} = await msg.awaitPayload<SMServerState>();
    return {layouts: layouts, vehicleAgents, simulationInstances};
  }

  async loadLayout(layout: number) {
    const msg = this.sendMessage({
      type: "cm-get-registered-layout",
      id: layout,
    });

    return await msg.awaitPayload<SMRegisteredLayout>();
  }
}

export const GLOBAL_SERVER_CONNECTION = new ServerConnection();
