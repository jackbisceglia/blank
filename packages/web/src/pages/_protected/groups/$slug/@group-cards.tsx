import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Member } from "@blank/zero";
import { ComponentProps, PropsWithChildren } from "react";
import { Button } from "@/components/ui/button";

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function compare<T>(balance: number, neg: T, even: T, pos: T) {
  if (balance === 0) return even;

  return balance > 0 ? pos : neg;
}

type CardsContainerProps = PropsWithChildren;

export function CardsSection(props: CardsContainerProps) {
  return (
    <div className="grid grid-rows-1 grid-cols-1 md:grid-cols-3 gap-4">
      {props.children}
    </div>
  );
}

type CardsProps = PropsWithChildren<{
  header: () => React.ReactNode;
  content: () => React.ReactNode;
  footer?: () => React.ReactNode;
}>;

export function GroupCard(props: CardsProps) {
  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="p-4 pb-2 pt-3">
        <CardTitle className="text-xs uppercase text-muted-foreground font-medium tracking-wide">
          <props.header />
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-0 min-h-8">
        <props.content />
      </CardContent>
      {props.footer && (
        <CardFooter className="px-4 pt-4 pb-3 mt-auto">
          <props.footer />
        </CardFooter>
      )}
    </Card>
  );
}

type ActiveExpensesCardProps = { total: number; count: number };

export function ActiveExpensesCard(props: ActiveExpensesCardProps) {
  return (
    <GroupCard
      header={() => "Active Expenses"}
      content={() => (
        <div className="text-lg font-semibold">{formatUSD(props.total)}</div>
      )}
      footer={() => (
        <p className="text-xs text-muted-foreground h-full">
          {props.count} expenses
        </p>
      )}
    />
  );
}

type BalancesCardProps = {
  members: Member[];
  count: number;
  balance: (id: string) => number;
};

export function BalancesCard(props: BalancesCardProps) {
  const transformed = props.members
    .map((member) => [member, props.balance(member.userId)] as const)
    .sort((tupleA) => compare(tupleA[1], -1, 0, 1));

  return (
    <GroupCard
      header={() => "Balances"}
      content={() => (
        <ul className="flex flex-col gap-1 max-h-24 overflow-y-auto">
          {transformed.map(([member, balance]) => (
            <li key={member.nickname}>
              <div className="flex justify-between items-center">
                <span
                  className={cn(
                    "text-sm text-foreground lowercase",
                    !balance && "text-muted-foreground"
                  )}
                >
                  {member.nickname}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    compare(
                      balance,
                      "text-blank-theme",
                      "text-muted-foreground",
                      "text-rose-400"
                    )
                  )}
                >
                  {`${compare(balance, "+", "", "-")} ${formatUSD(Math.abs(balance))}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    />
  );
}

type SuggestionsCardProps = {
  members: Member[];
  balance: (id: string) => number;
};

export function SuggestionsCard(props: SuggestionsCardProps) {
  const lastSettled = "04/02/25"; // TODO: compute from db
  const hasBalances = props.members.some(
    (member) => props.balance(member.userId) !== 0
  );

  const SettleOption = (
    props: PropsWithChildren & ComponentProps<typeof Button>
  ) => {
    return (
      <Button
        disabled
        variant="outline"
        size="xs"
        className="flex-1 border-border"
      >
        {props.children}
      </Button>
    );
  };

  return (
    <GroupCard
      header={() => "Settle"}
      content={() =>
        !hasBalances ? (
          <p className="text-sm lowercase text-muted-foreground">All settled</p>
        ) : (
          <div className="flex flex-wrap w-full h-full justify-evenly items-center gap-x-2 gap-y-2 py-0">
            <SettleOption>Manual</SettleOption>
            <SettleOption>Venmo</SettleOption>
            <SettleOption>Zelle</SettleOption>
          </div>
        )
      }
      footer={() => (
        <p className="text-xs text-muted-foreground lowercase">
          {hasBalances
            ? `last settled ${lastSettled}`
            : "No outstanding balances"}
        </p>
      )}
    />
  );
}
