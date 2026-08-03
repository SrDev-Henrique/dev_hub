import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/context/AuthContext";
import { useDeletePost, useToggleLike, useUpdatePost } from "@/hooks/usePosts";
import type { Post } from "@/lib/types";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/usePosts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/usePosts")>();
  return {
    ...actual,
    useToggleLike: vi.fn(),
    useUpdatePost: vi.fn(),
    useDeletePost: vi.fn(),
  };
});

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseToggleLike = vi.mocked(useToggleLike);
const mockedUseUpdatePost = vi.mocked(useUpdatePost);
const mockedUseDeletePost = vi.mocked(useDeletePost);

const basePost: Post = {
  id: 1,
  author: { id: 2, username: "bob", name: "Bob Builder", profile_photo_url: "" },
  text: "Olá, sou o bob!",
  created_at: "2026-08-03T16:08:37Z",
  updated_at: "2026-08-03T16:08:37Z",
  like_count: 3,
  comment_count: 1,
  liked_by_me: false,
};

function renderPost(post: Post) {
  return render(
    <MemoryRouter>
      <PostCard post={post} />
    </MemoryRouter>
  );
}

describe("PostCard", () => {
  const toggleLikeMutate = vi.fn();

  beforeEach(() => {
    toggleLikeMutate.mockClear();
    mockedUseToggleLike.mockReturnValue({
      mutate: toggleLikeMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useToggleLike>);
    mockedUseUpdatePost.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<
      typeof useUpdatePost
    >);
    mockedUseDeletePost.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<
      typeof useDeletePost
    >);
  });

  it("renders the post text, author and counts", () => {
    mockedUseAuth.mockReturnValue({ user: { id: 1, username: "alice" } } as unknown as ReturnType<typeof useAuth>);

    renderPost(basePost);

    expect(screen.getByText("Olá, sou o bob!")).toBeInTheDocument();
    expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("hides edit/delete controls when the viewer is not the author", () => {
    mockedUseAuth.mockReturnValue({ user: { id: 1, username: "alice" } } as unknown as ReturnType<typeof useAuth>);

    renderPost(basePost);

    expect(screen.queryByLabelText("Editar post")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Excluir post")).not.toBeInTheDocument();
  });

  it("shows edit/delete controls when the viewer is the author", () => {
    mockedUseAuth.mockReturnValue({ user: { id: 2, username: "bob" } } as unknown as ReturnType<typeof useAuth>);

    renderPost(basePost);

    expect(screen.getByLabelText("Editar post")).toBeInTheDocument();
    expect(screen.getByLabelText("Excluir post")).toBeInTheDocument();
  });

  it("toggles the like when the like button is clicked", () => {
    mockedUseAuth.mockReturnValue({ user: { id: 1, username: "alice" } } as unknown as ReturnType<typeof useAuth>);

    renderPost(basePost);

    fireEvent.click(screen.getByText("3"));

    expect(toggleLikeMutate).toHaveBeenCalledWith(1);
  });
});
