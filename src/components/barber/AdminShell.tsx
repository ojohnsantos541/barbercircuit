import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { myShopQuery } from "@/lib/my-shop";
import { ShopOnboarding } from "./ShopOnboarding";
import { useState } from "react";
import { BarChart3, Calendar, LayoutDashboard, Menu, Scissors, Settings, Users, UserSquare2, Wallet, ExternalLink, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./ui";

const items = [
  { to: "/painel", label: "Dashboard", icon: LayoutDashboard },
  { to: "/painel/agendamentos", label: "Agendamentos", icon: Calendar },
  { to: "/painel/clientes", label: "Clientes", icon: Users },
  { to: "/painel/servicos", label: "Serviços", icon: Scissors },
  { to: "/painel/barbeiros", label: "Barbeiros", icon: UserSquare2 },
  { to: "/painel/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/painel/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/painel/configuracoes", label: "Configurações", icon: Settings },
] as const;

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { data: shop } = useQuery(myShopQuery);
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6"><Logo /></div>
      <div className="mx-4 mb-4 rounded-lg border border-sidebar-border bg-sidebar-accent p-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Barbearia</div>
        <div className="font-display text-lg font-semibold text-sidebar-accent-foreground">{shop?.name ?? "Sua barbearia"}</div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/painel" ? path === "/painel" || path === "/painel/" : path.startsWith(to);
          return (
            <Link key={to} to={to} onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-sidebar-accent text-sidebar-primary font-semibold" : "text-sidebar-foreground hover:bg-sidebar-accent/60"}`}>
              <Icon className="h-4 w-4" />{label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-4">
        {shop && <Link to="/b/$slug" params={{ slug: shop.slug }} onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 px-3 py-2.5 text-sm text-primary hover:bg-primary/10">
          <ExternalLink className="h-4 w-4" /> Página de agendamento
        </Link>}
      </div>
    </div>
  );
}

export function AdminShell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: mine, isLoading } = useQuery(myShopQuery);
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: "/painel" }, replace: true });
  }
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen w-full">
      {!collapsed && <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block"><Nav /></aside>}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border bg-sidebar animate-in slide-in-from-left">
            <Button size="icon" variant="ghost" aria-label="Fechar menu" className="absolute right-3 top-6 text-muted-foreground" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
            <Nav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" aria-label="Abrir menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
          <Logo />
          <Button size="icon" variant="ghost" aria-label="Sair" className="ml-auto" onClick={signOut}><LogOut className="h-5 w-5" /></Button>
        </header>
        <div className="hidden items-center justify-between border-b px-8 py-3 lg:flex"><Button title={collapsed ? "Expandir menu" : "Recolher menu"} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} size="icon" variant="ghost" onClick={()=>setCollapsed(!collapsed)}><Menu/></Button><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{mine?.name ?? "Administrador"}</span><Button size="sm" variant="ghost" onClick={signOut}><LogOut /> Sair</Button></div></div>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{isLoading ? null : mine ? <Outlet /> : <ShopOnboarding />}</main>
      </div>
    </div>
  );
}
