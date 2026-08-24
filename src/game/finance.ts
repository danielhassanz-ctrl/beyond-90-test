/* ============================ PATRIMONIO ============================
 * Economía ligera pero real: caja, salario, primas, patrocinio, propiedades
 * y compromisos. Todas las cifras están en MILES de euros.
 * El dinero ganado y gastado persiste y se muestra en la retirada.
 */
import { clubById } from "./data";
import { note } from "./mutate";
import type { DynamicCard, GameState } from "./types";
import type { DynamicResult, DynamicView } from "./dynamic";

export interface Property {
  name: string;
  value: number;
  debt: number;
}

export interface Commitment {
  name: string;
  yearly: number;
  seasonsLeft: number;
}

export interface FinanceLine {
  season: string;
  text: string;
  amount: number;
}

export interface Finance {
  cash: number;
  annualSalary: number;
  bonuses: number;
  sponsorName: string | null;
  sponsorIncome: number;
  properties: Property[];
  commitments: Commitment[];
  history: FinanceLine[];
  lastOfferScene: number;
  boughtIds: string[];
}

export function emptyFinance(salary = 0): Finance {
  return {
    cash: 0,
    annualSalary: salary,
    bonuses: 0,
    sponsorName: null,
    sponsorIncome: 0,
    properties: [],
    commitments: [],
    history: [],
    lastOfferScene: -99,
    boughtIds: [],
  };
}

export function ensureFinance(s: GameState): Finance {
  const raw = s.finance;
  const f: Finance = raw && typeof raw === "object" ? { ...emptyFinance(s.salary), ...raw } : emptyFinance(s.salary);
  if (!Array.isArray(f.properties)) f.properties = [];
  if (!Array.isArray(f.commitments)) f.commitments = [];
  if (!Array.isArray(f.history)) f.history = [];
  if (!Array.isArray(f.boughtIds)) f.boughtIds = [];
  for (const k of ["cash", "annualSalary", "bonuses", "sponsorIncome", "lastOfferScene"] as const) {
    if (typeof f[k] !== "number" || !Number.isFinite(f[k])) (f[k] as number) = 0;
  }
  f.annualSalary = Math.max(f.annualSalary, s.salary);
  s.finance = f;
  return f;
}

export function netWorth(s: GameState): number {
  const f = ensureFinance(s);
  const equity = f.properties.reduce((a, p) => a + Math.max(0, p.value - p.debt), 0);
  return Math.round(f.cash + equity);
}

export function totalDebt(s: GameState): number {
  const f = ensureFinance(s);
  return Math.round(f.properties.reduce((a, p) => a + Math.max(0, p.debt), 0));
}

/** Cierre económico de la temporada. Devuelve el desglose para el resumen. */
export function seasonFinance(s: GameState): { income: number; spend: number; net: number; text: string } {
  const f = ensureFinance(s);
  const season = s.seasons[s.seasons.length - 1];
  const apps = season?.apps ?? 0;
  const goals = season?.goals ?? 0;

  f.annualSalary = Math.max(0, s.salary);
  const bonuses = Math.round(apps * (2 + s.overall / 40) + goals * 4 + (s.titles?.length ?? 0) * 15);
  f.bonuses = bonuses;

  if (f.sponsorName) f.sponsorIncome = Math.round(20 + s.fame * 1.8 + s.overall * 0.6);
  else f.sponsorIncome = 0;

  const gross = f.annualSalary + bonuses + f.sponsorIncome;
  const taxes = Math.round(gross * 0.42);
  const agentCut = s.agent.present ? Math.round(gross * (s.agent.commission / 100)) : 0;
  const living = Math.round(18 + gross * 0.08 + f.properties.length * 12);
  const commitments = f.commitments.reduce((a, c) => a + (c.seasonsLeft > 0 ? c.yearly : 0), 0);

  // Hipotecas: se amortiza cada temporada lo que se pueda.
  let mortgage = 0;
  for (const p of f.properties) {
    if (p.debt <= 0) continue;
    const pay = Math.min(p.debt, Math.max(20, Math.round(p.value * 0.09)));
    p.debt = Math.max(0, p.debt - pay);
    mortgage += pay;
  }

  const spend = taxes + agentCut + living + commitments + mortgage;
  const net = gross - spend;
  f.cash = Math.max(0, Math.round(f.cash + net));
  for (const c of f.commitments) if (c.seasonsLeft > 0) c.seasonsLeft -= 1;
  f.commitments = f.commitments.filter((c) => c.seasonsLeft > 0);

  const label = season?.season ?? `Temporada ${s.seasonIndex}`;
  const text = `Ingresos ${gross}.000 € · gastos ${spend}.000 € · saldo ${f.cash}.000 €`;
  f.history.unshift({ season: label, text, amount: net });
  f.history = f.history.slice(0, 14);

  // Compatibilidad: wealth es el patrimonio neto estimado.
  s.wealth = netWorth(s);
  return { income: gross, spend, net, text };
}

/* ========================= Decisiones de dinero ========================= */

