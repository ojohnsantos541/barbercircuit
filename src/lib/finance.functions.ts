import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { spInstant } from "./sp-time";

const expenseSchema = z.object({
  description: z.string().trim().min(2).max(120),
  category: z.string().trim().max(60).optional().default("Geral"),
  amount: z.coerce.number().positive().max(100000000),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const idSchema = z.object({ id: z.string().uuid() });
const rangeSchema = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

async function getShopId(context: { supabase: import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>; userId: string }) {
  const { data, error } = await context.supabase.from("barbershops").select("id").eq("owner_user_id", context.userId).maybeSingle();
  if (error) throw new Error("Não foi possível identificar sua barbearia. Verifique se há apenas uma unidade cadastrada.");
  if (!data) throw new Error("Cadastre sua barbearia primeiro.");
  return data.id;
}

export const getFinancialData = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((i:unknown)=>rangeSchema.parse(i)).handler(async({data,context})=>{
  const shopId=await getShopId(context);
  const from=spInstant(data.from,"00:00"), to=spInstant(data.to,"00:00");
  const [appointments,expenses]=await Promise.all([
    context.supabase.from("appointments").select("id,starts_at,status,price,services(name)").eq("barbershop_id",shopId).eq("status","concluido").gte("starts_at",from).lt("starts_at",to).lte("starts_at",new Date().toISOString()).order("starts_at",{ascending:false}).limit(2000),
    context.supabase.from("expenses").select("id,description,category,amount,expense_date").eq("barbershop_id",shopId).gte("expense_date",data.from).lt("expense_date",data.to).order("expense_date",{ascending:false}).limit(2000)
  ]);
  if(appointments.error||expenses.error) throw new Error("Não foi possível carregar o financeiro.");
  return {appointments:appointments.data??[],expenses:expenses.data??[]};
});

export const createExpense = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((i:unknown)=>expenseSchema.parse(i)).handler(async({data,context})=>{
  const shopId=await getShopId(context);
  const {data:row,error}=await context.supabase.from("expenses").insert({...data,barbershop_id:shopId}).select("id").single();
  if(error) throw new Error("Não foi possível registrar a despesa.");
  return row;
});

export const deleteExpense = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((i:unknown)=>idSchema.parse(i)).handler(async({data,context})=>{
  const shopId=await getShopId(context);
  const {data:row,error}=await context.supabase.from("expenses").delete().eq("id",data.id).eq("barbershop_id",shopId).select("id").single();
  if(error) throw new Error("Não foi possível excluir a despesa.");
  return row;
});
