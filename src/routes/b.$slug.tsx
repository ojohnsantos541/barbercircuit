import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Clock3, MapPin, Phone, Scissors, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/b/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Agendamento — ${params.slug} | BarberCircuit` },
      { name: "description", content: "Conheça os serviços e agende seu horário nesta barbearia." },
      { property: "og:title", content: "BarberCircuit — Agendamento online" },
      { property: "og:description", content: "Escolha o serviço, profissional e horário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicBarbershop,
});

type BookingResult = {
  appointment_id: string;
  starts_at: string;
  ends_at: string;
  barber_name: string;
  service_name: string;
  price: number;
};

function saoPauloDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}

function formatBookingDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function PublicBarbershop() {
  const { slug } = Route.useParams();
  const today = saoPauloDate();
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, isPending, error } = useQuery({
    queryKey: ["public-barbershop", slug],
    queryFn: async () => {
      const { data: shopRows, error: shopError } = await supabase.rpc("get_public_barbershop_by_slug", { _slug: slug });
      if (shopError) throw shopError;
      const shop = shopRows?.[0] ?? null;
      if (!shop) return null;

      const [services, barbers] = await Promise.all([
        supabase.from("services").select("id,name,description,price,duration_minutes").eq("barbershop_id", shop.id).eq("active", true).order("name"),
        supabase.from("barbers").select("id,name,specialty").eq("barbershop_id", shop.id).eq("active", true).order("name"),
      ]);
      if (services.error || barbers.error) throw new Error("Não foi possível carregar os dados públicos desta barbearia.");
      return { shop, services: services.data ?? [], barbers: barbers.data ?? [] };
    },
  });

  const slotsQuery = useQuery({
    queryKey: ["public-booking-slots", slug, barberId, serviceId, date],
    enabled: Boolean(barberId && serviceId && date),
    queryFn: async () => {
      const { data: slots, error: slotsError } = await supabase.rpc("get_public_booking_slots", {
        _slug: slug,
        _barber_id: barberId,
        _service_id: serviceId,
        _date: date,
      });
      if (slotsError) throw slotsError;
      return slots ?? [];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError("");
    setSubmitting(true);
    try {
      const { data: result, error: createError } = await supabase.rpc("create_public_booking", {
        _slug: slug,
        _barber_id: barberId,
        _service_id: serviceId,
        _date: date,
        _time: time,
        _customer_name: customerName.trim(),
        _customer_phone: customerPhone,
      });
      if (createError) throw createError;
      const confirmed = result?.[0] as BookingResult | undefined;
      if (!confirmed) throw new Error("Não foi possível confirmar o agendamento. Escolha outro horário.");
      setBooking(confirmed);
      setTime("");
      await slotsQuery.refetch();
    } catch (cause) {
      setBookingError(cause instanceof Error ? cause.message : "Não foi possível concluir o agendamento. Tente novamente.");
      await slotsQuery.refetch();
    } finally {
      setSubmitting(false);
    }
  }

  if (isPending) return <main className="grid min-h-screen place-items-center p-6 text-muted-foreground">Carregando barbearia...</main>;
  if (error) return <main className="grid min-h-screen place-items-center p-6"><div role="alert" className="panel max-w-lg p-8 text-center text-destructive">{error instanceof Error ? error.message : "Não foi possível carregar esta página."}</div></main>;
  if (!data) return <main className="grid min-h-screen place-items-center p-6"><div className="panel max-w-lg p-8 text-center"><h1 className="text-2xl font-semibold">Barbearia não encontrada</h1><p className="mt-2 text-sm text-muted-foreground">Confira se o link está correto.</p></div></main>;

  const { shop, services, barbers } = data;
  const selectedService = services.find((service) => service.id === serviceId);
  const selectedBarber = barbers.find((barber) => barber.id === barberId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-5 py-10 md:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">BarberCircuit</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{shop.name}</h1>
          {shop.address && <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{shop.address}</p>}
          {shop.phone && <a href={`tel:${shop.phone.replace(/[^+0-9]/g, "")}`} className="mt-2 inline-flex items-center gap-2 text-sm text-primary"><Phone className="h-4 w-4" />{shop.phone}</a>}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-5 py-8">
        <section className="panel p-5 md:p-7">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Reserve seu horário</p>
            <h2 className="mt-2 text-2xl font-semibold">Agendamento online</h2>
            <p className="mt-2 text-sm text-muted-foreground">Escolha o serviço, profissional e horário. A reserva é confirmada diretamente na agenda da barbearia.</p>
          </div>

          {booking ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5" role="status">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-7 w-7 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Agendamento confirmado!</h3>
                  <p className="text-sm text-muted-foreground">Seu horário já foi registrado na agenda.</p>
                </div>
              </div>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Serviço</dt><dd className="font-medium">{booking.service_name}</dd></div>
                <div><dt className="text-muted-foreground">Profissional</dt><dd className="font-medium">{booking.barber_name}</dd></div>
                <div><dt className="text-muted-foreground">Data e horário</dt><dd className="font-medium">{formatBookingDate(booking.starts_at)}</dd></div>
                <div><dt className="text-muted-foreground">Valor</dt><dd className="font-medium">{brl(Number(booking.price))}</dd></div>
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">Código da reserva: {booking.appointment_id.slice(0, 8).toUpperCase()}</p>
              <Button className="mt-5" onClick={() => { setBooking(null); setTime(""); setCustomerName(""); setCustomerPhone(""); }}>Fazer outro agendamento</Button>
            </div>
          ) : services.length === 0 || barbers.length === 0 ? (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">Esta barbearia ainda não possui serviços ou profissionais ativos para agendamento.</div>
          ) : (
            <form className="space-y-5" onSubmit={handleBooking}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm font-medium">
                  Serviço
                  <select required value={serviceId} onChange={(event) => { setServiceId(event.target.value); setTime(""); }} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Selecione um serviço</option>
                    {services.map((service) => <option key={service.id} value={service.id}>{service.name} · {brl(Number(service.price))} · {service.duration_minutes} min</option>)}
                  </select>
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  Profissional
                  <select required value={barberId} onChange={(event) => { setBarberId(event.target.value); setTime(""); }} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Selecione um profissional</option>
                    {barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}
                  </select>
                </label>
              </div>

              <label className="block max-w-xs space-y-2 text-sm font-medium">
                Data
                <Input type="date" required min={today} max={addDays(today, 60)} value={date} onChange={(event) => { setDate(event.target.value); setTime(""); }} />
                <span className="block text-xs font-normal text-muted-foreground">Disponibilidade para os próximos 60 dias.</span>
              </label>

              {serviceId && barberId && date && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4 text-primary" />Horários disponíveis</div>
                  {slotsQuery.isFetching ? <p className="text-sm text-muted-foreground">Consultando a agenda...</p>
                    : slotsQuery.error ? <p role="alert" className="text-sm text-destructive">Não foi possível consultar os horários. Atualize a página e tente novamente.</p>
                    : slotsQuery.data?.length ? (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {slotsQuery.data.map((slot) => (
                          <button key={slot.slot_time} type="button" onClick={() => setTime(slot.slot_time)} aria-pressed={time === slot.slot_time} className={`rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${time === slot.slot_time ? "border-primary bg-primary text-primary-foreground" : "border-input hover:border-primary hover:bg-primary/5"}`}>
                            {slot.slot_time}
                          </button>
                        ))}
                      </div>
                    ) : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Não há horários livres nesta data. Escolha outro dia ou fale com a barbearia.</p>}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm font-medium">
                  Seu nome
                  <Input required minLength={2} maxLength={100} autoComplete="name" placeholder="Nome completo" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  WhatsApp / telefone
                  <Input required type="tel" minLength={10} maxLength={20} autoComplete="tel" placeholder="(11) 99999-9999" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
                </label>
              </div>

              {bookingError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{bookingError}</p>}
              <div className="rounded-lg bg-muted/40 p-4 text-sm">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Serviço</span><span className="text-right font-medium">{selectedService?.name ?? "Não selecionado"}</span></div>
                <div className="mt-2 flex justify-between gap-3"><span className="text-muted-foreground">Profissional</span><span className="text-right font-medium">{selectedBarber?.name ?? "Não selecionado"}</span></div>
                <div className="mt-2 flex justify-between gap-3"><span className="text-muted-foreground">Horário</span><span className="text-right font-medium">{date && time ? `${date.split("-").reverse().join("/")} às ${time}` : "Não selecionado"}</span></div>
                <div className="mt-3 flex justify-between border-t pt-3"><span className="font-semibold">Total</span><span className="font-display text-lg font-semibold text-primary">{selectedService ? brl(Number(selectedService.price)) : "—"}</span></div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !serviceId || !barberId || !date || !time || !customerName.trim() || customerPhone.replace(/\D/g, "").length < 10 || slotsQuery.isFetching}>
                {submitting ? "Confirmando..." : "Confirmar agendamento"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">Ao confirmar, seu nome e telefone serão registrados para a gestão deste agendamento.</p>
            </form>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2"><Scissors className="h-5 w-5 text-primary" /><h2 className="text-2xl font-semibold">Serviços</h2></div>
          {services.length === 0 ? <div className="panel p-6 text-sm text-muted-foreground">Nenhum serviço ativo cadastrado.</div> : <div className="grid gap-3 sm:grid-cols-2">{services.map((service) => <article key={service.id} className="panel p-5"><h3 className="font-semibold">{service.name}</h3>{service.description && <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>}<div className="mt-4 flex items-center justify-between"><span className="text-xs text-muted-foreground">{service.duration_minutes} minutos</span><span className="font-display text-xl text-gold">{brl(Number(service.price))}</span></div></article>)}</div>}
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h2 className="text-2xl font-semibold">Profissionais</h2></div>
          {barbers.length === 0 ? <div className="panel p-6 text-sm text-muted-foreground">Nenhum profissional ativo cadastrado.</div> : <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">{barbers.map((barber) => <article key={barber.id} className="panel p-5"><h3 className="font-semibold">{barber.name}</h3><p className="mt-1 text-sm text-muted-foreground">{barber.specialty || "Profissional"}</p></article>)}</div>}
        </section>
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">Página oficial de {shop.name} · BarberCircuit</footer>
    </div>
  );
}
