import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { Paginated, Post, PublicUser } from "@/lib/types";

export function useUserProfile(username: string | undefined) {
  return useQuery({
    queryKey: ["user-profile", username],
    queryFn: async () => {
      const { data } = await api.get<PublicUser>(`/users/${username}/`);
      return data;
    },
    enabled: !!username,
  });
}

export function useUserPosts(userId: number | undefined) {
  return useQuery({
    queryKey: ["user-posts", userId],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Post>>(`/users/${userId}/posts/`);
      return data.results;
    },
    enabled: !!userId,
  });
}
