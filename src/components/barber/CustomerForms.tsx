import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { customersQuery, type Customer } from "@/lib/customers-query";
import { deleteCustomer, saveCustomer } from "@/lib/customers.functions";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Tente novamente.");

export function CustomerDialog({ customer, trigger, onSaved }: { customer?: Customer; trigger: ReactNode; onSaved?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", email: "", notes: "" });
  const qc = useQueryClient(); const save = useServerFn(saveCustomer);
  const m = useMutation({ mutationFn: save, onSuccess: async (r) => { await qc.invalidateQueries({ queryKey: customersQuery.queryKey }); toast.success(customer ? "Cliente atualizado." : "Cliente cadastrado."); onSaved?.(r.id); setOpen(false); }, onError: (e) => toast.error(msg(e)) });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) { toast.error("Informe o nome do cliente."); return; }
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) { toast.error("Informe um e-mail válido."); return; }
    m.mutate({ data: { ...(customer ? { id: customer.id } : {}), ...f } });
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) setF({ name: customer?.name ?? "", phone: customer?.phone ?? "", email: customer?.email ?? "", notes: customer?.notes ?? "" }); setOpen(o); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent><form onSubmit={submit} className="space-y-4">
        <DialogHeader><DialogTitle>{customer ? "Editar cliente" : "Novo cliente"}</DialogTitle><DialogDescription>Dados de contato do cliente.</DialogDescription></DialogHeader>
        <div className="space-y-1.5"><Label>Nome</Label><Input value={f.name} onChange={set("name")} /></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Telefone</Label><Input type="tel" value={f.phone} onChange={set("phone")} /></div><div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={f.email} onChange={set("email")} /></div></div>
        <div className="space-y-1.5"><Label>Observações</Label><Textarea value={f.notes} onChange={set("notes")} /></div>
        <DialogFooter><Button type="submit" disabled={m.isPending}>{m.isPending && <Loader2 className="animate-spin" />}Salvar</Button></DialogFooter>
      </form></DialogContent>
    </Dialog>
  );
}

export function DeleteCustomer({ customer, onDeleted }: { customer: Customer; onDeleted: () => void }) {
  const qc = useQueryClient(); const del = useServerFn(deleteCustomer);
  const m = useMutation({ mutationFn: del, onSuccess: async () => { onDeleted(); await qc.invalidateQueries({ queryKey: customersQuery.queryKey }); toast.success("Cliente excluído."); }, onError: (e) => toast.error(msg(e)) });
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button size="icon" variant="ghost" aria-label={`Excluir ${customer.name}`} disabled={m.isPending}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir {customer.name}?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Os agendamentos ficam sem cliente vinculado.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => m.mutate({ data: { id: customer.id } })}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  );
}