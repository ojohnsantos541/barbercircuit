import { z } from "zod";

export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Informe o nome."),
  phone: z.string().trim(),
  email: z.union([z.literal(""), z.string().trim().email("E-mail inválido.")]),
  notes: z.string().trim(),
});
export const customerIdSchema = z.object({ id: z.string().uuid() });