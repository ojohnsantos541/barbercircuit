import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { customerIdSchema, customerSchema } from "./customer-schema";

type Ctx = { supabase: import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>; userId: string };
async function shopOf({ supabase, userId }: Ctx) {
  const { data, error } = await supabase.from("barbershops").select("id").eq("owner_user_id", userId).maybeSingle();
  if (error) throw new Error("Não foi possível carregar sua barbearia.");
  if (!data) throw new Error("Cadastre sua barbearia primeiro.");
  return data.id;
}

export const getCustomers = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const shopId = await shopOf(context);
  const { data, error } = await context.supabase.from("customers")
    .select("*, appointments(id, starts_at, status, price, services(name), barbers(name))")
    .eq("barbershop_id", shopId).order("name").limit(1000);
  if (error) throw new Error("Não foi possível carregar os clientes.");
  return data;
});

export const saveCustomer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => customerSchema.parse(i)).handler(async ({ data, context }) => {
  const shopId = await shopOf(context);
  const { id, ...v } = data;
  const values = { name: v.name, phone: v.phone || null, email: v.email || null, notes: v.notes || null };
  const q = id
    ? context.supabase.from("customers").update(values).eq("id", id).eq("barbershop_id", shopId)
    : context.supabase.from("customers").insert({ ...values, barbershop_id: shopId });
  const r = await q.select("id").single();
  if (r.error) throw new Error("Não foi possível salvar o cliente.");
  return r.data;
});

export const deleteCustomer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => customerIdSchema.parse(i)).handler(async ({ data, context }) => {
  const shopId = await shopOf(context);
  const r = await context.supabase.from("customers").delete().eq("id", data.id).eq("barbershop_id", shopId).select("id").single();
  if (r.error) throw new Error("Não foi possível excluir o cliente.");
  return r.data;
});