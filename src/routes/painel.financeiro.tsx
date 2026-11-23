import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatCard } from "@/components/barber/ui";
import { getShopData, revenueOf, toISO } from "@/lib/demo-data";
import { brl, dateBR } from "@/lib/format";

export const Route = createFileRoute("/painel/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — BarberPro" }, { name: "description", content: "Receitas, despesas, faturamento e resultado da barbearia." }, { property: "og:title", content: "Financeiro — BarberPro" }, { property: "og:description", content: "Receitas, despesas, faturamento e resultado da barbearia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Financeiro,
});

function Financeiro() {
  const { appointments, expenses, services } = getShopData();
  const months = [2, 1, 0].map((back) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - back); const key = toISO(d).slice(0, 7);
    return { key, mes: d.toLocaleDateString("pt-BR", { month: "short" }), Receitas: revenueOf(appointments.filter((a) => a.date.startsWith(key))), Despesas: expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0) }; });
  const cur = months[2]!; const result = cur.Receitas - cur.Despesas;
  const recent = appointments.filter((a) => a.status === "concluido").sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 8);
  return (
    <>
      <PageHeader title="Financeiro" subtitle="Resultado do mês atual" action={<Button variant="gold">Lançar despesa</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receitas" value={brl(cur.Receitas)} icon={ArrowUpRight} />
        <StatCard label="Despesas" value={brl(cur.Despesas)} icon={ArrowDownRight} />
        <StatCard label="Resultado" value={brl(result)} hint={result >= 0 ? "Lucro no mês" : "Prejuízo no mês"} icon={PiggyBank} />
        <StatCard label="Margem" value={`${cur.Receitas ? Math.round((result / cur.Receitas) * 100) : 0}%`} icon={Wallet} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Receitas x Despesas" className="xl:col-span-2">
          <div className="h-64"><ResponsiveContainer><BarChart data={months}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => `R$${v}`} />
            <Tooltip cursor={{ fill: "var(--color-accent)" }} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} formatter={(v: number) => brl(v)} />
            <Legend /><Bar dataKey="Receitas" fill="var(--color-primary)" radius={[6, 6, 0, 0]} /><Bar dataKey="Despesas" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
          </BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Últimas receitas">
          <ul className="divide-y">{recent.map((a) => { const s = services.find((x) => x.id === a.serviceId)!; return <li key={a.id} className="flex justify-between py-2.5 text-sm"><span>{s.name} <span className="text-muted-foreground">· {dateBR(a.date)}</span></span><span className="text-success">+ {brl(s.price)}</span></li>; })}</ul>
        </Panel>
        <Panel title="Despesas do mês">
          <ul className="divide-y">{expenses.filter((e) => e.date.startsWith(cur.key)).map((e) => <li key={e.id} className="flex justify-between py-2.5 text-sm"><span>{e.description} <span className="text-muted-foreground">· {e.category}</span></span><span className="text-destructive">− {brl(e.amount)}</span></li>)}</ul>
        </Panel>
      </div>
    </>
  );
}
