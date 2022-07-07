
export interface PackageJSON {
  name: string;

  description?: string;
  dependencies?: {
    [key: string]: string;
  };
}

export function ensureUsablePackageJson(val: unknown): val is PackageJSON {
  if (typeof val != "object" || val === null)
    throw new Error("The value is not an object");

  if (!("name" in val))
    throw new Error("Field name is missing");

  if (typeof (val as any).name != "string")
    throw new Error("Field name does not contain a string");

  if ("description" in val)
    if (typeof (val as any).description != "string")
      throw new Error("description field is present but does not contain a string");

  if ("dependencies" in val) {
    const dep = (val as any).dependencies;
    if (typeof dep != "object" || dep === null)
      throw new Error("dependencies field is present but does not contain an object");

    for (const [key, value] of Object.entries(dep)) {
      // key is always a string
      if (typeof value != "string")
        throw new Error("The entry '" + key + "' in the dependencies object is not of type string but" + typeof value);
    }
  }

  return true;
}
