import {ValueSerializer} from "serialization-generator";

export class StaticValueSerializer<T> extends ValueSerializer<T> {
  constructor(private readonly value: T) {
    super();
  }

  deserialize(dv: DataView, offset: number): {offset: number; val: T} {
    const val = this.value;
    return {offset, val};
  }

  getSizeForValue(val: T): number {
    return 0;
  }

  getStaticSize(): number | undefined {
    return 0;
  }

  serialize(dv: DataView, offset: number, val: T): {offset: number} {
    return {offset};
  }

  typeCheck(val: T, name: string | undefined): void {
    if (!Object.is(val, this.value))
      throw new Error(name + " is not the specified value " + this.value + " but " + val);
  }
}
