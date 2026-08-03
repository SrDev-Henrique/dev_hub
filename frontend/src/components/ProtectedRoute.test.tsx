import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderProtected(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading state while auth is resolving", () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: true } as unknown as ReturnType<typeof useAuth>);

    renderProtected("/");

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("redirects to /login when there is no authenticated user", () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: false } as unknown as ReturnType<typeof useAuth>);

    renderProtected("/");

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders the nested route when the user is authenticated", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, username: "alice" },
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    renderProtected("/");

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
