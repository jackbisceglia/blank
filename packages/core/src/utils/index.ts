export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export * from "./neverthrow";
export * from "./effect";
