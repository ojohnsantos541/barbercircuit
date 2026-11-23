import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Scissors, Wallet, Globe, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/barber/ui";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Gestão premium para barbearias — BarberPro" }, { name: "description", content: "Agenda, clientes, barbeiros, financeiro e agendamento online para sua barbearia em um só lugar." }, { property: "og:title", content: "Gestão premium para barbearias — BarberPro" }, { property: "og:description", content: "Agenda, clientes, barbeiros, financeiro e agendamento online para sua barbearia em um só lugar." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Home,
});

const features = [
  { icon: Calendar, t: "Agenda inteligente", d: "Visão diária, semanal e mensal de todos os barbeiros." },
  { icon: Globe, t: "Agendamento online", d: "Página exclusiva com a identidade da sua barbearia." },
  { icon: Users, t: "Clientes fiéis", d: "Cadastro completo e histórico de cada atendimento." },
  { icon: Wallet, t: "Financeiro claro", d: "Receitas, despesas e lucro do mês em segundos." },
  { icon: Scissors, t: "Serviços e equipe", d: "Preços, durações e horários de cada profissional." },
  { icon: BarChart3, t: "Relatórios", d: "Descubra o que mais vende e quem mais fatura." },
];

function Home() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <Button asChild variant="ghost"><Link to="/painel">Entrar</Link></Button>
      </header>
      <section className="mx-auto max-w-4xl px-5 pb-20 pt-12 text-center md:pt-24">
        <p className="mb-5 text-xs uppercase tracking-[0.3em] text-primary">Software para barbearias</p>
        <h1 className="text-5xl font-semibold leading-[1.05] md:text-7xl">A sua barbearia,<br /><span className="text-gold">no próximo nível.</span></h1>
        <p className="mx-auto mt-6 max-w-xl text-muted-foreground md:text-lg">Agenda, clientes, equipe, financeiro e agendamento online em uma plataforma elegante feita para donos de barbearia.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="gold" size="lg"><Link to="/painel">Ver painel demonstrativo</Link></Button>
          <Button asChild variant="outline" size="lg"><Link to="/b/$slug" params={{ slug: "navalha-de-ouro" }}>Ver página de agendamento</Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, t, d }) => (
          <div key={t} className="panel p-6">
            <Icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-2xl font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} BarberPro. Versão demonstrativa.</footer>
    </div>
  );
}
