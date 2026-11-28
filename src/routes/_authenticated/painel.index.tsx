import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, DollarSign, Users, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, StatCard, StatusPill } from "@/components/barber/ui";
import { dashboardQuery } from "@/lib/dashboard-query";
import { brl, dateBR } from "@/lib/format";
import { spParts } from "@/lib/sp-time";

export const Route = createFileRoute("/_authenticated/painel/")({
  head: () => ({ meta: [{ title: "Dashboard — BarberCircuit" }, { name: "description", content: "Visão geral dos dados reais da sua barbearia." }, { property: "og:title", content: "Dashboard — BarberCircuit" }, { property: "og:description", content: "Visão geral dos dados reais da sua barbearia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

const todaySP = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const shift = (date: string, days: number) => { const [y,m,d] = date.split("-").map(Number); const x = new Date(Date.UTC(y!,m!-1,d!+days)); return x.toISOString().slice(0,10); };

function Dashboard() {
  const today = todaySP();
  const from = shift(today, -30);
  const to = shift(today, 1);
  const { data, isPending, error } = useQuery(dashboardQuery(from, to));
  const appointments = data?.appointments ?? [];
  const services = data?.services ?? [];
  const customers = data?.customerCount ?? 0;
  const todayAppts = appointments.filter((a) => spParts(a.starts_at).date === today).sort((a,b) => a.starts_at.localeCompare(b.starts_at));
  const month = today.slice(0,7);
  const monthDone = appointments.filter((a) => a.status === "concluido" && spParts(a.starts_at).date.startsWith(month));
  const revenue = monthDone.reduce((sum,a) => sum + Number(a.price), 0);
  const ticket = revenue / Math.max(1, monthDone.length);
  const top = services.map((s) => ({ name: s.name, count: appointments.filter((a) => a.service_id === s.id && a.status !== "cancelado" && spParts(a.starts_at).date.startsWith(month)).length })).sort((a,b) => b.count-a.count).slice(0,6);
  const maxTop = Math.max(1, ...top.map((x) => x.count));
  const chart = Array.from({length:30},(_,i)=>{ const date=shift(today,i-29); return { day: dateBR(date,{day:"2-digit",month:"2-digit"}), value: appointments.filter((a)=>a.status==="concluido" && spParts(a.starts_at).date===date).reduce((s,a)=>s+Number(a.price),0) }; });
  const titleDate = new Date().toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo",weekday:"long",day:"numeric",month:"long"});
  return (
    <>
      <PageHeader demo={false} title="Dashboard" subtitle={titleDate} />
      {error && <div role="alert" className="panel mb-4 p-4 text-destructive">{error instanceof Error ? error.message : "Não foi possível carregar os dados."}</div>}
      {isPending ? <div className="panel p-10 text-center text-muted-foreground">Carregando seus dados reais...</div> : <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Faturamento do mês" value={brl(revenue)} hint="Atendimentos concluídos · valor registrado" icon={DollarSign} />
          <StatCard label="Agendamentos hoje" value={String(todayAppts.length)} hint={`${todayAppts.filter((a)=>a.status==="concluido").length} já concluídos`} icon={CalendarCheck} />
          <StatCard label="Total de clientes" value={String(customers)} hint="Cadastros reais" icon={Users} />
          <StatCard label="Ticket médio" value={brl(ticket)} hint="Por atendimento concluído neste mês" icon={TrendingUp} />
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Panel title="Faturamento — últimos 30 dias" className="xl:col-span-2">
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}>
              <defs><linearGradient id="dashboard-revenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5}/><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid stroke="var(--color-border)" vertical={false}/><XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval={4}/><YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={50} tickFormatter={(v)=>`R$${v}`}/><Tooltip contentStyle={{background:"var(--color-popover)",border:"1px solid var(--color-border)",borderRadius:8}} formatter={(v:number)=>brl(v)}/><Area type="monotone" dataKey="value" name="Faturamento" stroke="var(--color-primary)" strokeWidth={2} fill="url(#dashboard-revenue)"/>
            </AreaChart></ResponsiveContainer></div>
          </Panel>
          <Panel title="Serviços mais procurados">
            {top.length===0 ? <p className="text-sm text-muted-foreground">Ainda não há agendamentos neste período.</p> : <ul className="space-y-4">{top.map((s)=><li key={s.name}><div className="mb-1 flex justify-between text-sm"><span>{s.name}</span><span className="text-muted-foreground">{s.count}</span></div><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gold" style={{width:`${(s.count/maxTop)*100}%`}}/></div></li>)}</ul>}
          </Panel>
          <Panel title="Agenda de hoje" className="xl:col-span-2">
            {todayAppts.length===0 ? <p className="text-sm text-muted-foreground">Nenhum agendamento registrado para hoje.</p> : <ul className="divide-y">{todayAppts.slice(0,10).map((a)=><li key={a.id} className="flex items-center gap-4 py-3"><span className="w-14 font-display text-xl text-primary">{spParts(a.starts_at).time}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{a.customers?.name ?? "Cliente não identificado"}</div><div className="truncate text-xs text-muted-foreground">{a.services?.name ?? "Serviço removido"} · {a.barbers?.name ?? "Profissional não identificado"}</div></div><StatusPill status={a.status}/></li>)}</ul>}
          </Panel>
          <Panel title="Próximos agendamentos">
            {appointments.filter((a)=>a.status==="confirmado" && spParts(a.starts_at).date>today).sort((a,b)=>a.starts_at.localeCompare(b.starts_at)).slice(0,6).length===0 ? <p className="text-sm text-muted-foreground">Nenhum próximo agendamento.</p> : <ul className="space-y-3">{appointments.filter((a)=>a.status==="confirmado" && spParts(a.starts_at).date>today).sort((a,b)=>a.starts_at.localeCompare(b.starts_at)).slice(0,6).map((a)=><li key={a.id} className="flex items-center gap-3"><div className="grid w-12 place-items-center rounded-lg bg-secondary py-1.5 text-center"><span className="text-[10px] uppercase text-muted-foreground">{dateBR(spParts(a.starts_at).date,{month:"short"})}</span><span className="font-display text-lg leading-none">{dateBR(spParts(a.starts_at).date,{day:"2-digit"})}</span></div><div className="min-w-0"><div className="truncate text-sm">{a.customers?.name ?? "Cliente"}</div><div className="text-xs text-muted-foreground">{spParts(a.starts_at).time} · {a.services?.name ?? "Serviço"}</div></div></li>)}</ul>}
          </Panel>
        </div>
      </>}
    </>
  );
}
