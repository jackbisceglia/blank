import { pipe, String } from "effect";

export function formatUSDString(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatUSDFormField(amount: string) {
  return pipe(amount, parseFloat, formatUSDString, String.slice(1));
}
