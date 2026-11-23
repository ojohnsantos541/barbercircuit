export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dateBR = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", opts);
