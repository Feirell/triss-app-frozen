import {
  ObjectPartialSerializer,
  ObjectSerializer,
  PropertySwitchSerializer,
  SerializerType,
  UINT32_SERIALIZER,
  ValueSerializer
} from "serialization-generator";
import {WrappedMessage} from "./wrapped-message";
import {WrappedResponseMessage} from "./wrapped-response-message";

export function createWrappedPartialMessageSerializer<Type>(ser: ValueSerializer<Type>) {
  const partialMessage = new ObjectPartialSerializer(
    new ObjectSerializer<WrappedMessage<Type>>()
      .append("messageId", UINT32_SERIALIZER)
      .append("payload", ser),
    "payload"
  );

  const partialResponseMessage = new ObjectPartialSerializer(
    new ObjectSerializer<WrappedResponseMessage<Type>>()
      .append("messageId", UINT32_SERIALIZER)
      .append("responseToId", UINT32_SERIALIZER)
      .append("payload", ser),
    "payload"
  );

  return new PropertySwitchSerializer<SerializerType<typeof partialMessage> | SerializerType<typeof partialResponseMessage>,
    "type">("type")
    .register("message", partialMessage)
    .register("response", partialResponseMessage)

    .finalize();
}
