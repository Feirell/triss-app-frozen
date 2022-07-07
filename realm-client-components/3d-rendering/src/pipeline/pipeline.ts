import {forgeStaticPipelineFunction} from "./forge-static-pipeline-processor";

type AnyObj = object;

type StrKeys<O extends AnyObj> = Extract<keyof O, string>;

type Names<A extends AnyObj, B extends AnyObj> = StrKeys<A> | StrKeys<B>;
type Joined<A extends AnyObj, B extends AnyObj> = Pick<A & B, Names<A, B>>;

export type ValuesMap<RM extends AnyObj, Names extends StrKeys<RM>> = {
  [Key in Names]: RM[Key];
};

export interface RegisteredMapper<Initial extends AnyObj, RM extends AnyObj> {
  id: StrKeys<RM>;
  dependencies: Names<Initial, RM>[];
  fnc: (arg: object) => any;
}

export class Pipeline<Initial extends AnyObj, RM extends AnyObj = AnyObj> {
  public rm!: RM;

  private mapper = new Map<StrKeys<RM>, RegisteredMapper<Initial, RM>>();

  // TODO TYPE-BUG
  registerMapper<Identifier extends string, RIDepending extends Names<Initial, RM>, MappedType>(
    id: Identifier,
    dependingOn: RIDepending[],
    fnc: (arg: ValuesMap<Joined<Initial, RM>, RIDepending>) => MappedType
  ) {
    if (typeof id != "string") throw new Error("Can not register mapper on a non string value.");

    // TODO add loop check
    this.mapper.set(id as any, {
      id: id as any,
      dependencies: dependingOn,
      fnc: fnc as any,
    });

    type NewRM = RM & Record<Identifier, MappedType>;
    return this as any as Pipeline<Initial, NewRM>;
  }

  hasMapper(mapper: string) {
    return this.mapper.has(mapper as any);
  }

  processFor<Name extends Names<Initial, RM>>(
    initial: Initial | Map<StrKeys<Initial>, any>,
    name: Name
  ) {
    const values = (
      initial instanceof Map ? new Map(initial) : new Map(Object.entries(initial))
    ) as Map<Names<Initial, RM>, any>;

    if (values.has(name)) return values.get(name) as Joined<Initial, RM>[Name];

    const needed = new Map<StrKeys<RM>, RegisteredMapper<Initial, RM>>();
    const addAsNeeded = (val: Names<Initial, RM>) => {
      const metric = this.getMapper(val as any);
      needed.set(val as StrKeys<RM>, metric);
    };

    addAsNeeded(name);

    while (needed.size > 0) {
      // TODO implement loop detection by checking if the needed set did not change
      for (const [name, mapper] of needed.entries()) {
        let allFulfilled = true;

        for (const dep of mapper.dependencies)
          if (!values.has(dep)) {
            allFulfilled = false;
            addAsNeeded(dep);
          }

        if (allFulfilled) {
          const fnc = mapper.fnc;
          const arg: {[key: string]: any} = {};
          for (const dep of mapper.dependencies) arg[dep] = values.get(dep)!;

          needed.delete(name);
          values.set(name, fnc(arg));
        }
      }
    }

    return values.get(name) as Joined<Initial, RM>[Name];
  }

  getMappingLayer<Name extends Names<Initial, RM>>(
    name: Name,
    initialValuesCheck: undefined | StrKeys<Initial>[] = undefined
  ) {
    const initials: StrKeys<Initial>[] = [];
    const layer: StrKeys<RM>[][] = [];

    const isInitial =
      initialValuesCheck !== undefined
        ? (val: any): val is StrKeys<Initial> => initialValuesCheck.includes(val)
        : (val: any): val is StrKeys<Initial> => !this.mapper.has(val);

    if (isInitial(name)) {
      initials.push(name);
      return {initials, layer};
    }

    const needed = new Map<StrKeys<RM>, RegisteredMapper<Initial, RM>>();
    const addAsNeeded = (val: Names<Initial, RM>) => {
      const metric = this.getMapper(val as any);
      needed.set(val as StrKeys<RM>, metric);
    };

    const processed = new Set<Names<Initial, RM>>();

    addAsNeeded(name);
    while (needed.size > 0) {
      const currentLayer: StrKeys<RM>[] = [];

      for (const [name, mapper] of needed.entries()) {
        let allFulfilled = true;

        for (const dep of mapper.dependencies)
          if (isInitial(dep)) {
            if (!initials.includes(dep)) initials.push(dep);
          } else if (!processed.has(dep)) {
            allFulfilled = false;
            addAsNeeded(dep);
          }

        if (allFulfilled) {
          needed.delete(name);
          processed.add(name);
          currentLayer.push(name);
        }
      }

      // TODO improve error description to allow the resolving of the issue
      if (currentLayer.length == 0)
        throw new Error(
          "There was at least one resolve needed but could not resolve the all dependencies for " +
            Array.from(needed.keys()).join(", ") +
            ". This is probably because the dependencies are cyclic."
        );

      layer.push(currentLayer);
    }

    return {initials, layer};
  }

  forgeStaticPipelineFunction<Name extends Names<Initial, RM>>(
    name: Name,
    initialValuesCheck: undefined | StrKeys<Initial>[] = undefined
  ) {
    const {initials, layer} = this.getMappingLayer(name, initialValuesCheck);

    const steps = [];
    for (const l of layer) for (const entry of l) steps.push(this.mapper.get(entry)!);

    return forgeStaticPipelineFunction(initials, steps) as (
      initial: Initial
    ) => Joined<Initial, RM>[Name];
  }

  private getMapper(name: StrKeys<RM>) {
    const m = this.mapper.get(name);

    if (m == undefined) throw new Error("Could not find a mapper with the name " + name);

    return m;
  }
}
