type TypeOfRetValues = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
type TypeOfMapping<T extends TypeOfRetValues> =
  T extends "string" ? string :
    T extends "number" ? number :
      T extends "bigint" ? bigint :
        T extends "boolean" ? boolean :
          T extends "symbol" ? symbol :
            T extends "undefined" ? undefined :
              T extends "object" ? object | null :
                T extends "function" ? (...args: any[]) => any :
                  never;

function hasFieldWithType<O extends object, F extends string, T>(obj: O, fieldName: F, checker: (val: unknown) => val is T): obj is (O & { [key in F]: T }) {
  return fieldName in obj && checker((obj as any)[fieldName]);
}

export function hasFieldWithBaseType<O extends object, F extends string, T extends TypeOfRetValues>(obj: O, fieldName: F, type: T): obj is (O & { [key in F]: TypeOfMapping<T> }) {
  return fieldName in obj && typeof (obj as any)[fieldName] == type;
}
