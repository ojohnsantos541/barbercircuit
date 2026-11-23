// DADOS DEMONSTRATIVOS — nenhum dado aqui é real.
// Toda entidade carrega `shopId` para isolar dados por barbearia (multi-tenant).
// No futuro, este módulo será substituído por consultas ao backend filtradas por shopId.

export type Shop = {
  id: string; slug: string; name: string; tagline: string; address: string; phone: string;
  logoInitials: string; hours: { day: string; open: string; close: string; closed?: boolean }[];
};
export type Service = { id: string; shopId: string; name: string; description: string; price: number; duration: number };
export type Barber = { id: string; shopId: string; name: string; specialty: string; initials: string; days: string[]; start: string; end: string };
export type Client = { id: string; shopId: string; name: string; phone: string; since: string };
export type AppointmentStatus = "confirmado" | "concluido" | "cancelado";
export type Appointment = { id: string; shopId: string; clientId: string; barberId: string; serviceId: string; date: string; time: string; status: AppointmentStatus };
export type Expense = { id: string; shopId: string; description: string; category: string; amount: number; date: string };

export const shops: Shop[] = [
  {
    id: "shop-1", slug: "navalha-de-ouro", name: "Navalha de Ouro", tagline: "Tradição e estilo desde 2012 (exemplo)",
    address: "Rua Augusta, 1200 — São Paulo, SP", phone: "(11) 98888-0000", logoInitials: "NO",
    hours: [
      { day: "Segunda", open: "09:00", close: "19:00" }, { day: "Terça", open: "09:00", close: "19:00" },
      { day: "Quarta", open: "09:00", close: "19:00" }, { day: "Quinta", open: "09:00", close: "20:00" },
      { day: "Sexta", open: "09:00", close: "20:00" }, { day: "Sábado", open: "08:00", close: "17:00" },
      { day: "Domingo", open: "", close: "", closed: true },
    ],
  },
];

const S = "shop-1";
export const services: Service[] = [
  { id: "sv1", shopId: S, name: "Corte Clássico", description: "Corte na tesoura e máquina com acabamento na navalha.", price: 60, duration: 40 },
  { id: "sv2", shopId: S, name: "Barba Completa", description: "Toalha quente, modelagem e hidratação.", price: 45, duration: 30 },
  { id: "sv3", shopId: S, name: "Corte + Barba", description: "O combo completo para sair impecável.", price: 95, duration: 70 },
  { id: "sv4", shopId: S, name: "Degradê Navalhado", description: "Fade preciso com acabamento perfeito.", price: 70, duration: 45 },
  { id: "sv5", shopId: S, name: "Pigmentação", description: "Correção de falhas na barba ou cabelo.", price: 50, duration: 30 },
  { id: "sv6", shopId: S, name: "Sobrancelha", description: "Limpeza e alinhamento na navalha.", price: 25, duration: 15 },
];

export const barbers: Barber[] = [
  { id: "b1", shopId: S, name: "Rafael Moura", specialty: "Cortes clássicos", initials: "RM", days: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], start: "09:00", end: "18:00" },
  { id: "b2", shopId: S, name: "Diego Alves", specialty: "Degradê e freestyle", initials: "DA", days: ["Ter", "Qua", "Qui", "Sex", "Sáb"], start: "10:00", end: "20:00" },
  { id: "b3", shopId: S, name: "Lucas Ferreira", specialty: "Barboterapia", initials: "LF", days: ["Seg", "Qua", "Sex", "Sáb"], start: "09:00", end: "17:00" },
];

const names = ["João Pereira", "Carlos Souza", "Marcos Lima", "Pedro Henrique", "Bruno Costa", "Felipe Rocha", "André Martins", "Gustavo Dias", "Thiago Ribeiro", "Rodrigo Nunes", "Eduardo Barros", "Vinícius Melo", "Leonardo Teixeira", "Mateus Cardoso", "Gabriel Araújo", "Ricardo Gomes", "Fernando Pinto", "Daniel Castro"];
export const clients: Client[] = names.map((name, i) => ({
  id: `c${i + 1}`, shopId: S, name,
  phone: `(11) 9${String(7000 + i * 137).padStart(4, "0")}-${String(1000 + i * 311).slice(0, 4)}`,
  since: `20${22 + (i % 4)}-0${(i % 9) + 1}-1${i % 9}`,
}));

// gerador determinístico para os exemplos
function rng(seed: number) { return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
export function toISO(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
export const todayISO = () => toISO(new Date());

function buildAppointments(): Appointment[] {
  const r = rng(42); const out: Appointment[] = []; const now = new Date();
  const slots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  for (let off = -75; off <= 21; off++) {
    const d = new Date(now); d.setDate(now.getDate() + off);
    if (d.getDay() === 0) continue;
    const iso = toISO(d);
    for (const b of barbers) for (const t of slots) {
      if (r() > 0.55) continue;
      const status: AppointmentStatus = off < 0 ? (r() < 0.08 ? "cancelado" : "concluido") : off === 0 && t < `${String(now.getHours()).padStart(2, "0")}:00` ? "concluido" : "confirmado";
      out.push({ id: `a${out.length}`, shopId: S, clientId: clients[Math.floor(r() * clients.length)]!.id, barberId: b.id, serviceId: services[Math.floor(r() * services.length)]!.id, date: iso, time: t, status });
    }
  }
  return out;
}
export const appointments = buildAppointments();

export const expenses: Expense[] = (() => {
  const now = new Date(); const out: Expense[] = [];
  for (let m = 0; m < 3; m++) {
    const base = new Date(now.getFullYear(), now.getMonth() - m, 5);
    [["Aluguel do salão", "Fixo", 3500], ["Energia elétrica", "Fixo", 480], ["Produtos (pomadas, lâminas)", "Insumos", 920], ["Marketing digital", "Marketing", 350], ["Internet e telefone", "Fixo", 180]]
      .forEach(([d, c, a], i) => out.push({ id: `e${m}-${i}`, shopId: S, description: d as string, category: c as string, amount: (a as number) + m * 15, date: toISO(new Date(base.getFullYear(), base.getMonth(), 5 + i * 4)) }));
  }
  return out;
})();

// Ponto único de acesso: no futuro virá da sessão do dono logado.
export const CURRENT_SHOP_ID = "shop-1";
export function getShopData(shopId: string = CURRENT_SHOP_ID) {
  const shop = shops.find((s) => s.id === shopId)!;
  const by = <T extends { shopId: string }>(l: T[]) => l.filter((x) => x.shopId === shopId);
  return { shop, services: by(services), barbers: by(barbers), clients: by(clients), appointments: by(appointments), expenses: by(expenses) };
}
export const getShopBySlug = (slug: string) => shops.find((s) => s.slug === slug);

export function revenueOf(list: Appointment[]) {
  return list.filter((a) => a.status === "concluido").reduce((s, a) => s + (services.find((x) => x.id === a.serviceId)?.price ?? 0), 0);
}
