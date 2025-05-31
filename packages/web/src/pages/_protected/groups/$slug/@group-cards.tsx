import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Member } from "@blank/zero";
import { PropsWithChildren } from "react";

const spans = [4, 4, 4];

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

type CardsContainerProps = PropsWithChildren;
export function CardsSection(props: CardsContainerProps) {
  return (
    <div className="grid grid-rows-1 grid-cols-1 md:grid-cols-12 gap-4">
      {props.children}
    </div>
  );
}

type CardsProps = PropsWithChildren<{
  header: () => React.ReactNode;
  content: () => React.ReactNode;
  footer?: () => React.ReactNode;
  colSpan?: number | "rest";
}>;

export function GroupCard(props: CardsProps) {
  return (
    <Card
      className={cn(
        "w-full flex flex-col col-span-2",
        ...(props.colSpan
          ? [
              props.colSpan === 1 && "col-span-1",
              props.colSpan === 2 && "col-span-2",
              props.colSpan === 3 && "col-span-3",
              props.colSpan === 4 && "col-span-4",
              props.colSpan === 5 && "col-span-5",
              props.colSpan === 6 && "col-span-6",
              props.colSpan === 7 && "col-span-7",
              props.colSpan === 8 && "col-span-8",
              props.colSpan === 9 && "col-span-9",
              props.colSpan === 10 && "col-span-10",
              props.colSpan === 11 && "col-span-11",
              props.colSpan === 12 && "col-span-12",
              props.colSpan === "rest" && "col-span-full",
            ]
          : [])
      )}
    >
      <CardHeader className="p-4 pb-2">
        <props.header />
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-2">
        <props.content />
      </CardContent>
      {props.footer && (
        <CardFooter className="px-4 pt-0 pb-4 mt-auto">
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
      colSpan={spans[0]}
      header={() => (
        <CardTitle className="text-xs uppercase text-muted-foreground font-medium tracking-wide">
          Active Expenses
        </CardTitle>
      )}
      content={() => (
        <div className="text-lg font-semibold">{formatUSD(props.total)}</div>
      )}
      footer={() => (
        <p className="text-xs text-muted-foreground">{props.count} expenses</p>
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
  return (
    <GroupCard
      colSpan={spans[1]}
      header={() => (
        <CardTitle className="text-xs uppercase text-muted-foreground font-medium tracking-wide">
          Balances
        </CardTitle>
      )}
      content={() =>
        props.count > 0 && (
          <ul className="flex flex-col gap-1 max-h-24 overflow-y-auto">
            {props.members
              .map((member) => [member, props.balance(member.userId)] as const)
              .sort((a) => (a[1] === 0 ? 0 : a[1] > 0 ? 1 : -1))
              .map(([member, balance]) => {
                if (balance === 0) return null;

                const match = <T,>(neg: T, even: T, pos: T) => {
                  switch (true) {
                    case balance < 0:
                      return neg;
                    case balance > 0:
                      return pos;
                    case balance === 0:
                    default:
                      return even;
                  }
                };

                return (
                  <li key={member.nickname}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">
                        {member.nickname}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          match(
                            "text-blank-theme",
                            "text-muted-foreground",
                            "text-rose-400"
                          )
                        )}
                      >
                        {match("+", "", "-")}
                        {formatUSD(Math.abs(balance))}
                      </span>
                    </div>
                  </li>
                );
              })}
          </ul>
        )
      }
    />
  );
}

type SuggestionsCardProps = {};

export function SuggestionsCard(props: SuggestionsCardProps) {
  return (
    <GroupCard
      colSpan={spans[2]}
      header={() => (
        <CardTitle className="text-xs uppercase text-muted-foreground font-medium tracking-wide">
          Suggestions
        </CardTitle>
      )}
      content={() => (
        <div className="text-lg font-semibold">
          {/* {formatUSD(props.total)} */}
        </div>
      )}
      footer={() => (
        <p className="text-xs text-muted-foreground">
          {/* {props.count} expenses */}
        </p>
      )}
    />
  );
}
