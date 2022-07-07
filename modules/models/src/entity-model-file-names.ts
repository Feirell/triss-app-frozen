import {camelCaseToUpperCase, upperToCamelCase} from "./camel-case";


export abstract class BaseEntityModelsDirectory<T> {
  constructor(
    protected readonly name: string
  ) {
  }

  getName() {
    return this.name;
  }

  getDirectoryName() {
    return this.getName() + "s";
  }

  abstract idToFileName(id: T): string;

  abstract fileNameToId(fn: string): T

  getPartialPath(id: T) {
    return this.getDirectoryName() + "/" + this.idToFileName(id);
  }
}

export abstract class EntityModelCamelCaseName extends BaseEntityModelsDirectory<string> {
  protected readonly matchRegex = /^([a-zA-Z]+).glb$/;

  fileNameToId(fn: string): string {
    const match = this.matchRegex.exec(fn);

    if (!match)
      throw new Error("Could not parse the file name '" + fn + "' with the pattern " + this.matchRegex.source);

    const [full, group] = match;

    return camelCaseToUpperCase(group);
  }

  idToFileName(id: string): string {
    if (typeof (id as any) != "string")
      throw new Error("The given id '" + id + "' is not a number");

    return upperToCamelCase(id) + ".glb";
  }
}

export class EntityModelPadNumberName extends BaseEntityModelsDirectory<number> {
  protected readonly matchRegex: RegExp;

  constructor(
    name: string,
    protected readonly digits: number = 3
  ) {
    super(name);

    this.matchRegex = new RegExp("^" + name + "(\\d{" + digits + "})\\.glb$");
  }

  fileNameToId(fn: string): number {
    const match = this.matchRegex.exec(fn);

    if (!match)
      throw new Error("Could not parse the file name '" + fn + "' with the pattern " + this.matchRegex.source);

    const [full, group] = match;

    const nr = Number.parseInt(group, 10);
    if (!Number.isInteger(nr))
      throw new Error("Parsed number for match " + group + " in file name " + full + " is not a finite number");

    return nr;
  }

  idToFileName(id: number): string {
    if (!Number.isInteger(id))
      throw new Error("The given id '" + id + "' is not a finite integer");

    if (id < 0)
      throw new Error("The id '" + id + "' is negative");

    if (Math.ceil(Math.log10(id)) > this.digits)
      throw new Error("The number " + id + " has more digits than the allowed " + this.digits);

    return this.name + id.toString(10).padStart(this.digits, "0") + ".glb";
  }
}
