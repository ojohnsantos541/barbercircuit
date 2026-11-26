import { z } from "zod";

export const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Informe o nome."),
  description: z.string().trim(),
  duration_minutes: z.number().int().positive("Informe uma duração maior que zero."),
  price: z.number().finite().nonnegative("O preço não pode ser negativo.").refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001, "Use até duas casas decimais."),
  active: z.boolean(),
});
export const barberSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Informe o nome."),
  specialty: z.string().trim(),
  phone: z.string().trim(),
  active: z.boolean(),
});
export const deleteCatalogSchema = z.object({ id: z.string().uuid(), kind: z.enum(["services", "barbers"]) });