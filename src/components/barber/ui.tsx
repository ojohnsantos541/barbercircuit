import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function DemoBadge() {
  return <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">Dados de exemplo</span>;
}

export function PageHeader({ title, subtitle, action, demo = true }: { title: string; subtitle?: string; action?: ReactNode; demo?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {demo && <div className="mb-1"><DemoBadge /></div>}
        <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: LucideIcon }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ title, children, action, className = "" }: { title?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={`panel p-5 ${className}`}>
      {title && <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`grid place-items-center rounded-lg bg-gold font-display font-bold text-primary-foreground ${size === "lg" ? "h-11 w-11 text-xl" : "h-9 w-9 text-lg"}`}>B</span>
      <span className={`font-display font-semibold ${size === "lg" ? "text-2xl" : "text-xl"}`}>Barber<span className="text-gold">Pro</span></span>
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const cls = status === "concluido" ? "bg-success/15 text-success" : status === "cancelado" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary";
  const label = status === "concluido" ? "Concluído" : status === "cancelado" ? "Cancelado" : "Confirmado";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}
