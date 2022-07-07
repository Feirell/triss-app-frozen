import {MessagePort, Worker as NodeWorker} from "worker_threads";

import {ChannelConnector, ConnectionState} from "./channel-connector";

type ChannelTypes = MessagePort | NodeWorker | Worker;

export class ChannelConnectorMessageChannel<Sending, Receiving> extends ChannelConnector<
  ChannelTypes,
  Sending,
  Receiving
> {
  private currentDisconnectHandler: undefined | (() => void) = undefined;

  getState(): ConnectionState {
    if (!this.channel) return "uninitialized";

    // TODO see if one can find out more about the state of those channels
    return "open";
  }

  protected coupleChannel(): void {
    const channel = this.channel;

    this.emitStateChangeIfNeeded();
    if (!channel) return;

    if ("start" in channel) channel.start();

    this.emitStateChangeIfNeeded();

    const addEvent =
      "addEventListener" in channel
        ? (ev: string, callback: (ev: any) => void) => channel.addEventListener(ev, callback)
        : // thanks again node js
          (ev: string, callback: (ev: any) => void) => channel.addListener(ev, callback);

    const removeEvent =
      "removeEventListener" in channel
        ? (ev: string, callback: (ev: any) => void) => channel.removeEventListener(ev, callback)
        : // thanks again node js
          (ev: string, callback: (ev: any) => void) => channel.removeListener(ev, callback);

    const messageHandler = (ev: MessageEvent | ArrayBuffer) => {
      // TODO there seems to be a bug, with listener
      //  When the Handler sends an ArrayBuffer to the Worker then the Worker receives an Event
      //  But when the Worker send an ArrayBuffer to the Client then the Handler receives only the ArrayBuffer
      //  Seems like a nodejs bug

      const data = ev instanceof ArrayBuffer ? ev : ev.data;
      this.receivedMessage(data);
    };
    addEvent("message", messageHandler as any);

    const messageerrorHandler = (ev: MessageEvent) => {
      this.encounteredError(ev.data);
    };
    addEvent("messageerror", messageerrorHandler as any);

    this.currentDisconnectHandler = function currentDisconnectHandler() {
      removeEvent("message", messageHandler as any);
      removeEvent("messageerror", messageerrorHandler as any);
    };
  }

  protected decoupleChannel(destroyChannel = false): void {
    if (this.currentDisconnectHandler) {
      this.currentDisconnectHandler();
      this.currentDisconnectHandler = undefined;
    }
  }

  protected sendArrayBuffer(ab: ArrayBuffer): void {
    if (this.getState() !== "open")
      throw new Error("The MessagePort channel is not open, thus can not send a message");

    this.channel!.postMessage(ab, [ab]);
  }
}
