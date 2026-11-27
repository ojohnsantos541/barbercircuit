import { describe, expect, it } from "vitest";
import { customerSchema } from "@/lib/customer-schema";

const base = { name: "João", phone: "", email: "", notes: "" };
describe("regras de clientes", () => {
  it("exige nome", () => expect(customerSchema.safeParse({ ...base, name: " " }).success).toBe(false));
  it("aceita e-mail vazio", () => expect(customerSchema.safeParse(base).success).toBe(true));
  it("rejeita e-mail inválido", () => expect(customerSchema.safeParse({ ...base, email: "joao" }).success).toBe(false));
});