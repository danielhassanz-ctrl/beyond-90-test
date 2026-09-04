import { ensureFinance, netWorth, totalDebt } from "./finance";
import type { DynamicResult, DynamicView } from "./dynamic";
import type { DynamicCard, GameState } from "./types";

type Followup = "family" | "debt" | "business_down" | "business_up" | "fund";

function markKey(kind: Followup): string {
  return `finance_followup_${kind}`;
}

export function financeFollowupCard(s: GameState): DynamicCard | null {
  const f = ensureFinance(s);
  const scene = s.sceneCount ?? 0;
  const last = s.flags["finance_followup_last"] ?? -99;
  if (scene - last < 7) return null;

  let kind: Followup | null = null;
  if (s.flags["familia_ayudada"] === 1 && s.flags[markKey("family")] !== 1 && s.seasonIndex >= 2) {
    kind = "family";
  } else if (totalDebt(s) >= 500 && totalDebt(s) > Math.max(250, f.cash * 1.2) && s.flags[markKey("debt")] !== 1) {
    kind = "debt";
  } else if (
    f.boughtIds.some((id) => id === "negocio_amigo" || id === "restaurante") &&
    !f.properties.some((p) => p.name.includes("Negocio") || p.name.includes("Restaurante")) &&
    s.flags[markKey("business_down")] !== 1
  ) {
    kind = "business_down";
  } else {
    const business = f.properties.find((p) => p.name.includes("Negocio") || p.name.includes("Restaurante"));
    if (business && business.value >= 215 && s.flags[markKey("business_up")] !== 1) kind = "business_up";
    const fund = f.properties.find((p) => p.name.includes("Cartera"));
    if (!kind && fund && fund.value >= 300 && s.flags[markKey("fund")] !== 1) kind = "fund";
  }
  if (!kind) return null;

  s.flags[markKey(kind)] = 1;
  s.flags["finance_followup_last"] = scene;
  return { type: "dynamic", kind: "finance_followup", data: { outcome: kind } };
}

export function renderFinanceFollowup(s: GameState, card: DynamicCard): DynamicView | null {
  if (card.kind !== "finance_followup") return null;
  const outcome = String(card.data["outcome"] ?? "") as Followup;
  if (outcome === "family") return {
    kicker: "Vida · meses después",
    title: "La casa ya no tiene hipoteca",
    image: "family",
    category: "life",
    text: "Vuelves a casa y encuentras la última carta del banco guardada como si fuera un trofeo. Nadie te pide nada. Precisamente por eso entiendes lo que cambió aquella transferencia.",
    choices: [
      { id: "cenar", label: "Quedarte a cenar y apagar el móvil", hint: "Familia primero por una noche" },
      { id: "limites", label: "Crear un fondo familiar con límites claros", hint: "Ayudar sin convertirte en banco" },
      { id: "normal", label: "No darle más importancia", hint: "Fue ayuda, no una deuda emocional" },
    ],
  };
  if (outcome === "debt") return {
    kicker: "Patrimonio · realidad",
    title: "Ganas mucho. Debes demasiado.",
    image: "office",
    category: "life",
    text: `Tu patrimonio neto ronda ${netWorth(s)}.000 €, pero la deuda sigue en ${totalDebt(s)}.000 €. Tu asesor no habla de lujo: habla de qué pasa si encadenas dos malas temporadas.`,
    choices: [
      { id: "amortizar", label: "Amortizar deuda agresivamente", hint: "Menos caja, menos presión" },
      { id: "mantener", label: "Mantener el plan y conservar liquidez", hint: "Aceptas el riesgo" },
      { id: "vender", label: "Vender el activo más caro", hint: "Recortas patrimonio para ganar aire" },
    ],
  };
  if (outcome === "business_down") return {
    kicker: "Patrimonio · consecuencia",
    title: "La persiana está bajada",
    image: "office",
    category: "life",
    text: "El negocio que llevaba tu apellido o el de un amigo ya no existe. El dinero se perdió antes de esta reunión. Lo que decides ahora es si también pierdes relaciones y cabeza.",
    choices: [
      { id: "asumir", label: "Cerrar la etapa y asumir la pérdida", hint: "No persigues dinero muerto" },
      { id: "rescatar", label: "Poner una última cantidad para intentar salvarlo", hint: "Riesgo real" },
      { id: "romper", label: "Romper con los socios y señalar responsables", hint: "Proteges tu versión, quemas puentes" },
    ],
  };
  if (outcome === "business_up") return {
    kicker: "Patrimonio · consecuencia",
    title: "El negocio sí funciona",
    image: "office",
    category: "life",
    text: "Por primera vez una inversión te paga a ti. Hay beneficios, llamadas para crecer y una pregunta menos vistosa: qué hacer antes de pensar que esto siempre será así.",
    choices: [
      { id: "reinvertir", label: "Reinvertir una parte", hint: "Más crecimiento, más exposición" },
      { id: "guardar", label: "Dejar el beneficio en caja", hint: "Liquidez" },
      { id: "familia", label: "Compartir una parte con los tuyos", hint: "Menos caja, más vínculo" },
    ],
  };
  if (outcome === "fund") return {
    kicker: "Patrimonio · largo plazo",
    title: "La decisión aburrida empieza a notarse",
    image: "office",
    category: "life",
    text: "La cartera que casi olvidaste vale bastante más que al principio. Nadie te pide una foto y nadie te felicita. Tu asesor dice que esa es exactamente la gracia.",
    choices: [
      { id: "seguir", label: "No tocarla y seguir igual", hint: "Largo plazo" },
      { id: "retirar", label: "Retirar una parte y disfrutarla", hint: "Liquidez y vida" },
      { id: "diversificar", label: "Repartir el riesgo", hint: "Más control" },
    ],
  };
  return null;
}

