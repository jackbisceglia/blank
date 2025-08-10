import { Participant } from "@blank/zero";

export const PERCENTAGE_SUM_ERROR_MARGIN = 1e-10;

export function fraction(split: Participant["split"]) {
  const [numerator, denominator] = split;

  const apply = (amount: number) => amount * (numerator / denominator);
  const inverse = () => fraction([denominator - numerator, denominator]);
  const percent = () => apply(100);

  return { apply, inverse, percent };
}
