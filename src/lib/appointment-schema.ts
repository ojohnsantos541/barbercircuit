import { z } from "zod";

export const STATUSES = ["confirmado", "em_andamento", "concluido", "cancelado"] as const;
export const newAppointmentSchema = z.object({
  customer_id: z.string().uuid("Escolha o cliente."),
  service_id: z.string().uuid("Escolha o serviço."),
  barber_id: z.string().uuid("Escolha o barbeiro."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Informe o horário."),
  notes: z.string().trim(),
});
export const statusSchema = z.object({ id: z.string().uuid(), status: z.enum(STATUSES) });
export const rangeSchema = z.object({ from: z.string(), to: z.string() });
export const apptIdSchema = z.object({ id: z.string().uuid() });