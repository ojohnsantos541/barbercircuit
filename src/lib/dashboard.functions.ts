import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { spInstant } from "./sp-time";
import { fetchAllRows } from "./paginated-query";

const rangeSchema = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export const getDashboardData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => rangeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: shop, error: shopError } = await context.supabase.from("barbershops")
      .select("id").eq("owner_user_id", context.userId).maybeSingle();
    if (shopError) throw new Error("Não foi possível identificar sua barbearia. Verifique se sua conta possui apenas uma unidade cadastrada.");
    if (!shop) return { appointments: [], services: [], barbers: [], customerCount: 0 };

    const from = spInstant(data.from, "00:00");
    const to = spInstant(data.to, "00:00");

    try {
      const [appointments, services, barbers, customers] = await Promise.all([
        fetchAllRows((pageFrom, pageTo) => context.supabase.from("appointments")
          .select("id, starts_at, ends_at, status, price, barber_id, customer_id, service_id, customers!appointments_customer_id_fkey(name), services!appointments_service_id_fkey(name), barbers!appointments_barber_id_fkey(name)")
          .eq("barbershop_id", shop.id).gte("starts_at", from).lt("starts_at", to)
          .order("starts_at").order("id").range(pageFrom, pageTo)),
        context.supabase.from("services").select("id, name, active").eq("barbershop_id", shop.id).order("name"),
        context.supabase.from("barbers").select("id, name, active").eq("barbershop_id", shop.id).order("name"),
        context.supabase.from("customers").select("id", { count: "exact", head: true }).eq("barbershop_id", shop.id),
      ]);

      if (services.error || barbers.error || customers.error) {
        throw new Error("query failed");
      }

      return {
        appointments,
        services: services.data ?? [],
        barbers: barbers.data ?? [],
        customerCount: customers.count ?? 0,
      };
    } catch {
      throw new Error("Não foi possível carregar os indicadores reais da barbearia.");
    }
  });
