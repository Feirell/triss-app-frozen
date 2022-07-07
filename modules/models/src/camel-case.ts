export function upperToCamelCase(str: string) {
  const wordBoundary = /_([a-z])/g;
  const lower = str.toLowerCase();
  return lower.replace(wordBoundary, (m, letter) => letter.toUpperCase());
}

export function camelCaseToUpperCase(str: string) {
  const wordBoundary = /([A-Z])/g;
  const seperated = str.replace(wordBoundary, (m, letter) => "_" + letter);
  return seperated.toUpperCase();
}
