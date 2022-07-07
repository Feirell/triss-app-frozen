export interface EntityType<T> {
  isValidValue(val: any): val is T;

  getValidAsString(): string;

  getAllValid(): ReadonlyArray<T>;

  [Symbol.iterator](): IterableIterator<T>;
}
