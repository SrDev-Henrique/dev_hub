import { Link, useParams } from "react-router-dom";

import { CreatePostDialog } from "@/components/CreatePostDialog";
import { FollowButton } from "@/components/FollowButton";
import { PostCard } from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useUserPosts, useUserProfile } from "@/hooks/useProfile";
import { useFollowers, useFollowing } from "@/hooks/useSocial";

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuth();
  const { data: profile, isLoading } = useUserProfile(username);
  const { data: posts } = useUserPosts(profile?.id);
  const { data: followers } = useFollowers(profile?.id);
  const { data: following } = useFollowing(profile?.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!profile) {
    return <p className="p-8 text-center text-muted-foreground">Usuário não encontrado.</p>;
  }

  const isMe = me?.id === profile.id;
  const isFollowing = !!followers?.some((f) => f.id === me?.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={profile.profile_photo_url} alt={profile.username} />
          <AvatarFallback>{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left">
          <h1 className="text-xl font-semibold">{profile.name || profile.username}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
        </div>
        {!isMe && <FollowButton targetUser={profile} isFollowing={isFollowing} />}
      </div>

      <div className="flex gap-6 text-sm">
        <span>
          <strong>{followers?.length ?? 0}</strong> seguidores
        </span>
        <span>
          <strong>{following?.length ?? 0}</strong> seguindo
        </span>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="followers">Seguidores</TabsTrigger>
          <TabsTrigger value="following">Seguindo</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="flex flex-col gap-4">
          {isMe && (
            <div className="flex justify-end">
              <CreatePostDialog />
            </div>
          )}
          {posts?.length === 0 && <p className="text-muted-foreground">Nenhum post ainda.</p>}
          {posts?.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </TabsContent>
        <TabsContent value="followers" className="flex flex-col gap-2">
          {followers?.length === 0 && <p className="text-muted-foreground">Nenhum seguidor ainda.</p>}
          {followers?.map((u) => (
            <Link key={u.id} to={`/profile/${u.username}`} className="rounded-lg border border-border p-2 text-left hover:bg-accent">
              {u.name || u.username} <span className="text-muted-foreground">@{u.username}</span>
            </Link>
          ))}
        </TabsContent>
        <TabsContent value="following" className="flex flex-col gap-2">
          {following?.length === 0 && <p className="text-muted-foreground">Não segue ninguém ainda.</p>}
          {following?.map((u) => (
            <Link key={u.id} to={`/profile/${u.username}`} className="rounded-lg border border-border p-2 text-left hover:bg-accent">
              {u.name || u.username} <span className="text-muted-foreground">@{u.username}</span>
            </Link>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
