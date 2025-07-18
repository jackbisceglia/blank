import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatUSD } from "@/lib/utils";
import { toast } from "sonner";
import { Member } from "@blank/zero";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

type MemberCardProps = {
  member: Member;
  balance?: number;
  isOwner?: boolean;
  isCurrentUser?: boolean;
  canManage?: boolean;
  onRemove?: (member: Member) => void;
};

export function MemberCard(props: MemberCardProps) {
  const balance = props.balance ?? 0;

  const balanceColor =
    balance === 0
      ? "text-muted-foreground"
      : balance > 0
        ? "text-blank-theme"
        : "text-rose-400";

  const balancePrefix = balance === 0 ? "" : balance > 0 ? "+" : "-";

  return (
    <Card className="w-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
              {getInitials(props.member.nickname)}
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-base font-medium lowercase">
                {props.member.nickname}
                {props.isCurrentUser && (
                  <Badge variant="theme" className="ml-2 text-xs">
                    you
                  </Badge>
                )}
              </CardTitle>
              {props.isOwner && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  <span className="lowercase">group owner</span>
                </div>
              )}
            </div>
          </div>
          {(props.canManage || props.isCurrentUser) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="xs" className="text-xs">
                  Manage
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {!props.isCurrentUser && (
                  <DropdownMenuItem
                    onClick={() => props.onRemove?.(props.member)}
                    className="text-rose-400 focus:text-rose-400 text-xs lowercase font-medium"
                  >
                    remove member
                  </DropdownMenuItem>
                )}
                {props.isCurrentUser && (
                  <DropdownMenuItem
                    className="text-xs lowercase font-medium"
                    onClick={() => {
                      toast("Update profile feature coming soon", {
                        description: "You'll be able to update your nickname",
                      });
                    }}
                  >
                    update profile
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-0">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase text-muted-foreground font-medium tracking-wide">
            Balance
          </span>
          <span className={cn("text-base font-semibold", balanceColor)}>
            {balancePrefix}
            {formatUSD(Math.abs(balance))}
          </span>
        </div>
      </CardContent>
      <CardFooter className="px-4 pt-2.5 pb-4 mt-auto">
        <p className="text-xs text-muted-foreground lowercase">
          {balance === 0
            ? "all settled up"
            : balance > 0
              ? "is owed money"
              : "owes money"}
        </p>
      </CardFooter>
    </Card>
  );
}

