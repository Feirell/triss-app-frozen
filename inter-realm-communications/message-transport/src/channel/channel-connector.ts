import performance from "@triss/performance";

import {InsteadArrayBuffer, ValueSerializer} from "serialization-generator";
import {EventEmitter} from "event-emitter-typesafe";
import {WrappedMessage} from "../wrapping/wrapped-message";
import {isWrappedResponseMessage, WrappedResponseMessage} from "../wrapping/wrapped-response-message";
import {createWrappedMessageSerializer} from "../wrapping/create-wrapped-message-serializer";
import {createWrappedPartialMessageSerializer} from "../wrapping/create-wrapped-partial-message-serializer";

export function createIdHandler(start = 0) {
  let value = start;

  const nextId = () => value++;

  return {nextId};
}

export const isArrayBuffer = (val: any): val is ArrayBuffer =>
  typeof val == "object" && val instanceof ArrayBuffer;

export type ConnectionState = "uninitialized" | "connecting" | "open" | "closing" | "closed";

interface ChannelConnectorEvents<Sending, Receiving> {
  "received-message": {
    event: "received-message";
    message: WrappedMessage<Receiving> | WrappedResponseMessage<Receiving>;
    start: number;
    end: number;
  };

  "encountered-error": {
    event: "encountered-error";
    error: any;
  };

  "connection-ended": {
    event: "connection-ended";
    reason: any;
  };

  "state-changed": {
    event: "state-changed";
    from: ConnectionState;
    to: ConnectionState;
  };
}

interface FilterWrapperCallbackController {
  stopListening(): void;
}

export abstract class ChannelConnector<UC, Sending, Receiving> extends EventEmitter<
  ChannelConnectorEvents<Sending, Receiving>
