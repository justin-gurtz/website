import {
  type SupabaseClient as OriginalSupabaseClient,
  createClient as originalCreateClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";
import camelCase from "lodash/camelCase";
import type { CamelCaseDatabase } from "@/types/camel-case";

// Custom snake_case that doesn't split on numbers (vo2MaxValue → vo2_max_value)
const toSnakeCase = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// Runtime: transform object keys to camelCase (shallow)
const keysToCamelCase = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map(keysToCamelCase) as T;
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [camelCase(key), value]),
    ) as T;
  }
  return obj;
};

// Runtime: transform object keys to snake_case (shallow)
const keysToSnakeCase = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map(keysToSnakeCase) as T;
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [toSnakeCase(key), value]),
    ) as T;
  }
  return obj;
};

// Runtime: transform comma-separated column string
const transformSelectString = (str: string): string =>
  str
    .split(",")
    .map((col) => toSnakeCase(col.trim()))
    .join(",");

type AnyFn = (...args: unknown[]) => unknown;

// Methods that take a column name as first arg
const COLUMN_METHODS = new Set([
  "order",
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "filter",
  "not",
  "like",
  "ilike",
  "is",
  "in",
  "contains",
  "containedBy",
  "match",
  "textSearch",
]);

// Methods that take data to insert/update
const DATA_METHODS = new Set(["insert", "upsert", "update"]);

// Wrap query builders to transform inputs and outputs
const wrapQueryBuilder = <T extends object>(builder: T): T => {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      // Transform results when promise resolves
      if (prop === "then") {
        return (
          onFulfilled?: (value: unknown) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) =>
          (value as AnyFn).call(
            target,
            (result: { data: unknown }) => {
              const transformed = result.data
                ? { ...result, data: keysToCamelCase(result.data) }
                : result;
              return onFulfilled?.(transformed);
            },
            onRejected,
          );
      }

      if (typeof value === "function") {
        return (...args: unknown[]) => {
          let transformedArgs = args;

          // Transform select string
          if (prop === "select" && typeof args[0] === "string") {
            transformedArgs = [
              transformSelectString(args[0]),
              ...args.slice(1),
            ];
          }
          // Transform column name (first arg)
          else if (
            COLUMN_METHODS.has(prop as string) &&
            typeof args[0] === "string"
          ) {
            transformedArgs = [toSnakeCase(args[0]), ...args.slice(1)];
          }
          // Transform insert/upsert/update data
          else if (DATA_METHODS.has(prop as string) && args[0]) {
            transformedArgs = [keysToSnakeCase(args[0]), ...args.slice(1)];
          }

          const result = (value as AnyFn).apply(target, transformedArgs);
          return result && typeof result === "object" && "then" in result
            ? wrapQueryBuilder(result as object)
            : result;
        };
      }

      return value;
    },
  });
};

// Wrap client to intercept .from()
const wrapClient = (
  client: OriginalSupabaseClient,
): OriginalSupabaseClient<CamelCaseDatabase> => {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === "from") {
        return (tableName: string, ...rest: unknown[]) =>
          wrapQueryBuilder(
            (value as AnyFn).apply(target, [
              toSnakeCase(tableName),
              ...rest,
            ]) as object,
          );
      }

      return typeof value === "function"
        ? (value as AnyFn).bind(target)
        : value;
    },
  }) as unknown as OriginalSupabaseClient<CamelCaseDatabase>;
};

// Export types for convenience
export type SupabaseClient = OriginalSupabaseClient<CamelCaseDatabase>;

/**
 * Drop-in replacement for Supabase createClient that automatically:
 * - Converts camelCase column names to snake_case in queries
 * - Converts snake_case result keys to camelCase
 * - Leaves JSON payload contents untouched
 */
export const createClient = (
  supabaseUrl: string,
  supabaseKey: string,
  options?: SupabaseClientOptions<"public">,
): SupabaseClient => {
  return wrapClient(originalCreateClient(supabaseUrl, supabaseKey, options));
};
