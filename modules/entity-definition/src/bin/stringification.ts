import {pipe} from "./iterator-pipe";

export function lineBreakForLineLength(lineLength: number, linebreak = "\n", itembreak = " ") {
  return function collect(collector: any = "", item: string, index: number) {
    let sep = "";

    if (index > 0)
      if (collector.length - collector.lastIndexOf("\n") + itembreak.length + item.length > lineLength)
        sep = linebreak;
      else
        sep = itembreak;

    return collector + sep + item;
  };
}

export function createFrm<T>(
  elements: Iterable<T>,
  mapper: (value: T) => string = toJSLiteral,
  direction: "pre" | "post" = "pre") {
  let maxLength = 0;

  for (const e of elements) {
    const l = mapper(e).length;
    if (l > maxLength)
      maxLength = l;
  }

  const pad = direction == "pre" ?
    String.prototype.padStart :
    String.prototype.padEnd;

  return function format(value: T) {
    return pad.call(mapper(value), maxLength, " ");
  };
}

type TypeofIds =
  | "undefined"
  | "object"
  | "boolean"
  | "number"
  | "bigint"
  | "string"
  | "symbol"
  | "function";

export function extractType<T>(val: Iterable<T>) {
  const set = new Set<TypeofIds>();

  for (const v of val)
    set.add(typeof v);

  return [...set.values()].sort();
}

export function toJSLiteral(v: any) {
  return JSON.stringify(v);
}

export function itemsToTypeUnionLiteral<K>(
  items: Iterable<K>, {
    valueStringifier = toJSLiteral,
    lineLength = 100
  }: {
    valueStringifier?: (k: K) => string;
    lineLength?: number;
  } = {}) {

  const frmKey = createFrm(items, valueStringifier);

  return `${pipe(items)
    .map(v => "| " + frmKey(v))
    .reduce(lineBreakForLineLength(lineLength, "\n  "), "  ")
  }`;
}

const keys = <T>(ite: Iterable<[T, any]>) =>
  pipe(ite).map(v => v[0]);

const values = <T>(ite: Iterable<[any, T]>) =>
  pipe(ite).map(v => v[1]);

export function mapToTSLiteral<K, V>(
  map: Iterable<[K, V]>, {
    keyStringifier = toJSLiteral,
    valueStringifier = toJSLiteral,
    lineLength = 100,
    keyType = extractType(keys(map)).join(" | "),
    valueType = extractType(values(map)).join(" | ")
  }: {
    keyStringifier?: (k: K) => string;
    valueStringifier?: (v: V) => string;
    lineLength?: number;
    keyType?: string;
    valueType?: string;
  } = {}) {

  const frmKey = createFrm(keys(map), keyStringifier);
  const frmVal = createFrm(values(map), valueStringifier);

  const collector = lineBreakForLineLength(lineLength, ",\n  ", ", ");

  return `new Map<${keyType}, ${valueType}>([
${pipe(map)
    .map(([k, v]) => `[${frmKey(k)}, ${frmVal(v)}]`)
    .reduce(collector, "  ")
  }
])`;
}