> {
  public SENDING_TYPE: Sending = undefined as any;
  public RECEIVING_TYPE: Receiving = undefined as any;

  private readonly messageIdHandler = createIdHandler();

  private readonly WRAPPED_SENDING_SERIALIZER;
  private readonly WRAPPED_PARTIAL_SENDING_SERIALIZER;
  private readonly WRAPPED_RECEIVING_SERIALIZER;

  private lastEmittedNewState: ConnectionState = "uninitialized";

  constructor(
    protected channel: UC | undefined,
    private readonly sendingSerializer: ValueSerializer<Sending>,
    private readonly receivingSerializer: ValueSerializer<Receiving>
  ) {
    super();

    this.WRAPPED_SENDING_SERIALIZER = createWrappedMessageSerializer(this.sendingSerializer);
    this.WRAPPED_PARTIAL_SENDING_SERIALIZER = createWrappedPartialMessageSerializer(
      this.sendingSerializer
    );
    this.WRAPPED_RECEIVING_SERIALIZER = createWrappedMessageSerializer(this.receivingSerializer);

    if (this.channel !== undefined) {
      this.coupleChannel();
      this.emitStateChangeIfNeeded();
    }

    this.addEventListener("encountered-error", ev => {
      console.error(ev.error);
    });
  }

  createFilteredWrapperCallback<Msg extends Receiving>(
    filter: (
      msg: Receiving,
      wrapper: WrappedMessage<Receiving> | WrappedResponseMessage<Receiving>
    ) => msg is Msg,
    cb: (
      msg: Msg,
      wrapped: WrappedMessage<Msg> | WrappedResponseMessage<Msg>,
      controller: FilterWrapperCallbackController
    ) => void
  ): FilterWrapperCallbackController {
    const listener = (ev: ChannelConnectorEvents<Sending, Receiving>["received-message"]) => {
      const wrapped = ev.message;
      const payload = wrapped.payload;

      if (filter(payload, wrapped)) {
        cb(payload, wrapped as WrappedMessage<Msg> | WrappedResponseMessage<Msg>, controller);
      }
    };

    this.addEventListener("received-message", listener);

    const stopListening = () => {
      this.removeEventListener("received-message", listener);
    };

    const controller = {stopListening};
    return controller;
  }

  emitStateChangeIfNeeded() {
    const previousState = this.lastEmittedNewState;
    const currentState = this.getState();

    if (currentState == previousState) return;

    this.lastEmittedNewState = currentState;

    this.emit("state-changed", {
      event: "state-changed",
      from: previousState,
      to: currentState,
    });
  }

  abstract getState(): ConnectionState;

  replaceChannel(channel: UC | undefined, destroyOld = false) {
    if (channel === this.channel) return;

    const previousChannel = this.channel;

    this.emitStateChangeIfNeeded();

    if (this.channel !== undefined) this.decoupleChannel(destroyOld);
    this.emitStateChangeIfNeeded();

    this.channel = undefined;
    this.emitStateChangeIfNeeded();

    this.channel = channel;

    try {
      this.coupleChannel();
    } catch (e) {
      this.channel = undefined;
      this.emitStateChangeIfNeeded();

      throw e;
    }

    this.emitStateChangeIfNeeded();
    return previousChannel;
  }

  destroyConnector() {
    if (this.channel !== undefined) {
      this.decoupleChannel(true);
      this.emitStateChangeIfNeeded();
    }
  }

  canSendMessages() {
    return this.getState() == "open";
  }

  /**
   * You NEED to use the FROM_SERVER_SERIALIZER, FROM_SERVER_PARTIAL_SERIALIZER, ... otherwise you will be missing
   * the prefixed id from the switch serializer
   * @param msg
   * @param inResponseTo
   */
  sendMessage(msg: Sending | ArrayBuffer, inResponseTo: number | undefined = undefined) {
    const id = this.messageIdHandler.nextId();

    const serialized = isArrayBuffer(msg)
      ? this.packAndSerializedPartial(id, msg, inResponseTo)
      : this.packAndSerializer(id, msg, inResponseTo);

    this.sendArrayBuffer(serialized);

    const awaitResponse = <Resp extends Receiving = Receiving>(
      timeoutMs: number | undefined = undefined
    ) => this.waitForMessageRespondingTo(id, timeoutMs) as Promise<WrappedResponseMessage<Resp>>;

    const awaitPayload = <Resp extends Receiving = Receiving>(
      timeoutMs: number | undefined = undefined
    ) => awaitResponse<Resp>(timeoutMs).then(v => v.payload);

    return {awaitResponse, awaitPayload};
  }

  waitForMessageRespondingTo(id: number, timeoutMs: number | undefined = undefined) {
    return this.waitForMessageWhichMeets(msg => {
      if (isWrappedResponseMessage(msg)) {
        return msg.responseToId == id;
      }

      return false;
    }, timeoutMs);
  }

  waitForMessageWhichMeets(
    condition: (msg: WrappedMessage<Receiving> | WrappedResponseMessage<Receiving>) => boolean,
    timeoutMs: number | undefined = undefined
  ) {
    return new Promise<WrappedMessage<Receiving> | WrappedResponseMessage<Receiving>>(
      (res, rej) => {
        const listener = (ev: ChannelConnectorEvents<Sending, Receiving>["received-message"]) => {
          const wrapper = ev.message;
          if (condition(wrapper)) {
            deRegister();
            res(wrapper);
          }
        };

        this.addEventListener("received-message", listener);

        const timeout = () => {
          deRegister();
          rej(
            new Error(
              "The awaited was not received within the allotted time of " + timeoutMs + "ms."
            )
          );
        };

        const timeoutId: any = timeoutMs !== undefined ? setTimeout(timeout, timeoutMs) : undefined;

        const deRegister = () => {
          if (typeof timeoutId == "number") clearTimeout(timeoutId as any);

          this.removeEventListener("received-message", listener);
        };
      }
    );
  }

  protected receivedMessage(msg: any) {
    try {
      if (!isArrayBuffer(msg))
        throw new Error("Received a message which is not an ArrayBuffer but " + msg);

      const start = performance.now();
      const parsedMessage = this.WRAPPED_RECEIVING_SERIALIZER.arrayBufferToValue(msg);
      const end = performance.now();

      const event = "received-message";
      this.emit("received-message", {event, message: parsedMessage, start, end});
    } catch (e) {
      // TODO this can not handle async handlers!
      this.encounteredError(e);
      throw e;
    }
  }

  protected encounteredError(error: any) {
    const event = "encountered-error";
    this.emit(event, {event, error});
    this.emitStateChangeIfNeeded();
  }

  protected connectionEnded(reason: any) {
    const event = "connection-ended";
    this.emit(event, {event, reason});
    this.replaceChannel(undefined);
  }

  protected abstract sendArrayBuffer(ab: ArrayBuffer): void;

  protected abstract coupleChannel(): void;

  protected abstract decoupleChannel(destroyChannel?: boolean): void;

  private packAndSerializer(
    id: number,
    msg: Sending,
    inResponseTo: number | undefined = undefined
  ) {
    let wrappedMsg: WrappedMessage<Sending> | WrappedResponseMessage<Sending>;

    if (inResponseTo !== undefined) {
      wrappedMsg = {
        type: "response",
        messageId: id,
        responseToId: inResponseTo,
        payload: msg,
      };
    } else {
      wrappedMsg = {
        type: "message",
        messageId: id,
        payload: msg,
      };
    }

    return this.WRAPPED_SENDING_SERIALIZER.valueToArrayBuffer(wrappedMsg);
  }

  private packAndSerializedPartial(
    id: number,
    msg: ArrayBuffer,
    inResponseTo: number | undefined = undefined
  ) {
    let wrappedMsg:
      | InsteadArrayBuffer<WrappedMessage<Sending>, "payload">
      | InsteadArrayBuffer<WrappedResponseMessage<Sending>, "payload">;

    if (inResponseTo !== undefined) {
      wrappedMsg = {
        type: "response",
        messageId: id,
        responseToId: inResponseTo,
        payload: msg,
      };
    } else {
      wrappedMsg = {
        type: "message",
        messageId: id,
        payload: msg,
      };
    }

    return this.WRAPPED_PARTIAL_SENDING_SERIALIZER.valueToArrayBuffer(wrappedMsg);
  }
}
