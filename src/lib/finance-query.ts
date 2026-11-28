import { queryOptions } from "@tanstack/react-query";
import { getFinancialData } from "./finance.functions";
export const financialQuery = (from:string,to:string)=>queryOptions({queryKey:["owner-financial",from,to],queryFn:()=>getFinancialData({data:{from,to}})});
