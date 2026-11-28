export function isRecognizedRevenue(
  status: string,
  startsAt: string,
  now: string | Date = new Date(),
) {
  const nowMs = typeof now === "string" ? new Date(now).getTime() : now.getTime();
  return status === "concluido" && new Date(startsAt).getTime() <= nowMs;
}
