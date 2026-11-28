import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { spInstant } from "./sp-time";

const weeklySchema = z.object({
  barber_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
const blockSchema = z.object({
  barber_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  reason: z.string().trim().max(160).optional().default(""),
});
const idSchema = z.object({ id: z.string().uuid() });

async function ownerShop(ctx: any) {
  const { data, error } = await ctx.supabase.from("barbershops").select("id").eq("owner_user_id", ctx.userId).maybeSingle();
  if (error || !data) throw new Error("Não foi possível identificar sua barbearia.");
  return data.id as string;
}
function validRange(start: string, end: string) {
  if (start >= end) throw new Error("O horário final precisa ser posterior ao inicial.");
}
function instant(date: string, time: string) { return spInstant(date, time); }
function overlaps(a: string, b: string, c: string, d: string) {
  return new Date(a).getTime() < new Date(d).getTime() && new Date(c).getTime() < new Date(b).getTime();
}

export const getBarberAvailability = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const shopId = await ownerShop(context);
  const db = context.supabase as any;
  const [hours, blocks, barbers] = await Promise.all([
    db.from("barber_weekly_hours").select("*").eq("barbershop_id", shopId).order("day_of_week").order("start_time"),
    db.from("barber_time_blocks").select("*").eq("barbershop_id", shopId).gte("starts_at", new Date().toISOString()).order("starts_at").limit(200),
    db.from("barbers").select("id,name,active").eq("barbershop_id", shopId).order("name"),
  ]);
  if (hours.error || blocks.error || barbers.error) throw new Error("Não foi possível carregar a disponibilidade. Verifique se as tabelas de disponibilidade já foram criadas no Supabase.");
  return { hours: hours.data ?? [], blocks: blocks.data ?? [], barbers: barbers.data ?? [] };
});

export const saveBarberWeeklyHour = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => weeklySchema.parse(i)).handler(async ({ data, context }) => {
  validRange(data.start_time, data.end_time);
  const shopId = await ownerShop(context);
  const db = context.supabase as any;
  const { data: barber } = await db.from("barbers").select("id").eq("id", data.barber_id).eq("barbershop_id", shopId).maybeSingle();
  if (!barber) throw new Error("Barbeiro não encontrado nesta barbearia.");
  const { data: existing, error } = await db.from("barber_weekly_hours").select("id,start_time,end_time").eq("barbershop_id", shopId).eq("barber_id", data.barber_id).eq("day_of_week", data.day_of_week);
  if (error) throw new Error("Não foi possível validar os horários.");
  if ((existing ?? []).some((x: any) => data.start_time < x.end_time && x.start_time < data.end_time)) throw new Error("Este intervalo se sobrepõe a outro horário cadastrado.");
  const result = await db.from("barber_weekly_hours").insert({ ...data, barbershop_id: shopId }).select("id").single();
  if (result.error) throw new Error("Não foi possível salvar o expediente.");
  return result.data;
});

export const deleteBarberWeeklyHour = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => idSchema.parse(i)).handler(async ({ data, context }) => {
  const shopId = await ownerShop(context);
  const r = await (context.supabase as any).from("barber_weekly_hours").delete().eq("id", data.id).eq("barbershop_id", shopId).select("id").single();
  if (r.error) throw new Error("Não foi possível remover o horário.");
  return r.data;
});

export const createBarberTimeBlock = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => blockSchema.parse(i)).handler(async ({ data, context }) => {
  validRange(data.start_time, data.end_time);
  const shopId = await ownerShop(context);
  const db = context.supabase as any;
  const { data: barber } = await db.from("barbers").select("id").eq("id", data.barber_id).eq("barbershop_id", shopId).maybeSingle();
  if (!barber) throw new Error("Barbeiro não encontrado nesta barbearia.");
  const starts = instant(data.date, data.start_time), ends = instant(data.date, data.end_time);
  const { data: appointments, error } = await db.from("appointments").select("starts_at,ends_at,status").eq("barbershop_id", shopId).eq("barber_id", data.barber_id).neq("status", "cancelado").lt("starts_at", ends).gt("ends_at", starts);
  if (error) throw new Error("Não foi possível verificar os agendamentos existentes.");
  if ((appointments ?? []).some((a: any) => overlaps(starts, ends, a.starts_at, a.ends_at ?? a.starts_at))) throw new Error("Já existe agendamento neste intervalo. Remaneje ou cancele o atendimento antes de bloquear esse horário.");
  const { data: existing, error: blockError } = await db.from("barber_time_blocks").select("starts_at,ends_at").eq("barbershop_id", shopId).eq("barber_id", data.barber_id).lt("starts_at", ends).gt("ends_at", starts);
  if (blockError) throw new Error("Não foi possível validar os bloqueios existentes.");
  if ((existing ?? []).some((x: any) => overlaps(starts, ends, x.starts_at, x.ends_at))) throw new Error("Este bloqueio se sobrepõe a outro já cadastrado.");
  const result = await db.from("barber_time_blocks").insert({ barber_id: data.barber_id, barbershop_id: shopId, starts_at: starts, ends_at: ends, reason: data.reason || null }).select("id").single();
  if (result.error) throw new Error("Não foi possível salvar o bloqueio.");
  return result.data;
});

export const deleteBarberTimeBlock = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => idSchema.parse(i)).handler(async ({ data, context }) => {
  const shopId = await ownerShop(context);
  const r = await (context.supabase as any).from("barber_time_blocks").delete().eq("id", data.id).eq("barbershop_id", shopId).select("id").single();
  if (r.error) throw new Error("Não foi possível remover o bloqueio.");
  return r.data;
});
