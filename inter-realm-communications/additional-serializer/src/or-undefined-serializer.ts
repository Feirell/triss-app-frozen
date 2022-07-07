import {
  FLOAT64_SERIALIZER,
  SerializerType,
  SwitchSerializer,
  ValueSerializer,
} from "serialization-generator";

import {StaticValueSerializer} from "./static-value-serializer";

export const OR_UNDEFINED_SERIALIZER = <T extends ValueSerializer<any>>(ser: T) => {
  // TODO This is buggy, the second registers has only never left to use
  //  my beliefe is that SerializerType<T> might be undefined, so it is unified
  //  since it fits undefined and is both handled by the first Alternative
  const instance = new SwitchSerializer<undefined | SerializerType<T>>();

  instance.register((v): v is undefined => v === undefined, new StaticValueSerializer(undefined));

  // splitting the registers to skip the problem that only never remains
  instance.register((v): v is SerializerType<T> => true, ser);

  return instance.finalize();
};

/**
 * This function is meant to help you identify undefined values serialized by the OR_UNDEFINED_SERIALIZER.
 */
export const isUndefined = (() => {
  // The base idea is that is not important which second serializer is registered, to identify the byte pattern for the first one
  // which is used for the undefined value.
  const undefinedValue = OR_UNDEFINED_SERIALIZER(FLOAT64_SERIALIZER).valueToArrayBuffer(undefined);

  return (ab: ArrayBuffer) => {
    if (undefinedValue.byteLength != ab.byteLength) return false;

    const a = new Uint8Array(undefinedValue);
    const b = new Uint8Array(ab);

    // This should be exactly one byte with the value 0000_0000
    for (let i = 0; i < a.byteLength; i++) if (a[i] != b[i]) return false;

    return true;
  };
})();
