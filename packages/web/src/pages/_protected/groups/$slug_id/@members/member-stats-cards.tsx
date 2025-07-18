import { Button } from "@/components/ui/button";
import { Member } from "@blank/zero";
import { Balances } from "@/lib/balances";
import { GroupCard, CardsSection } from "../@dashboard/overview-cards";
import { Users, UserPlus, DollarSign } from "lucide-react";

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

type MemberStatsCardsProps = {
  members: Member[];
  balances: Balances;
  canInvite?: boolean;
  onInvite?: () => void;
};

export function MemberStatsCards(props: MemberStatsCardsProps) {
  const { members, balances, canInvite, onInvite } = props;
  
  const totalMembers = members.length;
  const membersWithBalances = members.filter(m => balances.get(m.userId) !== 0);
  const totalOutstanding = members.reduce((sum, member) => {
    const balance = balances.get(member.userId);
    return sum + Math.abs(balance);
  }, 0) / 2; // Divide by 2 because each transaction is counted twice (once for each party)

  return (
    <CardsSection>
      <GroupCard
        header={() => "Total Members"}
        content={() => (
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-lg font-semibold">{totalMembers}</span>
          </div>
        )}
        footer={() => (
          <p className="text-xs text-muted-foreground lowercase">
            {totalMembers === 1 ? "1 member" : `${totalMembers} members`} in group
          </p>
        )}
      />

      <GroupCard
        header={() => "Outstanding Balances"}
        content={() => (
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-muted-foreground" />
            <span className="text-lg font-semibold">{formatUSD(totalOutstanding)}</span>
          </div>
        )}
        footer={() => (
          <p className="text-xs text-muted-foreground lowercase">
            {membersWithBalances.length === 0 
              ? "all members settled" 
              : `${membersWithBalances.length} ${membersWithBalances.length === 1 ? "member" : "members"} with balances`
            }
          </p>
        )}
      />

      <GroupCard
        header={() => "Invite Members"}
        content={() => (
          <div className="flex items-center justify-center h-full">
            <Button
              variant="outline"
              size="sm"
              onClick={onInvite}
              disabled={!canInvite}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </Button>
          </div>
        )}
        footer={() => (
          <p className="text-xs text-muted-foreground lowercase">
            {canInvite 
              ? "add new members to the group" 
              : "only group owners can invite"
            }
          </p>
        )}
      />
    </CardsSection>
  );
}