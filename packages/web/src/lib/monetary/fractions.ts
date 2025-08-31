import { Participant } from "@blank/zero";

export const PERCENTAGE_SUM_ERROR_MARGIN = 1e-10;

type Split = Participant["split"];

const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a === 0 ? 1 : a;
};

const fractionPartsToInts = (split: Split): Split => {
  let [num, denom] = split;

  // Avoid division by zero; return as-is
  if (denom === 0) return [num, denom];

  // Canonical zero
  if (num === 0) return [0, 1];

  // If either is not an integer, scale both to integers by a power of 10
  const decimalPlaces = (x: number): number => {
    if (Number.isInteger(x)) return 0;
    const s = x.toString().toLowerCase();
    if (s.includes("e")) {
      const [mantissa, expStr] = s.split("e");
      const exp = parseInt(expStr, 10);
      const frac = mantissa.split(".")[1]?.length ?? 0;
      return Math.max(0, frac - (exp < 0 ? exp : 0));
    }
    const idx = s.indexOf(".");
    return idx >= 0 ? s.length - idx - 1 : 0;
  };

  if (!Number.isInteger(num) || !Number.isInteger(denom)) {
    const maxDp = Math.min(
      12,
      Math.max(decimalPlaces(num), decimalPlaces(denom)),
    );
    const f = Math.pow(10, maxDp);
    num = Math.round(num * f);
    denom = Math.round(denom * f);
  }

  // Now reduce using GCD
  const g = gcd(num, denom);
  num = num / g;
  denom = denom / g;

  // Ensure denominator is positive
  if (denom < 0) {
    num = -num;
    denom = -denom;
  }

  return [num, denom];
};

export function fraction() {
  const split = (...values: Split) => {
    const [numerator, denominator] = values;

    const apply = (amount: number) => amount * (numerator / denominator);
    const inverse = () => split(denominator - numerator, denominator);

    const percent = () => apply(100);
    const get = () => [numerator, denominator] as [number, number];

    const simplify = () =>
      split(...fractionPartsToInts([numerator, denominator]));

    return { apply, inverse, percent, get, simplify };
  };

  return { from: split };
}
