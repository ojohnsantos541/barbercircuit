import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel } from "@/components/barber/ui";
import { myShopQuery, slugify } from "@/lib/my-shop";
import { updateMyShop } from "@/lib/shop-settings.functions";

export const Route = createFileRoute("/_authenticated/painel/configuracoes")({
 head:()=>({meta:[{title:"Configurações — BarberCircuit"},{name:"description",content:"Dados oficiais e link público da sua barbearia."},{property:"og:title",content:"Configurações — BarberCircuit"},{property:"og:description",content:"Dados oficiais e link público da sua barbearia."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),
 component:Config,
});

function Config(){
 const {data:shop,isPending,error}=useQuery(myShopQuery);
 const [form,setForm]=useState({name:"",address:"",phone:"",slug:""});
 const [slugEdited,setSlugEdited]=useState(false);
 useEffect(()=>{if(shop)setForm({name:shop.name,address:shop.address??"",phone:shop.phone??"",slug:shop.slug});},[shop]);
 const qc=useQueryClient(),save=useServerFn(updateMyShop);
 const mutation=useMutation({mutationFn:save,onSuccess:async()=>{await qc.invalidateQueries({queryKey:["my-shop"]});toast.success("Dados da barbearia atualizados.");},onError:e=>toast.error(e instanceof Error?e.message:"Não foi possível salvar.")});
 if(isPending)return <div className="panel p-8 text-center text-muted-foreground">Carregando configurações...</div>;
 if(error)return <div role="alert" className="panel p-6 text-destructive">{error instanceof Error?error.message:"Não foi possível carregar sua barbearia."}</div>;
 if(!shop)return <div className="panel p-8 text-center text-muted-foreground">Finalize o cadastro da sua barbearia para configurar seus dados.</div>;
 const publicUrl=typeof window!=="undefined"?`${window.location.origin}/b/${form.slug}`:`/b/${form.slug}`;
 return <>
  <PageHeader demo={false} title="Configurações" subtitle="Dados oficiais usados no seu cadastro e link público"/>
  <div className="grid gap-4 lg:grid-cols-2">
   <Panel title="Identidade e contato">
    <form className="space-y-4" onSubmit={e=>{e.preventDefault();mutation.mutate({data:form});}}>
     <div className="space-y-1.5"><Label htmlFor="shop-name">Nome da barbearia</Label><Input id="shop-name" required minLength={2} maxLength={100} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value,slug:slugEdited?p.slug:slugify(e.target.value)}))}/></div>
     <div className="space-y-1.5"><Label htmlFor="shop-address">Endereço</Label><Input id="shop-address" maxLength={200} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></div>
     <div className="space-y-1.5"><Label htmlFor="shop-phone">Telefone / WhatsApp</Label><Input id="shop-phone" maxLength={30} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
     <div className="space-y-1.5"><Label htmlFor="shop-slug">Identificador do agendamento</Label><Input id="shop-slug" required minLength={3} maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e=>{setSlugEdited(true);setForm(p=>({...p,slug:slugify(e.target.value)}));}}/><p className="text-xs text-muted-foreground">Use letras minúsculas, números e hífens. Deve ser exclusivo.</p></div>
     <div className="rounded-lg bg-secondary p-3"><div className="text-xs uppercase text-muted-foreground">Link público</div><div className="mt-1 break-all text-sm">{publicUrl}</div></div>
     <Button type="submit" disabled={mutation.isPending}>{mutation.isPending?"Salvando...":"Salvar alterações"}</Button>
    </form>
   </Panel>
   <Panel title="Recursos ainda não persistidos">
    <p className="text-sm text-muted-foreground">O banco atual armazena nome, endereço, telefone e link público. Ainda não existem campos persistentes para logotipo, slogan e horários de funcionamento. Não vou exibir controles que aparentem salvar essas informações sem que o banco realmente as armazene.</p>
    <p className="mt-3 text-sm text-muted-foreground">Esses recursos exigem uma atualização do esquema do Supabase pelo Lovable, seguindo as regras de gerenciamento deste projeto.</p>
   </Panel>
  </div>
 </>;
}