interface MoneyOffer {
  id: string;
  kicker: string;
  title: string;
  text: (s: GameState) => string;
  price: number;
  /** Requisito mínimo de caja para que la escena aparezca. */
  minCash: number;
  financeable: boolean;
  requires?: (s: GameState) => boolean;
  effect?: (s: GameState, mode: "cash" | "finance") => void;
}

const OFFERS: MoneyOffer[] = [
  {
    id: "piso_alquiler",
    kicker: "Vida",
    title: "¿Seguir en casa de tus padres?",
    text: () => "Un compañero te ofrece compartir piso cerca de la ciudad deportiva. Tu madre no dice nada, pero recoge tu ropa más despacio de lo normal.",
    price: 24,
    minCash: 30,
    financeable: false,
  },
  {
    id: "coche",
    kicker: "Dinero",
    title: "Tu primer coche",
    text: () => "Llevas dos años en autobús a los entrenamientos. En el concesionario te tratan por primera vez de usted.",
    price: 38,
    minCash: 55,
    financeable: true,
  },
  {
    id: "piso_propio",
    kicker: "Patrimonio",
    title: "Primera vivienda",
    text: () => "Un piso decente, sin lujos, a quince minutos del club. Es el primer papel importante que firmas con tu nombre y no con el de tus padres.",
    price: 260,
    minCash: 150,
    financeable: true,
  },
  {
    id: "ayuda_familia",
    kicker: "Casa",
    title: "La hipoteca de tus padres",
    text: () => "Tu padre lleva 22 años pagándola. Podrías cancelarla de golpe y no notarlo demasiado.",
    price: 90,
    minCash: 130,
    financeable: false,
    effect: (s) => {
      s.rel.family = Math.min(100, s.rel.family + 14);
      s.flags["familia_ayudada"] = 1;
    },
  },
  {
    id: "negocio_amigo",
    kicker: "Inversión",
    title: "El negocio de tu amigo de la infancia",
    text: () => "Quiere abrir dos locales y te pide entrar como socio. Te promete que en tres años se ríe todo el barrio de los que dudaron.",
    price: 180,
    minCash: 260,
    financeable: false,
    effect: (s) => {
      s.flags["negocio_amigo"] = 1;
    },
  },
  {
    id: "casa_grande",
    kicker: "Patrimonio",
    title: "Casa con jardín",
    text: (s) => `Tres millones. Piscina, seguridad y quince minutos de la ciudad deportiva del ${clubById(s.clubId).short}. Tu asesor te recomienda financiar la mitad.`,
    price: 3000,
    minCash: 900,
    financeable: true,
    requires: (s) => s.overall >= 74,
  },
  {
    id: "mansion",
    kicker: "Patrimonio",
    title: "La casa de Aravaca",
    text: () => "Seis millones, cuatro plantas y una entrada que sale en revistas. Es la casa de alguien que ya ha llegado. Todavía no sabes si eres ese alguien.",
    price: 6000,
    minCash: 2200,
    financeable: true,
    requires: (s) => s.overall >= 80 && (s.finance?.properties.length ?? 0) >= 1,
  },
];

const SPONSORS = ["Puma", "Adidas", "Nike", "New Balance", "Under Armour"];

/** Elige una escena de dinero si el estado la justifica. Nunca dos seguidas. */
export function moneyCard(s: GameState): DynamicCard | null {
  const f = ensureFinance(s);
  const scene = s.sceneCount ?? 0;
  if (scene - f.lastOfferScene < 7) return null;

  // Patrocinio: cuando hay notoriedad real y aún no hay marca.
  if (!f.sponsorName && s.fame >= 32 && s.stage !== "youth" && Math.random() < 0.5) {
    const brand = SPONSORS[Math.floor(Math.random() * SPONSORS.length)]!;
    f.lastOfferScene = scene;
    return { type: "dynamic", kind: "money", data: { offer: "patrocinio", brand, price: 0 } };
  }

  const candidates = OFFERS.filter(
    (o) => !f.boughtIds.includes(o.id) && f.cash >= o.minCash && (!o.requires || o.requires(s)),
  );
  if (candidates.length === 0) return null;
  if (Math.random() < 0.35) return null;
  const offer = candidates[candidates.length - 1]!;
  f.lastOfferScene = scene;
  return { type: "dynamic", kind: "money", data: { offer: offer.id, price: offer.price } };
}

