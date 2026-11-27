import { queryOptions } from "@tanstack/react-query";
import { getCustomers } from "./customers.functions";

export const customersQuery = queryOptions({ queryKey: ["owner-customers"], queryFn: () => getCustomers() });
export type Customer = Awaited<ReturnType<typeof getCustomers>>[number];