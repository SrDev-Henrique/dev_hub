import { Button } from "@/components/ui/button";
import { useToggleFollow } from "@/hooks/useSocial";

export function FollowButton({
  targetUserId,
  meId,
  isFollowing,
}: {
  targetUserId: number;
  meId: number | undefined;
  isFollowing: boolean;
}) {
  const toggleFollow = useToggleFollow(targetUserId, meId);

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={() => toggleFollow.mutate(isFollowing)}
      disabled={toggleFollow.isPending}
    >
      {isFollowing ? "Deixar de seguir" : "Seguir"}
    </Button>
  );
}
