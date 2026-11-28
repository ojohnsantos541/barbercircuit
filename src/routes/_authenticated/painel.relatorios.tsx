import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PageHeader, Panel } from "@/components/barber/ui";
import { dashboardQuery } from "@/lib/dashboard-query";
import { brl } from "@/lib/format";
import { spParts } from "@/lib/sp-time";

export const Route = createFileRoute("/_authenticated/painel/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — BarberCircuit" }, { name: "description", content: "Indicadores calculados a partir dos agendamentos reais." }, { property: "og:title", content: "Relatórios — BarberCircuit" }, { property: "og:description", content: "Indicadores calculados a partir dos agendamentos reais." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Relatorios,
});
const COLORS=["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)","var(--color-chart-5)","var(--color-muted-foreground)"];
const WD=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const shift=(date:string,days:number)=>{const[y,m,d]=date.split("-").map(Number);return new Date(Date.UTC(y!,m!-1,d!+days)).toISOString().slice(0,10);};

function Relatorios(){
 const now=today(),year=now.slice(0,4);
 const {data,isPending,error}=useQuery(dashboardQuery(`${year}-01-01`,`${Number(year)+1}-01-01`));
 const appts=data?.appointments??[],services=data?.services??[],barbers=data?.barbers??[];
 const month=appts.filter(a=>spParts(a.starts_at).date.startsWith(now.slice(0,7)));
 const done=month.filter(a=>a.status==="concluido");
 const revenue=done.reduce((s,a)=>s+Number(a.price),0);
 const bySvc=services.map(s=>({name:s.name,value:done.filter(a=>a.service_id===s.id).reduce((sum,a)=>sum+Number(a.price),0)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
 const byBarber=barbers.map(b=>({name:b.name,value:done.filter(a=>a.barber_id===b.id).reduce((sum,a)=>sum+Number(a.price),0),count:done.filter(a=>a.barber_id===b.id).length})).filter(x=>x.count>0).sort((a,b)=>b.value-a.value);
 const byDay=WD.map((name,i)=>({name,count:appts.filter(a=>a.status!=="cancelado"&&new Date(`${spParts(a.starts_at).date}T12:00:00`).getDay()===i).length}));
 const nonCancelled=appts.filter(a=>a.status!=="confirmado");
 const cancelled=appts.filter(a=>a.status==="cancelado").length;
 const cancelRate=nonCancelled.length?Math.round(cancelled/nonCancelled.length*100):0;
 return <>
  <PageHeader demo={false} title="Relatórios" subtitle="Indicadores calculados com os dados da sua barbearia"/>
  {error&&<div role="alert" className="panel mb-4 p-4 text-destructive">{error instanceof Error?error.message:"Não foi possível carregar os relatórios."}</div>}
  {isPending?<div className="panel p-10 text-center text-muted-foreground">Carregando indicadores...</div>:<>
   <div className="grid gap-4 sm:grid-cols-3"><div className="panel p-5"><div className="text-xs uppercase text-muted-foreground">Faturamento do mês</div><div className="mt-2 font-display text-3xl">{brl(revenue)}</div></div><div className="panel p-5"><div className="text-xs uppercase text-muted-foreground">Atendimentos concluídos</div><div className="mt-2 font-display text-3xl">{done.length}</div></div><div className="panel p-5"><div className="text-xs uppercase text-muted-foreground">Taxa de cancelamento</div><div className="mt-2 font-display text-3xl">{cancelRate}%</div></div></div>
   <div className="mt-4 grid gap-4 lg:grid-cols-2">
    <Panel title="Faturamento por serviço — mês atual"><div className="flex flex-col items-center gap-4 sm:flex-row">{bySvc.length===0?<p className="text-sm text-muted-foreground">Sem atendimentos concluídos neste mês.</p>:<><div className="h-52 w-52"><ResponsiveContainer><PieChart><Pie data={bySvc} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} stroke="var(--color-card)">{bySvc.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v:number)=>brl(v)} contentStyle={{background:"var(--color-popover)",border:"1px solid var(--color-border)",borderRadius:8}}/></PieChart></ResponsiveContainer></div><ul className="flex-1 space-y-2 text-sm">{bySvc.map((s,i)=><li key={s.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{background:COLORS[i%COLORS.length]}}/><span className="flex-1">{s.name}</span><span className="text-muted-foreground">{brl(s.value)}</span></li>)}</ul></>}</div></Panel>
    <Panel title="Ranking de barbeiros — mês atual">{byBarber.length===0?<p className="text-sm text-muted-foreground">Sem atendimentos concluídos neste mês.</p>:<ol className="space-y-4">{byBarber.map((b,i)=><li key={b.name} className="flex items-center gap-4"><span className="font-display text-3xl text-gold">{i+1}º</span><div className="flex-1"><div className="font-medium">{b.name}</div><div className="text-xs text-muted-foreground">{b.count} atendimentos</div></div><span className="font-display text-xl">{brl(b.value)}</span></li>)}</ol>}</Panel>
    <Panel title="Movimento por dia da semana — ano atual"><div className="flex h-44 items-end gap-2">{byDay.map(x=>{const max=Math.max(1,...byDay.map(d=>d.count));return <div key={x.name} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-md bg-gold" style={{height:`${x.count/max*140}px`}}/><span className="text-xs text-muted-foreground">{x.name}</span></div>})}</div></Panel>
    <Panel title="Indicadores do mês"><div className="grid grid-cols-2 gap-3">{[["Agendamentos no mês",String(month.length)],["Cancelados",String(month.filter(a=>a.status==="cancelado").length)],["Faturamento",brl(revenue)],["Ticket médio",brl(revenue/Math.max(1,done.length))]].map(([label,value])=><div key={label} className="rounded-lg bg-secondary p-4"><div className="text-[11px] uppercase text-muted-foreground">{label}</div><div className="mt-1 font-display text-2xl">{value}</div></div>)}</div></Panel>
   </div>
  </>}
 </>;
}