export function renderMoney(s: GameState, card: DynamicCard): DynamicView | null {
  if (card.kind !== "money") return null;
  const f = ensureFinance(s);
  const id = String(card.data["offer"] ?? "");
  if (id === "patrocinio") {
    const brand = String(card.data["brand"] ?? "Puma");
    return {
      kicker: "Dinero",
      title: `${brand} quiere vestirte`,
      image: "agent",
      category: "market",
      text: `Contrato de material y tres publicaciones al mes. La cifra que te ponen delante supera lo que gana tu familia en varios años. Tu representante ya ha hecho la cuenta de su parte.`,
      choices: [
        { id: "firmar", label: `Firmar con ${brand}`, hint: "Ingresos y exposición" },
        { id: "negociar", label: "Pedir el doble", hint: "Puede caerse" },
        { id: "rechazar", label: "Rechazar por ahora", hint: "Foco en el campo" },
      ],
      freeform: { prompt: "¿Qué condición pones?", placeholder: "Quiero que incluyan a mi barrio…" },
    };
  }
  const offer = OFFERS.find((o) => o.id === id);
  if (!offer) return null;
  const choices: { id: string; label: string; hint?: string }[] = [];
  if (f.cash >= offer.price) choices.push({ id: "cash", label: `Pagarlo al contado (${offer.price}.000 €)`, hint: `Saldo: ${f.cash}.000 €` });
  if (offer.financeable) choices.push({ id: "finance", label: "Financiar la mitad", hint: "Menos caja hoy, deuda a plazos" });
  choices.push({ id: "no", label: "Dejarlo pasar", hint: "Sigues como estás" });
  return {
    kicker: offer.kicker,
    title: offer.title,
    image: id === "ayuda_familia" ? "family" : "office",
    category: "life",
    text: offer.text(s),
    choices,
    freeform: { prompt: "¿Prefieres otra cosa?", placeholder: "Escribe qué haces con ese dinero…" },
  };
}

export function resolveMoney(s: GameState, card: DynamicCard, choiceId: string): DynamicResult | null {
  if (card.kind !== "money") return null;
  const f = ensureFinance(s);
  const id = String(card.data["offer"] ?? "");

  if (id === "patrocinio") {
    const brand = String(card.data["brand"] ?? "Puma");
    if (choiceId === "rechazar") {
      s.flags["patrocinio_rechazado"] = 1;
      return { title: "Sin marca", text: `Dices que no a ${brand}. Tu representante tarda dos días en contestarte al teléfono.`, tone: "neutral" };
    }
    if (choiceId === "negociar" && Math.random() < 0.45) {
      s.agent.trust = Math.max(0, s.agent.trust - 6);
      return { title: "Se cae el acuerdo", text: `${brand} no acepta y se lleva el contrato a otro jugador de tu posición. Lo verás con esas botas el resto del año.`, tone: "bad" };
    }
    const boost = choiceId === "negociar" ? 1.6 : 1;
    f.sponsorName = brand;
    f.sponsorIncome = Math.round((30 + s.fame * 1.8) * boost);
    f.cash += Math.round(f.sponsorIncome * 0.5);
    s.flags["patrocinio"] = 1;
    s.fame = Math.min(100, s.fame + 6);
    note(s, `Firmas con ${brand}.`, "gold");
    return {
      title: `Firmas con ${brand}`,
      text: `Sesión de fotos, caja de botas en el vestuario y ${f.sponsorIncome}.000 € al año. Te sacan una serigrafía con tu nombre y no sabes dónde mirar.`,
      tone: "gold",
      share: {
        headline: `PATROCINIO ${brand.toUpperCase()}`,
        kicker: `${s.player.name} · ${s.age} años`,
        lines: [
          { label: "Marca", value: brand },
          { label: "Anual", value: `${f.sponsorIncome}.000 €` },
          { label: "Media", value: String(s.overall) },
        ],
      },
    };
  }

  const offer = OFFERS.find((o) => o.id === id);
  if (!offer) return null;
  if (choiceId === "no" || choiceId === "free") {
    return { title: "No es el momento", text: "Lo dejas pasar. El dinero sigue donde estaba y tú también.", tone: "neutral" };
  }
  const mode: "cash" | "finance" = choiceId === "finance" ? "finance" : "cash";
  const upfront = mode === "finance" ? Math.round(offer.price / 2) : offer.price;
  if (f.cash < upfront) {
    return { title: "No llegas", text: "Al revisar los números no da. Aprendes que la ficha no es lo que entra en la cuenta.", tone: "bad" };
  }
  f.cash -= upfront;
  f.boughtIds.push(offer.id);
  const debt = mode === "finance" ? offer.price - upfront : 0;

  if (["piso_propio", "casa_grande", "mansion"].includes(offer.id)) {
    f.properties.push({ name: offer.title, value: offer.price, debt });
  } else if (offer.id === "coche") {
    f.commitments.push({ name: "Coche", yearly: mode === "finance" ? Math.round(offer.price / 4) : 6, seasonsLeft: mode === "finance" ? 4 : 2 });
  } else if (offer.id === "piso_alquiler") {
    f.commitments.push({ name: "Alquiler", yearly: 24, seasonsLeft: 3 });
    s.rel.family = Math.max(0, s.rel.family - 6);
    s.rel.dressing = Math.min(100, s.rel.dressing + 6);
  } else if (offer.id === "negocio_amigo") {
    f.properties.push({ name: "Negocio con un amigo", value: Math.round(offer.price * 0.9), debt: 0 });
  }
  offer.effect?.(s, mode);
  s.wealth = netWorth(s);

  const financedText = debt > 0 ? ` Quedan ${debt}.000 € a plazos.` : "";
  return {
    title: offer.title,
    text: `Hecho: ${upfront}.000 € fuera de la cuenta.${financedText} Saldo actual: ${f.cash}.000 €. Patrimonio neto estimado: ${netWorth(s)}.000 €.`,
    tone: "good",
  };
}
