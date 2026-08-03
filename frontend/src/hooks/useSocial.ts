import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Paginated, PublicUser } from "@/lib/types";

export function useFollowers(userId: number | undefined) {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      const { data } = await api.get<Paginated<PublicUser>>(`/users/${userId}/followers/`);
      return data.results;
    },
    enabled: !!userId,
  });
}

export function useFollowing(userId: number | undefined) {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      const { data } = await api.get<Paginated<PublicUser>>(`/users/${userId}/following/`);
      return data.results;
    },
    enabled: !!userId,
  });
}

export function useToggleFollow(targetUser: PublicUser) {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isFollowing: boolean) => {
      if (isFollowing) {
        await api.delete(`/users/${targetUser.id}/follow/`);
      } else {
        await api.post(`/users/${targetUser.id}/follow/`);
      }
    },
    onMutate: async (isFollowing) => {
      await queryClient.cancelQueries({ queryKey: ["followers", targetUser.id] });
      if (me) await queryClient.cancelQueries({ queryKey: ["following", me.id] });

      const previousFollowers = queryClient.getQueryData<PublicUser[]>(["followers", targetUser.id]);
      const previousFollowing = me ? queryClient.getQueryData<PublicUser[]>(["following", me.id]) : undefined;

      if (me) {
        const meAsPublicUser: PublicUser = {
          id: me.id,
          username: me.username,
          name: me.name,
          profile_photo_url: me.profile_photo_url,
        };

        queryClient.setQueryData<PublicUser[]>(["followers", targetUser.id], (old) => {
          if (!old) return old;
          return isFollowing ? old.filter((u) => u.id !== me.id) : [...old, meAsPublicUser];
        });
        queryClient.setQueryData<PublicUser[]>(["following", me.id], (old) => {
          if (!old) return old;
          return isFollowing ? old.filter((u) => u.id !== targetUser.id) : [...old, targetUser];
        });
      }

      return { previousFollowers, previousFollowing };
    },
    onError: (_err, _isFollowing, context) => {
      if (context?.previousFollowers !== undefined) {
        queryClient.setQueryData(["followers", targetUser.id], context.previousFollowers);
      }
      if (me && context?.previousFollowing !== undefined) {
        queryClient.setQueryData(["following", me.id], context.previousFollowing);
      }
      toast.error("Não foi possível atualizar o status de seguir.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["followers", targetUser.id] });
      if (me) queryClient.invalidateQueries({ queryKey: ["following", me.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ["user-search", query],
    queryFn: async () => {
      const { data } = await api.get<Paginated<PublicUser>>("/users/search/", { params: { q: query } });
      return data.results;
    },
    enabled: query.trim().length > 0,
  });
}
