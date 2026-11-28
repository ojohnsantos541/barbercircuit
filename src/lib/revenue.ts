export function isRecognizedRevenue(
  status: string,
  startsAt: string,
  now: string | Date = new Date(),
) {
  return status === "concluido" && new Date(startsAt).getTime() <= new Date(now).getTime();
}
