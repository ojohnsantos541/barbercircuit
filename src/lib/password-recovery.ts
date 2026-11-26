export const RECOVERY_STORAGE_KEY = "barberpro-password-recovery-user";
export const RECOVERY_EVENT = "barberpro-password-recovery";

export function isRecoveryHash(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("type") === "recovery" && !params.has("error") && !params.has("error_code");
}

export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
  if (password !== confirmation) return "As senhas não coincidem.";
  return null;
}