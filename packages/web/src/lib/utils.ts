import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
