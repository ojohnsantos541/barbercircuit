import { describe, expect, it } from "vitest";
import { overlaps, spInstant, spParts } from "@/lib/sp-time";

describe("regras de agendamento", () => {
  it("09:00 em São Paulo é 12:00 UTC", () => expect(spInstant("2026-11-28", "09:00")).toBe("2026-11-28T12:00:00.000Z"));
  it("exibe no horário de São Paulo", () => expect(spParts("2026-11-28T12:30:00.000Z")).toEqual({ date: "2026-11-28", time: "09:30" }));
  it("detecta conflito de horário", () => expect(overlaps(spInstant("2026-11-28", "09:15"), spInstant("2026-11-28", "09:45"), spInstant("2026-11-28", "09:00"), spInstant("2026-11-28", "09:30"))).toBe(true));
  it("horários encostados não conflitam", () => expect(overlaps(spInstant("2026-11-28", "09:30"), spInstant("2026-11-28", "10:00"), spInstant("2026-11-28", "09:00"), spInstant("2026-11-28", "09:30"))).toBe(false));
});