export function resolveFinanceFollowup(s: GameState, card: DynamicCard, choiceId: string): DynamicResult | null {
  if (card.kind !== "finance_followup") return null;
  const f = ensureFinance(s);
  const outcome = String(card.data["outcome"] ?? "") as Followup;

  if (outcome === "family") {
    if (choiceId === "cenar") { s.rel.family = Math.min(100, s.rel.family + 7); s.morale = Math.min(100, s.morale + 5); return { title: "Una cena normal", text: "Esa noche vuelves a ser simplemente hijo, hermano, pareja. Al día siguiente el fútbol sigue ahí.", tone: "good" }; }
    if (choiceId === "limites") { f.commitments.push({ name: "Fondo familiar", yearly: 18, seasonsLeft: 4 }); s.rel.family = Math.min(100, s.rel.family + 5); s.discipline = Math.min(100, s.discipline + 3); return { title: "Ayudar con reglas", text: "Fijas una cantidad, un plazo y un límite. La generosidad deja de depender de quién llame primero.", tone: "good" }; }
    return { title: "Sin deuda emocional", text: "No conviertes el gesto en una factura sentimental. En casa lo agradecen más así.", tone: "neutral" };
  }

  if (outcome === "debt") {
    if (choiceId === "amortizar") {
      const target = f.properties.filter((p) => p.debt > 0).sort((a, b) => b.debt - a.debt)[0];
      if (target) { const pay = Math.min(target.debt, f.cash, Math.max(100, Math.round(target.debt * 0.25))); target.debt -= pay; f.cash -= pay; s.discipline = Math.min(100, s.discipline + 5); return { title: "Menos deuda", text: `Amortizas ${pay}.000 €. La cuenta baja, pero también baja el ruido en tu cabeza.`, tone: "good" }; }
    }
    if (choiceId === "vender") {
      const target = [...f.properties].sort((a, b) => b.value - a.value)[0];
      if (target) { const proceeds = Math.max(0, target.value - target.debt); f.cash += proceeds; f.properties = f.properties.filter((p) => p !== target); return { title: "Vendes para respirar", text: `${target.name} sale del patrimonio. Recuperas ${proceeds}.000 € y una preocupación menos.`, tone: "neutral" }; }
    }
    s.morale = Math.max(0, s.morale - 2);
    return { title: "Mantienes el plan", text: "Conservas caja y aceptas el riesgo. Una mala temporada financiera tendrá consecuencias.", tone: "neutral" };
  }

  if (outcome === "business_down") {
    if (choiceId === "rescatar") { const rescue = Math.min(f.cash, Math.max(30, Math.round(f.cash * 0.15))); f.cash -= rescue; s.morale = Math.max(0, s.morale - 4); return { title: "Una última bala", text: `Pones ${rescue}.000 € más. No compras garantías; compras tiempo.`, tone: "neutral" }; }
    if (choiceId === "romper") { s.fame = Math.min(100, s.fame + 3); s.rel.family = Math.max(0, s.rel.family - 3); s.memory.conflicts.unshift("Rompiste públicamente con los socios de un negocio fallido"); return { title: "Puentes quemados", text: "Tu versión sale primero. Proteges el apellido y pierdes gente por el camino.", tone: "bad" }; }
    s.discipline = Math.min(100, s.discipline + 4);
    return { title: "Pérdida asumida", text: "Cierras cuentas y dejas de perseguir dinero muerto. La siguiente decisión será con memoria.", tone: "neutral" };
  }

  if (outcome === "business_up") {
    const gain = Math.max(20, Math.round(netWorth(s) * 0.025));
    if (choiceId === "reinvertir") { const p = f.properties.find((x) => x.name.includes("Negocio") || x.name.includes("Restaurante")); if (p) p.value += gain; f.cash = Math.max(0, f.cash - Math.min(f.cash, gain)); return { title: "Doblas parte de la apuesta", text: "Una parte vuelve al negocio. Si crece, crecerá contigo; si cae, también.", tone: "neutral" }; }
    if (choiceId === "familia") { const gift = Math.min(f.cash, Math.max(15, Math.round(gain * 0.5))); f.cash -= gift; s.rel.family = Math.min(100, s.rel.family + 8); return { title: "Se reparte", text: `Apartas ${gift}.000 € para los tuyos. Esta vez el dinero sí mejora algo fuera del fútbol.`, tone: "good" }; }
    s.discipline = Math.min(100, s.discipline + 2);
    return { title: "Caja primero", text: "No haces nada vistoso. El beneficio se queda líquido y te compra tranquilidad.", tone: "good" };
  }

  if (outcome === "fund") {
    const p = f.properties.find((x) => x.name.includes("Cartera"));
    if (choiceId === "retirar" && p) { const take = Math.min(p.value, Math.max(40, Math.round(p.value * 0.2))); p.value -= take; f.cash += take; s.morale = Math.min(100, s.morale + 3); return { title: "También se vive", text: `Retiras ${take}.000 €. El plan sigue vivo, pero deja de ser una cifra intocable.`, tone: "good" }; }
    if (choiceId === "diversificar" && p) { const move = Math.max(25, Math.round(p.value * 0.25)); p.value -= move; f.properties.push({ name: "Cartera diversificada", value: move, debt: 0 }); s.discipline = Math.min(100, s.discipline + 3); return { title: "Menos concentración", text: "Repartes el riesgo y haces el patrimonio más difícil de romper con una sola mala decisión.", tone: "good" }; }
    s.discipline = Math.min(100, s.discipline + 4);
    return { title: "No tocar", text: "Resistes las ganas de tocar lo que funciona. También eso es una decisión.", tone: "good" };
  }

  return null;
}
