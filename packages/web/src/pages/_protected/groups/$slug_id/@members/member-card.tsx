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
import { cn } from "@/lib/utils";
import { Member } from "@blank/zero";
import { MoreHorizontal, Crown, UserMinus } from "lucide-react";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
  const { member, balance = 0, isOwner, isCurrentUser, canManage, onRemove } = props;
  
  const balanceColor = balance === 0 
    ? "text-muted-foreground" 
    : balance > 0 
    ? "text-blank-theme" 
    : "text-rose-400";

  const balancePrefix = balance === 0 ? "" : balance > 0 ? "+" : "-";

  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="p-4 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {getInitials(member.nickname)}
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium lowercase">
                {member.nickname}
                {isCurrentUser && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    you
                  </Badge>
                )}
              </CardTitle>
              {isOwner && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Crown className="w-3 h-3" />
                  <span className="lowercase">group owner</span>
                </div>
              )}
            </div>
          </div>
          {canManage && !isCurrentUser && !isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onRemove?.(member)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-0 min-h-9">
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase text-muted-foreground font-medium tracking-wide">
            Balance
          </span>
          <span className={cn("text-sm font-medium", balanceColor)}>
            {balancePrefix}{formatUSD(Math.abs(balance))}
          </span>
        </div>
      </CardContent>
      <CardFooter className="px-4 pt-4 pb-3 mt-auto">
        <p className="text-xs text-muted-foreground lowercase">
          {balance === 0 
            ? "all settled up" 
            : balance > 0 
            ? "is owed money" 
            : "owes money"
          }
        </p>
      </CardFooter>
    </Card>
  );
}