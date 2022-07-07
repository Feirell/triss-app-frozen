import {EntityIdentifier} from "@triss/dto";

export class EntityIdentifierSet {
  private map = new Map<EntityIdentifier["idCategory"], Set<number>>();

  add(entityIdentifier: EntityIdentifier) {
    let set = this.map.get(entityIdentifier.idCategory);

    if (!set) this.map.set(entityIdentifier.idCategory, (set = new Set()));

    set.add(entityIdentifier.idNumber);
  }

  has(entityIdentifier: EntityIdentifier) {
    const set = this.map.get(entityIdentifier.idCategory);

    if (!set) return false;

    return set.has(entityIdentifier.idNumber);
  }

  *values() {
    for (const [idCategory, associatedNumbers] of this.map)
      for (const idNumber of associatedNumbers) yield {idCategory, idNumber} as EntityIdentifier;
  }

  getAllValues() {
    return Array.from(this.values());
  }

  unify(other: EntityIdentifierSet) {
    const ret = new EntityIdentifierSet();
    const inBoth = new Set<EntityIdentifier["idCategory"]>();

    for (const [a, b] of [
      [this, other],
      [other, this],
    ])
      for (const [category, numbers] of a.map)
        if (b.map.has(category)) inBoth.add(category);
        else ret.map.set(category, new Set(numbers));

    for (const category of inBoth) {
      const thisSet = this.map.get(category)!;
      const otherSet = other.map.get(category)!;

      // copying the bigger of the two and appending the smaller one
      const [copy, append] = [thisSet, otherSet].sort((a, b) => b.size - a.size);

      for (const entry of append) copy.add(entry);

      ret.map.set(category, copy);
    }

    return ret;
  }
}
