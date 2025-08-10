import { Button } from "@/components/ui/button";
import { Group, Member } from "@blank/zero";
import { Badge } from "@/components/ui/badge";
import { createBalanceMap } from "@/lib/monetary/balances";
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
import { ComponentProps, PropsWithChildren, useState } from "react";
import { useUpdateMemberNickname } from "@/pages/_protected/@data/members";
import { withToast } from "@/lib/toast";
import { prevented } from "@/lib/utils";
import * as v from "valibot";
import { useAppForm } from "@/components/form";

const constraints = { nickname: { minLength: 1, maxLength: 32 } };

const gradients = [
  "bg-gradient-to-br from-[hsl(200,65%,60%)] to-[hsl(260,55%,45%)]",
  "bg-gradient-to-tl from-[hsl(160,60%,65%)] to-[hsl(220,50%,50%)]",
  "bg-gradient-to-tr from-[hsl(30,70%,65%)] to-[hsl(350,60%,45%)]",
  "bg-gradient-to-bl from-[hsl(280,65%,60%)] to-[hsl(180,55%,50%)]",
  "bg-gradient-to-tr from-[hsl(45,65%,65%)] to-[hsl(270,50%,45%)]",
  "bg-gradient-to-tr from-[hsl(320,60%,60%)] to-[hsl(120,55%,50%)]",
  "bg-gradient-to-br from-[hsl(190,65%,65%)] to-[hsl(340,60%,45%)]",
  "bg-gradient-to-tl from-[hsl(60,60%,60%)] to-[hsl(240,55%,50%)]",
  "bg-gradient-to-tl from-[hsl(15,70%,60%)] to-[hsl(200,55%,50%)]",
  "bg-gradient-to-tr from-[hsl(140,60%,65%)] to-[hsl(310,55%,45%)]",
  "bg-gradient-to-bl from-[hsl(210,65%,60%)] to-[hsl(40,60%,50%)]",
];

const getGradient = (id: string) =>
  gradients[Math.abs(Hash.string(id)) % gradients.length];

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
  const settle = { enabled: false };

  const StyledItem = (props: ComponentProps<typeof DropdownMenuItem>) => (
    <DropdownMenuItem className="text-xs uppercase" {...props} />
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
        {
          <StyledItem
            // TODO: update to do a proper check if this pair has anything to settle
            disabled={!settle.enabled || props.balance !== 0}
            onClick={props.settle}
          >
            Settle
          </StyledItem>
        }
        {props.isOwner && !props.isAuthenticatedUser && (
          <StyledItem variant="destructive" onClick={props.remove}>
            Remove
          </StyledItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const schemas = {
  nickname: v.pipe(
    v.pipe(
      v.string(),
      v.minLength(constraints.nickname.minLength),
      v.maxLength(constraints.nickname.maxLength),
    ),
  ),
};

const formSchemaNotStale = (init: string) =>
  v.pipe(
    v.object({ nickname: schemas.nickname }),
    v.check((data) => data.nickname !== init, "These details are already set"),
  );

type UpdateNicknameFormProps = {
  group: Group;
  member: Member;
  reset: () => void;
};

function UpdateNicknameForm(props: UpdateNicknameFormProps) {
  const updateMemberNickname = useUpdateMemberNickname();

  const init = { nickname: props.member.nickname };

  const form = useAppForm({
    defaultValues: init,
    validators: { onChange: formSchemaNotStale(init.nickname) },
    onSubmit: async (options) => {
      const promise = updateMemberNickname({
        groupId: props.group.id,
        nickname: options.value.nickname,
      });

      return await withToast({
        promise,
        finally: props.reset,
        notify: {
          loading: "Updating nickname",
          success: `Group nickname updated to ${options.value.nickname}`,
          error: "Failed to update nickname",
        },
      });
    },
  });

  return (
    <form
      onSubmit={prevented(() => void form.handleSubmit())}
      className="flex items-center gap-2"
    >
      <form.AppField
        name="nickname"
        listeners={{
          onChange: (ctx) => {
            if (ctx.value === props.member.nickname) {
              form.resetField("nickname");
            }
          },
        }}
        children={(field) => (
          <field.SheetTextField
            inputProps={{
              "aria-label": "Update Nickname",
              minLength: constraints.nickname.minLength,
              maxLength: constraints.nickname.maxLength,
              placeholder: "Enter your username",
              className: "py-1 px-2.5 h-auto w-auto h-8.5 w-auto flex-initial",
            }}
          />
        )}
      />

      <form.AppForm>
        <form.SubmitButton
          className="uppercase border-border w-22 my-auto py-1.5"
          size="xs"
          dirty={{ disableForAria: true }}
        >
          Update
        </form.SubmitButton>
      </form.AppForm>
    </form>
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

function useEditState(defaultState?: "write" | "read") {
  const [editState, setEditState] = useState<"write" | "read">(
    defaultState ?? "read",
  );

  const toggle = () => setEditState((p) => (p === "write" ? "read" : "write"));

  return { state: editState, toggle };
}

export function MembersList(props: MemberManagementCardProps) {
  const editing = useEditState("read");

  const balances = createBalanceMap(props.expenses);

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
    <li
      key={member.userId}
      className="flex flex-col sm:flex-row sm:justify-between sm:items-center items-center gap-4 sm:gap-x-6 py-5 px-2"
    >
      <Avatar className="size-12 flex-none rounded-lg">
        <AvatarFallback
          className={`${getGradient(member.userId)} text-background font-medium text-sm rounded-lg`}
        >
          {getInitials(member.nickname)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-auto">
        {editing.state === "write" && derived.isAuthenticatedUser ? (
          <UpdateNicknameForm
            reset={editing.toggle}
            group={props.group}
            member={member}
          />
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-base border border-transparent py-1 font-semibold text-foreground lowercase">
              {member.nickname}
            </p>
            {derived.isAuthenticatedUser && (
              <Badge variant="theme" className="text-xs h-min ml-1">
                you
              </Badge>
            )}
          </div>
        )}
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
          <p className={`text-base w-fit ${getBalanceStyle(derived.balance)}`}>
            {getBalanceText(derived.balance)}
          </p>
        </div>
        {derived.isAuthenticatedUser ? (
          <Button
            variant="outline"
            size="xs"
            className="uppercase border-border w-22"
            onClick={editing.toggle}
          >
            {editing.state === "write" ? "Cancel" : "Edit"}
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
