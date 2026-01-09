import type { Database } from "@/types/database";

// Convert snake_case string to camelCase at type level
type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

// Transform object keys to camelCase (shallow - just top-level keys)
export type KeysToCamelCase<T> = T extends object
  ? string extends keyof T
    ? T // Has index signature (like Json), don't transform
    : { [K in keyof T as SnakeToCamelCase<K & string>]: T[K] }
  : T;

// Transform Database schema - table names and Row/Insert/Update keys
type CamelCaseSchema<D> = {
  [K in keyof D]: K extends "__InternalSupabase"
    ? D[K]
    : K extends "public"
      ? {
          [P in keyof D[K]]: P extends "Tables" | "Views"
            ? {
                [T in keyof D[K][P] as SnakeToCamelCase<T & string>]: {
                  [R in keyof D[K][P][T]]: R extends "Row" | "Insert" | "Update"
                    ? KeysToCamelCase<D[K][P][T][R]>
                    : D[K][P][T][R];
                };
              }
            : D[K][P];
        }
      : D[K];
};

export type CamelCaseDatabase = CamelCaseSchema<Database>;
