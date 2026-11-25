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
  head: () => ({ meta: [{ title: "Entrar — BarberPro" }, { name: "description", content: "Acesse o painel da sua barbearia ou crie sua conta BarberPro." }, { property: "og:title", content: "Entrar — BarberPro" }, { property: "og:description", content: "Acesse o painel da sua barbearia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "cadastrar">("entrar");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password"));
    setLoading(true);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: redirect, replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/painel", data: { full_name: String(f.get("name")) } } });
        if (error) throw error;
        if (data.session) navigate({ to: "/painel", replace: true }); else setSent(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.includes("Invalid login") ? "E-mail ou senha incorretos." : msg.includes("registered") ? "Este e-mail já possui conta." : msg.includes("confirmed") ? "Confirme seu e-mail antes de entrar." : "Não foi possível continuar. Tente novamente.");
    } finally { setLoading(false); }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="panel w-full max-w-md p-8">
        <div className="mb-6 flex justify-center"><Logo /></div>
        {sent ? (
          <div className="text-center"><h1 className="text-2xl font-semibold">Confirme seu e-mail</h1><p className="mt-2 text-sm text-muted-foreground">Enviamos um link de confirmação. Depois de confirmar, entre com seu e-mail e senha.</p><Button variant="outline" className="mt-6" onClick={() => { setSent(false); setMode("entrar"); }}>Voltar para entrar</Button></div>
        ) : (
          <>
            <h1 className="text-center text-3xl font-semibold">{mode === "entrar" ? "Entrar no painel" : "Criar conta"}</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">{mode === "entrar" ? "Acesse a gestão da sua barbearia" : "Comece a gerenciar sua barbearia"}</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "cadastrar" && <div className="space-y-1.5"><Label htmlFor="name">Nome completo</Label><Input id="name" name="name" required /></div>}
              <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
              <div className="space-y-1.5"><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" required minLength={6} autoComplete={mode === "entrar" ? "current-password" : "new-password"} /></div>
              <Button type="submit" variant="gold" className="w-full" disabled={loading}>{loading ? "Aguarde..." : mode === "entrar" ? "Entrar" : "Criar conta"}</Button>
            </form>
            <button type="button" className="mt-4 w-full text-center text-sm text-primary hover:underline" onClick={() => setMode(mode === "entrar" ? "cadastrar" : "entrar")}>{mode === "entrar" ? "Ainda não tem conta? Cadastre-se" : "Já tem conta? Entrar"}</button>
          </>
        )}
      </div>
    </div>
  );
}
