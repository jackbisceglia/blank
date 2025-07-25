import { Button } from "@/components/ui/button";
import { Group, Member } from "@blank/zero";
import { Badge } from "@/components/ui/badge";
import { createBalanceMap } from "@/lib/balances";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExpenseWithParticipants } from "../page";
import {
  getBalanceLabel,
  getBalanceStyle,
  getBalanceText,
} from "@/components/utils";
import { Hash } from "effect";
import { ComponentProps, PropsWithChildren } from "react";

const gradients = [
  "bg-gradient-to-br from-[hsl(220,60%,60%)] to-[hsl(230,50%,40%)]",
  "bg-gradient-to-br from-[hsl(210,65%,55%)] to-[hsl(240,55%,35%)]",
  "bg-gradient-to-br from-[hsl(225,70%,50%)] to-[hsl(245,60%,30%)]",

  "bg-gradient-to-br from-[hsl(250,60%,60%)] to-[hsl(260,50%,40%)]",
  "bg-gradient-to-br from-[hsl(240,65%,55%)] to-[hsl(270,55%,35%)]",
  "bg-gradient-to-br from-[hsl(260,70%,50%)] to-[hsl(280,60%,30%)]",

  "bg-gradient-to-br from-[hsl(280,60%,60%)] to-[hsl(290,50%,40%)]",
  "bg-gradient-to-br from-[hsl(300,65%,55%)] to-[hsl(320,55%,35%)]",
  "bg-gradient-to-br from-[hsl(290,70%,50%)] to-[hsl(310,60%,30%)]",

  "bg-gradient-to-br from-[hsl(320,65%,60%)] to-[hsl(340,55%,40%)]",
  "bg-gradient-to-br from-[hsl(330,70%,55%)] to-[hsl(350,60%,35%)]",
  "bg-gradient-to-br from-[hsl(340,75%,50%)] to-[hsl(360,65%,30%)]",

  "bg-gradient-to-br from-[hsl(170,60%,60%)] to-[hsl(180,50%,40%)]",
  "bg-gradient-to-br from-[hsl(160,65%,55%)] to-[hsl(190,55%,35%)]",
  "bg-gradient-to-br from-[hsl(180,70%,50%)] to-[hsl(200,60%,30%)]",

  "bg-gradient-to-br from-[hsl(150,60%,60%)] to-[hsl(160,50%,40%)]",
  "bg-gradient-to-br from-[hsl(140,65%,55%)] to-[hsl(170,55%,35%)]",
  "bg-gradient-to-br from-[hsl(160,70%,50%)] to-[hsl(180,60%,30%)]",
];

const getGradient = (id: string) =>
  gradients[Hash.string(id) % gradients.length];

function createCustomMemberSort(userId: string, ownerId: string) {
  return function (a: Member, b: Member) {
    if (a.userId === userId) return -1;
    if (b.userId === userId) return 1;
    if (a.userId === ownerId) return -1;
    if (b.userId === ownerId) return 1;

    return a.nickname.localeCompare(b.nickname);
  };
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

type MemberDropdownMenuProps = PropsWithChildren<{
  remove: () => void;
  settle: () => void;
  isAuthenticatedUser: boolean;
  isOwner: boolean;
  balance: number;
}>;

function MemberDropdownMenu(props: MemberDropdownMenuProps) {
  const StyledItem = ({
    disabled: _,
    ...rest
  }: ComponentProps<typeof DropdownMenuItem>) => (
    <DropdownMenuItem
      disabled
      className="text-xs uppercase font-medium w-32"
      {...rest}
    >
      Settle
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className="uppercase border-border w-22"
        >
          {props.children}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {props.balance !== 0 && (
          <StyledItem disabled onClick={props.settle}>
            Settle
          </StyledItem>
        )}
        {props.isOwner && !props.isAuthenticatedUser && (
          <StyledItem variant="destructive" onClick={props.remove}>
            Remove
          </StyledItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type MemberManagementCardProps = {
  members: Member[];
  expenses: ExpenseWithParticipants[];
  group: Group;
  userId: string;
  settle: () => void;
  remove: (member: Member) => Promise<void>;
};

export function MembersList(props: MemberManagementCardProps) {
  const balances = createBalanceMap(props.expenses); // todo: move to global store

  const sortedMembers = props.members.toSorted(
    createCustomMemberSort(props.userId, props.group.ownerId),
  );

  const withDerived = (member: Member) => ({
    member: member,
    derived: {
      isAuthenticatedUser: props.userId === member.userId,
      isOwner: props.group.ownerId === member.userId,
      balance: balances.get(member.userId),
    },
  });

  return sortedMembers.map(withDerived).map(({ derived, member }) => (
    <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-x-6 py-5 px-2">
      <Avatar className="size-10 flex-none rounded-lg">
        <AvatarFallback
          className={`${getGradient(member.userId)} text-background font-medium text-sm rounded-lg`}
        >
          {getInitials(member.nickname)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-auto">
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold text-foreground lowercase">
            {member.nickname}
          </p>
          {derived.isAuthenticatedUser && (
            <Badge variant="theme" className="text-xs h-min">
              you
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground uppercase">
          {derived.isOwner ? "owner" : "member"}
        </span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-x-6">
        <div className="text-left sm:text-right min-w-0 min-w-28">
          {balances.get(member.userId) !== 0 && (
            <p className="mr-auto text-xs w-fit text-muted-foreground">
              {getBalanceLabel(balances.get(member.userId))}
            </p>
          )}
          <div
            className={`text-base font-semibold w-fit ${getBalanceStyle(derived.balance)}`}
          >
            {getBalanceText(derived.balance, { fallback: "settled" })}
          </div>
        </div>
        {derived.isAuthenticatedUser ? (
          <Button
            variant="outline"
            size="xs"
            className="uppercase border-border w-22"
          >
            Edit
          </Button>
        ) : (
          <MemberDropdownMenu
            balance={derived.balance}
            isAuthenticatedUser={props.userId === member.userId}
            isOwner={props.userId === props.group.ownerId}
            remove={() => props.remove(member)}
            settle={props.settle}
          >
            Manage
          </MemberDropdownMenu>
        )}
      </div>
    </li>
  ));
}
