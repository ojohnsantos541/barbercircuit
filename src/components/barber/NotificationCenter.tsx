import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, BellRing, Check, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Notice = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  appointmentId?: string;
};

function describeEvent(eventType: string, record: Record<string, unknown>, oldRecord: Record<string, unknown>) {
  if (eventType === "INSERT") return { title: "Novo agendamento", message: "Um novo atendimento foi adicionado à agenda." };
  if (eventType === "DELETE") return { title: "Agendamento removido", message: "Um atendimento foi excluído da agenda." };
  if (record.status === "cancelado" && oldRecord.status !== "cancelado") return { title: "Agendamento cancelado", message: "Um atendimento foi cancelado." };
  if (record.starts_at !== oldRecord.starts_at || record.barber_id !== oldRecord.barber_id) return { title: "Agendamento alterado", message: "O horário ou profissional de um atendimento foi alterado." };
  if (record.status !== oldRecord.status) return { title: "Status atualizado", message: `O status do atendimento mudou para ${String(record.status ?? "atualizado")}.` };
  return null;
}

export function NotificationCenter({ shopId }: { shopId: string }) {
  const [items, setItems] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window) setPermission(Notification.permission);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Não foi possível registrar o service worker:", error);
      });
    }
    const channel = supabase.channel(`barbercircuit-appointments-${shopId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `barbershop_id=eq.${shopId}` }, (payload) => {
        const event = describeEvent(payload.eventType, (payload.new ?? {}) as Record<string, unknown>, (payload.old ?? {}) as Record<string, unknown>);
        if (!event) return;
        const record = (payload.new ?? payload.old ?? {}) as Record<string, unknown>;
        const notice: Notice = {
          id: typeof record.id === "string" ? record.id + "-" + Date.now() : String(Date.now()),
          title: event.title,
          message: event.message,
          createdAt: new Date().toISOString(),
          appointmentId: typeof record.id === "string" ? record.id : undefined,
        };
        setItems((current) => [notice, ...current].slice(0, 30));
        toast(event.title, { description: event.message });
        if ("Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
          new Notification(event.title, { body: event.message, icon: "/favicon.ico", tag: notice.id });
        }
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Canal de notificações em tempo real indisponível:", status);
        }
      });
    return () => { void supabase.removeChannel(channel); };
  }, [shopId]);

  async function enableNotifications() {
    if (!("Notification" in window)) {
      toast.error("Este navegador não oferece suporte a notificações.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") toast.success("Notificações do navegador ativadas.");
    else toast.info("A permissão não foi concedida. Você pode alterá-la nas configurações do navegador.");
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" aria-label={`Notificações, ${items.length} recentes`} onClick={() => setOpen((value) => !value)} className="relative">
        {items.length > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {items.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />}
      </Button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-card p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">Notificações</div>
            <Button size="sm" variant="ghost" onClick={() => setItems([])}>Limpar</Button>
          </div>
          {permission !== "granted" && (
            <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-sm font-medium"><Smartphone className="h-4 w-4 text-primary" /> Alertas no dispositivo</div>
              <p className="mt-1 text-xs text-muted-foreground">Autorize as notificações deste navegador para receber alertas quando o painel estiver em segundo plano.</p>
              <Button size="sm" className="mt-2 w-full" onClick={enableNotifications}>Ativar notificações</Button>
            </div>
          )}
          {items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma notificação recente. Os novos eventos aparecerão aqui.</p> : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg bg-secondary/70 p-3">
                  <div className="text-sm font-medium">{item.title}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    {item.appointmentId && <Link to="/painel/agendamentos" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">Abrir agenda</Link>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 border-t pt-2 text-[11px] text-muted-foreground"><Check className="h-3 w-3 text-success" /> Atualização em tempo real</div>
        </div>
      )}
    </div>
  );
}
