import { Member } from "@blank/zero";
import { MemberCard } from "./member-card";
import { Balances } from "@/lib/balances";
import { compareParticipantsCustomOrder } from "@/lib/participants";

type MemberListProps = {
  members: Member[];
  balances: Balances;
  currentUserId: string;
  groupOwnerId: string;
  onRemoveMember?: (member: Member) => void;
};

export function MemberList(props: MemberListProps) {
  const { members, balances, currentUserId, groupOwnerId, onRemoveMember } = props;
  
  const isCurrentUserOwner = currentUserId === groupOwnerId;
  
  const sortedMembers = [...members].sort((a, b) => {
    // Current user always first
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    
    // Group owner second (if not current user)
    if (a.userId === groupOwnerId) return -1;
    if (b.userId === groupOwnerId) return 1;
    
    // Then sort by balance
    const balanceA = balances.get(a.userId);
    const balanceB = balances.get(b.userId);
    return compareParticipantsCustomOrder(balanceA, balanceB);
  });

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground lowercase">No members found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {sortedMembers.map((member) => (
        <MemberCard
          key={member.userId}
          member={member}
          balance={balances.get(member.userId)}
          isOwner={member.userId === groupOwnerId}
          isCurrentUser={member.userId === currentUserId}
          canManage={isCurrentUserOwner}
          {...(onRemoveMember && { onRemove: onRemoveMember })}
        />
      ))}
    </div>
  );
}