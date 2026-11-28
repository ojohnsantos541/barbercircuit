import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Clock, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/barber/ui";
import { DeleteButton, ServiceDialog } from "@/components/barber/CatalogForms";
import { catalogQuery } from "@/lib/catalog-query";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/painel/servicos")({
  head: () => ({ meta: [{ title: "Serviços — BarberCircuit" }, { name: "description", content: "Cadastro de serviços com descrição, preço e duração." }, { property: "og:title", content: "Serviços — BarberCircuit" }, { property: "og:description", content: "Cadastro de serviços com descrição, preço e duração." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => { void context.queryClient.ensureQueryData(catalogQuery); },
  component: Servicos,
  errorComponent: ({ error }) => <div role="alert" className="panel p-6 text-destructive">{error instanceof Error ? error.message : "Não foi possível carregar."}</div>,
  notFoundComponent: () => <div className="panel p-6">Página não encontrada.</div>,
});

function Servicos() {
  const { data: { services } } = useSuspenseQuery(catalogQuery);
  return (
    <>
      <PageHeader demo={false} title="Serviços" subtitle="Catálogo oferecido aos seus clientes" action={<ServiceDialog trigger={<Button><Plus /> Novo serviço</Button>} />} />
      {services.length === 0 && <div className="panel p-10 text-center text-muted-foreground">Nenhum serviço cadastrado ainda. Clique em “Novo serviço” para começar.</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((s) => (
          <div key={s.id} className={`panel flex flex-col p-6 transition-colors hover:border-primary/50 ${s.active ? "" : "opacity-60"}`}>
            <div className="flex items-start justify-between gap-2"><div><h3 className="text-2xl font-semibold">{s.name}</h3>{!s.active && <span className="text-xs uppercase tracking-wider text-muted-foreground">Inativo</span>}</div><div className="flex"><ServiceDialog service={s} trigger={<Button aria-label={`Editar ${s.name}`} size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>} /><DeleteButton id={s.id} kind="services" name={s.name} /></div></div>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.description}</p>
            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{s.duration_minutes} min</span>
              <span className="font-display text-2xl text-gold">{brl(Number(s.price))}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
