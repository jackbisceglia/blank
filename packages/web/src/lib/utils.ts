import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Creates a function that joins a list of strings with a specified delimiter, filtering out any falsey values.
 * @param delimiter - The delimiter to join the strings with.
 * @returns A function that accepts a list of strings or falsey values and returns a string of the joined strings, or an empty string if no strings are provided.
 */
export function build(delimiter: string) {
  return (...args: (string | false)[]) =>
    args.filter((arg) => !!arg).join(delimiter);
}

export function slugify(str: string) {
  const encode = (s: string) => s.toLowerCase().replaceAll(" ", "-");
  const decode = (s: string) => s.replaceAll("-", " ");

  return {
    encode: () => encode(str),
    decode: () => decode(str),
    isLossless: () => decode(encode(str)) === str.toLowerCase(), // check if the value survives a round trip
  };
}

export type PropsWithClassname<T> = T & {
  className?: string;
};

export function matchOn<T, R>(value: T, fn: (value: T) => R): R {
  return fn(value);
}

export function match<T>(fn: () => T): T {
  return fn();
}

export const isClient = () => typeof window !== "undefined";

export const constants = {
  zero_ttl: "1h",
  syncServer: import.meta.env.VITE_SYNC_SERVER_URL as string,
  googleThumbnailSuffix: "=s96-c",
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function log(str: string) {
  console.log(`\n\n${str}\n\n`);
}

type RegisterOptions = {
  fn: (e: KeyboardEvent) => void;
  when?: boolean;
};

export const keyboard = {
  register: (opts: RegisterOptions) => {
    const cond = opts.when ?? true;
    if (cond) {
      document.addEventListener("keydown", opts.fn);
    }

    return {
      cleanup: () => {
        if (cond) {
          document.removeEventListener("keydown", opts.fn);
        }
      },
    };
  },
};

export const fn = <T>(fn: () => T): T => fn();

/**
 * Executes an immediately invoked function expression (IIFE) for improved readability
 * @param fn - The function to be executed immediately
 * @returns The result of executing the function
 * @example
 * // Instead of:
 * const callback = (() => {
 *   const host = getHeader("host");
 *   return `${host?.includes("localhost") ? "http" : "https"}://${host}/api/callback`;
 * })();
 *
 * // You can use:
 * const callback = evaluate(() => {
 *   const host = getHeader("host");
 *   return `${host?.includes("localhost") ? "http" : "https"}://${host}/api/callback`;
 * });
 */
export function evaluate<T>(fn: () => T): T {
  return fn();
}

export function createPreventDefault(fn: () => void, e: KeyboardEvent) {
  return () => {
    e.preventDefault();
    fn();
  };
}
