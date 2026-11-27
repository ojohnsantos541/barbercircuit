import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, Pencil, Phone, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, StatusPill } from "@/components/barber/ui";
import { CustomerDialog, DeleteCustomer } from "@/components/barber/CustomerForms";
import { customersQuery } from "@/lib/customers-query";
import { brl, dateBR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/painel/clientes")({
  head: () => ({ meta: [{ title: "Clientes — BarberPro" }, { name: "description", content: "Cadastro de clientes com telefone e histórico de agendamentos." }, { property: "og:title", content: "Clientes — BarberPro" }, { property: "og:description", content: "Cadastro de clientes com telefone e histórico de agendamentos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => { void context.queryClient.ensureQueryData(customersQuery); },
  component: Clientes,
  errorComponent: ({ error }) => <div role="alert" className="panel p-6 text-destructive">{error instanceof Error ? error.message : "Não foi possível carregar."}</div>,
  notFoundComponent: () => <div className="panel p-6">Página não encontrada.</div>,
});

const tz = "America/Sao_Paulo";
const dt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: tz, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function Clientes() {
  const { data: clients } = useSuspenseQuery(customersQuery);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | undefined>();
  const list = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone ?? "").includes(q));
  const current = clients.find((c) => c.id === sel) ?? clients[0];
  const hist = [...(current?.appointments ?? [])].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const done = hist.filter((a) => a.status === "concluido");
  return (
    <>
      <PageHeader demo={false} title="Clientes" subtitle={`${clients.length} clientes cadastrados`} action={<CustomerDialog onSaved={setSel} trigger={<Button><Plus /> Novo cliente</Button>} />} />
      {clients.length === 0 ? <div className="panel p-10 text-center text-muted-foreground">Nenhum cliente cadastrado ainda. Clique em “Novo cliente” para começar.</div> : (
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-2">
          <div className="relative mb-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou telefone" className="pl-9" /></div>
          <ul className="max-h-[560px] divide-y overflow-y-auto">
            {list.map((c) => (
              <li key={c.id}>
                <button onClick={() => setSel(c.id)} className={`flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left ${current?.id === c.id ? "bg-accent" : "hover:bg-accent/50"}`}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">{c.name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0"><div className="truncate text-sm font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.phone || "Sem telefone"}</div></div>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</li>}
          </ul>
        </Panel>
        {current && (
          <Panel className="lg:col-span-3">
            <div className="flex items-start justify-between gap-2"><h2 className="text-3xl font-semibold">{current.name}</h2><div className="flex"><CustomerDialog customer={current} trigger={<Button size="icon" variant="ghost" aria-label={`Editar ${current.name}`}><Pencil className="h-4 w-4" /></Button>} /><DeleteCustomer customer={current} onDeleted={() => setSel(undefined)} /></div></div>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{current.phone || "Sem telefone"}{current.email && <><Mail className="ml-2 h-3.5 w-3.5" />{current.email}</>} · Cliente desde {dateBR(current.created_at.slice(0, 10), { month: "long", year: "numeric" })}</p>
            {current.notes && <p className="mt-3 rounded-lg bg-secondary p-3 text-sm">{current.notes}</p>}
            <div className="my-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[["Visitas", String(done.length)], ["Total gasto", brl(done.reduce((s, a) => s + Number(a.price), 0))], ["Última visita", done[0] ? dt(done[0].starts_at).slice(0, 5) : "—"]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-secondary p-3"><div className="text-[11px] uppercase text-muted-foreground">{l}</div><div className="font-display text-xl">{v}</div></div>
              ))}
            </div>
            <h3 className="mb-2 text-lg font-semibold">Histórico de agendamentos</h3>
            <ul className="max-h-96 divide-y overflow-y-auto">
              {hist.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-24 text-muted-foreground">{dt(a.starts_at)}</span>
                  <span className="min-w-0 flex-1 truncate">{a.services?.name ?? "Serviço removido"} <span className="text-muted-foreground">· {a.barbers?.name.split(" ")[0] ?? "—"}</span></span>
                  <StatusPill status={a.status} />
                </li>
              ))}
              {hist.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nenhum agendamento ainda.</li>}
            </ul>
          </Panel>
        )}
      </div>)}
    </>
  );
}
