const isIdentifier = (str: string) => /^[a-zA-Z_][a-zA-Z_0-9]*$/.test(str);

const tryToConvertToIdentifier = (str: string) =>
  str
    .replace(/[ -]+(.)/g, (full, m1) => m1.toUpperCase())
    .split("")
    .filter(v => /[a-zA-Z_]/)
    .join("");

class UniqueIdentifierMapper {
  private readonly names: {
    original: string;
    mapped: string;
  }[] = [];

  canBeUsed(name: string) {
    if (!isIdentifier(name)) return;

    return !this.names.find(({mapped}) => mapped == name);
  }

  getNextUnused(prefix = "_") {
    if (!isIdentifier(prefix)) prefix = "_";

    for (let i = 0; i < 0xffff; i++) {
      const name = prefix + i.toString(16).padStart(4, "0");
      if (this.canBeUsed(name)) return name;
    }

    throw new Error("Could not find a usable name within 0xffff variations of the name.");
  }

  getIdentifier(name: string): string {
    const found = this.names.find(({original}) => original == name);

    if (found) return found.mapped;

    const mapped = this.createMapped(name);
    this.names.push({original: name, mapped});

    return mapped;
  }

  private createMapped(name: string) {
    if (this.canBeUsed(name)) return name;

    const converted = tryToConvertToIdentifier(name);
    if (this.canBeUsed(converted)) return converted;

    return this.getNextUnused(converted);
  }
}

const indent = (str: string, depth: number) =>
  " ".repeat(depth) + str.replace(/\n(.)/g, (f, m1) => "\n" + " ".repeat(depth) + m1);

export function forgeStaticPipelineFunction(
  initial: string[],
  steps: {
    id: string;
    dependencies: string[];
    fnc: (arg: object) => any;
  }[]
) {
  // check uniqueness:
  const ids = new Set<string>();
  for (const name of initial)
    if (ids.has(name))
      throw new Error(
        'Name "' + name + '" of initial was already in use, there was a duplication.'
      );
    else ids.add(name);

  for (const {id: name} of steps)
    if (ids.has(name))
      throw new Error('Name "' + name + '" of steps was already in use, there was a duplication.');
    else ids.add(name);

  const idMapper = new UniqueIdentifierMapper();
  let wrapperCode = "";
  let fncCode = "";

  if (initial.length > 0) {
    for (const name of initial) {
      const id = idMapper.getIdentifier(name);

      if (isIdentifier(name)) fncCode += "const " + id + " = init." + name + ";\n";
      else fncCode += "const " + id + ' = init["' + name + '"];\n';
    }

    fncCode += "\n";
  }

  if (steps.length > 0) {
    for (const mapper of steps) {
      const id = idMapper.getIdentifier(mapper.id);
      wrapperCode += "const " + id + 'Mapper = getFnc("' + mapper.id + '");\n';

      if (mapper.dependencies.length == 0) {
        fncCode += "const " + id + " = " + id + "Mapper();\n";
        continue;
      }

      const dependencyObjMap = mapper.dependencies.map(dep => [dep, idMapper.getIdentifier(dep)]);

      let depStr;
      if (dependencyObjMap.every(([dep, id]) => dep == id))
        depStr = dependencyObjMap.map(v => v[0]).join(", ");
      else {
        depStr = "";
        for (const [dep, id] of dependencyObjMap) {
          if (depStr.length > 0) depStr += ",\n";

          if (isIdentifier(dep)) depStr += dep + ": " + id;
          else depStr += '"' + dep + '": ' + id;
        }
        depStr = "\n" + indent(depStr, 2) + "\n";
      }

      fncCode += "const " + id + " = " + id + "Mapper({" + depStr + "});\n";
    }

    fncCode += "\n";
  }

  if (steps.length > 0)
    fncCode += "return " + idMapper.getIdentifier(steps[steps.length - 1].id) + ";\n";
  else fncCode += "return " + idMapper.getIdentifier(initial[initial.length - 1]) + ";\n";

  const getFnc = (name: string) => {
    const found = steps.find(m => m.id == name);
    if (!found) throw new Error('Could not find the step with the name "' + name + '"');

    return found.fnc;
  };

  const fullCode =
    "return function wrapper(getFnc) {\n" +
    indent(
      "" +
        wrapperCode +
        "\n" +
        "return function process(init) {\n" +
        indent("" + fncCode, 2) +
        "}\n",
      2
    ) +
    "}";

  return Function(fullCode)()(getFnc);
}
