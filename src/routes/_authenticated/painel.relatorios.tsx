import { createFileRoute } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PageHeader, Panel } from "@/components/barber/ui";
import { getShopData, revenueOf, todayISO } from "@/lib/demo-data";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/painel/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — BarberPro" }, { name: "description", content: "Desempenho por serviço, barbeiro e dia da semana." }, { property: "og:title", content: "Relatórios — BarberPro" }, { property: "og:description", content: "Desempenho por serviço, barbeiro e dia da semana." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Relatorios,
});
const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-muted-foreground)"];
const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Relatorios() {
  const { appointments, services, barbers } = getShopData();
  const month = todayISO().slice(0, 7); const m = appointments.filter((a) => a.date.startsWith(month));
  const bySvc = services.map((s) => ({ name: s.name, value: revenueOf(m.filter((a) => a.serviceId === s.id)) }));
  const byBarber = barbers.map((b) => ({ b, v: revenueOf(m.filter((a) => a.barberId === b.id)) })).sort((x, y) => y.v - x.v);
  const byDay = WD.map((d, i) => ({ d, n: appointments.filter((a) => new Date(`${a.date}T12:00:00`).getDay() === i && a.status !== "cancelado").length }));
  const maxD = Math.max(...byDay.map((x) => x.n), 1);
  const cancel = Math.round((appointments.filter((a) => a.status === "cancelado").length / Math.max(1, appointments.filter((a) => a.status !== "confirmado").length)) * 100);
  return (
    <>
      <PageHeader title="Relatórios" subtitle="Análise do mês atual" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Faturamento por serviço">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-52 w-52"><ResponsiveContainer><PieChart><Pie data={bySvc} dataKey="value" innerRadius={55} outerRadius={90} stroke="var(--color-card)">{bySvc.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} /></PieChart></ResponsiveContainer></div>
            <ul className="flex-1 space-y-2 text-sm">{bySvc.map((s, i) => <li key={s.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} /><span className="flex-1">{s.name}</span><span className="text-muted-foreground">{brl(s.value)}</span></li>)}</ul>
          </div>
        </Panel>
        <Panel title="Ranking de barbeiros">
          <ol className="space-y-4">{byBarber.map(({ b, v }, i) => <li key={b.id} className="flex items-center gap-4"><span className="font-display text-3xl text-gold">{i + 1}º</span><div className="flex-1"><div className="font-medium">{b.name}</div><div className="text-xs text-muted-foreground">{b.specialty}</div></div><span className="font-display text-xl">{brl(v)}</span></li>)}</ol>
        </Panel>
        <Panel title="Movimento por dia da semana">
          <div className="flex h-44 items-end gap-2">{byDay.map((x) => <div key={x.d} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-md bg-gold" style={{ height: `${(x.n / maxD) * 140}px` }} /><span className="text-xs text-muted-foreground">{x.d}</span></div>)}</div>
        </Panel>
        <Panel title="Indicadores">
          <div className="grid grid-cols-2 gap-3">
            {[["Atendimentos no mês", String(m.filter((a) => a.status === "concluido").length)], ["Taxa de cancelamento", `${cancel}%`], ["Faturamento no mês", brl(revenueOf(m))], ["Serviço líder", [...bySvc].sort((a, b) => b.value - a.value)[0]?.name ?? "—"]].map(([l, v]) => (
              <div key={l} className="rounded-lg bg-secondary p-4"><div className="text-[11px] uppercase text-muted-foreground">{l}</div><div className="mt-1 font-display text-2xl">{v}</div></div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
