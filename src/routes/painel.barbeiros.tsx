import { DemoAction } from "@/components/barber/DemoAction";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/barber/ui";
import { getShopData, revenueOf, todayISO } from "@/lib/demo-data";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/painel/barbeiros")({
  head: () => ({ meta: [{ title: "Barbeiros — BarberPro" }, { name: "description", content: "Equipe de profissionais e seus horários de atendimento." }, { property: "og:title", content: "Barbeiros — BarberPro" }, { property: "og:description", content: "Equipe de profissionais e seus horários de atendimento." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Barbeiros,
});
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function Barbeiros() {
  const { barbers, appointments } = getShopData();
  const month = todayISO().slice(0, 7);
  return (
    <>
      <PageHeader title="Barbeiros" subtitle="Profissionais e horários de atendimento" action={<DemoAction title="Novo barbeiro" fields={["Nome", "Especialidade", "Dias de atendimento", "Horário inicial", "Horário final"]} />} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {barbers.map((b) => { const mine = appointments.filter((a) => a.barberId === b.id && a.date.startsWith(month)); return (
          <div key={b.id} className="panel p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-gold font-display text-xl font-bold text-primary-foreground">{b.initials}</span>
              <div><h3 className="text-2xl font-semibold">{b.name}</h3><p className="text-sm text-muted-foreground">{b.specialty}</p></div>
            </div>
            <div className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">Dias de atendimento</div>
            <div className="mt-2 flex gap-1">{DAYS.map((d) => <span key={d} className={`flex-1 rounded py-1 text-center text-[11px] ${b.days.includes(d) ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground/50"}`}>{d}</span>)}</div>
            <div className="mt-4 text-sm">Horário: <span className="text-primary">{b.start} às {b.end}</span></div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
              <div><div className="text-[11px] uppercase text-muted-foreground">Atendimentos/mês</div><div className="font-display text-xl">{mine.filter((a) => a.status === "concluido").length}</div></div>
              <div><div className="text-[11px] uppercase text-muted-foreground">Faturado/mês</div><div className="font-display text-xl">{brl(revenueOf(mine))}</div></div>
            </div>
          </div>); })}
      </div>
    </>
  );
}
