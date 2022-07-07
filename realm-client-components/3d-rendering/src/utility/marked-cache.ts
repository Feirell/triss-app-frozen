const DEFAULT_IDENTITY = <K extends any[]>(a: K, b: K) => {
  if (a.length != b.length) return false;

  for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;

  return true;
};

export class MultiKeyMap<Key extends any[], Value> {
  // TODO implement faster variation
  private storage: [Key, Value][] = [];

  constructor(private identity: (a: Key, b: Key) => boolean = DEFAULT_IDENTITY) {}

  has(search: Key): boolean {
    for (const [key, value] of this.storage) if (this.identity(search, key)) return true;

    return false;
  }

  set(search: Key, value: Value) {
    for (const entry of this.storage)
      if (this.identity(search, entry[0])) {
        entry[1] = value;
        return;
      }

    this.storage.push([search.slice() as Key, value]);
  }

  get(search: Key): undefined | Value {
    for (const [key, value] of this.storage) if (this.identity(search, key)) return value;

    return undefined;
  }

  *values() {
    for (const entry of this.storage) yield entry[1];
  }

  *keys() {
    for (const entry of this.storage) yield entry[0] as Readonly<Key>;
  }

  entries() {
    return (this.storage as [Readonly<Key>, Value][]).values();
  }

  delete(search: Key) {
    for (let i = 0; i < this.storage.length; i++)
      if (this.identity(search, this.storage[i][0])) {
        this.storage.splice(i, 1);
        return true;
      }

    return false;
  }
}

export class MarkedCache<
  MultipleKeys extends boolean,
  Key extends MultipleKeys extends true ? any[] : any,
  Value
> {
  private map: Map<Key, {wasUsed: boolean; value: Value}>;
  private cachedValues: Value[] = [];

  constructor(
    private multipleKeys: MultipleKeys,
    private producer: (key: Key) => Value,
    /**
     * Return undefined if the value is not reusable by all of the keys.
     */
    private toCache: (key: Key, value: Value) => Value | undefined,
    private fromCache: (key: Key, value: Value) => Value
  ) {
    this.map = multipleKeys ? (new MultiKeyMap() as any) : new Map();
  }

  public markAllUnused() {
    for (const entry of this.map.values()) entry.wasUsed = false;
  }

  public getOrProduce(key: Key) {
    const got = this.map.get(key);

    if (got) {
      got.wasUsed = true;
      return got.value;
    } else {
      let value: Value;
      if (this.cachedValues.length != 0) {
        const cachedValue = this.cachedValues.pop()!;
        value = this.fromCache(key, cachedValue);
      } else {
        value = this.producer(key);
      }

      this.map.set(key, {wasUsed: true, value});

      return value;
    }
  }

  public removeAllUnused() {
    this.cachedValues = [];
    const cw = this.cachedValues;

    const toBeRemoved: [Key, Value][] = [];

    for (const [key, {wasUsed, value}] of this.map.entries()) {
      if (wasUsed) continue;

      const cacheReadyValue = this.toCache(key, value);
      toBeRemoved.push([key, value]);

      if (cacheReadyValue !== undefined) cw.push(cacheReadyValue);
    }

    for (const [elem] of toBeRemoved) this.map.delete(elem);

    return toBeRemoved;
  }

  *values() {
    for (const entry of this.map.values()) yield entry.value;
  }

  keys() {
    return this.map.keys();
  }

  *entries(): Generator<[Key, Value]> {
    for (const [key, value] of this.map.entries()) yield [key, value.value];
  }
}
