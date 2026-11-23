import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/barber/ui";
import { getShopData, toISO, todayISO, type Appointment } from "@/lib/demo-data";
import { dateBR } from "@/lib/format";

export const Route = createFileRoute("/painel/agendamentos")({
  head: () => ({ meta: [{ title: "Agendamentos — BarberPro" }, { name: "description", content: "Calendário diário, semanal e mensal dos atendimentos." }, { property: "og:title", content: "Agendamentos — BarberPro" }, { property: "og:description", content: "Calendário diário, semanal e mensal dos atendimentos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Agenda,
});

type View = "dia" | "semana" | "mes";
const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Agenda() {
  const data = getShopData();
  const [view, setView] = useState<View>("dia");
  const [cursor, setCursor] = useState(() => new Date());
  const byDate = (iso: string) => data.appointments.filter((a) => a.date === iso);
  const svc = (id: string) => data.services.find((s) => s.id === id)?.name ?? "";
  const cli = (id: string) => data.clients.find((c) => c.id === id)?.name ?? "";
  const move = (n: number) => { const d = new Date(cursor); if (view === "dia") d.setDate(d.getDate() + n); else if (view === "semana") d.setDate(d.getDate() + 7 * n); else d.setMonth(d.getMonth() + n); setCursor(d); };
  const weekStart = new Date(cursor); weekStart.setDate(cursor.getDate() - cursor.getDay());
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });
  const label = view === "dia" ? cursor.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    : view === "semana" ? `${week[0]!.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} – ${week[6]!.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`
    : cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const Card = ({ a }: { a: Appointment }) => (
    <div className={`rounded-md border-l-2 bg-secondary px-2 py-1.5 text-xs ${a.status === "cancelado" ? "border-destructive opacity-50" : "border-primary"}`}>
      <div className="truncate font-medium">{cli(a.clientId)}</div><div className="truncate text-muted-foreground">{svc(a.serviceId)}</div>
    </div>
  );

  return (
    <>
      <PageHeader title="Agendamentos" subtitle="Acompanhe a agenda de toda a equipe" action={<Button variant="gold">Novo agendamento</Button>} />
      <div className="panel mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => move(-1)} aria-label="Anterior"><ChevronLeft /></Button>
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>Hoje</Button>
          <Button size="icon" variant="ghost" onClick={() => move(1)} aria-label="Próximo"><ChevronRight /></Button>
          <span className="ml-2 font-display text-xl capitalize">{label}</span>
        </div>
        <div className="flex rounded-lg bg-secondary p-1">
          {(["dia", "semana", "mes"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`flex-1 rounded-md px-4 py-1.5 text-sm ${view === v ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}>{v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}</button>
          ))}
        </div>
      </div>

      {view === "dia" && (
        <div className="panel overflow-x-auto">
          <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `70px repeat(${data.barbers.length}, 1fr)` }}>
            <div className="border-b p-3" />
            {data.barbers.map((b) => <div key={b.id} className="border-b border-l p-3 text-sm font-semibold">{b.name}</div>)}
            {HOURS.map((h) => (
              <div key={h} className="contents">
                <div className="border-b p-3 text-xs text-muted-foreground">{h}</div>
                {data.barbers.map((b) => { const a = byDate(toISO(cursor)).find((x) => x.barberId === b.id && x.time === h); return <div key={b.id} className="min-h-16 border-b border-l p-1.5">{a && <Card a={a} />}</div>; })}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "semana" && (
        <div className="panel overflow-x-auto">
          <div className="grid min-w-[860px] grid-cols-7">
            {week.map((d) => { const iso = toISO(d); const list = byDate(iso).sort((a, b) => a.time.localeCompare(b.time)); return (
              <div key={iso} className="min-h-96 border-l first:border-l-0">
                <div className={`border-b p-3 text-center ${iso === todayISO() ? "text-primary" : ""}`}><div className="text-xs uppercase text-muted-foreground">{WD[d.getDay()]}</div><div className="font-display text-2xl">{d.getDate()}</div></div>
                <div className="space-y-1.5 p-1.5">{list.slice(0, 10).map((a) => <div key={a.id}><div className="mb-0.5 text-[10px] text-primary">{a.time}</div><Card a={a} /></div>)}{list.length > 10 && <div className="text-center text-xs text-muted-foreground">+{list.length - 10}</div>}</div>
              </div>); })}
          </div>
        </div>
      )}

      {view === "mes" && (() => {
        const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const start = new Date(first); start.setDate(1 - first.getDay());
        const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
        return (
          <div className="panel overflow-hidden">
            <div className="grid grid-cols-7 border-b">{WD.map((w) => <div key={w} className="p-2 text-center text-xs uppercase text-muted-foreground">{w}</div>)}</div>
            <div className="grid grid-cols-7">
              {cells.map((d) => { const iso = toISO(d); const n = byDate(iso).filter((a) => a.status !== "cancelado").length; const inMonth = d.getMonth() === cursor.getMonth(); return (
                <button key={iso} onClick={() => { setCursor(d); setView("dia"); }} className={`min-h-16 border-b border-l p-2 text-left transition-colors hover:bg-accent md:min-h-24 ${inMonth ? "" : "opacity-30"}`}>
                  <div className={`text-sm ${iso === todayISO() ? "font-bold text-primary" : ""}`}>{d.getDate()}</div>
                  {n > 0 && <div className="mt-1 inline-block rounded bg-primary/15 px-1.5 text-[10px] text-primary md:text-xs">{n}<span className="hidden md:inline"> agend.</span></div>}
                </button>); })}
            </div>
          </div>
        );
      })()}
      <p className="mt-3 text-xs text-muted-foreground">{dateBR(todayISO(), { day: "2-digit", month: "long" })} — clique em um dia no mês para ver detalhes.</p>
    </>
  );
}
