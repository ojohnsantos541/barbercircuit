import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
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
  const [hours, setHours] = useState(shop.hours);
  const [logo, setLogo] = useState<string>();
  const upload = useRef<HTMLInputElement>(null);
  return (
    <>
      <PageHeader title="Configurações" subtitle="Dados da barbearia exibidos para seus clientes" action={<Button variant="gold" onClick={() => toast("Versão demonstrativa: alterações ainda não são salvas.")}>Salvar alterações</Button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Identidade">
          <div className="mb-5 flex items-center gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-gold font-display text-3xl font-bold text-primary-foreground">{logo ? <img src={logo} alt="Prévia do logotipo" className="h-full w-full object-cover"/> : shop.logoInitials}</span>
            <input ref={upload} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{if(typeof reader.result==='string')setLogo(reader.result)};reader.readAsDataURL(f)}}/>
            <Button variant="outline" onClick={()=>upload.current?.click()}><Upload /> Enviar logotipo</Button>
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
            {hours.map((h, i) => (
              <li key={h.day} className="flex flex-wrap items-center gap-3 py-3">
                <Switch aria-label={`Abrir ${h.day}`} checked={!h.closed} onCheckedChange={checked=>setHours(prev=>prev.map((v,j)=>j===i?{...v,closed:!checked}:v))} />
                <span className="w-20 shrink-0 text-sm">{h.day}</span>
                {h.closed ? <span className="text-sm text-muted-foreground">Fechado</span> : (
                  <div className="flex w-full items-center gap-2 sm:w-auto"><Input aria-label={`${h.day} abertura`} type="time" defaultValue={h.open} className="min-w-0 flex-1 sm:w-28" /><span className="text-muted-foreground">às</span><Input aria-label={`${h.day} fechamento`} type="time" defaultValue={h.close} className="min-w-0 flex-1 sm:w-28" /></div>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
