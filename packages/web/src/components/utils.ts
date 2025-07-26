import { formatUSD, matchSign } from "@/lib/utils";

export function getBalanceStyle(balance: number) {
  if (balance === 0) return "text-muted-foreground font-medium";

  return [
    "font-semibold",
    balance > 0 ? "text-blank-theme" : "text-rose-400",
  ].join(" ");
}

type GetBalanceDisplayOptions = { fallback?: string };

export function getBalanceText(
  balance: number,
  options?: GetBalanceDisplayOptions,
) {
  if (options?.fallback && balance === 0) return options?.fallback;

  const formatted = formatUSD(Math.abs(balance));
  const prefix = matchSign(balance, "-", "", "+");

  return [prefix, formatted].join("");
}

export function getBalanceLabel(balance: number) {
  if (balance === 0) return undefined;

  return matchSign(balance, "owes", "", "is owed");
}
