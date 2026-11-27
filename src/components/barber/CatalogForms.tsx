import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { catalogQuery, type Barber, type Service } from "@/lib/catalog-query";
import { deleteCatalogItem, saveBarber, saveService } from "@/lib/catalog.functions";

function message(e: unknown) { return e instanceof Error ? e.message.replace(/^.*?:\s(?=[A-ZÁ-Ú])/, "") : "Tente novamente."; }
function useInvalidate() { const qc = useQueryClient(); return () => qc.invalidateQueries({ queryKey: catalogQuery.queryKey }); }

function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }

export function ServiceDialog({ service, trigger }: { service?: Service; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", description: "", price: "", duration: "30", active: true });
  const save = useServerFn(saveService); const invalidate = useInvalidate();
  const m = useMutation({ mutationFn: save, onSuccess: async () => { await invalidate(); toast.success(service ? "Serviço atualizado." : "Serviço cadastrado."); setOpen(false); }, onError: (e) => toast.error(message(e)) });
  function reset() { setF({ name: service?.name ?? "", description: service?.description ?? "", price: service ? String(service.price).replace(".", ",") : "", duration: String(service?.duration_minutes ?? 30), active: service?.active ?? true }); }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(f.price.replace(/\./g, "").replace(",", ".")); const duration = Number(f.duration);
    if (!f.name.trim()) { toast.error("Informe o nome do serviço."); return; }
    if (!Number.isFinite(price) || price < 0) { toast.error("Informe um preço válido."); return; }
    if (!Number.isInteger(duration) || duration <= 0) { toast.error("Informe a duração em minutos."); return; }
    m.mutate({ data: { ...(service ? { id: service.id } : {}), name: f.name, description: f.description, price, duration_minutes: duration, active: f.active } });
  }
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) reset(); setOpen(o); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent><form onSubmit={submit} className="space-y-4">
        <DialogHeader><DialogTitle>{service ? "Editar serviço" : "Novo serviço"}</DialogTitle><DialogDescription>Informações exibidas aos seus clientes.</DialogDescription></DialogHeader>
        <Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Descrição"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Preço (R$)"><Input inputMode="decimal" placeholder="50,00" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field><Field label="Duração (min)"><Input type="number" min={1} value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></Field></div>
        <label className="flex items-center justify-between rounded-lg border p-3 text-sm">Disponível para agendamento<Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} /></label>
        <DialogFooter><Button type="submit" disabled={m.isPending}>{m.isPending && <Loader2 className="animate-spin" />}Salvar</Button></DialogFooter>
      </form></DialogContent>
    </Dialog>
  );
}

export function BarberDialog({ barber, trigger }: { barber?: Barber; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", specialty: "", phone: "", active: true });
  const save = useServerFn(saveBarber); const invalidate = useInvalidate();
  const m = useMutation({ mutationFn: save, onSuccess: async () => { await invalidate(); toast.success(barber ? "Barbeiro atualizado." : "Barbeiro cadastrado."); setOpen(false); }, onError: (e) => toast.error(message(e)) });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) { toast.error("Informe o nome do barbeiro."); return; }
    m.mutate({ data: { ...(barber ? { id: barber.id } : {}), ...f } });
  }
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) setF({ name: barber?.name ?? "", specialty: barber?.specialty ?? "", phone: barber?.phone ?? "", active: barber?.active ?? true }); setOpen(o); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent><form onSubmit={submit} className="space-y-4">
        <DialogHeader><DialogTitle>{barber ? "Editar barbeiro" : "Novo barbeiro"}</DialogTitle><DialogDescription>Profissional da sua equipe.</DialogDescription></DialogHeader>
        <Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Especialidade"><Input value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })} /></Field>
        <Field label="Telefone"><Input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <label className="flex items-center justify-between rounded-lg border p-3 text-sm">Disponível para agendamento<Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} /></label>
        <DialogFooter><Button type="submit" disabled={m.isPending}>{m.isPending && <Loader2 className="animate-spin" />}Salvar</Button></DialogFooter>
      </form></DialogContent>
    </Dialog>
  );
}

export function DeleteButton({ id, kind, name }: { id: string; kind: "services" | "barbers"; name: string }) {
  const del = useServerFn(deleteCatalogItem); const invalidate = useInvalidate();
  const m = useMutation({ mutationFn: del, onSuccess: async () => { await invalidate(); toast.success("Cadastro excluído."); }, onError: (e) => toast.error(message(e)) });
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button aria-label={`Excluir ${name}`} size="icon" variant="ghost" disabled={m.isPending}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir {name}?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Agendamentos antigos são mantidos.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => m.mutate({ data: { id, kind } })}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  );
}