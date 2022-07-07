import {Worker} from "worker_threads";
import {World} from "@triss/entities";
import {AgentLoader, ManifestAgentEntry} from "@triss/agent-loader";
import {EntityIdentifier, FrameDTO} from "@triss/dto";
import {EntityIdentifierSet} from "@triss/entity-helper";
import {SelfAligningRepeater} from "@triss/timer";
import {isUndefined} from "@triss/additional-serializer";
import {
  deconstructedFrameToFullFrame,
  FRAME_DECONSTRUCTOR,
  FrameListener,
  FrameListenerHandler,
  PartialFrame,
  PartialFrameWithChangeMarker
} from "./frame-listener";
import {SimulationInstanceHandler} from "./simulation-instance-handler";
//
// function createDataURLFromJSSnippet(snippet: string) {
//   return new URL("data:text/javascript;base64," + Buffer.from(snippet).toString("base64"));
// }
//
// // TODO import the other realm correctly
// const entryURL = createDataURLFromJSSnippet(`
// import * from "@triss/agent-worker";
// `);

type SimulationInstanceHandlerStates = "running" | "paused";

export class SimulationInstanceRealtimeHandler extends SimulationInstanceHandler {
  private registeredFrameListeners: FrameListenerHandler[] = [];

  private exportedEntities: EntityIdentifier[] = [];

  private frameRenderingState: SimulationInstanceHandlerStates = "paused";
  private readonly timer = new SelfAligningRepeater(
    () => this.loop(),
    // TODO what should be done if the frame was skipped?
    () => undefined,
    1000 / 60
  );

  private lastFullFrame: undefined | PartialFrame = undefined;

  // private lastLoopTraffic: ArrayBuffer = new ArrayBuffer(0);
  private lastLoopTrafficChanged = false;

  // private lastLoopLayout: ArrayBuffer = new ArrayBuffer(0);
  private lastLoopLayoutChanged = false;

  constructor(
    spawnWorker: () => Worker,
    agentLoader: AgentLoader,
    name: string,
    description: string,
    initialWorld: World,
    loadedAgent: ManifestAgentEntry
  ) {
    super(spawnWorker, agentLoader, name, description, initialWorld, loadedAgent);
    this.timer.start();
  }

  getOperatingState() {
    return this.frameRenderingState;
  }

  public async getGuaranteedFullFrame(forceUpdate = false) {
    if (this.lastFullFrame && !forceUpdate) return this.lastFullFrame;

    const frame = await this.getCurrentFrame({
      includeTraffic: true,
      includeLayout: true,
      includeExportedAgentDataFor: this.exportedEntities
    });

    return this.updateCacheFrame(FRAME_DECONSTRUCTOR.arrayBufferToValue(frame.frame));
  }

  public registerFrameListener(listener: FrameListener) {
    const flh = new FrameListenerHandler(this, listener);
    this.registeredFrameListeners.push(flh);
    return flh;
  }

  public deregisterFrameListener(listener: FrameListener) {
    const handler = this.registeredFrameListeners.find(h => h.getListener() == listener);
    if (!handler) return;

    // Using filter to preserve this array if it is currently being iterated over
    this.registeredFrameListeners = this.registeredFrameListeners.filter(v => v !== handler);
    this.updateRequestedExportedEntities();
  }

  public numberOfFrameListeners() {
    return this.registeredFrameListeners.length;
  }

  public updateRequestedExportedEntities() {
    let eis = new EntityIdentifierSet();

    for (const listener of this.registeredFrameListeners)
      eis = eis.unify(listener.getRequestingSet());

    this.exportedEntities = eis.getAllValues();
  }

  getCachedFullFrame() {
    return this.lastFullFrame;
  }

  public setRunning() {
    if (this.frameRenderingState == "running") return;

    this.frameRenderingState = "running";
  }

  public setPaused() {
    if (this.frameRenderingState == "paused") return;

    this.frameRenderingState = "paused";
  }

  private updateCacheFrame(partial: PartialFrame) {
    // TODO make this fix more robust
    //  The partial.layout or partial.traffic properties are problematic.
    //  Since this is a partial deserializer it will not deserialize the OR_UNDEFINED serialize part
    //  therefore we cant really make sure if this is undefined which is bad.

    const trafficTransmitted = !isUndefined(partial.traffic);
    const layoutTransmitted = !isUndefined(partial.layout);

    if (this.lastFullFrame == undefined) {
      if (!trafficTransmitted || !layoutTransmitted)
        throw new Error(
          "Tried to establish a cache but the worker did not provide traffic and layout."
        );

      this.lastFullFrame = partial;
    }

    this.lastFullFrame.simulationTime = partial.simulationTime;
    this.lastFullFrame.frameId = partial.frameId;
    this.lastFullFrame.exportedAgentData = partial.exportedAgentData;

    if (trafficTransmitted) {
      this.lastFullFrame!.traffic = partial.traffic;
      this.lastLoopTrafficChanged = true;
    } else {
      this.lastLoopTrafficChanged = false;
    }

    if (layoutTransmitted) {
      this.lastFullFrame!.layout = partial.layout;
      this.lastLoopLayoutChanged = true;
    } else {
      this.lastLoopLayoutChanged = false;
    }

    return this.lastFullFrame;
  }

  private async loop() {
    if (this.frameRenderingState == "paused") return;

    const noCachedDataPresent = this.lastFullFrame == undefined;

    // Even though we only request those properties, the agent can send more data if, for example, the layout changed
    const workerFrame = await this.getNextFrame({
      includeTraffic: noCachedDataPresent,
      includeLayout: noCachedDataPresent,
      includeExportedAgentDataFor: this.exportedEntities
    });

    const arrayBuffer = workerFrame.frame;

    const partial = FRAME_DECONSTRUCTOR.arrayBufferToValue(arrayBuffer);

    this.updateCacheFrame(partial);

    if (this.registeredFrameListeners.length == 0) return;

    const getFrame = (() => {
      let frame: FrameDTO | undefined = undefined;

      return () => {
        if (!frame) {
          if (!this.lastFullFrame)
            throw new Error(
              "There is no last frame even though it should have been set right before this."
            );
          frame = deconstructedFrameToFullFrame(this.lastFullFrame);
        }

        return frame;
      };
    })();

    const eventFrame: PartialFrameWithChangeMarker = {
      ...this.lastFullFrame!,
      trafficChanged: this.lastLoopTrafficChanged,
      layoutChanged: this.lastLoopTrafficChanged
    };

    const listeners = this.registeredFrameListeners.slice();
    for (const handler of listeners) handler.pushFrame(eventFrame, getFrame);
  }
}
