import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatUSD } from "@/lib/utils";
import { Member } from "@blank/zero";
import { ComponentProps, PropsWithChildren } from "react";
import { Button } from "@/components/ui/button";
import { compareParticipantsCustomOrder } from "@/lib/participants";
import { Balances, withBalance } from "@/lib/balances";
import { Status } from "../@table/table-status";

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
      <CardContent className="px-4 pt-0 pb-0 min-h-9">
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

type ActiveExpensesCardProps = { total: number; count: number; status: Status };

export function ActiveExpensesCard(props: ActiveExpensesCardProps) {
  const titles: Record<Status, string> = {
    active: "Active Expenses",
    settled: "Settled Expenses",
    all: "All Expenses",
  };

  const trailing: Record<Status, (count: number) => string> = {
    active: (count: number) => `${count.toString()} active expenses`,
    settled: (count: number) => `${count.toString()} settled expenses`,
    all: (count: number) => `${count.toString()} total expenses`,
  };

  return (
    <GroupCard
      header={() => titles[props.status]}
      content={() => (
        <div className="text-lg font-semibold">{formatUSD(props.total)}</div>
      )}
      footer={() => (
        <p className="text-xs text-muted-foreground h-full">
          {trailing[props.status](props.count)}
        </p>
      )}
    />
  );
}

type BalancesCardProps = {
  members: Member[];
  count: number;
  balances: Balances;
};

export function BalancesCard(props: BalancesCardProps) {
  const transformed = props.members
    .map((member) => withBalance(member, props.balances.get(member.userId)))
    .sort((a, b) => compareParticipantsCustomOrder(a.balance, b.balance));

  return (
    <GroupCard
      header={() => "Balances"}
      content={() => (
        <ul className="flex flex-col gap-1 max-h-20 overflow-y-auto pb-3 pr-1">
          {transformed.map((member) => (
            <li key={member.nickname}>
              <div className="flex justify-between items-center">
                <span
                  className={cn(
                    "text-sm text-foreground lowercase",
                    !props.balances.get(member.userId) &&
                      "text-muted-foreground",
                  )}
                >
                  {member.nickname}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    compare(
                      props.balances.get(member.userId),
                      "text-rose-400",
                      "text-muted-foreground",
                      "text-blank-theme",
                    ),
                  )}
                >
                  {`${compare(member.balance, "-", "", "+")} ${formatUSD(Math.abs(member.balance))}`}
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
  balances: Balances;
  lastSettled: Date | undefined;
  settle: () => void;
};

export function ActionsCard(props: SuggestionsCardProps) {
  const hasBalances = props.members.some(
    (member) => props.balances.get(member.userId) !== 0,
  );

  const SettleOption = (
    props: PropsWithChildren & ComponentProps<typeof Button>,
  ) => {
    const { className, ...rest } = props;
    return (
      <Button
        variant="outline"
        size="xs"
        className={cn("flex-1 border-border", className)}
        {...rest}
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
            <SettleOption onClick={props.settle}>Manual</SettleOption>
            <SettleOption disabled>Venmo</SettleOption>
            <SettleOption disabled>Zelle</SettleOption>
          </div>
        )
      }
      footer={() => (
        <p className="text-xs text-muted-foreground lowercase">
          {hasBalances
            ? props.lastSettled
              ? `last settled ${props.lastSettled.toLocaleDateString()}`
              : "settle up for the first time"
            : "No outstanding balances"}
        </p>
      )}
    />
  );
}
