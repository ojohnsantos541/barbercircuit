import { queryOptions } from "@tanstack/react-query";
import { getDashboardData } from "./dashboard.functions";

export const dashboardQuery = (from: string, to: string) => queryOptions({
  queryKey: ["owner-dashboard", from, to],
  queryFn: () => getDashboardData({ data: { from, to } }),
});
