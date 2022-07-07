import {SimulationInstanceRealtimeHandler} from "../instance-handling/simulation-instance-realtime-handler";
import {WebSocketServer} from "../client-connection/web-socket-server";
import {createTagFromData, createTileFromData, RegisteredLayout, World} from "@triss/entities";
import {AgentLoader} from "@triss/agent-loader";
import {LayoutStateDTO} from "@triss/dto";
import {
  LayoutInformation,
  SimulationInstanceInformation,
  SimulationOperatingState,
  VehicleAgentInformation
} from "@triss/client-server-serializer";
import {Log, Logger} from "@triss/logger";
import {RealmController} from "@triss/server-realm-spawn-interface";

export class Server {
  @Log()
  private readonly logger!: Logger;

  private readonly serverWebSocketHandler: WebSocketServer;

  private layouts: RegisteredLayout[] = [];
  private agents: VehicleAgentInformation[] = [];

  private readonly simulationInstances: SimulationInstanceRealtimeHandler[] = [];

  private constructor(
    private readonly rc: RealmController,
    private readonly agentLoader: AgentLoader
  ) {
    this.serverWebSocketHandler = new WebSocketServer(this);
    this.logger.info("Created Server");

    this.agentLoader.addEventListener("agents-changed", async () => {
      this.agents = await this.agentLoader.getAllAvailableAgents();
      this.serverStateChanged();
    });
  }

  static async createWithOwnAgentLoader(rc: RealmController) {
    return new Server(rc, await AgentLoader.createAgentLoader("./agent-manifest.json", () => rc.spawnWorker("AGENT_SANDBOX")));
  }

  serverStateChanged() {
    try {
      const state = {
        layouts: this.getLayoutInformation(),
        vehicleAgents: this.getVehicleAgentInformation(),
        simulationInstances: this.getSimulationInstanceInformation()
      };

      this.serverWebSocketHandler.broadcastServerStateChange(state);
    } catch (e) {
      this.logger.error("There was an error while broadcasting the server state change.", e);
    }
  }

  createLayout(name: string, description: string, layout: LayoutStateDTO) {
    // let str = '{\n  "category": "LayoutStateDTO",\n';
    //
    // for (const cat of ['tags', 'tiles'] as const) {
    //     str += '  "' + cat + '": [\n';
    //     for (const entity of layout[cat]) {
    //         str += '    ' + JSON.stringify(entity) + ',\n';
    //     }
    //     str += '  ],\n';
    // }
    //
    // console.log('About to create a new layout with the name ' + name + ' and the layout:\n' + str);

    const tags = layout.tags.map(createTagFromData);
    const tiles = layout.tiles.map(createTileFromData);

    const instance = new RegisteredLayout(name, description, tags, tiles);
    this.layouts.push(instance);

    this.logger.info("Created a new layout \"" + name + "\" with the id " + instance.id);
    this.serverStateChanged();

    return instance;
  }

  async importVehicleAgent(
    files: {fileName: string; fileContent: string}[]
  ) {
    const agent = await this.agentLoader.importAgent(files);

    this.agents = await this.agentLoader.getAllAvailableAgents();

    this.logger.info("Created a new vehicle agent \"" + agent.name + "\" with the id " + agent.id);
    this.serverStateChanged();

    return agent;
  }

  async registerStandardAgent(
    name: string
  ) {
    const agent = await this.agentLoader.linkAlreadyWrittenAgent(name);

    this.agents = await this.agentLoader.getAllAvailableAgents();

    this.logger.info("Linked a standard vehicle agent \"" + agent.name + "\" with the id " + agent.id);
    this.serverStateChanged();

    return agent;
  }

  getVehicleAgentInformationById(id: number) {
    for (const entry of this.getVehicleAgentInformation())
      if (entry.id == id)
        return entry;

    throw new Error("Could not find an agent with the id " + id);
  }

  getLayoutInformationById(id: number) {
    for (const entry of this.getLayoutInformation())
      if (entry.id == id)
        return entry;

    throw new Error("Could not find an agent with the id " + id);
  }

  private getLayoutById(id: number) {
    for (const entry of this.layouts)
      if (entry.id == id)
        return entry;

    throw new Error("Could not find an layout with the id " + id);
  }

  async createSimulation(name: string, description: string, agentId: number, layoutId: number) {
    const agent = this.getVehicleAgentInformationById(agentId);
    const layout = this.getLayoutById(layoutId);

    const world = new World();
    world.tags = layout.tags;
    world.tiles = layout.tiles;

    const sih = new SimulationInstanceRealtimeHandler(
      () => this.rc.spawnWorker("AGENT_WORKER" /* this is defined in the server application */),
      this.agentLoader,
      name,
      description,
      world,
      agent
    );

    await sih.create();

    this.simulationInstances.push(sih);

    this.logger.info("Created a new simulation instance \"" + name + "\" with the id " + sih.id);
    this.serverStateChanged();

    return sih;
  }

  getSimulationInstances() {
    return this.simulationInstances.slice();
  }

  getLayout() {
    return this.layouts.slice();
  }

  getSimulationInstance(nr: number) {
    for (const si of this.simulationInstances) if (si.id == nr) return si;

    return undefined;
  }

  getVehicleAgentInformation() {
    return this.agents;
  }

  getLayoutInformation(): LayoutInformation[] {
    return this.getLayout().map(l => ({
      id: l.id,
      name: l.name,
      description: l.description
    }));
  }

  getSimulationInstanceInformation(): SimulationInstanceInformation[] {
    return this.getSimulationInstances().map<SimulationInstanceInformation>(si => ({
      id: si.id,
      name: si.name,
      description: si.description,
      operatingState: si.getOperatingState()
    }));
  }

  changeOperatingStateOfInstance(instanceId: number, operatingState: SimulationOperatingState) {
    const instance = this.getSimulationInstance(instanceId);
    if (!instance)
      throw new Error("could not find a simulation instance with the number " + instanceId);

    if (instance.getOperatingState() == operatingState) return;

    switch (operatingState) {
      case "paused":
        instance.setPaused();
        break;
      case "running":
        instance.setRunning();
        break;

      default:
        // Since no string but an identifier is transmitted, this will only
        // happen if there is a new state not correctly implemented
        throw new Error(
          "The toState \"" +
          operatingState +
          "\" for the ChangeSimulationOperatingState was not recognised "
        );
    }

    this.serverStateChanged();
  }
}
