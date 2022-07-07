import WebSocket from "ws";

import {Server} from "../server/server";

import {
  ClientMessages,
  CMChangeSimulationOperatingState,
  CMCreateLayout,
  CMCreateSimulationInstance,
  CMCreateVehicleAgent,
  CMGetRegisteredLayout,
  CMStartSendingFrames,
  CMStopSendingFrames,
  FROM_CLIENT_SERIALIZER,
  FROM_SERVER_PARTIAL_SERIALIZER,
  ServerMessagesPartial,
  SMCreatedLayout,
  SMCreatedSimulationInstance,
  SMCreatedVehicleAgent,
  SMRegisteredLayout,
  SMServerState,
  SMUnableToCreateVehicleAgent
} from "@triss/client-server-serializer";

import {ChannelConnectorWebsocket} from "@triss/message-transport";
import {FrameListenerHandler} from "../instance-handling/frame-listener";

class ProtocolError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class IndividualWebSocketHandler extends ChannelConnectorWebsocket<ServerMessagesPartial,
  ClientMessages> {
  private frameRequestingHandler = new Map<number, FrameListenerHandler>();

  constructor(private readonly server: Server, socket: WebSocket) {
    super(socket as any, FROM_SERVER_PARTIAL_SERIALIZER, FROM_CLIENT_SERIALIZER);

    // TODO this is an async handler, which means that the thrown errors can not be catched by the ChannelConnector
    //  which means that this error will lead to a system crash
    this.addEventListener("received-message", async ev => {
      const wrapper = ev.message;
      const msg = wrapper.payload;

      const ret: ServerMessagesPartial | void | undefined = await (() => {
        switch (msg.type) {
          case "cm-get-registered-layout":
            return this.onGetRegisteredLayout(msg);

          case "cm-create-vehicle-agent":
            return this.onCreateVehicleAgent(msg);
          case "cm-create-layout":
            return this.onCreateLayout(msg);
          case "cm-create-simulation-instance":
            return this.onCreateSimulationInstance(msg);

          case "cm-change-simulation-operating-state":
            return this.changeSimulationOperatingState(msg);

          case "cm-start-sending-frames":
            return this.startSendingFrames(msg);
          case "cm-stop-sending-frames":
            return this.stopSendingFrames(msg);

          case "cm-server-state":
            return this.onServerState();
        }

        throw new Error("Undefined msg type " + (msg as any).type);
      })();

      if (ret) this.sendMessage(ret, wrapper.messageId);
    });

    this.addEventListener("state-changed", ev => {
      if (ev.to == "closing" || ev.to == "closed")
        for (const frh of this.frameRequestingHandler.values()) frh.stopRequesting();
    });

    (async () => {
      const serverState = this.onServerState();
      this.sendMessage(await serverState);
    })();
  }

  onGetRegisteredLayout(msg: CMGetRegisteredLayout): SMRegisteredLayout {
    const layout = this.server.getLayout().find(l => l.id == msg.id);
    if (layout === undefined)
      throw new Error("There is no layout registered with the requested id " + msg.id);

    return {
      type: "sm-registered-layout",
      layout: layout.getSerializeData()
    };
  }

  private async onCreateLayout(cw: CMCreateLayout): Promise<SMCreatedLayout> {
    const {name, description, layout} = cw;
    const regLayout = this.server.createLayout(name, description, layout);

    return {
      type: "sm-created-layout",
      id: regLayout.id
    };
  }

  private async onCreateVehicleAgent(
    cnva: CMCreateVehicleAgent
  ): Promise<SMCreatedVehicleAgent | SMUnableToCreateVehicleAgent> {
    try {
      const {associatedFiles} = cnva;

      const loadedAgent = await this.server.importVehicleAgent(
        associatedFiles
      );

      return {
        type: "sm-created-vehicle-agent",
        id: loadedAgent.id
      };
    } catch (e) {
      return {
        type: "sm-unable-to-create-vehicle-agent",
        reason: ("" + e || "").split("\n    at")[0]
      };
    }
  }

  private async onCreateSimulationInstance(cnsi: CMCreateSimulationInstance) {
    const {name, description, agent, layout} = cnsi;
    const si = await this.server.createSimulation(name, description, agent, layout);

    return {
      type: "sm-created-simulation-instance",
      id: si.id
    } as SMCreatedSimulationInstance;
  }

  private async changeSimulationOperatingState(css: CMChangeSimulationOperatingState) {
    this.server.changeOperatingStateOfInstance(css.instanceId, css.toState);
  }

  private async startSendingFrames(ssf: CMStartSendingFrames) {
    const instanceId = ssf.instanceId;

    const instance = this.server.getSimulationInstance(instanceId);
    if (!instance)
      throw new Error("could not find a simulation instance with the number " + instanceId);

    let frh = this.frameRequestingHandler.get(instanceId);
    if (!frh) {
      const listener = (frame: ArrayBuffer) => {
        if (!this.canSendMessages()) return;

        this.sendMessage({type: "sm-frame", instanceId, frame});
      };

      frh = instance.registerFrameListener(listener);
      this.frameRequestingHandler.set(instanceId, frh);

      const frame = await frh.getCurrentFrame();
      const fullMessage = FROM_SERVER_PARTIAL_SERIALIZER.valueToArrayBuffer({
        type: "sm-frame",
        instanceId,
        frame
      });

      this.sendMessage(fullMessage);
    }

    frh.setOptions(ssf.options);
  }

  private stopSendingFrames(ssf: CMStopSendingFrames) {
    const frh = this.frameRequestingHandler.get(ssf.instanceId);
    if (frh) {
      this.frameRequestingHandler.delete(ssf.instanceId);
      frh.stopRequesting();
    }
  }

  private onServerState() {
    return {
      type: "sm-server-state",
      layouts: this.server.getLayoutInformation(),
      vehicleAgents: this.server.getVehicleAgentInformation(),
      simulationInstances: this.server.getSimulationInstanceInformation()
    } as SMServerState;
  }
}

