export interface TryAgent {
  type: "try-agent";

  id: number;
}

export const isTryAgentMessage = (val: any): val is TryAgent =>
  typeof val == "object" && val.type === "try-agent" && typeof val.id == "number";

export interface TryAgentSucceeded {
  type: "try-agent-succeeded";
}

export const isTryAgentSucceededMessage = (val: any): val is TryAgentSucceeded =>
  typeof val == "object" && val.type === "try-agent-succeeded";

export interface TryAgentFailed {
  type: "try-agent-failed";

  msg: string;
}

export const isTryAgentFailedMessage = (val: any): val is TryAgentFailed =>
  typeof val == "object" && val.type === "try-agent-failed" && typeof val.msg == "string";
