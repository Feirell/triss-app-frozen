import {ChannelConnector, ConnectionState} from "./channel-connector";

const getConnectionState = (socket: WebSocket | undefined): ConnectionState => {
  if (socket == undefined) return "uninitialized";

  if (!("readyState" in socket)) throw new Error("readyState is not part of the websocket");

  switch (socket.readyState) {
    case 0:
      return "connecting";
    case 1:
      return "open";
    case 2:
      return "closing";
    case 3:
      return "closed";
  }

  throw new Error("The web socket adapter is in an unrecognized state");
};

export class ChannelConnectorWebsocket<Sending, Receiving> extends ChannelConnector<
  WebSocket,
  Sending,
  Receiving
> {
  private currentDisconnectHandler: undefined | (() => void) = undefined;

  getState(): ConnectionState {
    return getConnectionState(this.channel);
  }

  protected coupleChannel(destroyChannel = false): void {
    const channel = this.channel;

    if (!channel) return;

    channel.binaryType = "arraybuffer";
    this.emitStateChangeIfNeeded();

    const openHandler = (ev: Event) => this.emitStateChangeIfNeeded();
    channel.addEventListener("open", openHandler);

    const messageHandler = (ev: MessageEvent) => this.receivedMessage(ev.data);
    channel.addEventListener("message", messageHandler);

    const errorHandler = (ev: Event) => this.encounteredError(undefined);
    channel.addEventListener("error", errorHandler);

    const closeHandler = (ev: Event) => this.connectionEnded(undefined);
    channel.addEventListener("close", closeHandler);

    this.currentDisconnectHandler = function currentDisconnectHandler() {
      channel.removeEventListener("open", openHandler);
      channel.removeEventListener("message", messageHandler);
      channel.removeEventListener("error", errorHandler);
      channel.removeEventListener("close", closeHandler);
    };

    // TODO this does not work there is an error somewhere no clue what happens
    //  and I have no time to fix it, at some point in time the WebSocket should be discarded correctly!
    // if (destroyChannel)
    //     // see: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
    //     channel.close(1000);
    //
    // this.channel = undefined;
  }

  protected decoupleChannel(): void {
    if (this.currentDisconnectHandler) {
      this.currentDisconnectHandler();
      this.currentDisconnectHandler = undefined;
    }
  }

  protected sendArrayBuffer(ab: ArrayBuffer): void {
    if (this.getState() !== "open")
      throw new Error("The WebSocket channel is not open, thus can not send a message");

    this.channel!.send(ab);
  }
}
