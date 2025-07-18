import { SecondaryHeading } from "@/components/prose";
import { Button } from "@/components/ui/button";
import { UserPlus, Users } from "lucide-react";

type EmptyStateProps = {
  canInvite?: boolean;
  onInvite?: () => void;
};

export function EmptyMembersState(props: EmptyStateProps) {
  const { canInvite, onInvite } = props;

  return (
    <div className="text-center py-12 space-y-4">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <SecondaryHeading className="text-muted-foreground">
          No members found
        </SecondaryHeading>
        <p className="text-sm text-muted-foreground lowercase">
          This group doesn't have any members yet.
        </p>
      </div>
      {canInvite && (
        <Button onClick={onInvite} variant="outline" className="mt-4">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite first member
        </Button>
      )}
    </div>
  );
}

export function LoadingMembersState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-20" />
              <div className="h-4 bg-muted rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}