/*
export class IndividualWebSocketHandlerOld extends WebSocketAdapter<ServerMessages, ClientMessages> {
    @Log(cc)
    private readonly logger!: Index;

    private stopFrameSending: undefined | (() => void) = undefined;

    constructor(private readonly server: Server, socket: WebSocket) {
        super(socket as any, FROM_SERVER_SERIALIZER, FROM_CLIENT_SERIALIZER);

        this.logger.log("created new IndividualWebSocketHandler");

        this.registerResponder("cm-create-new-simulation-instance", this.onCreateNewSimulationInstance.bind(this));
        this.registerResponder("cm-start-sending-frames", this.startSendingFrames.bind(this));
        this.registerResponder("cm-stop-sending-frames", this.stopSendingFrames.bind(this));
        this.registerResponder("cm-server-state", this.onServerState.bind(this));
        this.registerResponder("cm-get-current-world-setup-and-state", this.onGetCurrentWorldSetupAndState.bind(this));
        this.registerResponder("cm-create-vehicle-agent", this.onCreateVehicleAgent.bind(this));

        this.setFallthrough(msg => this.logger.error('received a message which could not be processed, message:\n' + JSON.stringify(msg, undefined, 2)))

        this.on("state-change", ev => {
            if (this.stopFrameSending && (ev.currentState == "closing" || ev.currentState == "closed"))
                this.stopFrameSending();
        });
    }

    private async onCreateVehicleAgent(cnva: CMCreateVehicleAgent): Promise<SMCreatedVehicleAgent | SMUnableToCreateVehicleAgent> {
        try {
            const al = this.server.agentLoader;
            const {loadedAgent} = await al.importAndLoadAgent(cnva.associatedFiles, cnva.chosenEntry, cnva.name, cnva.description);

            return {
                type: "sm-created-vehicle-agent",
                id: loadedAgent.id
            };
        } catch (e) {
            return {
                type: "sm-unable-to-create-vehicle-agent",
                reason: (('' + e) || '').split('\n    at')[0]
            };
        }
    }

    private async onCreateNewSimulationInstance(cnsi: CMCreateNewSimulationInstance) {
        const va = await this.server.getVehicleAgents();
        const agent = va.find(a => a.id == cnsi.chosenAgent);
        if (!agent)
            throw new Error('could not find the agent with the id ' + cnsi.chosenAgent);

        const world = createWorldFromData({
            category: "WorldData",
            traffic: {category: "WorldStateData", vehicles: []},
            layout: cnsi.setup
        });

        const sih = new SimulationInstanceRealtimeHandler(
            this.server.agentLoader,
            cnsi.name, cnsi.description,
            world, agent
        );

        this.server.registerSimulationInstanceHandler(sih);

        return {
            type: "sm-created-new-simulation-instance",
            number: sih.id
        } as SMCreatedNewSimulationInstance;
    }

    private startSendingFrames(ssf: CMStartSendingFrames) {
        const nr = ssf.id;

        const instance = this.server.getSimulationInstance(nr);
        if (!instance)
            throw new Error("could not find a simulation instance with ne number " + nr);

        if (this.stopFrameSending)
            this.stopFrameSending();

        // const listener =
        //     ssf.sendAgentData ?
        //         (ev: Frame) => {
        //             // this.logger.log('produced frame');
        //             if (!this.canSendMessages())
        //                 return;
        //
        //             this.send({
        //                 type: "sm-frame-agent-data",
        //                 frame: ev.frame,
        //                 vehicleAgentData: ev.vehicleAgentData
        //             });
        //         }
        //         :
        //         (ev: SimulationInstanceEvents['produced-frame']) => {
        //             if (!this.canSendMessages())
        //                 return;
        //
        //             this.send({
        //                 type: "sm-frame",
        //                 frame: ev.frame
        //             });
        //         };

        const listener = (frame: Frame) => {
            if (!this.canSendMessages())
                return;

            this.send({
                type: "sm-frame",
                frame: frame
            });
        }

        instance.registerFrameListener(listener);
        this.stopFrameSending = () => instance.deregisterFrameListener(listener);

        instance.setRunning();
    }

    private stopSendingFrames(ssf: CMStopSendingFrames) {
        if (this.stopFrameSending)
            this.stopFrameSending();
    }

    private async onServerState(request: CMServerState) {
        const sims = this.server.getSimulationInstances();

        const simInstances = sims.map(si => ({
            id: si.id,
            name: si.name,
            description: si.description
        } as SimulationInstanceInformation));

        const va = await this.server.getVehicleAgents();

        const vehicleAgents = va.map(va => ({
            id: va.id,
            name: va.name,
            description: va.description
        }) as VehicleAgentInformation);

        return {
            type: "sm-server-state",
            simulationInstances: simInstances,
            vehicleAgents: vehicleAgents
        } as SMServerState;
    }

    private async onGetCurrentWorldSetupAndState(request: CMGetCurrentWorldSetupAndState) {
        const chosenSimulationInstance = this.server.getSimulationInstance(request.simulationInstance);
        if (!chosenSimulationInstance)
            throw new Error('tried to use unknown simulation instance with id ' + request.simulationInstance);

        const {setup, frame} = await chosenSimulationInstance.getCurrentFrameAndSetup();

        return {
            type: "sm-current-world-setup-and-state",
            frame, worldSetup: setup
        } as SMCurrentWorldSetupAndState;
    }
}
*/
