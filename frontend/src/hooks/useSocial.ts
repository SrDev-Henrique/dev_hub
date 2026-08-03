import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

export function useToggleFollow(targetUserId: number, meId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isFollowing: boolean) => {
      if (isFollowing) {
        await api.delete(`/users/${targetUserId}/follow/`);
      } else {
        await api.post(`/users/${targetUserId}/follow/`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followers", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["following", meId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => toast.error("Não foi possível atualizar o status de seguir."),
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
