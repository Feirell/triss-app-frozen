import chalk, {Chalk} from "chalk";

// UTIL

interface Constructor {
  new(...args: any[]): any;

  constructor: Constructor;
}

const isPrototype = (inst: object): inst is Constructor => inst === inst.constructor.prototype;

const getConstructor = (inst: ((...args: any[]) => any) | Constructor | object) => {
  if (typeof inst == "function") return inst;

  if (isPrototype(inst)) return inst.constructor;

  return Object.getPrototypeOf(inst).constructor;
};

const split = /[a-z][A-Z]/g;

const formatNumber = (n: number, l = 2) => n.toString().padStart(l, "0");
const timestring = () => new Date().toLocaleTimeString();
const upperToDashed = (str: string) =>
  str.replace(split, substr => substr[0] + "-" + substr[1]).toUpperCase();

type LogFnc = (...args: any[]) => undefined;
type ColorDefinition = {chalkColor: Chalk; consoleColor: string};

const checkSuitableNumber = (n: any): n is number => Number.isInteger(n) && n >= 0 && n <= 255;

function createColorDefinition(r: number, g: number, b: number) {
  if (!(Number.isInteger(r) && r >= 0 && r <= 255))
    throw new TypeError("r needs to be an integer in the range 0 to 255 but was " + r);

  if (!(Number.isInteger(g) && g >= 0 && g <= 255))
    throw new TypeError("g needs to be an integer in the range 0 to 255 but was " + g);

  if (!(Number.isInteger(b) && b >= 0 && b <= 255))
    throw new TypeError("b needs to be an integer in the range 0 to 255 but was " + b);

  return {
    chalkColor: chalk.rgb(r, g, b),
    consoleColor: "rgb(" + r + ", " + g + ", " + b + ")"
  };
}

declare const window: any;

const threadId = (() => {
  try {
    if (typeof window === undefined)
      return "";

    const w = require("node:worker_threads");
    if (w.isMainThread)
      return "[MAIN]";
    else if (typeof w.threadId == "number")
      return "[W-" + w.threadId.toString(10).padStart(2, "0") + "]";
    else
      return "[W-??]";
  } catch (e) {
    return "";
  }
})();

export class Logger {
  private readonly label: string;

  private readonly colors: {
    prefix: ColorDefinition;
    log: ColorDefinition;
    info: ColorDefinition;
    debug: ColorDefinition;
    warn: ColorDefinition;
    error: ColorDefinition;
  };

  constructor(name: string, instanceNumber?: number, private con = console) {
    this.label =
      upperToDashed(name) +
      (isFinite(instanceNumber as any) ? "-" + formatNumber(instanceNumber as number) : "");

    this.colors = Object.seal({
      prefix: createColorDefinition(128, 128, 128),
      log: createColorDefinition(144, 238, 144),
      info: createColorDefinition(128, 128, 128),
      debug: createColorDefinition(128, 128, 128),
      warn: createColorDefinition(255, 255, 224),
      error: createColorDefinition(255, 0, 0)
    });
  }

  /**
   * Sets the color for the tag in front of the actual massage.
   * @param part which part you want to change the color for
   *
   * @param r an integer in the range of [0, 255] (inclusive)
   * @param g an integer in the range of [0, 255] (inclusive)
   * @param b an integer in the range of [0, 255] (inclusive)
   */
  setColor(part: keyof Logger["colors"], r: number, g: number, b: number) {
    this.colors[part] = createColorDefinition(r, g, b);
  }

  log(...args: any[]) {
    this.print(this.con.log as LogFnc, this.colors.log, args);
  }

  info(...args: any[]) {
    this.print((this.con as any).info, this.colors.info, args);
  }

  debug(...args: any[]) {
    this.print((this.con as any).debug, this.colors.debug, args);
  }

  warn(...args: any[]) {
    this.print(this.con.warn as LogFnc, this.colors.warn, args);
  }

  error(...args: any[]) {
    this.print(this.con.error as LogFnc, this.colors.error, args);
  }

  private print(logFnc: LogFnc, labelColor: ColorDefinition, args: any[]) {
    const hasPattern = typeof args[0] == "string";
    const prefixColor = this.colors.prefix;

    if (chalk.level == 0)
      // assuming that this is a browser
      logFnc(
        "%c%s%c [%c%s%c] " + (hasPattern ? args[0] : ""),
        "color: " + prefixColor.consoleColor,
        timestring(),
        "color: unset",

        "color: " + labelColor.consoleColor,
        this.label,
        "color: unset",

        ...(hasPattern ? args.slice(1) : args)
      );
    // the stdout supports ANSI colors, use chalk
    else
      logFnc(
        "%s [%s] " + (hasPattern ? args[0] : ""),
        prefixColor.chalkColor(timestring() + (threadId.length > 0 ? " " + threadId : "")),

        labelColor.chalkColor(this.label),

        ...(hasPattern ? args.slice(1) : args)
      );
  }
}

const getAndIncreaseInstanceCounter = (() => {
  const instanceTracker = new WeakMap();

  return (target: any, reset = false) => {
    if (reset || !instanceTracker.has(target)) {
      instanceTracker.set(target, 0);
      return 0;
    } else {
      const instanceNumber = instanceTracker.get(target) + 1;
      instanceTracker.set(target, instanceNumber);
      return instanceNumber;
    }
  };
})();

export function applyOnTarget(
  target: any,
  propertyName: string,
  {useInstanceNumber = true, con = console} = {}
) {
  const isStatic = isPrototype(target) || typeof target === "function";
  const constructor = getConstructor(target);

  const name = constructor.name;
  const instanceNumber =
    !isStatic && useInstanceNumber ? getAndIncreaseInstanceCounter(target) : undefined;

  const logger = new Logger(name, instanceNumber, con);
  Object.defineProperty(target, propertyName, {
    value: logger,
    enumerable: false
  });
}

/**
 * This function is a decorator which can be used on attributes.
 * Be aware that the injected Logger instance is the same for all instances of this class!
 *
 ```ts
 class Example{
    @Log()
    private logger!: Logger;

    exampleMethode(){
        this.logger.log("exampleMethode was called");
    }
 }
 ```
 */
export function Log(con = console, ...decoratorArgs: any[]) {
  // target is either a prototype or the constructor function, hopefully they will offer a way of
  // accessing the actual instance (one could with getter and some workaround but you should not)
  return (target: any, propertyName: any) => applyOnTarget(target, propertyName, {con});
}
