import {ObjectPartialSerializer, SerializerType, ValueSerializer} from "serialization-generator";
import {EntityIdentifier, FrameDTO} from "@triss/dto";
import {EntityIdentifierSet} from "@triss/entity-helper";
import {
  FRAME_SERIALIZER,
  FrameOptions,
  LAYOUT_STATE_SERIALIZER,
  TRAFFIC_STATE_SERIALIZER
} from "@triss/entity-serializer";
import {OR_UNDEFINED_SERIALIZER} from "@triss/additional-serializer";
import {SimulationInstanceRealtimeHandler} from "./simulation-instance-realtime-handler";

const createCachedDeserializer = <Type>(ser: ValueSerializer<Type>, value: ArrayBuffer) => {
  let cache: Type | undefined = undefined;

  return () => {
    if (cache == undefined) cache = ser.arrayBufferToValue(value);

    return cache;
  };
};

export interface FrameListener {
  (arrayBuffer: ArrayBuffer, getRequestedFrame: () => FrameDTO, getFullFrame: () => FrameDTO): void;
}

const trafficUndefinedValue =
  OR_UNDEFINED_SERIALIZER(TRAFFIC_STATE_SERIALIZER).valueToArrayBuffer(undefined);
const layoutUndefinedValue =
  OR_UNDEFINED_SERIALIZER(LAYOUT_STATE_SERIALIZER).valueToArrayBuffer(undefined);

export interface PartialFrameWithChangeMarker extends PartialFrame {
  trafficChanged: boolean;
  layoutChanged: boolean;
}

export class FrameListenerHandler {
  private requestingExportedData = new EntityIdentifierSet();

  private options: FrameOptions = {
    includeTraffic: false,
    includeLayout: false,
    includeExportedAgentDataFor: []
  };

  constructor(private sirh: SimulationInstanceRealtimeHandler, private listener: FrameListener) {
  }

  getListener() {
    return this.listener;
  }

  pushFrame(frame: PartialFrameWithChangeMarker, getFullFrame: () => FrameDTO) {
    const {serialized, deserialize} = this.cleanFrame(frame);
    this.listener(serialized, deserialize, getFullFrame);
  }

  setOptions(options: FrameOptions) {
    this.options = {...options};
    this.setRequestingExportedData(options.includeExportedAgentDataFor);
  }

  getOptions() {
    return this.options;
  }

  setRequestingExportedData(ids: EntityIdentifier[]) {
    this.options.includeExportedAgentDataFor = ids;
    const set = (this.requestingExportedData = new EntityIdentifierSet());
    for (const id of ids) set.add(id);

    this.sirh.updateRequestedExportedEntities();
  }

  getRequestingExportedData(): EntityIdentifier[] {
    return this.requestingExportedData.getAllValues();
  }

  getRequestingSet() {
    return this.requestingExportedData;
  }

  stopRequesting() {
    this.sirh.deregisterFrameListener(this.listener);
  }

  getHandler() {
    return this.sirh;
  }

  async getCurrentFrame() {
    const ff = await this.sirh.getGuaranteedFullFrame();
    const {serialized} = this.cleanFrame({
      ...ff,
      trafficChanged: true,
      layoutChanged: true
    });
    return serialized;
  }

  private cleanFrame(frame: PartialFrameWithChangeMarker) {
    const exportedAgentData = frame.exportedAgentData.filter(e =>
      this.requestingExportedData.has(e.forEntity)
    );

    const traffic =
      !frame.trafficChanged && !this.options.includeTraffic ? trafficUndefinedValue : frame.traffic;
    const layout =
      !frame.layoutChanged && !this.options.includeLayout ? layoutUndefinedValue : frame.layout;

    const serialized = FRAME_DECONSTRUCTOR.valueToArrayBuffer({
      frameId: frame.frameId,
      simulationTime: frame.simulationTime,
      traffic,
      layout,
      exportedAgentData
    });

    const deserialize = createCachedDeserializer(FRAME_SERIALIZER, serialized);

    return {serialized, deserialize};
  }
}

export const FRAME_DECONSTRUCTOR = new ObjectPartialSerializer(FRAME_SERIALIZER, "traffic", "layout");
export type PartialFrame = SerializerType<typeof FRAME_DECONSTRUCTOR>;
export const deconstructedFrameToFullFrame = (() => {
  const trafficSer = OR_UNDEFINED_SERIALIZER(TRAFFIC_STATE_SERIALIZER);
  const layoutSer = OR_UNDEFINED_SERIALIZER(LAYOUT_STATE_SERIALIZER);

  return (dec: PartialFrame): FrameDTO => {
    const traffic = trafficSer.arrayBufferToValue(dec.traffic);
    const layout = layoutSer.arrayBufferToValue(dec.layout);

    return {
      ...dec,
      traffic,
      layout
    };
  };
})();
