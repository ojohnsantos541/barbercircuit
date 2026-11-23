import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel } from "@/components/barber/ui";
import { getShopData } from "@/lib/demo-data";

export const Route = createFileRoute("/painel/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — BarberPro" }, { name: "description", content: "Nome, logotipo, endereço, telefone e horários de funcionamento." }, { property: "og:title", content: "Configurações — BarberPro" }, { property: "og:description", content: "Nome, logotipo, endereço, telefone e horários de funcionamento." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Config,
});

function Config() {
  const { shop } = getShopData();
  return (
    <>
      <PageHeader title="Configurações" subtitle="Dados da barbearia exibidos para seus clientes" action={<Button variant="gold" onClick={() => toast("Versão demonstrativa: alterações ainda não são salvas.")}>Salvar alterações</Button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Identidade">
          <div className="mb-5 flex items-center gap-4">
            <span className="grid h-20 w-20 place-items-center rounded-xl bg-gold font-display text-3xl font-bold text-primary-foreground">{shop.logoInitials}</span>
            <Button variant="outline"><Upload /> Enviar logotipo</Button>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nome da barbearia</Label><Input defaultValue={shop.name} /></div>
            <div className="space-y-1.5"><Label>Slogan</Label><Input defaultValue={shop.tagline} /></div>
            <div className="space-y-1.5"><Label>Endereço</Label><Input defaultValue={shop.address} /></div>
            <div className="space-y-1.5"><Label>Telefone / WhatsApp</Label><Input defaultValue={shop.phone} /></div>
            <div className="space-y-1.5"><Label>Link de agendamento</Label><Input readOnly value={`barberpro.app/b/${shop.slug}`} /></div>
          </div>
        </Panel>
        <Panel title="Horários de funcionamento">
          <ul className="divide-y">
            {shop.hours.map((h) => (
              <li key={h.day} className="flex items-center gap-3 py-3">
                <Switch defaultChecked={!h.closed} />
                <span className="w-20 text-sm">{h.day}</span>
                {h.closed ? <span className="text-sm text-muted-foreground">Fechado</span> : (
                  <div className="flex items-center gap-2"><Input type="time" defaultValue={h.open} className="w-28" /><span className="text-muted-foreground">às</span><Input type="time" defaultValue={h.close} className="w-28" /></div>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
