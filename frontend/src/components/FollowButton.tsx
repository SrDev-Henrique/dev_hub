import { Button } from "@/components/ui/button";
import { useToggleFollow } from "@/hooks/useSocial";
import type { PublicUser } from "@/lib/types";

export function FollowButton({ targetUser, isFollowing }: { targetUser: PublicUser; isFollowing: boolean }) {
  const toggleFollow = useToggleFollow(targetUser);

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
