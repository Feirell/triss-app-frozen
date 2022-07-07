export interface WrappedMessage<Payload> {
  type: "message";
  messageId: number;
  payload: Payload;
}

export const isWrappedMessage = <Type = any>(msg: any): msg is WrappedMessage<Type> =>
  typeof msg == "object" &&
  "type" in msg &&
  msg.type == "message" &&
  "messageId" in msg &&
  typeof msg.messageId == "number";
