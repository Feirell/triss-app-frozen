import {ObjectSerializer, PropertySwitchSerializer, UINT32_SERIALIZER, ValueSerializer} from "serialization-generator";
import {WrappedMessage} from "./wrapped-message";
import {WrappedResponseMessage} from "./wrapped-response-message";

export function createWrappedMessageSerializer<Type>(ser: ValueSerializer<Type>) {
  return new PropertySwitchSerializer<WrappedMessage<Type> | WrappedResponseMessage<Type>, "type">(
    "type"
  )
    .register(
      "message",
      new ObjectSerializer<WrappedMessage<Type>>()
        .append("messageId", UINT32_SERIALIZER)
        .append("payload", ser)
    )

    .register(
      "response",
      new ObjectSerializer<WrappedResponseMessage<Type>>()
        .append("messageId", UINT32_SERIALIZER)
        .append("responseToId", UINT32_SERIALIZER)
        .append("payload", ser)
    )

    .finalize();
}
