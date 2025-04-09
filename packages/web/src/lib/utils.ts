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

export function slug(str: string) {
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

function removeTrailingSlash(str: string): string {
  return str.endsWith("/") ? str.slice(0, -1) : str;
}

export const constants = {
  zero_ttl: "1h",
  authServer: removeTrailingSlash(
    import.meta.env.VITE_AUTH_SERVER_URL as string
  ),
  syncServer: import.meta.env.VITE_SYNC_SERVER_URL as string,
  authClientId: "blank-auth-web",
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

export function createPreventDefault(fn: () => void, e: KeyboardEvent) {
  return () => {
    e.preventDefault();
    fn();
  };
}
