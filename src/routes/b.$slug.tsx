import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Scissors, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";

export const Route=createFileRoute("/b/$slug")({
 head:({params})=>({meta:[{title:`Agendamento — ${params.slug} | BarberCircuit`},{name:"description",content:"Conheça os serviços e profissionais desta barbearia."},{property:"og:title",content:"BarberCircuit — Barbearia"},{property:"og:description",content:"Serviços e profissionais da barbearia."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),
 component:PublicBarbershop,
});

function PublicBarbershop(){
 const {slug}=Route.useParams();
 const {data,isPending,error}=useQuery({
  queryKey:["public-barbershop",slug],
  queryFn:async()=>{
   const {data:shopRows,error:shopError}=await supabase.rpc("get_public_barbershop_by_slug",{_slug:slug});
   const shop=shopRows?.[0]??null;
   if(shopError)throw shopError;
   if(!shop)return null;
   const [services,barbers]=await Promise.all([
    supabase.from("services").select("id,name,description,price,duration_minutes").eq("barbershop_id",shop.id).eq("active",true).order("name"),
    supabase.from("barbers").select("id,name,specialty").eq("barbershop_id",shop.id).eq("active",true).order("name")
   ]);
   if(services.error||barbers.error)throw new Error("Não foi possível carregar os dados públicos desta barbearia.");
   return {shop,services:services.data??[],barbers:barbers.data??[]};
  }
 });
 if(isPending)return <main className="grid min-h-screen place-items-center p-6 text-muted-foreground">Carregando barbearia...</main>;
 if(error)return <main className="grid min-h-screen place-items-center p-6"><div role="alert" className="panel max-w-lg p-8 text-center text-destructive">{error instanceof Error?error.message:"Não foi possível carregar esta página."}</div></main>;
 if(!data)return <main className="grid min-h-screen place-items-center p-6"><div className="panel max-w-lg p-8 text-center"><h1 className="text-2xl font-semibold">Barbearia não encontrada</h1><p className="mt-2 text-sm text-muted-foreground">Confira se o link está correto.</p></div></main>;
 const {shop,services,barbers}=data;
 return <div className="min-h-screen bg-background">
  <header className="border-b"><div className="mx-auto max-w-4xl px-5 py-12"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">BarberCircuit</p><h1 className="mt-3 text-4xl font-semibold md:text-5xl">{shop.name}</h1>{shop.address&&<p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4"/>{shop.address}</p>}{shop.phone&&<a href={`tel:${shop.phone.replace(/[^+0-9]/g,"")}`} className="mt-2 inline-flex items-center gap-2 text-sm text-primary"><Phone className="h-4 w-4"/>{shop.phone}</a>}</div></header>
  <main className="mx-auto max-w-4xl space-y-8 px-5 py-8">
   <section className="panel p-5"><h2 className="text-xl font-semibold">Agendamento online</h2><p className="mt-2 text-sm text-muted-foreground">A página já está conectada ao cadastro real da barbearia. A confirmação online de horários será ativada assim que a camada segura de disponibilidade e gravação pública for configurada no banco de dados.</p>{shop.phone&&<Button asChild className="mt-4"><a href={`https://wa.me/${shop.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">Solicitar horário pelo WhatsApp</a></Button>}</section>
   <section><div className="mb-4 flex items-center gap-2"><Scissors className="h-5 w-5 text-primary"/><h2 className="text-2xl font-semibold">Serviços</h2></div>{services.length===0?<div className="panel p-6 text-sm text-muted-foreground">Nenhum serviço ativo cadastrado.</div>:<div className="grid gap-3 sm:grid-cols-2">{services.map(s=><article key={s.id} className="panel p-5"><h3 className="font-semibold">{s.name}</h3>{s.description&&<p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}<div className="mt-4 flex items-center justify-between"><span className="text-xs text-muted-foreground">{s.duration_minutes} minutos</span><span className="font-display text-xl text-gold">{brl(Number(s.price))}</span></div></article>)}</div>}</section>
   <section><div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary"/><h2 className="text-2xl font-semibold">Profissionais</h2></div>{barbers.length===0?<div className="panel p-6 text-sm text-muted-foreground">Nenhum profissional ativo cadastrado.</div>:<div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">{barbers.map(b=><article key={b.id} className="panel p-5"><h3 className="font-semibold">{b.name}</h3><p className="mt-1 text-sm text-muted-foreground">{b.specialty||"Profissional"}</p></article>)}</div>}</section>
  </main>
  <footer className="border-t py-6 text-center text-xs text-muted-foreground">Página oficial de {shop.name} · BarberCircuit</footer>
 </div>;
}
