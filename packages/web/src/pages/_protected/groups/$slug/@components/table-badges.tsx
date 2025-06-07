import { Badge } from "@/components/ui/badge";
import React from "react";
import { ExpenseWithParticipants } from "../page";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

type BadgeSimpleProps = React.PropsWithChildren<{
  variant: "secondary" | "theme";
}> &
  React.ComponentPropsWithoutRef<"span">;

const BadgeSimple = React.forwardRef<HTMLSpanElement, BadgeSimpleProps>(
  ({ variant, children, ...rest }, ref) => (
    <Badge
      ref={ref}
      className="overflow-x-hidden truncate block max-w-full lowercase"
      variant={variant}
      {...rest}
    >
      {children}
    </Badge>
  )
);

BadgeSimple.displayName = "BadgeSimple";

type ParticipantBadgeProps = {
  participant: ExpenseWithParticipants["participants"][number];
  strategy?: "compact" | "standard";
};

export function ParticipantBadge(props: ParticipantBadgeProps) {
  const p = props.participant;
  const variant = p.role === "participant" ? "secondary" : "theme";

  switch (props.strategy) {
    case "compact":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <BadgeSimple variant={variant} className="cursor-pointer">
              {getInitials(p.member?.nickname)}
            </BadgeSimple>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            <p className="font-semibold">{p.member?.nickname || "?"}</p>
          </TooltipContent>
        </Tooltip>
      );
    case "standard":
      return <BadgeSimple variant={variant}>{p.member?.nickname}</BadgeSimple>;
  }
}

type ParticipantBadgeListProps = {
  participants: ExpenseWithParticipants["participants"];
};

export function ParticipantBadgeList(props: ParticipantBadgeListProps) {
  const participants = props.participants.filter(
    (p): p is typeof p & { member: NonNullable<typeof p.member> } =>
      p.member !== undefined
  );

  return (
    <ul className="space-x-1 w-fit flex">
      {participants.map((p) => (
        <li key={p.userId}>
          <ParticipantBadge participant={p} strategy="compact" />
        </li>
      ))}
    </ul>
  );
}
