import crypto from "crypto";
import {TwoDArray} from "./two-d-array";


const md5Hash = (val: any) => {
  const h = crypto.createHash("MD5");
  h.write(val);
  return h.digest();
};

export class PseudoRandomNumberGenerator {
  private state: Buffer;

  constructor(seed: string) {
    this.state = md5Hash(seed);
  }

  next() {
    this.state = md5Hash(this.state);
    return this.state.readUInt32BE() / 0xffffffff;
  }

  intInRange(min: number, max: number) {
    return min + Math.floor(this.next() * (max - min));
  }

  pickRandom<T>(arr: T[]): T {
    if (arr.length == 0) throw new Error("The array is empty");

    const index = this.intInRange(0, arr.length);
    return arr[index];
  }
}

class CoordRegister {
  private readonly coordSet = new Map<string, {x: number; y: number}>();

  add(x: number, y: number) {
    return this.coordSet.set(x + "-" + y, {x, y});
  }

  has(x: number, y: number) {
    return this.coordSet.has(x + "-" + y);
  }

  *entries() {
    for (const {x, y} of this.coordSet.values()) yield [x, y];
  }

  get size() {
    return this.coordSet.size;
  }

  remove(x: number, y: number) {
    this.coordSet.delete(x + "-" + y);
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  extractOne() {
    for (const [x, y] of this) {
      this.remove(x, y);
      return [x, y];
    }
  }
}

interface ChooseNext<Option> {
  /**
   * This function is called when there are cells which are not fully defined.
   * You need to return one of the options and reduce the options set, ideally to just one option left.
   *
   * @param cells
   */
  (cells: {x: number; y: number; options: Option[]}[]): {x: number; y: number; options: Option[]};
}

interface UpdateOptions<Option> {
  /**
   * This function will be called to progress the solver.
   * You can either return an array with multiple options, one option or none.
   * The last one will raise an error but might be correct because there is no solution.
   *
   * @param x
   * @param y
   * @param current
   * @param top
   * @param right
   * @param bottom
   * @param left
   */
  (
    x: number,
    y: number,
    current: Option[],
    top: Option[] | "edge",
    right: Option[] | "edge",
    bottom: Option[] | "edge",
    left: Option[] | "edge"
  ): Option[];
}

interface OptionsEqual<Option> {
  (a: Option, b: Option): boolean;
}

export class WaveSolver<Option> {
  private readonly optionsField = new TwoDArray<Option[]>(this.dimension, this.dimension);
  // private readonly undecided: [number, number][] = [];
  private readonly undecided = new CoordRegister();

  constructor(
    private readonly dimension: number,
    private readonly initialOptions: Option[],
    private readonly chooseFromBest: ChooseNext<Option>,
    private readonly updateOptions: UpdateOptions<Option>,
    private readonly optionsEqual: OptionsEqual<Option>
  ) {
    for (let x = 0; x < dimension; x++)
      for (let y = 0; y < dimension; y++) {
        this.optionsField.set(x, y, this.initialOptions);
        this.undecided.add(x, y);
      }
  }

  step() {
    if (this.undecided.size == 0) return;

    const field = this.optionsField;

    let certainty = this.initialOptions.length;
    let equallyCertain: {x: number; y: number; options: Option[]}[] = [];

    for (const [x, y] of this.undecided) {
      const options = field.get(x, y);

      if (!options) continue;

      const elemCertainty = options.length;
      const entry = {x, y, options};

      if (elemCertainty < certainty) {
        certainty = elemCertainty;
        equallyCertain = [entry];
      } else if (elemCertainty == certainty) {
        equallyCertain = [...equallyCertain, entry];
      }
    }

    const {x, y, options} = this.chooseFromBest(equallyCertain);
    this.changeCellOptions(x, y, options);
  }

  changeCellOptions(x: number, y: number, reducedOptions: Option[]) {
    const currentOptions = this.optionsField.get(x, y);
    if (!currentOptions) throw new Error("This field is out of range");

    if (reducedOptions.length == 0) throw new Error("Cell has no reducedOptions");

    for (const rp of reducedOptions)
      if (!currentOptions.find(co => this.optionsEqual(co, rp)))
        throw new Error(
          "Could not pick reducedOptions because it contained an option which was not included in the current options"
        );

    // was identical
    if (reducedOptions.length == currentOptions.length) return;

    this.optionsField.set(x, y, reducedOptions);

    if (reducedOptions.length == 1) this.undecided.remove(x, y);

    const other = [
      [x, y + 1],
      [x + 1, y],
      [x, y - 1],
      [x - 1, y],
    ] as const;
    for (const [x, y] of other) {
      if (
        x >= 0 &&
        x < this.dimension &&
        y >= 0 &&
        y < this.dimension &&
        this.undecided.has(x, y)
      ) {
        // This is the cascade
        const elem = this.optionsField.get(x, y);

        if (!elem) throw new Error("Does not have the entry but it should");

        const top: Option[] | "edge" = this.optionsField.get(x, y + 1) || "edge";
        const right: Option[] | "edge" = this.optionsField.get(x + 1, y) || "edge";
        const bottom: Option[] | "edge" = this.optionsField.get(x, y - 1) || "edge";
        const left: Option[] | "edge" = this.optionsField.get(x - 1, y) || "edge";

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const current = this.optionsField.get(x, y)!;
        const decided = this.updateOptions(x, y, current, top, right, bottom, left);
        this.changeCellOptions(x, y, decided);
      }
    }
  }

  solve() {
    while (this.undecided.size > 0) this.step();
  }

  getField() {
    return this.optionsField;
  }

  amountOfUndecided() {
    return this.undecided.size;
  }
}
