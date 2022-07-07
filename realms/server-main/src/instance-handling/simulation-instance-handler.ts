import {Worker} from "worker_threads";

import {
  FROM_SERVER_MESSAGES_SERIALIZER,
  FROM_WORKER_PARTIAL_MESSAGE_SERIALIZER,
  ServerMessages,
  WMFramePartial,
  WMReady,
  WorkerMessagesPartial
} from "@triss/server-worker-serializer";
import {World} from "@triss/entities";
import {AgentLoader, ManifestAgentEntry} from "@triss/agent-loader";
import {EntityIdentifier} from "@triss/dto";
import {ChannelConnectorMessageChannel} from "@triss/message-transport";

function createIdHandler() {
  let id = 0;

  const nextId = () => id++;

  return {nextId};
}

const handlerIDGenerator = createIdHandler();
const instanceIDGenerator = createIdHandler();

export class SimulationInstanceHandler extends ChannelConnectorMessageChannel<ServerMessages,
  WorkerMessagesPartial> {
  public readonly id = handlerIDGenerator.nextId();
  protected readonly associatedWorker: Worker;

  constructor(
    spawnWorker: () => Worker,
    public readonly agentLoader: AgentLoader,
    public readonly name: string,
    public readonly description: string,
    protected readonly initialWorld: World,
    protected readonly loadedAgent: ManifestAgentEntry
  ) {
    super(
      spawnWorker(),
      FROM_SERVER_MESSAGES_SERIALIZER,
      FROM_WORKER_PARTIAL_MESSAGE_SERIALIZER
    );

    this.associatedWorker = this.channel as Worker;
  }

  public async create() {
    const msg = this.sendMessage({
      type: "sm-create-instance",

      instanceId: instanceIDGenerator.nextId(),
      world: this.initialWorld.getSerializeData(),

      manifestPath: this.agentLoader.getManifestPath(),
      loadedAgent: this.loadedAgent
    });

    return (await msg.awaitResponse<WMReady>()).payload;
  }

  public async getCurrentFrame({
                                 includeTraffic = true,
                                 includeLayout = false,
                                 includeExportedAgentDataFor = []
                               }: {
    includeTraffic?: boolean;
    includeLayout?: boolean;
    includeExportedAgentDataFor?: EntityIdentifier[];
  } = {}) {
    const msg = this.sendMessage({
      type: "sm-get-current-frame",
      options: {
        includeTraffic,
        includeLayout,
        includeExportedAgentDataFor
      }
    });

    return await msg.awaitPayload<WMFramePartial>();
  }

  public async getNextFrame({
                              includeTraffic = true,
                              includeLayout = false,
                              includeExportedAgentDataFor = []
                            }: {
    includeTraffic?: boolean;
    includeLayout?: boolean;
    includeExportedAgentDataFor?: EntityIdentifier[];
  } = {}) {
    const msg = this.sendMessage({
      type: "sm-produce-next-frame",
      options: {
        includeTraffic,
        includeLayout,
        includeExportedAgentDataFor
      }
    });

    return await msg.awaitPayload<WMFramePartial>();
  }

  async destroy() {
    this.destroyConnector();
    await this.associatedWorker.terminate();
  }
}
