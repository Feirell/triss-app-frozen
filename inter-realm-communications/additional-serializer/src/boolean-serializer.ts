import {
  createTransformSerializer,
  UINT8_SERIALIZER,
  ValueSerializer,
} from "serialization-generator";

const isBoolean = (val: any): val is boolean => val === true || val === false;

export const BOOLEAN_SERIALIZER: ValueSerializer<boolean> = createTransformSerializer<
  boolean,
  number
>(
  val => (val ? 1 : 0),
  val => val != 0,
  UINT8_SERIALIZER,
  (val, name) => {
    if (!isBoolean(val)) throw new Error(name + " needs to be a boolean but was " + val);
  }
);
