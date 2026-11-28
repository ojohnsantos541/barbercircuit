import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel, StatCard } from "@/components/barber/ui";
import { financialQuery } from "@/lib/finance-query";
import { createExpense, deleteExpense } from "@/lib/finance.functions";
import { brl, dateBR } from "@/lib/format";
import { spParts } from "@/lib/sp-time";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/painel/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — BarberCircuit" }, { name: "description", content: "Receitas reais de atendimentos e despesas registradas." }, { property: "og:title", content: "Financeiro — BarberCircuit" }, { property: "og:description", content: "Receitas reais de atendimentos e despesas registradas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Financeiro,
});

const todaySP=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const shift=(date:string,days:number)=>{const [y,m,d]=date.split("-").map(Number);return new Date(Date.UTC(y!,m!-1,d!+days)).toISOString().slice(0,10);};
const monthKey=(d:string)=>d.slice(0,7);\nconst monthOffset=(date:string,back:number)=>{const[y,m]=date.split("-").map(Number);return new Date(Date.UTC(y!,m!-1-back,1)).toISOString().slice(0,7);};

function Financeiro() {
  const today=todaySP(),from=shift(today,-95),to=shift(today,1);
  const {data,isPending,error}=useQuery(financialQuery(from,to));
  const qc=useQueryClient();
  const add=useServerFn(createExpense),remove=useServerFn(deleteExpense);
  const [form,setForm]=useState({description:"",category:"Geral",amount:"",expense_date:today});
  const refresh=async()=>{await qc.invalidateQueries({queryKey:["owner-financial"]});await qc.invalidateQueries({queryKey:["owner-dashboard"]});};
  const create=useMutation({mutationFn:add,onSuccess:async()=>{setForm({description:"",category:"Geral",amount:"",expense_date:today});await refresh();toast.success("Despesa registrada.");},onError:e=>toast.error(e instanceof Error?e.message:"Não foi possível registrar.")});
  const del=useMutation({mutationFn:remove,onSuccess:async()=>{await refresh();toast.success("Despesa excluída.");},onError:e=>toast.error(e instanceof Error?e.message:"Não foi possível excluir.")});
  const appointments=data?.appointments??[],expenses=data?.expenses??[];
  const months=[2,1,0].map(back=>{const key=monthOffset(today,back);const d=new Date(key+"-15T12:00:00");return {key,label:d.toLocaleDateString("pt-BR",{month:"short",timeZone:"America/Sao_Paulo"}),Receitas:appointments.filter(a=>spParts(a.starts_at).date.startsWith(key)).reduce((s,a)=>s+Number(a.price),0),Despesas:expenses.filter(e=>e.expense_date.startsWith(key)).reduce((s,e)=>s+Number(e.amount),0)};});
  const current=months[2]??{key:monthKey(today),Receitas:0,Despesas:0,label:""};
  const result=current.Receitas-current.Despesas;
  const recent=appointments.slice(0,8);
  return <>
    <PageHeader demo={false} title="Financeiro" subtitle="Receitas registradas e despesas reais" />
    {error&&<div role="alert" className="panel mb-4 p-4 text-destructive">{error instanceof Error?error.message:"Não foi possível carregar o financeiro."}</div>}
    {isPending?<div className="panel p-10 text-center text-muted-foreground">Carregando movimentações...</div>:<>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receitas do mês" value={brl(current.Receitas)} hint="Agendamentos concluídos" icon={ArrowUpRight}/>
        <StatCard label="Despesas do mês" value={brl(current.Despesas)} hint="Lançamentos cadastrados" icon={ArrowDownRight}/>
        <StatCard label="Resultado" value={brl(result)} hint={result>=0?"Saldo positivo":"Saldo negativo"} icon={PiggyBank}/>
        <StatCard label="Margem" value={`${current.Receitas?Math.round(result/current.Receitas*100):0}%`} hint="Sobre as receitas" icon={Wallet}/>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Receitas x despesas — últimos meses" className="xl:col-span-2">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={months}><CartesianGrid stroke="var(--color-border)" vertical={false}/><XAxis dataKey="label" stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false}/><YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={60} tickFormatter={v=>`R$${v}`}/><Tooltip contentStyle={{background:"var(--color-popover)",border:"1px solid var(--color-border)",borderRadius:8}} formatter={(v:number)=>brl(v)}/><Legend/><Bar dataKey="Receitas" fill="var(--color-primary)" radius={[6,6,0,0]}/><Bar dataKey="Despesas" fill="var(--color-chart-3)" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Registrar despesa">
          <form className="space-y-3" onSubmit={e=>{e.preventDefault();create.mutate({data:{...form,amount:Number(form.amount)}});}}>
            <div className="space-y-1.5"><Label htmlFor="expense-description">Descrição</Label><Input id="expense-description" required minLength={2} maxLength={120} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Ex.: Conta de energia"/></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="expense-category">Categoria</Label><Input id="expense-category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></div><div className="space-y-1.5"><Label htmlFor="expense-amount">Valor (R$)</Label><Input id="expense-amount" required type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div></div>
            <div className="space-y-1.5"><Label htmlFor="expense-date">Data</Label><Input id="expense-date" required type="date" value={form.expense_date} onChange={e=>setForm({...form,expense_date:e.target.value})}/></div>
            <Button type="submit" disabled={create.isPending||!form.description.trim()||!form.amount}> {create.isPending?"Salvando...":"Salvar despesa"} </Button>
          </form>
        </Panel>
        <Panel title="Últimas receitas">
          {recent.length===0?<p className="text-sm text-muted-foreground">Nenhum atendimento concluído neste período.</p>:<ul className="divide-y">{recent.map(a=><li key={a.id} className="flex justify-between gap-3 py-2.5 text-sm"><span>{a.services?.name??"Atendimento"} <span className="text-muted-foreground">· {dateBR(spParts(a.starts_at).date)}</span></span><span className="whitespace-nowrap text-success">+ {brl(Number(a.price))}</span></li>)}</ul>}
        </Panel>
        <Panel title="Despesas registradas" >
          {expenses.length===0?<p className="text-sm text-muted-foreground">Nenhuma despesa cadastrada no período.</p>:<ul className="divide-y">{expenses.map(e=><li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="min-w-0 flex-1"><span className="block truncate">{e.description}</span><span className="text-xs text-muted-foreground">{e.category??"Geral"} · {dateBR(e.expense_date)}</span></span><span className="whitespace-nowrap text-destructive">− {brl(Number(e.amount))}</span><Button size="icon" variant="ghost" aria-label={`Excluir despesa ${e.description}`} disabled={del.isPending} onClick={()=>{if(confirm("Excluir esta despesa?"))del.mutate({data:{id:e.id}});}}><Trash2 className="h-4 w-4"/></Button></li>)}</ul>}
        </Panel>
      </div>
    </>}
  </>;
}
