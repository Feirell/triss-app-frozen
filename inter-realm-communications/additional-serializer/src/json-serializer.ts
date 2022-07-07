import {STRING_SERIALIZER, TransformSerializer} from "serialization-generator";

export class JSONSerializer<T> extends TransformSerializer<T, string> {
  constructor(private readonly typeCheckFnc = (val: any): val is T => typeof val == "object") {
    super(STRING_SERIALIZER);
  }

  fromBaseToOrigin(val: string): T {
    return JSON.parse(val);
  }

  fromOriginToBase(val: T): string {
    return JSON.stringify(val);
  }

  originTypeCheck(val: T, name: string): void {
    if (this.typeCheckFnc(val)) throw new Error(name + " had not the needed structure");
  }
}
