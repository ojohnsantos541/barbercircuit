import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { apptIdSchema, newAppointmentSchema, rangeSchema, statusSchema } from "./appointment-schema";
import { overlaps, spInstant } from "./sp-time";

type Ctx = { supabase: import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>; userId: string };
async function shopOf({ supabase, userId }: Ctx) {
  const { data, error } = await supabase.from("barbershops").select("id").eq("owner_user_id", userId).maybeSingle();
  if (error) throw new Error("Não foi possível carregar sua barbearia.");
  if (!data) throw new Error("Cadastre sua barbearia primeiro.");
  return data.id;
}

export const getAppointments = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => rangeSchema.parse(i)).handler(async ({ data, context }) => {
  const shopId = await shopOf(context);
  const { data: rows, error } = await context.supabase.from("appointments")
    .select("id, starts_at, ends_at, status, price, notes, barber_id, customers(name), services(name)")
    .eq("barbershop_id", shopId).gte("starts_at", data.from).lt("starts_at", data.to).order("starts_at").limit(1000);
  if (error) throw new Error("Não foi possível carregar a agenda.");
  return rows;
});

export const createAppointment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => newAppointmentSchema.parse(i)).handler(async ({ data, context }) => {
  const shopId = await shopOf(context);
  const [serviceResult, barberResult, customerResult] = await Promise.all([
    context.supabase.from("services").select("duration_minutes, price").eq("id", data.service_id).eq("barbershop_id", shopId).eq("active", true).maybeSingle(),
    context.supabase.from("barbers").select("id").eq("id", data.barber_id).eq("barbershop_id", shopId).eq("active", true).maybeSingle(),
    context.supabase.from("customers").select("id").eq("id", data.customer_id).eq("barbershop_id", shopId).maybeSingle(),
  ]);
  if (serviceResult.error || !serviceResult.data) throw new Error("Serviço não encontrado ou inativo.");
  if (barberResult.error || !barberResult.data) throw new Error("Barbeiro não encontrado ou inativo nesta barbearia.");
  if (customerResult.error || !customerResult.data) throw new Error("Cliente não encontrado nesta barbearia.");
  const svc = serviceResult.data;
  const starts = spInstant(data.date, data.time);
  const ends = new Date(new Date(starts).getTime() + svc.duration_minutes * 60000).toISOString();
  const dayStart = new Date(new Date(starts).getTime() - 24 * 3600000).toISOString();
  const { data: same } = await context.supabase.from("appointments").select("starts_at, ends_at").eq("barbershop_id", shopId).eq("barber_id", data.barber_id).neq("status", "cancelado").gte("starts_at", dayStart).lt("starts_at", ends);
  if ((same ?? []).some((a) => overlaps(starts, ends, a.starts_at, a.ends_at ?? a.starts_at))) throw new Error("Este barbeiro já tem um atendimento nesse horário.");
  const r = await context.supabase.from("appointments").insert({ barbershop_id: shopId, customer_id: data.customer_id, service_id: data.service_id, barber_id: data.barber_id, starts_at: starts, ends_at: ends, price: svc.price, notes: data.notes || null }).select("id").single();
  if (r.error) throw new Error("Não foi possível salvar o agendamento.");
  return r.data;
});

export const setAppointmentStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => statusSchema.parse(i)).handler(async ({ data, context }) => {
  const shopId = await shopOf(context);
  const r = await context.supabase.from("appointments").update({ status: data.status }).eq("id", data.id).eq("barbershop_id", shopId).select("id").single();
  if (r.error) throw new Error("Não foi possível alterar o status.");
  return r.data;
});

export const deleteAppointment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => apptIdSchema.parse(i)).handler(async ({ data, context }) => {
  const shopId = await shopOf(context);
  const r = await context.supabase.from("appointments").delete().eq("id", data.id).eq("barbershop_id", shopId).select("id").single();
  if (r.error) throw new Error("Não foi possível excluir o agendamento.");
  return r.data;
});