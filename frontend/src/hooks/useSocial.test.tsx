import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/context/AuthContext";
import { useToggleFollow } from "@/hooks/useSocial";
import { api } from "@/lib/api";
import type { PublicUser } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockedApi = vi.mocked(api, true);
const mockedUseAuth = vi.mocked(useAuth);

const me: PublicUser = { id: 1, username: "alice", name: "Alice", profile_photo_url: "" };
const targetUser: PublicUser = { id: 2, username: "bob", name: "Bob Builder", profile_photo_url: "" };

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useToggleFollow", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({ user: me } as unknown as ReturnType<typeof useAuth>);
  });

  it("optimistically adds me to the followers list and the target to the following list", async () => {
    queryClient.setQueryData(["followers", targetUser.id], []);
    queryClient.setQueryData(["following", me.id], []);
    mockedApi.post.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useToggleFollow(targetUser), { wrapper: createWrapper(queryClient) });

    act(() => {
      result.current.mutate(false); // was not following -> follow
    });

    await waitFor(() => {
      const followers = queryClient.getQueryData<PublicUser[]>(["followers", targetUser.id]);
      expect(followers?.map((u) => u.id)).toContain(me.id);
    });

    const following = queryClient.getQueryData<PublicUser[]>(["following", me.id]);
    expect(following?.map((u) => u.id)).toContain(targetUser.id);
  });

  it("rolls back the followers/following lists when the request fails", async () => {
    queryClient.setQueryData(["followers", targetUser.id], []);
    queryClient.setQueryData(["following", me.id], []);
    mockedApi.post.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useToggleFollow(targetUser), { wrapper: createWrapper(queryClient) });

    act(() => {
      result.current.mutate(false);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData<PublicUser[]>(["followers", targetUser.id])).toEqual([]);
    expect(queryClient.getQueryData<PublicUser[]>(["following", me.id])).toEqual([]);
  });
});
