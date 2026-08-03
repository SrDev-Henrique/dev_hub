import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { Comment, Paginated, Post } from "@/lib/types";

const POST_LIST_QUERY_KEYS = ["feed", "user-posts"];

function invalidatePostLists(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    predicate: (query) => POST_LIST_QUERY_KEYS.includes(query.queryKey[0] as string),
  });
}

export function useFeed(page: number) {
  return useQuery({
    queryKey: ["feed", page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Post>>("/posts/feed/", { params: { page } });
      return data;
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post<Post>("/posts/", { text });
      return data;
    },
    onSuccess: () => {
      invalidatePostLists(queryClient);
      toast.success("Post publicado!");
    },
    onError: () => toast.error("Não foi possível publicar o post."),
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: number; text: string }) => {
      const { data } = await api.patch<Post>(`/posts/${id}/`, { text });
      return data;
    },
    onSuccess: () => {
      invalidatePostLists(queryClient);
      toast.success("Post atualizado!");
    },
    onError: () => toast.error("Não foi possível editar o post."),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/posts/${id}/`);
    },
    onSuccess: () => {
      invalidatePostLists(queryClient);
      toast.success("Post excluído.");
    },
    onError: () => toast.error("Não foi possível excluir o post."),
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const { data } = await api.post<{ liked: boolean }>(`/posts/${postId}/like/`);
      return data;
    },
    onSuccess: () => {
      invalidatePostLists(queryClient);
    },
    onError: () => toast.error("Não foi possível curtir o post."),
  });
}

export function useComments(postId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Comment>>(`/posts/${postId}/comments/`);
      return data;
    },
    enabled,
  });
}

export function useCreateComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post<Comment>(`/posts/${postId}/comments/`, { text });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      invalidatePostLists(queryClient);
    },
    onError: () => toast.error("Não foi possível comentar."),
  });
}

export function useUpdateComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: number; text: string }) => {
      const { data } = await api.patch<Comment>(`/comments/${id}/`, { text });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success("Comentário atualizado!");
    },
    onError: () => toast.error("Não foi possível editar o comentário."),
  });
}

export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/comments/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      invalidatePostLists(queryClient);
      toast.success("Comentário excluído.");
    },
    onError: () => toast.error("Não foi possível excluir o comentário."),
  });
}
