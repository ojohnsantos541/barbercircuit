import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { barberSchema, serviceSchema, deleteCatalogSchema } from "./catalog-schema";

async function ownerShop(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from("barbershops").select("id").eq("owner_user_id", userId).maybeSingle();
  if (error) throw new Error("Não foi possível carregar sua barbearia.");
  return data?.id ?? null;
}

export const getCatalog = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const shopId = await ownerShop(context.supabase, context.userId);
  if (!shopId) return { shopId: null, services: [], barbers: [] };
  const [services, barbers] = await Promise.all([
    context.supabase.from("services").select("*").eq("barbershop_id", shopId).order("name"),
    context.supabase.from("barbers").select("*").eq("barbershop_id", shopId).order("name"),
  ]);
  if (services.error || barbers.error) throw new Error("Não foi possível carregar os cadastros. Tente novamente.");
  return { shopId, services: services.data, barbers: barbers.data };
});

export const saveService = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => serviceSchema.parse(input)).handler(async ({ data, context }) => {
  const shopId = await ownerShop(context.supabase, context.userId);
  if (!shopId) throw new Error("Cadastre sua barbearia antes de adicionar serviços.");
  const { id, ...values } = data;
  const query = id
    ? context.supabase.from("services").update(values).eq("id", id).eq("barbershop_id", shopId)
    : context.supabase.from("services").insert({ ...values, barbershop_id: shopId });
  const result = await query.select().single();
  if (result.error) throw new Error("Não foi possível salvar o serviço. Tente novamente.");
  return result.data;
});

export const saveBarber = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => barberSchema.parse(input)).handler(async ({ data, context }) => {
  const shopId = await ownerShop(context.supabase, context.userId);
  if (!shopId) throw new Error("Cadastre sua barbearia antes de adicionar profissionais.");
  const { id, ...values } = data;
  const query = id
    ? context.supabase.from("barbers").update(values).eq("id", id).eq("barbershop_id", shopId)
    : context.supabase.from("barbers").insert({ ...values, barbershop_id: shopId });
  const result = await query.select().single();
  if (result.error) throw new Error("Não foi possível salvar o barbeiro. Tente novamente.");
  return result.data;
});

export const deleteCatalogItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => deleteCatalogSchema.parse(input)).handler(async ({ data, context }) => {
  const shopId = await ownerShop(context.supabase, context.userId);
  if (!shopId) throw new Error("Barbearia não encontrada.");
  const result = await context.supabase.from(data.kind).delete().eq("id", data.id).eq("barbershop_id", shopId).select("id").single();
  if (result.error) throw new Error("Não foi possível excluir o cadastro. Tente novamente.");
  return result.data;
});