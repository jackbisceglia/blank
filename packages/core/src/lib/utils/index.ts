export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Conditionally spreads an object into another object, filtering out undefined values
 * @param obj - The object to conditionally include
 * @returns The object with defined values only, or false if no defined values
 */
export function optional<T extends Record<string, unknown>>(
  obj: T
): { [K in keyof T]: NonNullable<T[K]> } | false {
  const entries = Object.entries(obj).filter(
    ([, value]) => value !== undefined
  );

  if (entries.length === 0) return false;

  return Object.fromEntries(entries) as { [K in keyof T]: NonNullable<T[K]> };
}
