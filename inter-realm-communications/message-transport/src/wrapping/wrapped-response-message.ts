export interface WrappedResponseMessage<Payload> {
  type: "response";
  messageId: number;
  responseToId: number;
  payload: Payload;
}

export const isWrappedResponseMessage = <Type = any>(
  msg: any
): msg is WrappedResponseMessage<Type> =>
  typeof msg == "object" &&
  "type" in msg &&
  msg.type == "response" &&
  "messageId" in msg &&
  typeof msg.messageId == "number" &&
  "responseToId" in msg &&
  typeof msg.responseToId == "number";
