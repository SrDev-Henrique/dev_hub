import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Comment, Paginated, Post } from "@/lib/types";

const POST_LIST_QUERY_KEYS = ["feed", "user-posts"];

/** "feed" caches hold a paginated envelope, "user-posts" caches hold a plain array. */
type PostsCacheValue = Paginated<Post> | Post[];

function isPostListQuery(queryKey: readonly unknown[]) {
  return POST_LIST_QUERY_KEYS.includes(queryKey[0] as string);
}

function mapPosts(data: PostsCacheValue, fn: (posts: Post[]) => Post[]): PostsCacheValue {
  return Array.isArray(data) ? fn(data) : { ...data, results: fn(data.results) };
}

function invalidatePostLists(queryClient: QueryClient) {
  queryClient.invalidateQueries({ predicate: (query) => isPostListQuery(query.queryKey) });
}

/** Applies `fn` to every cached post list, returning a snapshot for rollback on error. */
function updatePostsCaches(queryClient: QueryClient, fn: (posts: Post[]) => Post[]) {
  const snapshot = queryClient.getQueriesData<PostsCacheValue>({
    predicate: (query) => isPostListQuery(query.queryKey),
  });
  snapshot.forEach(([key, data]) => {
    if (data) queryClient.setQueryData(key, mapPosts(data, fn));
  });
  return snapshot;
}

function restorePostsCaches(queryClient: QueryClient, snapshot: ReturnType<typeof updatePostsCaches>) {
  snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
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
    onMutate: async ({ id, text }) => {
      await queryClient.cancelQueries({ predicate: (query) => isPostListQuery(query.queryKey) });
      const snapshot = updatePostsCaches(queryClient, (posts) =>
        posts.map((post) => (post.id === id ? { ...post, text } : post))
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (context) restorePostsCaches(queryClient, context.snapshot);
      toast.error("Não foi possível editar o post.");
    },
    onSuccess: () => toast.success("Post atualizado!"),
    onSettled: () => invalidatePostLists(queryClient),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/posts/${id}/`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ predicate: (query) => isPostListQuery(query.queryKey) });
      const snapshot = updatePostsCaches(queryClient, (posts) => posts.filter((post) => post.id !== id));
      return { snapshot };
    },
    onError: (_err, _id, context) => {
      if (context) restorePostsCaches(queryClient, context.snapshot);
      toast.error("Não foi possível excluir o post.");
    },
    onSuccess: () => toast.success("Post excluído."),
    onSettled: () => invalidatePostLists(queryClient),
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const { data } = await api.post<{ liked: boolean }>(`/posts/${postId}/like/`);
      return data;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ predicate: (query) => isPostListQuery(query.queryKey) });
      const snapshot = updatePostsCaches(queryClient, (posts) =>
        posts.map((post) =>
          post.id === postId
            ? { ...post, liked_by_me: !post.liked_by_me, like_count: post.like_count + (post.liked_by_me ? -1 : 1) }
            : post
        )
      );
      return { snapshot };
    },
    onError: (_err, _postId, context) => {
      if (context) restorePostsCaches(queryClient, context.snapshot);
      toast.error("Não foi possível curtir o post.");
    },
    onSettled: () => invalidatePostLists(queryClient),
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post<Comment>(`/posts/${postId}/comments/`, { text });
      return data;
    },
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });
      const previousComments = queryClient.getQueryData<Paginated<Comment>>(["comments", postId]);
      const postsSnapshot = updatePostsCaches(queryClient, (posts) =>
        posts.map((post) => (post.id === postId ? { ...post, comment_count: post.comment_count + 1 } : post))
      );

      if (user) {
        const optimisticComment: Comment = {
          id: -Date.now(),
          author: { id: user.id, username: user.username, name: user.name, profile_photo_url: user.profile_photo_url },
          post: postId,
          text,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<Paginated<Comment>>(["comments", postId], (old) =>
          old
            ? { ...old, count: old.count + 1, results: [...old.results, optimisticComment] }
            : { count: 1, next: null, previous: null, results: [optimisticComment] }
        );
      }

      return { previousComments, postsSnapshot };
    },
    onError: (_err, _text, context) => {
      if (context?.previousComments !== undefined) {
        queryClient.setQueryData(["comments", postId], context.previousComments);
      }
      if (context) restorePostsCaches(queryClient, context.postsSnapshot);
      toast.error("Não foi possível comentar.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      invalidatePostLists(queryClient);
    },
  });
}

export function useUpdateComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: number; text: string }) => {
      const { data } = await api.patch<Comment>(`/comments/${id}/`, { text });
      return data;
    },
    onMutate: async ({ id, text }) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });
      const previousComments = queryClient.getQueryData<Paginated<Comment>>(["comments", postId]);
      queryClient.setQueryData<Paginated<Comment>>(["comments", postId], (old) =>
        old ? { ...old, results: old.results.map((c) => (c.id === id ? { ...c, text } : c)) } : old
      );
      return { previousComments };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousComments !== undefined) {
        queryClient.setQueryData(["comments", postId], context.previousComments);
      }
      toast.error("Não foi possível editar o comentário.");
    },
    onSuccess: () => toast.success("Comentário atualizado!"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["comments", postId] }),
  });
}

export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/comments/${id}/`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });
      const previousComments = queryClient.getQueryData<Paginated<Comment>>(["comments", postId]);
      queryClient.setQueryData<Paginated<Comment>>(["comments", postId], (old) =>
        old ? { ...old, count: Math.max(0, old.count - 1), results: old.results.filter((c) => c.id !== id) } : old
      );
      const postsSnapshot = updatePostsCaches(queryClient, (posts) =>
        posts.map((post) =>
          post.id === postId ? { ...post, comment_count: Math.max(0, post.comment_count - 1) } : post
        )
      );
      return { previousComments, postsSnapshot };
    },
    onError: (_err, _id, context) => {
      if (context?.previousComments !== undefined) {
        queryClient.setQueryData(["comments", postId], context.previousComments);
      }
      if (context) restorePostsCaches(queryClient, context.postsSnapshot);
      toast.error("Não foi possível excluir o comentário.");
    },
    onSuccess: () => toast.success("Comentário excluído."),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      invalidatePostLists(queryClient);
    },
  });
}
