import { DemoAction } from "@/components/barber/DemoAction";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, StatusPill } from "@/components/barber/ui";
import { getShopData, revenueOf } from "@/lib/demo-data";
import { brl, dateBR } from "@/lib/format";

export const Route = createFileRoute("/painel/clientes")({
  head: () => ({ meta: [{ title: "Clientes — BarberPro" }, { name: "description", content: "Cadastro de clientes com telefone e histórico de agendamentos." }, { property: "og:title", content: "Clientes — BarberPro" }, { property: "og:description", content: "Cadastro de clientes com telefone e histórico de agendamentos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Clientes,
});

function Clientes() {
  const { clients, appointments, services, barbers } = getShopData();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(clients[0]?.id);
  const list = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
  const current = clients.find((c) => c.id === sel);
  const hist = appointments.filter((a) => a.clientId === sel).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHeader title="Clientes" subtitle={`${clients.length} clientes cadastrados`} action={<DemoAction title="Novo cliente" fields={["Nome", "Telefone"]} />} />
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-2">
          <div className="relative mb-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou telefone" className="pl-9" /></div>
          <ul className="max-h-[560px] divide-y overflow-y-auto">
            {list.map((c) => (
              <li key={c.id}>
                <button onClick={() => setSel(c.id)} className={`flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left ${sel === c.id ? "bg-accent" : "hover:bg-accent/50"}`}>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">{c.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span>
                  <div className="min-w-0"><div className="truncate text-sm font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.phone}</div></div>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        {current && (
          <Panel className="lg:col-span-3">
            <h2 className="text-3xl font-semibold">{current.name}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{current.phone} · Cliente desde {dateBR(current.since, { month: "long", year: "numeric" })}</p>
            <div className="my-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[["Visitas", String(hist.filter((a) => a.status === "concluido").length)], ["Total gasto", brl(revenueOf(hist))], ["Última visita", hist.find((a) => a.status === "concluido") ? dateBR((hist.find((a) => a.status === "concluido")?.date ?? "")) : "—"]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-secondary p-3"><div className="text-[11px] uppercase text-muted-foreground">{l}</div><div className="font-display text-xl">{v}</div></div>
              ))}
            </div>
            <h3 className="mb-2 text-lg font-semibold">Histórico de agendamentos</h3>
            <ul className="max-h-96 divide-y overflow-y-auto">
              {hist.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-20 text-muted-foreground">{dateBR(a.date)} {a.time}</span>
                  <span className="min-w-0 flex-1 truncate">{services.find((s) => s.id === a.serviceId)?.name} <span className="text-muted-foreground">· {barbers.find((b) => b.id === a.barberId)?.name.split(" ")[0]}</span></span>
                  <StatusPill status={a.status} />
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
