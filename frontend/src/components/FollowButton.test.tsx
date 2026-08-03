import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FollowButton } from "@/components/FollowButton";
import { useToggleFollow } from "@/hooks/useSocial";

vi.mock("@/hooks/useSocial", () => ({
  useToggleFollow: vi.fn(),
}));

const mockedUseToggleFollow = vi.mocked(useToggleFollow);

describe("FollowButton", () => {
  const mutate = vi.fn();

  beforeEach(() => {
    mutate.mockClear();
    mockedUseToggleFollow.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useToggleFollow>);
  });

  it('shows "Seguir" and follows when not following', () => {
    render(<FollowButton targetUserId={2} meId={1} isFollowing={false} />);

    const button = screen.getByRole("button", { name: "Seguir" });
    fireEvent.click(button);

    expect(mutate).toHaveBeenCalledWith(false);
  });

  it('shows "Deixar de seguir" and unfollows when already following', () => {
    render(<FollowButton targetUserId={2} meId={1} isFollowing={true} />);

    const button = screen.getByRole("button", { name: "Deixar de seguir" });
    fireEvent.click(button);

    expect(mutate).toHaveBeenCalledWith(true);
  });

  it("disables the button while the mutation is pending", () => {
    mockedUseToggleFollow.mockReturnValue({
      mutate,
      isPending: true,
    } as unknown as ReturnType<typeof useToggleFollow>);

    render(<FollowButton targetUserId={2} meId={1} isFollowing={false} />);

    expect(screen.getByRole("button", { name: "Seguir" })).toBeDisabled();
  });
});
