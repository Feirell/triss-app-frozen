// copied from the random exit driver

export class TwoDArray<K> {
  private emptyMarker = {};
  private backing: (K | object)[];

  clone() {
    const c = new TwoDArray<K>(this.width, this.height);

    const em = this.emptyMarker;
    const source = this.backing;
    const target = c.backing;

    for (let i = 0; i < target.length; i++) if (source[i] !== em) target[i] = source[i];

    return c;
  }

  constructor(private width: number, private height: number) {
    this.backing = new Array(width * height).fill(this.emptyMarker);
  }

  has(x: number, y: number) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;

    const index = x * this.height + y;
    return this.backing[index] != this.emptyMarker;
  }

  get(x: number, y: number, empty = undefined): typeof empty | K {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return undefined;

    const index = x * this.height + y;
    const cellContent = this.backing[index];
    return cellContent == this.emptyMarker ? empty : (cellContent as K);
  }

  set(x: number, y: number, value: K) {
    if (x < 0 || x >= this.width)
      throw new Error("x is out of the bounds [0, " + (this.width - 1) + "]");

    if (y < 0 || y >= this.height)
      throw new Error("y is out of the bounds [0, " + (this.height - 1) + "]");

    const index = x * this.height + y;
    this.backing[index] = value;
  }

  delete(x: number, y: number) {
    if (x < 0 || x >= this.width)
      throw new Error("x is out of the bounds [0, " + (this.width - 1) + "]");

    if (y < 0 || y >= this.height)
      throw new Error("y is out of the bounds [0, " + (this.height - 1) + "]");

    const index = x * this.height + y;
    this.backing[index] = this.emptyMarker;
  }

  clear() {
    this.backing.fill(this.emptyMarker);
  }
}

export class TwoDArrayWithShift<K> {
  private emptyMarker = {};
  private backing: (K | object)[];

  constructor(
    private xMin: number,
    private xMax: number,
    private yMin: number,
    private yMax: number
  ) {
    this.backing = new Array((xMax - xMin + 1) * (yMax - yMin + 1)).fill(this.emptyMarker);
  }

  has(x: number, y: number) {
    const {xMin, xMax, yMin, yMax} = this;

    if (x < xMin || x > xMax) return false;

    if (y < yMin || y > yMax) return false;

    const index = (x - xMin) * (yMax - yMin) + y - yMin;

    return this.backing[index] != this.emptyMarker;
  }

  get(x: number, y: number, empty = undefined): typeof empty | K {
    const cellContent = this.backing[this.calcIndex(x, y)];
    return cellContent == this.emptyMarker ? empty : (cellContent as K);
  }

  set(x: number, y: number, value: K) {
    this.backing[this.calcIndex(x, y)] = value;
  }

  delete(x: number, y: number) {
    this.backing[this.calcIndex(x, y)] = this.emptyMarker;
  }

  clear() {
    this.backing.fill(this.emptyMarker);
  }

  private calcIndex(x: number, y: number) {
    const {xMin, xMax, yMin, yMax} = this;

    if (x < xMin || x > xMax)
      throw new Error("x is out of the bounds [" + xMin + ", " + xMax + "]");

    if (y < yMin || y > yMax)
      throw new Error("y is out of the bounds [" + yMin + ", " + yMax + "]");

    return (x - xMin) * (yMax - yMin) + y - yMin;
  }
}
