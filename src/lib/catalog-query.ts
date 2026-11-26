import { queryOptions } from "@tanstack/react-query";
import { getCatalog } from "./catalog.functions";

export const catalogQuery = queryOptions({ queryKey: ["owner-catalog"], queryFn: () => getCatalog() });
export type Catalog = Awaited<ReturnType<typeof getCatalog>>;
export type Service = Catalog["services"][number];
export type Barber = Catalog["barbers"][number];