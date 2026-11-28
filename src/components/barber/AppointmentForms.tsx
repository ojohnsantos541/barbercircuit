import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { catalogQuery } from "@/lib/catalog-query";
import { customersQuery } from "@/lib/customers-query";
import { createAppointment, deleteAppointment, setAppointmentStatus } from "@/lib/appointments.functions";
import { STATUSES } from "@/lib/appointment-schema";
import { spParts } from "@/lib/sp-time";
import { brl } from "@/lib/format";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Tente novamente.");
const sel = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";
export const STATUS_LABEL: Record<string, string> = { confirmado: "Confirmado", em_andamento: "Em andamento", concluido: "Concluído", cancelado: "Cancelado" };
export type Appt = { id: string; starts_at: string; ends_at: string | null; status: string; price: number; notes: string | null; barber_id: string | null; customers: { name: string; phone?: string | null } | null; services: { name: string } | null };

function useRefresh() {
  const qc = useQueryClient();
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["owner-appointments"] }),
      qc.invalidateQueries({ queryKey: ["owner-dashboard"] }),
    ]);
  };
}

function whatsappHref(phone: string | null | undefined, message: string) {
  const digits = (phone ?? "").replace(/\\D/g, "");
  if (digits.length < 10 || digits.length > 13) return null;
  const international = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}

export function NewAppointmentDialog({ trigger, date }: { trigger: ReactNode; date: string }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ customer_id: "", service_id: "", barber_id: "", date, time: "09:00", notes: "" });
  const cat = useQuery({ ...catalogQuery, enabled: open });
  const cus = useQuery({ ...customersQuery, enabled: open });
  const refresh = useRefresh(); const create = useServerFn(createAppointment);
  const m = useMutation({ mutationFn: create, onSuccess: async () => { await refresh(); toast.success("Agendamento criado."); setOpen(false); }, onError: (e) => toast.error(msg(e)) });
  const services = (cat.data?.services ?? []).filter((s) => s.active);
  const barbers = (cat.data?.barbers ?? []).filter((b) => b.active);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.customer_id || !f.service_id || !f.barber_id) { toast.error("Escolha cliente, serviço e barbeiro."); return; }
    m.mutate({ data: f });
  }
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) setF((p) => ({ ...p, date })); setOpen(o); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent><form onSubmit={submit} className="space-y-4">
        <DialogHeader><DialogTitle>Novo agendamento</DialogTitle><DialogDescription>Horário de Brasília (São Paulo).</DialogDescription></DialogHeader>
        {(cus.data?.length === 0 || (cat.data && (services.length === 0 || barbers.length === 0))) && <p className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">Cadastre ao menos um cliente, um serviço ativo e um barbeiro ativo antes de agendar.</p>}
        <div className="space-y-1.5"><Label>Cliente</Label><select className={sel} value={f.customer_id} onChange={set("customer_id")}><option value="">Selecione</option>{(cus.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Serviço</Label><select className={sel} value={f.service_id} onChange={set("service_id")}><option value="">Selecione</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name} · {brl(Number(s.price))}</option>)}</select></div>
          <div className="space-y-1.5"><Label>Barbeiro</Label><select className={sel} value={f.barber_id} onChange={set("barber_id")}><option value="">Selecione</option>{barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Data</Label><Input type="date" value={f.date} onChange={set("date")} /></div><div className="space-y-1.5"><Label>Horário</Label><Input type="time" step={900} value={f.time} onChange={set("time")} /></div></div>
        <div className="space-y-1.5"><Label>Observações</Label><Textarea value={f.notes} onChange={set("notes")} /></div>
        <DialogFooter><Button type="submit" disabled={m.isPending}>{m.isPending && <Loader2 className="animate-spin" />}Agendar</Button></DialogFooter>
      </form></DialogContent>
    </Dialog>
  );
}

export function AppointmentDetails({ a, barberName, trigger }: { a: Appt; barberName: string; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const refresh = useRefresh(); const setStatus = useServerFn(setAppointmentStatus); const del = useServerFn(deleteAppointment);
  const st = useMutation({ mutationFn: setStatus, onSuccess: async () => { await refresh(); toast.success("Status atualizado."); }, onError: (e) => toast.error(msg(e)) });
  const rm = useMutation({ mutationFn: del, onSuccess: async () => { setOpen(false); await refresh(); toast.success("Agendamento excluído."); }, onError: (e) => toast.error(msg(e)) });
  const s = spParts(a.starts_at); const e = a.ends_at ? spParts(a.ends_at).time : "";
  const dateLabel = s.date.split("-").reverse().join("/");
  const customerName = a.customers?.name ?? "Cliente";
  const serviceName = a.services?.name ?? "seu serviço";
  const confirmationText = `Olá, ${customerName}! Seu agendamento está confirmado para ${dateLabel} às ${s.time}. Serviço: ${serviceName}. Profissional: ${barberName}. Valor: ${brl(Number(a.price))}. Será um prazer receber você!`;
  const reminderText = `Olá, ${customerName}! Passando para lembrar do seu atendimento amanhã às ${s.time}, com ${barberName}. Serviço: ${serviceName}. Esperamos por você!`;
  const confirmationHref = whatsappHref(a.customers?.phone, confirmationText);
  const reminderHref = whatsappHref(a.customers?.phone, reminderText);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{a.customers?.name ?? "Cliente removido"}</DialogTitle><DialogDescription>{a.services?.name ?? "Serviço removido"} · {barberName} · {dateLabel} {s.time}{e && `–${e}`} · {brl(Number(a.price))}</DialogDescription></DialogHeader>
        {a.notes && <p className="rounded-lg bg-secondary p-3 text-sm">{a.notes}</p>}
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-sm font-medium">WhatsApp do cliente</p>
          {confirmationHref && reminderHref ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <a href={confirmationHref} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"><MessageCircle className="h-4 w-4" />Enviar confirmação</a>
              <a href={reminderHref} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-accent"><MessageCircle className="h-4 w-4" />Enviar lembrete</a>
            </div>
          ) : <p className="text-xs text-muted-foreground">Cadastre um telefone com DDD no cadastro deste cliente para habilitar as mensagens.</p>}
          <p className="mt-2 text-[11px] text-muted-foreground">O WhatsApp abrirá com a mensagem preenchida. Revise e toque em enviar.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">{STATUSES.map((x) => <Button key={x} variant={a.status === x ? "default" : "outline"} disabled={st.isPending} onClick={() => st.mutate({ data: { id: a.id, status: x } })}>{STATUS_LABEL[x]}</Button>)}</div>
        <DialogFooter><Button variant="ghost" className="text-destructive" disabled={rm.isPending} onClick={() => { if (confirm("Excluir este agendamento?")) rm.mutate({ data: { id: a.id } }); }}><Trash2 /> Excluir</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
