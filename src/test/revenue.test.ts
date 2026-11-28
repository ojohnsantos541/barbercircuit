import { describe, expect, it } from "vitest";
import { isRecognizedRevenue } from "@/lib/revenue";

describe("receita reconhecida", () => {
  const now = "2026-11-28T15:00:00.000Z";

  it("reconhece atendimento concluído que já começou", () => {
    expect(isRecognizedRevenue("concluido", "2026-11-28T14:00:00.000Z", now)).toBe(true);
  });

  it("não reconhece atendimento futuro marcado como concluído", () => {
    expect(isRecognizedRevenue("concluido", "2026-11-28T16:00:00.000Z", now)).toBe(false);
  });

  it("não reconhece atendimento ainda confirmado", () => {
    expect(isRecognizedRevenue("confirmado", "2026-11-28T14:00:00.000Z", now)).toBe(false);
  });
});
