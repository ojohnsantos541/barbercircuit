import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getUser: vi.fn(), updateUser: vi.fn(), resetPasswordForEmail: vi.fn(),
  signInWithPassword: vi.fn(), signUp: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({ ...options, useSearch: () => ({ redirect: "/painel" }) }),
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: PropsWithChildren<{ to: string }>) => <a href={to}>{children}</a>,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { AuthPage } from "@/routes/auth";
import { ResetPasswordPage } from "@/routes/reset-password";
import { isRecoveryHash, RECOVERY_STORAGE_KEY, validateNewPassword } from "@/lib/password-recovery";

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  auth.getUser.mockResolvedValue({ data: { user: { id: "recovery-user" } }, error: null });
  auth.updateUser.mockResolvedValue({ error: null });
  auth.resetPasswordForEmail.mockResolvedValue({ error: null });
});
afterEach(cleanup);

describe("Password recovery", () => {
  it("requests the recovery email with the same-origin public reset destination", async () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole("button", { name: "Esqueceu sua senha?" }));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "owner@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar link de recuperação" }));
    await waitFor(() => expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("owner@example.com", { redirectTo: `${window.location.origin}/reset-password` }));
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("does not update a password for an ordinary signed-in session", async () => {
    render(<ResetPasswordPage />);
    await screen.findByRole("heading", { name: "Link inválido ou expirado" });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects an expired recovery session", async () => {
    sessionStorage.setItem(RECOVERY_STORAGE_KEY, "recovery-user");
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });
    render(<ResetPasswordPage />);
    await screen.findByRole("heading", { name: "Link inválido ou expirado" });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("saves matching passwords through Supabase without a current password", async () => {
    sessionStorage.setItem(RECOVERY_STORAGE_KEY, "recovery-user");
    render(<ResetPasswordPage />);
    fireEvent.change(await screen.findByLabelText("Nova senha"), { target: { value: "new-secret-123" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "new-secret-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    await screen.findByRole("heading", { name: "Senha atualizada" });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "new-secret-123" });
    expect(sessionStorage.getItem(RECOVERY_STORAGE_KEY)).toBeNull();
  });

  it("blocks mismatched passwords before contacting Supabase", async () => {
    sessionStorage.setItem(RECOVERY_STORAGE_KEY, "recovery-user");
    render(<ResetPasswordPage />);
    fireEvent.change(await screen.findByLabelText("Nova senha"), { target: { value: "new-secret-123" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "different-secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    await screen.findByRole("alert");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("does not claim success when the password update fails", async () => {
    sessionStorage.setItem(RECOVERY_STORAGE_KEY, "recovery-user");
    auth.updateUser.mockResolvedValue({ error: { code: "same_password" } });
    render(<ResetPasswordPage />);
    fireEvent.change(await screen.findByLabelText("Nova senha"), { target: { value: "new-secret-123" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "new-secret-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("heading", { name: "Senha atualizada" })).toBeNull();
    expect(sessionStorage.getItem(RECOVERY_STORAGE_KEY)).toBe("recovery-user");
  });

  it("recognizes only error-free recovery hashes", () => {
    expect(isRecoveryHash("#type=recovery&access_token=example")).toBe(true);
    expect(isRecoveryHash("#type=signup")).toBe(false);
    expect(isRecoveryHash("#type=recovery&error_code=otp_expired")).toBe(false);
  });

  it("enforces the existing six-character password minimum", () => {
    expect(validateNewPassword("12345", "12345")).not.toBeNull();
    expect(validateNewPassword("123456", "123456")).toBeNull();
  });
});