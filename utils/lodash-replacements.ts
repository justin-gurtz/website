// Native JavaScript replacements for lodash functions
// This reduces bundle size by ~200KB

export const map = <T, U>(array: T[], iteratee: (value: T, index: number, array: T[]) => U): U[] => {
  return array.map(iteratee);
};

export const filter = <T>(array: T[], predicate: (value: T, index: number, array: T[]) => boolean): T[] => {
  return array.filter(predicate);
};

export const forEach = <T>(array: T[], iteratee: (value: T, index: number, array: T[]) => void): void => {
  array.forEach(iteratee);
};

export const reduce = <T, U>(
  array: T[],
  iteratee: (accumulator: U, value: T, index: number, array: T[]) => U,
  initialValue: U
): U => {
  return array.reduce(iteratee, initialValue);
};

export const slice = <T>(array: T[], start?: number, end?: number): T[] => {
  return array.slice(start, end);
};

export const compact = <T>(array: (T | null | undefined | false | 0 | "")[]): T[] => {
  return array.filter(Boolean) as T[];
};

export const includes = <T>(array: T[], value: T): boolean => {
  return array.includes(value);
};

export const keys = <T extends Record<string, any>>(object: T): (keyof T)[] => {
  return Object.keys(object) as (keyof T)[];
};

export const values = <T extends Record<string, any>>(object: T): T[keyof T][] => {
  return Object.values(object);
};

export const join = (array: (string | number)[], separator?: string): string => {
  return array.join(separator);
};

export const times = <T>(n: number, iteratee: (index: number) => T): T[] => {
  return Array.from({ length: n }, (_, i) => iteratee(i));
};

export const padStart = (string: string | number, length: number, chars: string = ' '): string => {
  return String(string).padStart(length, chars);
};

export const startsWith = (string: string, target: string, position?: number): boolean => {
  return string.startsWith(target, position);
};

export const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => isEqual(item, b[index]));
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => isEqual(a[key], b[key]));
  }
  
  return false;
};

export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};