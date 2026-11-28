import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/barber/ui";
import { isRecoveryHash, RECOVERY_EVENT, RECOVERY_STORAGE_KEY, validateNewPassword } from "@/lib/password-recovery";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Redefinir senha — BarberCircuit" },
    { name: "description", content: "Crie uma nova senha para acessar sua conta BarberCircuit com segurança." },
    { property: "og:title", content: "Redefinir senha — BarberCircuit" },
    { property: "og:description", content: "Recupere o acesso à sua conta BarberCircuit." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPasswordPage,
});

export function ResetPasswordPage() {
  const [state, setState] = useState<"checking" | "ready" | "invalid" | "success">("checking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const recoveryHash = isRecoveryHash(window.location.hash);
    async function check() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (!active) return;
        const user = data.user;
        const valid = !authError && user && (recoveryHash || sessionStorage.getItem(RECOVERY_STORAGE_KEY) === user.id);
        if (valid && user) sessionStorage.setItem(RECOVERY_STORAGE_KEY, user.id);
        setState(valid ? "ready" : "invalid");
      } catch {
        if (active) setState("invalid");
      }
    }
    window.addEventListener(RECOVERY_EVENT, check);
    void check();
    return () => { active = false; window.removeEventListener(RECOVERY_EVENT, check); };
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state !== "ready" || loading) return;
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const validation = validateNewPassword(password, String(form.get("confirmation")));
    if (validation) { setError(validation); return; }
    setError("");
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user || sessionStorage.getItem(RECOVERY_STORAGE_KEY) !== data.user.id) {
        setState("invalid");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.code === "same_password" ? "Escolha uma senha diferente da anterior." : "Não foi possível salvar a senha. Tente novamente ou solicite um novo link.");
        return;
      }
      sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
      setState("success");
    } catch {
      setError("Não foi possível salvar a senha. Verifique sua conexão e tente novamente.");
    } finally { setLoading(false); }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="panel w-full max-w-md p-8">
        <div className="mb-6 flex justify-center"><Logo /></div>
        {state === "checking" ? <p role="status" className="text-center text-muted-foreground">Verificando seu link...</p> : state === "invalid" ? (
          <div className="text-center"><h1 className="text-2xl font-semibold">Link inválido ou expirado</h1><p className="mt-2 text-sm text-muted-foreground">Solicite um novo link de recuperação na tela de login.</p><Button asChild variant="gold" className="mt-6"><Link to="/auth" search={{ redirect: "/painel" }}>Voltar para entrar</Link></Button></div>
        ) : state === "success" ? (
          <div className="text-center"><h1 className="text-2xl font-semibold">Senha atualizada</h1><p role="status" className="mt-2 text-sm text-muted-foreground">Sua nova senha foi salva com sucesso.</p><Button asChild variant="gold" className="mt-6"><Link to="/painel">Ir para o painel</Link></Button></div>
        ) : (
          <><h1 className="text-center text-3xl font-semibold">Criar nova senha</h1><p className="mt-1 text-center text-sm text-muted-foreground">Escolha uma senha com pelo menos 6 caracteres.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" name="password" type="password" required minLength={6} autoComplete="new-password" disabled={loading} /></div>
              <div className="space-y-1.5"><Label htmlFor="confirmation">Confirmar nova senha</Label><Input id="confirmation" name="confirmation" type="password" required minLength={6} autoComplete="new-password" disabled={loading} /></div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" variant="gold" className="w-full" disabled={loading}>{loading ? "Salvando..." : "Salvar nova senha"}</Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}