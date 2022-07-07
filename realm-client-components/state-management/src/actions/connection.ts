import {Action} from "redux";

export interface TryToConnectConnectA extends Action {
  type: "connect";
  url: string;
}

export interface ConnectionFailedA extends Action {
  type: "connection-failed";
  reason: string;
}

export interface ConnectedA extends Action {
  type: "connected";
}

export interface DisconnectA extends Action {
  type: "disconnect";
}

export interface DisconnectedA extends Action {
  type: "disconnected";
}
