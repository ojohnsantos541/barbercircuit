import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, DollarSign, Users, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, StatCard, StatusPill } from "@/components/barber/ui";
import { getShopData, revenueOf, todayISO, toISO } from "@/lib/demo-data";
import { brl, dateBR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/painel/")({
  head: () => ({ meta: [{ title: "Dashboard — BarberPro" }, { name: "description", content: "Visão geral do faturamento e dos agendamentos da barbearia." }, { property: "og:title", content: "Dashboard — BarberPro" }, { property: "og:description", content: "Visão geral do faturamento e dos agendamentos da barbearia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { appointments, clients, services, barbers } = getShopData();
  const today = todayISO(); const month = today.slice(0, 7);
  const monthAppts = appointments.filter((a) => a.date.startsWith(month));
  const todayAppts = appointments.filter((a) => a.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = appointments.filter((a) => a.date > today && a.status === "confirmado").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 6);
  const top = services.map((s) => ({ s, n: monthAppts.filter((a) => a.serviceId === s.id && a.status !== "cancelado").length })).sort((a, b) => b.n - a.n);
  const max = top[0]?.n || 1;
  const chart = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 29 + i); const iso = toISO(d); return { dia: dateBR(iso, { day: "2-digit", month: "2-digit" }), valor: revenueOf(appointments.filter((a) => a.date === iso)) }; });
  const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "";
  const svc = (id: string) => services.find((s) => s.id === id)?.name ?? "";
  const barber = (id: string) => barbers.find((b) => b.id === id)?.name.split(" ")[0] ?? "";

  return (
    <>
      <PageHeader title="Dashboard" subtitle={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Faturamento do mês" value={brl(revenueOf(monthAppts))} hint="Atendimentos concluídos" icon={DollarSign} />
        <StatCard label="Agendamentos hoje" value={String(todayAppts.length)} hint={`${todayAppts.filter((a) => a.status === "concluido").length} já concluídos`} icon={CalendarCheck} />
        <StatCard label="Total de clientes" value={String(clients.length)} hint="Cadastrados" icon={Users} />
        <StatCard label="Ticket médio" value={brl(revenueOf(monthAppts) / Math.max(1, monthAppts.filter((a) => a.status === "concluido").length))} hint="Este mês" icon={TrendingUp} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Faturamento — últimos 30 dias" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="dia" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval={4} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => `R$${v}`} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} formatter={(v: number) => brl(v)} />
                <Area type="monotone" dataKey="valor" stroke="var(--color-primary)" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Serviços mais procurados">
          <ul className="space-y-4">
            {top.map(({ s, n }) => (
              <li key={s.id}>
                <div className="mb-1 flex justify-between text-sm"><span>{s.name}</span><span className="text-muted-foreground">{n}</span></div>
                <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gold" style={{ width: `${(n / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Agenda de hoje" className="xl:col-span-2">
          {todayAppts.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum agendamento hoje.</p> : (
            <ul className="divide-y">
              {todayAppts.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-center gap-4 py-3">
                  <span className="w-14 font-display text-xl text-primary">{a.time}</span>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{name(a.clientId)}</div><div className="truncate text-xs text-muted-foreground">{svc(a.serviceId)} · {barber(a.barberId)}</div></div>
                  <StatusPill status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Próximos agendamentos">
          <ul className="space-y-3">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <div className="grid w-12 place-items-center rounded-lg bg-secondary py-1.5 text-center"><span className="text-[10px] uppercase text-muted-foreground">{dateBR(a.date, { month: "short" })}</span><span className="font-display text-lg leading-none">{dateBR(a.date, { day: "2-digit" })}</span></div>
                <div className="min-w-0"><div className="truncate text-sm">{name(a.clientId)}</div><div className="text-xs text-muted-foreground">{a.time} · {svc(a.serviceId)}</div></div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
