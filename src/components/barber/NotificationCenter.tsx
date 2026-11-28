import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, BellRing, Check, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Notice = Tables<"notifications">;

export function NotificationCenter({ shopId }: { shopId: string }) {
  const [items, setItems] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const unreadCount = items.filter((item) => !item.read_at).length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;
    if ("Notification" in window) setPermission(Notification.permission);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Não foi possível registrar o service worker:", error);
      });
    }

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("barbershop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) {
        console.warn("Não foi possível carregar as notificações:", error.message);
        return;
      }
      if (active && data) setItems(data);
    };

    void loadNotifications();
    const channel = supabase
      .channel(`barbercircuit-notifications-${shopId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `barbershop_id=eq.${shopId}` },
        (payload) => {
          const notice = payload.new as Notice;
          setItems((current) => [notice, ...current.filter((item) => item.id !== notice.id)].slice(0, 30));
          toast(notice.title, { description: notice.message });
          if ("Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
            try {
              new Notification(notice.title, { body: notice.message, icon: "/favicon.ico", tag: notice.id });
            } catch (error) {
              console.warn("Não foi possível exibir a notificação do navegador:", error);
            }
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Canal de notificações indisponível:", status);
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [shopId]);

  async function markRead(id: string) {
    const now = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: now }).eq("id", id).eq("barbershop_id", shopId);
    if (error) {
      toast.error("Não foi possível atualizar a notificação.");
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: now } : item));
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: now }).eq("barbershop_id", shopId).is("read_at", null);
    if (error) {
      toast.error("Não foi possível atualizar as notificações.");
      return;
    }
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? now })));
  }

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
      <Button variant="ghost" size="icon" aria-label={`Notificações, ${unreadCount} não lidas`} onClick={() => setOpen((value) => !value)} className="relative">
        {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-card p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="font-semibold">Notificações</div>
            {unreadCount > 0 && <Button size="sm" variant="ghost" onClick={() => void markAllRead()}>Marcar todas como lidas</Button>}
          </div>
          {permission !== "granted" && (
            <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-sm font-medium"><Smartphone className="h-4 w-4 text-primary" /> Alertas neste dispositivo</div>
              <p className="mt-1 text-xs text-muted-foreground">Ative para receber alertas enquanto o painel estiver aberto em segundo plano. Para alertas com o painel fechado, será necessário configurar o envio Web Push.</p>
              <Button size="sm" className="mt-2 w-full" onClick={enableNotifications}>Ativar notificações</Button>
            </div>
          )}
          {items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p> : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className={`rounded-lg p-3 ${item.read_at ? "bg-secondary/50" : "bg-secondary/90"}`}>
                  <div className="flex items-start gap-2">
                    {!item.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{item.title}</div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                        <Link to="/painel/agendamentos" onClick={() => { void markRead(item.id); setOpen(false); }} className="text-xs text-primary hover:underline">Abrir agenda</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 border-t pt-2 text-[11px] text-muted-foreground"><Check className="h-3 w-3 text-success" /> Avisos salvos no sistema</div>
        </div>
      )}
    </div>
  );
}
