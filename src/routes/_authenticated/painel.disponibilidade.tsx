import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/barber/ui";
import { getBarberAvailability, saveBarberWeeklyHour, deleteBarberWeeklyHour, createBarberTimeBlock, deleteBarberTimeBlock } from "@/lib/availability.functions";

export const Route = createFileRoute("/_authenticated/painel/disponibilidade")({
  head: () => ({ meta: [{ title: "Disponibilidade — BarberCircuit" }, { name: "description", content: "Configure o expediente, almoço, folgas e bloqueios da equipe." }] }),
  component: Availability,
});
const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function Availability() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["barber-availability"], queryFn: () => getBarberAvailability() });
  const [barberId, setBarberId] = useState("");
  const [day, setDay] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [blockDate, setBlockDate] = useState(today());
  const [blockStart, setBlockStart] = useState("12:00");
  const [blockEnd, setBlockEnd] = useState("13:00");
  const [reason, setReason] = useState("Almoço");
  const [message, setMessage] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["barber-availability"] });
  const weekly = useMutation({ mutationFn: () => saveBarberWeeklyHour({ data: { barber_id: barberId, day_of_week: Number(day), start_time: start, end_time: end } }), onSuccess: () => { setMessage("Expediente salvo."); refresh(); }, onError: (e) => setMessage(e.message) });
  const block = useMutation({ mutationFn: () => createBarberTimeBlock({ data: { barber_id: barberId, date: blockDate, start_time: blockStart, end_time: blockEnd, reason } }), onSuccess: () => { setMessage("Bloqueio salvo."); refresh(); }, onError: (e) => setMessage(e.message) });
  const removeHour = useMutation({ mutationFn: (id: string) => deleteBarberWeeklyHour({ data: { id } }), onSuccess: refresh, onError: (e) => setMessage(e.message) });
  const removeBlock = useMutation({ mutationFn: (id: string) => deleteBarberTimeBlock({ data: { id } }), onSuccess: refresh, onError: (e) => setMessage(e.message) });
  const selected = barberId || data?.barbers[0]?.id || "";
  const hours = (data?.hours ?? []).filter((x: any) => x.barber_id === selected);
  const blocks = (data?.blocks ?? []).filter((x: any) => x.barber_id === selected);
  const name = (id: string) => data?.barbers.find((b: any) => b.id === id)?.name ?? "Barbeiro";
  return <>
    <PageHeader demo={false} title="Disponibilidade" subtitle="Configure os horários de cada profissional em um só painel." />
    {isLoading && <div className="panel p-6 text-muted-foreground">Carregando disponibilidade...</div>}
    {error && <div role="alert" className="panel p-5 text-destructive">{error.message}</div>}
    {!isLoading && data && <>
      {data.barbers.length === 0 ? <div className="panel p-8 text-center text-muted-foreground">Cadastre um barbeiro antes de configurar os horários.</div> : <>
        <div className="panel mb-5 p-4">
          <label className="mb-2 block text-sm font-medium">Profissional</label>
          <select className={field} value={selected} onChange={(e) => setBarberId(e.target.value)}>{data.barbers.map((b: any) => <option key={b.id} value={b.id}>{b.name}{b.active ? "" : " (inativo)"}</option>)}</select>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="panel space-y-4 p-5">
            <div className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary"/><h2 className="font-display text-xl">Expediente semanal</h2></div>
            <p className="text-sm text-muted-foreground">Cadastre um intervalo por vez. Para almoço, divida o dia em dois períodos (ex.: 09h–12h e 13h–18h).</p>
            <label className="block text-sm">Dia da semana<select className={field+" mt-1"} value={day} onChange={(e)=>setDay(e.target.value)}>{days.map((d,i)=><option key={d} value={i}>{d}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3"><label className="text-sm">Início<input className={field+" mt-1"} type="time" value={start} onChange={(e)=>setStart(e.target.value)}/></label><label className="text-sm">Fim<input className={field+" mt-1"} type="time" value={end} onChange={(e)=>setEnd(e.target.value)}/></label></div>
            <Button onClick={()=>weekly.mutate()} disabled={!selected||weekly.isPending}><Plus/> Adicionar horário</Button>
            <div className="space-y-2 border-t pt-4">
              {hours.length===0 && <p className="text-sm text-muted-foreground">Nenhum horário cadastrado para {name(selected)}.</p>}
              {hours.map((h:any)=><div key={h.id} className="flex items-center justify-between rounded-md bg-secondary p-3 text-sm"><span>{days[h.day_of_week]} · {h.start_time.slice(0,5)}–{h.end_time.slice(0,5)}</span><Button size="icon" variant="ghost" aria-label="Remover horário" onClick={()=>removeHour.mutate(h.id)}><Trash2 className="h-4 w-4"/></Button></div>)}
            </div>
          </section>
          <section className="panel space-y-4 p-5">
            <div className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary"/><h2 className="font-display text-xl">Pausa, folga ou bloqueio</h2></div>
            <p className="text-sm text-muted-foreground">Use para almoço excepcional, compromisso, folga parcial ou ajuste de um dia específico.</p>
            <label className="block text-sm">Data<input className={field+" mt-1"} type="date" min={today()} value={blockDate} onChange={(e)=>setBlockDate(e.target.value)}/></label>
            <div className="grid grid-cols-2 gap-3"><label className="text-sm">Início<input className={field+" mt-1"} type="time" value={blockStart} onChange={(e)=>setBlockStart(e.target.value)}/></label><label className="text-sm">Fim<input className={field+" mt-1"} type="time" value={blockEnd} onChange={(e)=>setBlockEnd(e.target.value)}/></label></div>
            <label className="block text-sm">Motivo<input className={field+" mt-1"} maxLength={160} value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Ex.: Almoço, médico, compromisso"/></label>
            <Button onClick={()=>block.mutate()} disabled={!selected||block.isPending}><Plus/> Bloquear horário</Button>
            <div className="space-y-2 border-t pt-4">
              {blocks.length===0 && <p className="text-sm text-muted-foreground">Nenhum bloqueio futuro cadastrado.</p>}
              {blocks.map((b:any)=><div key={b.id} className="flex items-center justify-between gap-3 rounded-md bg-secondary p-3 text-sm"><span className="min-w-0"><strong>{new Date(b.starts_at).toLocaleDateString("pt-BR",{timeZone:"UTC"})}</strong> · {new Date(b.starts_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"})}–{new Date(b.ends_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"})}<span className="block truncate text-muted-foreground">{b.reason||"Indisponível"}</span></span><Button size="icon" variant="ghost" aria-label="Remover bloqueio" onClick={()=>removeBlock.mutate(b.id)}><Trash2 className="h-4 w-4"/></Button></div>)}
            </div>
          </section>
        </div>
        {message && <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p>}
      </>}
    </>}
  </>;
}
