import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useToggleLike } from "@/hooks/usePosts";
import { api } from "@/lib/api";
import type { Paginated, Post } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

const mockedApi = vi.mocked(api, true);

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 1,
    author: { id: 2, username: "bob", name: "Bob", profile_photo_url: "" },
    text: "oi",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    like_count: 3,
    comment_count: 0,
    liked_by_me: false,
    ...overrides,
  };
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useToggleLike", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    vi.clearAllMocks();
  });

  it("flips liked_by_me and like_count in every cached post list before the request resolves", async () => {
    const feed: Paginated<Post> = { count: 1, next: null, previous: null, results: [makePost()] };
    queryClient.setQueryData(["feed", 1], feed);
    queryClient.setQueryData(["user-posts", 2], [makePost()]);

    mockedApi.post.mockReturnValue(new Promise(() => {})); // never resolves during this test

    const { result } = renderHook(() => useToggleLike(), { wrapper: createWrapper(queryClient) });

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      const feedCache = queryClient.getQueryData<Paginated<Post>>(["feed", 1]);
      expect(feedCache?.results[0].liked_by_me).toBe(true);
      expect(feedCache?.results[0].like_count).toBe(4);
    });

    const profileCache = queryClient.getQueryData<Post[]>(["user-posts", 2]);
    expect(profileCache?.[0].liked_by_me).toBe(true);
    expect(profileCache?.[0].like_count).toBe(4);
  });

  it("rolls back to the previous state when the request fails", async () => {
    const feed: Paginated<Post> = { count: 1, next: null, previous: null, results: [makePost()] };
    queryClient.setQueryData(["feed", 1], feed);
    mockedApi.post.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useToggleLike(), { wrapper: createWrapper(queryClient) });

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const feedCache = queryClient.getQueryData<Paginated<Post>>(["feed", 1]);
    expect(feedCache?.results[0].liked_by_me).toBe(false);
    expect(feedCache?.results[0].like_count).toBe(3);
  });
});
