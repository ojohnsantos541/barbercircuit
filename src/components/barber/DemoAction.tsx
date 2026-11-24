import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Check } from 'lucide-react';
export function DemoAction({title, fields}: {title:string; fields:string[]}) {
 const [open,setOpen]=useState(false); const [done,setDone]=useState(false);
 return <><Button variant="gold" onClick={()=>{setOpen(true);setDone(false)}}><Plus/>{title}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Dados de exemplo · sem envio ou armazenamento real.</DialogDescription></DialogHeader>{done ? <div className="py-6 text-center"><Check className="mx-auto mb-3 h-10 w-10 text-primary"/><p>Exemplo preenchido com sucesso.</p><Button className="mt-5" onClick={()=>setOpen(false)}>Fechar</Button></div> : <form className="space-y-4" onSubmit={e=>{e.preventDefault();setDone(true)}}>{fields.map(f=><div key={f} className="space-y-1.5"><Label htmlFor={f}>{f}</Label><Input id={f} required type={f.includes('Data')?'date':f.includes('Horário')?'time':f.includes('Preço')||f.includes('Valor')||f.includes('Duração')?'number':'text'} min="0"/></div>)}<Button type="submit" variant="gold" className="w-full">Concluir exemplo</Button></form>}</DialogContent></Dialog></>
}
