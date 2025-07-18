import { fromParsedEffect, TaggedError } from "@blank/core/lib/effect/index";
import { Participant } from "@blank/core/modules/participant/schema";
import { clsx, type ClassValue } from "clsx";
import { Effect, pipe, String, Array, Match } from "effect";
import { twMerge } from "tailwind-merge";

export function fraction(split: Participant["split"]) {
  const [numerator, denominator] = split;

  const apply = (amount: number) => amount * (numerator / denominator);
  const inverse = () => fraction([denominator - numerator, denominator]);
  const percent = () => apply(100);

  return { apply, inverse, percent };
}

/**
 * Creates a function that joins a list of strings with a specified delimiter, filtering out any falsey values.
 * @param delimiter - The delimiter to join the strings with.
 * @returns A function that accepts a list of strings or falsey values and returns a string of the joined strings, or an empty string if no strings are provided.
 */
export function build(delimiter: string) {
  return (...args: (string | false)[]) =>
    args.filter((arg) => !!arg).join(delimiter);
}

export type PropsWithClassname<T> = T & {
  className?: string;
};

export const constants = {
  syncServer: import.meta.env.VITE_SYNC_SERVER_URL as string,
  googleThumbnailSuffix: "=s96-c",
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

// TODO: dedup usage of these
export function createPreventDefault(fn: () => void, e: KeyboardEvent) {
  return () => {
    e.preventDefault();
    fn();
  };
}

export const prevented = <
  E extends { preventDefault: () => void; stopPropagation: () => void },
>(
  callback?: (e: E) => unknown,
) => {
  return (e: E) => {
    e.preventDefault();
    e.stopPropagation();
    callback?.(e);
  };
};

export const timestampToDate = (timestamp: number): Date => new Date(timestamp);

export const flags = {
  dev: {
    deleteAllExpenses: false,
    inlineRandomizeExpense: false,
  },
};

export function wrapInBox(...strings: string[]) {
  const y = "-------------------------------------";
  const x = "|";
  const content = strings.join("");

  const padded = content
    .split("\n")
    .map((line) => `${x}${line}${x}`)
    .join("\n");

  return [y, content, y].join("\n");
}
