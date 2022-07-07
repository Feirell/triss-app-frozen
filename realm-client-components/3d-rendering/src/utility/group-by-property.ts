export function groupByProperty<U extends object, K extends keyof U>(
  property: K,
  objects: U[]
): Map<U[K], U[]> {
  const map = new Map<U[K], U[]>();

  for (const element of objects) {
    const propertyValue = element[property];

    const arr = map.get(propertyValue);

    if (arr) {
      arr.push(element);
    } else {
      map.set(propertyValue, [element]);
    }
  }

  return map;
}
