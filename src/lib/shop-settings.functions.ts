import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const shopSchema=z.object({name:z.string().trim().min(2).max(100),address:z.string().trim().max(200).optional().default(""),phone:z.string().trim().max(30).optional().default(""),slug:z.string().trim().min(3).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)});
export const updateMyShop=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((i:unknown)=>shopSchema.parse(i)).handler(async({data,context})=>{
 const {data:shop,error:lookupError}=await context.supabase.from("barbershops").select("id").eq("owner_user_id",context.userId).maybeSingle();
 if(lookupError) throw new Error("Não foi possível identificar sua barbearia. Verifique se há apenas uma unidade cadastrada.");
 if(!shop) throw new Error("Cadastre sua barbearia antes de alterar as configurações.");
 const {data:updated,error}=await context.supabase.from("barbershops").update({name:data.name,address:data.address||null,phone:data.phone||null,slug:data.slug}).eq("id",shop.id).eq("owner_user_id",context.userId).select("*").single();
 if(error) throw new Error(error.code==="23505"?"Este link de agendamento já está sendo usado. Escolha outro.":"Não foi possível salvar as configurações.");
 return updated;
});
