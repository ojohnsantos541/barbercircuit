import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { myShopQuery, slugify } from "@/lib/my-shop";

export function ShopOnboarding() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }

    // Keep onboarding resilient if the Auth user exists but its profile trigger
    // did not create the corresponding public.profiles row.
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: u.user.id,
        full_name: typeof u.user.user_metadata?.['full_name'] === "string"
          ? u.user.user_metadata.full_name.trim() || null
          : null,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (profileError) {
      setLoading(false);
      toast.error("Não foi possível preparar seu perfil. Saia da conta e entre novamente.");
      return;
    }
    const { data: existing, error: lookupError } = await supabase.from("barbershops").select("id").eq("owner_user_id", u.user.id).maybeSingle();
    if (lookupError) { setLoading(false); toast.error("Sua conta possui mais de uma barbearia cadastrada. Corrija os registros antes de continuar."); return; }
    if (existing) { setLoading(false); toast.success("Sua barbearia já está cadastrada."); qc.invalidateQueries({ queryKey: myShopQuery.queryKey }); return; }
    const base = slugify(name) || "barbearia";
    let error = null;
    for (let i = 0; i < 4; i++) {
      const slug = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      ({ error } = await supabase.from("barbershops").insert({ name, slug, phone: String(f.get("phone")) || null, address: String(f.get("address")) || null, owner_user_id: u.user.id }));
      if (!error || error.code !== "23505") break;
    }
    setLoading(false);
    if (error) { toast.error("Não foi possível cadastrar a barbearia."); return; }
    toast.success("Barbearia cadastrada!");
    qc.invalidateQueries({ queryKey: myShopQuery.queryKey });
  }
  return (
    <div className="mx-auto max-w-lg panel p-8">
      <h1 className="text-3xl font-semibold">Cadastre sua barbearia</h1>
      <p className="mt-1 text-sm text-muted-foreground">Esses dados aparecem para seus clientes na página de agendamento.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5"><Label htmlFor="shop-name">Nome da barbearia</Label><Input id="shop-name" name="name" required /></div>
        <div className="space-y-1.5"><Label htmlFor="shop-phone">Telefone / WhatsApp</Label><Input id="shop-phone" name="phone" /></div>
        <div className="space-y-1.5"><Label htmlFor="shop-address">Endereço</Label><Input id="shop-address" name="address" /></div>
        <Button type="submit" variant="gold" className="w-full" disabled={loading}>{loading ? "Salvando..." : "Cadastrar barbearia"}</Button>
      </form>
    </div>
  );
}
