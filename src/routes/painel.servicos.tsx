import { createFileRoute } from "@tanstack/react-router";
import { Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/barber/ui";
import { getShopData } from "@/lib/demo-data";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/painel/servicos")({
  head: () => ({ meta: [{ title: "Serviços — BarberPro" }, { name: "description", content: "Cadastro de serviços com descrição, preço e duração." }, { property: "og:title", content: "Serviços — BarberPro" }, { property: "og:description", content: "Cadastro de serviços com descrição, preço e duração." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Servicos,
});

function Servicos() {
  const { services } = getShopData();
  return (
    <>
      <PageHeader title="Serviços" subtitle="Catálogo oferecido aos seus clientes" action={<Button variant="gold">Novo serviço</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((s) => (
          <div key={s.id} className="panel flex flex-col p-6 transition-colors hover:border-primary/50">
            <div className="flex items-start justify-between"><h3 className="text-2xl font-semibold">{s.name}</h3><button aria-label="Editar" className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button></div>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.description}</p>
            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{s.duration} min</span>
              <span className="font-display text-2xl text-gold">{brl(s.price)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
