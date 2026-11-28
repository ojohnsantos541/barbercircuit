import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/barber/ui";
import { AppointmentDetails, NewAppointmentDialog, type Appt } from "@/components/barber/AppointmentForms";
import { catalogQuery } from "@/lib/catalog-query";
import { getAppointments } from "@/lib/appointments.functions";
import { spInstant, spParts } from "@/lib/sp-time";

export const Route = createFileRoute("/_authenticated/painel/agendamentos")({
  head: () => ({ meta: [{ title: "Agendamentos — BarberCircuit" }, { name: "description", content: "Calendário diário, semanal e mensal dos atendimentos." }, { property: "og:title", content: "Agendamentos — BarberCircuit" }, { property: "og:description", content: "Calendário diário, semanal e mensal dos atendimentos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Agenda,
});

type View = "dia" | "semana" | "mes";
const HOURS = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];
const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function monthQuery(cursor: Date) {
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - 7); const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 8);
  return queryOptions({ queryKey: ["owner-appointments", iso(start)], queryFn: () => getAppointments({ data: { from: spInstant(iso(start), "00:00"), to: spInstant(iso(end), "00:00") } }), placeholderData: keepPreviousData });
}

function Agenda() {
  const [view, setView] = useState<View>("dia");
  const [cursor, setCursor] = useState(() => new Date());
  const { data: appts = [], error } = useQuery(monthQuery(cursor));
  const { data: cat } = useQuery(catalogQuery);
  const barbers = cat?.barbers ?? [];
  const list = appts.map((a) => ({ ...a, ...spParts(a.starts_at) })) as (Appt & { date: string; time: string })[];
  const byDate = (d: string) => list.filter((a) => a.date === d);
  const bName = (id: string | null) => barbers.find((b) => b.id === id)?.name ?? "Barbeiro removido";
  const today = iso(new Date());
  const move = (n: number) => { const d = new Date(cursor); if (view === "dia") d.setDate(d.getDate() + n); else if (view === "semana") d.setDate(d.getDate() + 7 * n); else d.setMonth(d.getMonth() + n); setCursor(d); };
  const weekStart = new Date(cursor); weekStart.setDate(cursor.getDate() - cursor.getDay());
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });
  const label = view === "dia" ? cursor.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    : view === "semana" ? `${(week[0] ?? cursor).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} – ${(week[6] ?? cursor).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`
    : cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const Card = ({ a }: { a: Appt & { time: string } }) => (
    <AppointmentDetails a={a} barberName={bName(a.barber_id)} trigger={
      <button className={`block w-full rounded-md border-l-2 bg-secondary px-2 py-1.5 text-left text-xs hover:bg-accent ${a.status === "cancelado" ? "border-destructive opacity-50" : a.status === "concluido" ? "border-success" : "border-primary"}`}>
        <div className="truncate font-medium"><span className="text-primary">{a.time}</span> {a.customers?.name ?? "—"}</div><div className="truncate text-muted-foreground">{a.services?.name ?? ""}</div>
      </button>} />
  );
  const cols = barbers.filter((b) => b.active || list.some((a) => a.barber_id === b.id));

  return (
    <>
      <PageHeader demo={false} title="Agendamentos" subtitle="Acompanhe a agenda de toda a equipe" action={<NewAppointmentDialog date={iso(cursor)} trigger={<Button><Plus /> Novo agendamento</Button>} />} />
      {error && <div role="alert" className="panel mb-4 p-4 text-destructive">{error.message}</div>}
      <div className="panel mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
          <Button size="icon" variant="ghost" onClick={() => move(-1)} aria-label="Anterior"><ChevronLeft /></Button>
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>Hoje</Button>
          <Button size="icon" variant="ghost" onClick={() => move(1)} aria-label="Próximo"><ChevronRight /></Button>
          <span className="ml-1 min-w-0 flex-1 truncate font-display text-lg capitalize sm:ml-2 sm:text-xl">{label}</span>
        </div>
        <div className="flex w-full rounded-lg bg-secondary p-1 sm:w-auto">
          {(["dia", "semana", "mes"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`min-h-10 flex-1 rounded-md px-3 py-1.5 text-sm sm:px-4 ${view === v ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}>{v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}</button>
          ))}
        </div>
      </div>

      {view === "dia" && (cols.length === 0 ? <div className="panel p-10 text-center text-muted-foreground">Cadastre barbeiros para ver a agenda do dia.</div> : (
        <div className="panel hidden overflow-x-auto md:block">
          <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `70px repeat(${cols.length}, 1fr)` }}>
            <div className="border-b p-3" />
            {cols.map((b) => <div key={b.id} className="border-b border-l p-3 text-sm font-semibold">{b.name}</div>)}
            {HOURS.map((h) => (
              <div key={h} className="contents">
                <div className="border-b p-3 text-xs text-muted-foreground">{h}:00</div>
                {cols.map((b) => <div key={b.id} className="min-h-16 space-y-1 border-b border-l p-1.5">{byDate(iso(cursor)).filter((x) => x.barber_id === b.id && x.time.startsWith(h)).map((a) => <Card key={a.id} a={a} />)}</div>)}
              </div>
            ))}
          </div>
        </div>
      ))}

      {view === "dia" && cols.length > 0 && (
        <div className="space-y-3 md:hidden">
          {cols.map((b) => {
            const items = byDate(iso(cursor)).filter((a) => a.barber_id === b.id).sort((a, z) => a.time.localeCompare(z.time));
            return <section key={b.id} className="panel p-3">
              <h3 className="mb-2 text-sm font-semibold">{b.name}</h3>
              {items.length ? <div className="space-y-2">{items.map((a) => <Card key={a.id} a={a} />)}</div> : <p className="py-2 text-xs text-muted-foreground">Sem atendimentos neste dia.</p>}
            </section>;
          })}
        </div>
      )}

      {view === "semana" && (
        <>
          <div className="space-y-3 md:hidden">
            {week.map((d) => { const k = iso(d); const items = byDate(k); return <section key={k} className="panel p-3">
              <div className={`mb-2 flex items-center justify-between border-b pb-2 ${k === today ? "text-primary" : ""}`}>
                <span className="text-xs uppercase text-muted-foreground">{WD[d.getDay()]}</span>
                <span className="font-display text-xl">{d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span>
              </div>
              {items.length ? <div className="space-y-2">{items.map((a) => <Card key={a.id} a={a} />)}</div> : <p className="py-2 text-xs text-muted-foreground">Sem atendimentos.</p>}
            </section>; })}
          </div>
          <div className="panel hidden overflow-x-auto md:block">
          <div className="grid min-w-[860px] grid-cols-7">
            {week.map((d) => { const k = iso(d); const items = byDate(k); return (
              <div key={k} className="min-h-96 border-l first:border-l-0">
                <div className={`border-b p-3 text-center ${k === today ? "text-primary" : ""}`}><div className="text-xs uppercase text-muted-foreground">{WD[d.getDay()]}</div><div className="font-display text-2xl">{d.getDate()}</div></div>
                <div className="space-y-1.5 p-1.5">{items.map((a) => <Card key={a.id} a={a} />)}</div>
              </div>); })}
          </div>
          </div>
        </>
      )}

      {view === "mes" && (() => {
        const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const start = new Date(first); start.setDate(1 - first.getDay());
        const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
        return (
          <div className="panel overflow-hidden">
            <div className="grid grid-cols-7 border-b">{WD.map((w) => <div key={w} className="p-2 text-center text-xs uppercase text-muted-foreground">{w}</div>)}</div>
            <div className="grid grid-cols-7">
              {cells.map((d) => { const k = iso(d); const n = byDate(k).filter((a) => a.status !== "cancelado").length; const inMonth = d.getMonth() === cursor.getMonth(); return (
                <button key={k} onClick={() => { setCursor(d); setView("dia"); }} className={`min-h-16 border-b border-l p-2 text-left transition-colors hover:bg-accent md:min-h-24 ${inMonth ? "" : "opacity-30"}`}>
                  <div className={`text-sm ${k === today ? "font-bold text-primary" : ""}`}>{d.getDate()}</div>
                  {n > 0 && <div className="mt-1 inline-block rounded bg-primary/15 px-1.5 text-[10px] text-primary md:text-xs">{n}<span className="hidden md:inline"> agend.</span></div>}
                </button>); })}
            </div>
          </div>
        );
      })()}
      <p className="mt-3 text-xs text-muted-foreground">Horários no fuso de São Paulo. Clique em um atendimento para mudar o status ou excluir.</p>
    </>
  );
}
