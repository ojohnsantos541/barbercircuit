import { describe, expect, it } from "vitest";
import { barberSchema, serviceSchema } from "@/lib/catalog-schema";

const service = { name: "Corte", description: "", duration_minutes: 30, price: 50, active: true };
describe("regras de cadastro", () => {
  it("aceita preço em reais com centavos", () => expect(serviceSchema.parse({ ...service, price: 49.9 }).price).toBe(49.9));
  it("rejeita preço negativo", () => expect(serviceSchema.safeParse({ ...service, price: -1 }).success).toBe(false));
  it("rejeita duração zero", () => expect(serviceSchema.safeParse({ ...service, duration_minutes: 0 }).success).toBe(false));
  it("exige nome do barbeiro", () => expect(barberSchema.safeParse({ name: " ", specialty: "", phone: "", active: true }).success).toBe(false));
});