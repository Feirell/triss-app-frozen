export class IteratorPipe<Value> implements Iterable<Value> {
  constructor(private readonly iterable: Iterable<Value> | (() => Generator<Value>)) {
  }

  * [Symbol.iterator](): Iterator<Value> {
    const ite = this.iterable;
    const parent = typeof ite === "function" ?
      ite() : ite;

    yield* parent;
  }

  map<Out>(mapper: (value: Value) => Out): IteratorPipe<Out> {
    const orig = this;

    return new IteratorPipe(function* map() {
      for (const val of orig)
        yield mapper(val);
    });
  }

  filter<Subset extends Value>(predicate: (value: Value, index: number) => value is Subset): IteratorPipe<Subset>;
  filter(predicate: (value: Value, index: number) => unknown): IteratorPipe<Value>;

  filter(predicate: (val: Value, index: number) => boolean) {
    const orig = this;

    return new IteratorPipe(function* filter() {
      let i = 0;

      for (const val of orig)
        if (predicate(val, i++))
          yield val;
    });
  }

  reduce<Collected>(callback: (previousValue: Collected, currentValue: Value, currentIndex: number) => Collected, initialValue: Collected): Collected {
    let collected = initialValue;
    let index = 0;

    for (const value of this)
      collected = callback(collected, value, index++);

    return collected;
  }

  toArray() {
    return Array.from(this);
  }
}

export function pipe<T>(ite: Iterable<T>) {
  return new IteratorPipe(ite);
}
