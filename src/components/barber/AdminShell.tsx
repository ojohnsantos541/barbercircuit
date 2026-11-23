import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Calendar, LayoutDashboard, Menu, Scissors, Settings, Users, UserSquare2, Wallet, ExternalLink, X } from "lucide-react";
import { Logo } from "./ui";
import { getShopData } from "@/lib/demo-data";

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
  const { shop } = getShopData();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6"><Logo /></div>
      <div className="mx-4 mb-4 rounded-lg border border-sidebar-border bg-sidebar-accent p-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Barbearia</div>
        <div className="font-display text-lg font-semibold text-sidebar-accent-foreground">{shop.name}</div>
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
        <Link to="/b/$slug" params={{ slug: shop.slug }} onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 px-3 py-2.5 text-sm text-primary hover:bg-primary/10">
          <ExternalLink className="h-4 w-4" /> Página de agendamento
        </Link>
      </div>
    </div>
  );
}

export function AdminShell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block"><Nav /></aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border bg-sidebar animate-in slide-in-from-left">
            <button aria-label="Fechar menu" className="absolute right-3 top-6 p-2 text-muted-foreground" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            <Nav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur lg:hidden">
          <button aria-label="Abrir menu" onClick={() => setOpen(true)} className="p-1"><Menu className="h-5 w-5" /></button>
          <Logo />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
