import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";

describe("DeleteConfirmButton", () => {
  it("does not call onConfirm until the user confirms in the dialog", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteConfirmButton title="Excluir post" description="Essa ação não pode ser desfeita." onConfirm={onConfirm}>
        <button type="button">Excluir post</button>
      </DeleteConfirmButton>
    );

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText("Essa ação não pode ser desfeita.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Excluir post" }));

    expect(await screen.findByText("Essa ação não pode ser desfeita.")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Excluir" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not call onConfirm when the dialog is cancelled", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteConfirmButton title="Excluir post" description="Essa ação não pode ser desfeita." onConfirm={onConfirm}>
        <button type="button">Excluir post</button>
      </DeleteConfirmButton>
    );

    await user.click(screen.getByRole("button", { name: "Excluir post" }));
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
