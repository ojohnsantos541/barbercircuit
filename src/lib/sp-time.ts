// São Paulo has had no daylight saving since 2019, so its offset is fixed at -03:00.
export function spInstant(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}
export function spParts(iso: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { date: `${p["year"]}-${p["month"]}-${p["day"]}`, time: `${p["hour"]}:${p["minute"]}` };
}
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}