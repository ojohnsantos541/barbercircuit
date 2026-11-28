import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Pencil, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/barber/ui";
import { BarberDialog, DeleteButton } from "@/components/barber/CatalogForms";
import { catalogQuery } from "@/lib/catalog-query";

export const Route = createFileRoute("/_authenticated/painel/barbeiros")({
  head: () => ({ meta: [{ title: "Barbeiros — BarberCircuit" }, { name: "description", content: "Equipe de profissionais e seus horários de atendimento." }, { property: "og:title", content: "Barbeiros — BarberCircuit" }, { property: "og:description", content: "Equipe de profissionais e seus horários de atendimento." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => { void context.queryClient.ensureQueryData(catalogQuery); },
  component: Barbeiros,
  errorComponent: ({ error }) => <div role="alert" className="panel p-6 text-destructive">{error instanceof Error ? error.message : "Não foi possível carregar."}</div>,
  notFoundComponent: () => <div className="panel p-6">Página não encontrada.</div>,
});
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

function Barbeiros() {
  const { data: { barbers } } = useSuspenseQuery(catalogQuery);
  return (
    <>
      <PageHeader demo={false} title="Barbeiros" subtitle="Profissionais da sua equipe" action={<BarberDialog trigger={<Button><Plus /> Novo barbeiro</Button>} />} />
      {barbers.length === 0 && <div className="panel p-10 text-center text-muted-foreground">Nenhum barbeiro cadastrado ainda. Clique em “Novo barbeiro” para começar.</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {barbers.map((b) => (
          <div key={b.id} className={`panel p-6 ${b.active ? "" : "opacity-60"}`}>
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gold font-display text-xl font-bold text-primary-foreground">{initials(b.name)}</span>
              <div className="min-w-0 flex-1"><h3 className="truncate text-2xl font-semibold">{b.name}</h3><p className="text-sm text-muted-foreground">{b.specialty || "Barbeiro"}</p></div>
              <BarberDialog barber={b} trigger={<Button aria-label={`Editar ${b.name}`} size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>} /><DeleteButton id={b.id} kind="barbers" name={b.name} />
            </div>
            <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-4 w-4" />{b.phone || "Sem telefone"}</span>
              <span className={b.active ? "text-primary" : "text-muted-foreground"}>{b.active ? "Ativo" : "Inativo"}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
