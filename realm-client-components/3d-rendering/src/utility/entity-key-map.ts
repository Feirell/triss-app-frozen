import {EntityCategory, EntityIdentifier} from "@triss/dto";

type Category = EntityIdentifier["idCategory"];
type InstanceIdentifier = EntityIdentifier["idNumber"];

// TODO move this to its own package
export class EntityKeyMap<Value> implements Map<EntityIdentifier, Value> {
  readonly [Symbol.toStringTag] = "EntityKeyMap" as const;
  private categoryMap = new Map<Category, Map<InstanceIdentifier, Value>>();

  get size() {
    let sum = 0;
    for (const map of this.categoryMap.values()) {
      sum += map.size;
    }

    return sum;
  }

  *[Symbol.iterator](): IterableIterator<[EntityIdentifier, Value]> {
    const category = "EntityIdentifier";

    for (const [idCategory, instanceMap] of this.categoryMap) {
      for (const [idNumber, value] of instanceMap) {
        const entityIdentifier: EntityIdentifier = {
          category,
          idCategory,
          idNumber,
        };

        yield [entityIdentifier, value] as [EntityIdentifier, Value];
      }
    }
  }

  clear(): void {
    this.categoryMap.clear();
  }

  delete(key: EntityIdentifier): boolean {
    const map = this.categoryMap.get(key.idCategory);

    if (!map) return false;

    return map.delete(key.idNumber);
  }

  entries(): IterableIterator<[EntityIdentifier, Value]> {
    return this[Symbol.iterator]();
  }

  *entriesForCategory<SearchCategory extends EntityCategory>(
    category: SearchCategory
  ): IterableIterator<[EntityIdentifier<SearchCategory>, Value]> {
    const map = this.categoryMap.get(category);

    if (map)
      for (const [key, value] of map) {
        yield [
          {
            category: "EntityIdentifier",
            idCategory: category,
            idNumber: key,
          },
          value,
        ];
      }
  }

  forEach(
    callbackfn: (value: Value, key: EntityIdentifier, map: Map<EntityIdentifier, Value>) => void,
    thisArg?: any
  ): void {
    // TODO honor the this argument for the callbackfn
    for (const [key, value] of this) {
      callbackfn(value, key, this);
    }
  }

  get(key: EntityIdentifier): Value | undefined {
    const map = this.categoryMap.get(key.idCategory);

    if (!map) return undefined;

    return map.get(key.idNumber);
  }

  has(key: EntityIdentifier): boolean {
    const map = this.categoryMap.get(key.idCategory);

    if (!map) return false;

    return map.has(key.idNumber);
  }

  *keys(): IterableIterator<EntityIdentifier> {
    for (const [key] of this) yield key;
  }

  set(key: EntityIdentifier, value: Value): this {
    let map = this.categoryMap.get(key.idCategory);

    if (!map) {
      map = new Map();
      this.categoryMap.set(key.idCategory, map);
    }

    map.set(key.idNumber, value);

    return this;
  }

  *values(): IterableIterator<Value> {
    for (const [key, value] of this) yield value;
  }

  clone() {
    const clone = new EntityKeyMap<Value>();

    const catMap = clone.categoryMap;

    for (const [key, value] of this.categoryMap) catMap.set(key, new Map(value));

    return clone;
  }
}
