import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/barber/ui";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s["redirect"] === "string" && s["redirect"].startsWith("/") && !s["redirect"].startsWith("//") ? s["redirect"] : "/painel" }),
  head: () => ({ meta: [{ title: "Entrar — BarberCircuit" }, { name: "description", content: "Acesse o painel da sua barbearia ou crie sua conta BarberCircuit." }, { property: "og:title", content: "Entrar — BarberCircuit" }, { property: "og:description", content: "Acesse o painel da sua barbearia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthPage,
});

export function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "cadastrar" | "recuperar">("entrar");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim().toLowerCase();
    const password = String(f.get("password"));
    const name = String(f.get("name") ?? "").trim();
    setLoading(true);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: redirect, replace: true });
      } else if (mode === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/painel", data: { full_name: name } } });
        if (error) throw error;
        if (data.session) navigate({ to: "/painel", replace: true }); else setSent(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const code = typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: unknown }).code ?? "")
        : "";
      const status = typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status?: unknown }).status)
        : 0;
      const normalized = `${code} ${message}`.toLowerCase();

      let userMessage = "Não foi possível continuar. Tente novamente.";
      if (normalized.includes("over_email_send_rate_limit") || normalized.includes("email rate limit") || status === 429) {
        userMessage = "O limite de envio de e-mails de confirmação foi atingido. Aguarde alguns minutos antes de tentar novamente. Se persistir, será necessário configurar o envio de e-mails da barbearia.";
      } else if (normalized.includes("email_address_invalid") || normalized.includes("email address") && normalized.includes("invalid")) {
        userMessage = "Este endereço de e-mail não foi aceito. Confira se está correto e tente outro endereço.";
      } else if (normalized.includes("invalid login") || normalized.includes("invalid_credentials")) {
        userMessage = "E-mail ou senha incorretos.";
      } else if (normalized.includes("already registered") || normalized.includes("user_already_exists") || normalized.includes("registered")) {
        userMessage = "Este e-mail já possui cadastro. Entre na sua conta ou recupere a senha.";
      } else if (normalized.includes("email not confirmed") || normalized.includes("email_not_confirmed") || normalized.includes("confirmed")) {
        userMessage = "Confirme seu e-mail antes de entrar.";
      } else if (normalized.includes("password") && (normalized.includes("at least") || normalized.includes("weak") || normalized.includes("short"))) {
        userMessage = "A senha não atende aos requisitos. Use uma senha mais forte.";
      } else if (mode === "recuperar") {
        userMessage = "Não foi possível enviar o link de recuperação. Confira o e-mail e tente novamente.";
      }
      toast.error(userMessage);
    } finally { setLoading(false); }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="panel w-full max-w-md p-8">
        <div className="mb-6 flex justify-center"><Logo /></div>
        {sent ? (
          <div className="text-center"><h1 className="text-2xl font-semibold">{mode === "recuperar" ? "Verifique seu e-mail" : "Confirme seu e-mail"}</h1><p role="status" className="mt-2 text-sm text-muted-foreground">{mode === "recuperar" ? "Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha. Confira também a pasta de spam." : "Enviamos um link de confirmação. Depois de confirmar, entre com seu e-mail e senha."}</p><Button variant="outline" className="mt-6" onClick={() => { setSent(false); setMode("entrar"); }}>Voltar para entrar</Button></div>
        ) : (
          <>
            <h1 className="text-center text-3xl font-semibold">{mode === "entrar" ? "Entrar no painel" : mode === "recuperar" ? "Recuperar senha" : "Criar conta"}</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">{mode === "entrar" ? "Acesse a gestão da sua barbearia" : mode === "recuperar" ? "Receba um link de recuperação no seu e-mail" : "Comece a gerenciar sua barbearia"}</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "cadastrar" && <div className="space-y-1.5"><Label htmlFor="name">Nome completo</Label><Input id="name" name="name" required /></div>}
              <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
              {mode !== "recuperar" && <div className="space-y-1.5"><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" required minLength={6} autoComplete={mode === "entrar" ? "current-password" : "new-password"} /></div>}
              {mode === "entrar" && <Button type="button" variant="link" className="h-auto px-0 py-0 text-sm" disabled={loading} onClick={() => setMode("recuperar")}>Esqueceu sua senha?</Button>}
              <Button type="submit" variant="gold" className="w-full" disabled={loading}>{loading ? "Aguarde..." : mode === "entrar" ? "Entrar" : mode === "recuperar" ? "Enviar link de recuperação" : "Criar conta"}</Button>
            </form>
            <Button type="button" variant="link" className="mt-4 h-auto w-full whitespace-normal text-center text-sm" disabled={loading} onClick={() => setMode(mode === "entrar" ? "cadastrar" : "entrar")}>{mode === "entrar" ? "Ainda não tem conta? Cadastre-se" : mode === "recuperar" ? "Voltar para entrar" : "Já tem conta? Entrar"}</Button>
          </>
        )}
      </div>
    </div>
  );
}
