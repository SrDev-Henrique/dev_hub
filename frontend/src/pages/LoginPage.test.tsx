import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/context/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { renderWithProviders } from "@/test/test-utils";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("LoginPage", () => {
  const login = vi.fn();

  beforeEach(() => {
    login.mockReset();
    mockedUseAuth.mockReturnValue({
      login,
      user: null,
      isLoading: false,
      register: vi.fn(),
      logout: vi.fn(),
      refreshMe: vi.fn(),
      updateUser: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
  });

  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Informe o usuário")).toBeInTheDocument();
    expect(screen.getByText("Informe a senha")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("calls login with the entered credentials on valid submit", async () => {
    const user = userEvent.setup();
    login.mockResolvedValueOnce(undefined);
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText("Usuário"), "alice");
    await user.type(screen.getByLabelText("Senha"), "S3nhaForte!23");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(login).toHaveBeenCalledWith("alice", "S3nhaForte!23");
  });

  it("shows an error message when login fails", async () => {
    const user = userEvent.setup();
    login.mockRejectedValueOnce(new Error("invalid credentials"));
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText("Usuário"), "alice");
    await user.type(screen.getByLabelText("Senha"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Usuário ou senha inválidos.")).toBeInTheDocument();
  });
});
