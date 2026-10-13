/**
 * PEDIR AL CLUB. Hasta ahora el jugador solo reaccionaba a lo que le llegaba. Estos son los movimientos que puede hacer él, en
 * cualquier momento (con un enfriamiento para no abusar): quiere salir, pide una cesión, una renovación, una subida de sueldo,
 * más minutos o el brazalete. El club evalúa con lo que de verdad hay (tu rol, tu relación con el míster, tu contrato, tu nivel,
 * tu edad) y contesta; a veces dice que sí, a veces que no y a veces que ahora no. Todo en código, sin llamadas a la IA.
 *
 * Quedarte fuera de las convocatorias por pedir la salida es un caso excepcional (~1 de cada 4, más si te llevas mal con el
 * míster), no la norma.
 */
import type { Consequences } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { computeRole } from "@/lib/narrative/role";
import { getNpcName } from "@/lib/narrative/npcs";
import { getClubLevel } from "@/lib/calendar/match-calendar";
import { contractUntil, contractFlags, renewalDeal, playerAnnualGross, turnsSinceContractSigned, eur, eurFee } from "@/lib/narrative/transfer-terms";
import { pickInterestedClub, pickLoanClub } from "@/lib/narrative/market-window";
import { getTorneoProgress } from "@/lib/narrative/torneo";

export type ClubRequestKind = "transferible" | "cesion" | "renovacion" | "sueldo" | "minutos" | "brazalete";

export const CLUB_REQUEST_KINDS: ClubRequestKind[] = ["transferible", "cesion", "renovacion", "sueldo", "minutos", "brazalete"];

export const CLUB_REQUEST_INFO: Record<ClubRequestKind, { label: string; icon: string; hint: string }> = {
  transferible: { label: "Quiero salir (transferible)", icon: "🚪", hint: "Pedir que te pongan en el mercado" },
  cesion: { label: "Pedir una cesión", icon: "🔁", hint: "Salir cedido para jugar más" },
  renovacion: { label: "Pedir la renovación", icon: "✍️", hint: "Hablar de un contrato nuevo" },
  sueldo: { label: "Pedir una mejora salarial", icon: "💶", hint: "Sin cambiar de contrato" },
  minutos: { label: "Hablar con el míster", icon: "🗣️", hint: "Pedir más minutos" },
  brazalete: { label: "Pedir el brazalete", icon: "🎖️", hint: "Optar a capitán" },
};

/** Turnos que tienen que pasar antes de repetir cada petición. */
const COOLDOWN: Record<ClubRequestKind, number> = { transferible: 12, cesion: 12, renovacion: 15, sueldo: 15, minutos: 8, brazalete: 25 };

const askKey = (kind: ClubRequestKind) => `ask_${kind}`;
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round1k = (n: number) => Math.round(n / 1000) * 1000;
const NEED = { grande: 64, europeo: 58, modesto: 50 } as const;

export interface ClubRequestResult {
  ok: boolean;
  title: string;
  description: string;
  label: string;
  outcomeText: string;
  consequences: Consequences;
}

/** ¿Se puede pedir esto ahora? Si no, por qué (se enseña en el botón). */
export function requestStatus(player: Player, kind: ClubRequestKind): { available: boolean; reason?: string } {
  if (player.status !== "active" || !player.club || player.club === NO_CLUB_YET || player.club.startsWith("SELECCIÓN:")) {
    return { available: false, reason: "Primero necesitas un club." };
  }
  if (getTorneoProgress(player)) return { available: false, reason: "Ahora estás con la selección: el club espera." };
  const last = num(player.flags?.[askKey(kind)]);
  if (last > 0 && player.week - last < COOLDOWN[kind]) {
    const left = COOLDOWN[kind] - (player.week - last);
    return { available: false, reason: `Ya lo hablaste hace poco: espera ${left} ${left === 1 ? "turno" : "turnos"}.` };
  }
  const loan = Boolean(player.flags?.loan_active) && !player.flags?.loan_returned;
  const role = computeRole(player).role;
  const since = num(player.flags?.club_since);
  switch (kind) {
    case "transferible":
      if (loan) return { available: false, reason: "Estás cedido: tu club de origen decide." };
      if (num(player.flags?.listed_until) > player.week) return { available: false, reason: "Ya estás en el mercado." };
      if (since > 0 && player.week - since < 6) return { available: false, reason: "Acabas de llegar: da algo de tiempo." };
      break;
    case "cesion":
      if (loan) return { available: false, reason: "Ya estás cedido." };
      if (num(player.flags?.listed_until) > player.week) return { available: false, reason: "Ya hay una salida en marcha." };
      break;
    case "renovacion":
      if (turnsSinceContractSigned(player) < 10) return { available: false, reason: "Acabas de firmar: no tiene sentido renegociar ahora." };
      if (loan) return { available: false, reason: "Estás cedido: no es tu club." };
      break;
    case "sueldo":
      if (turnsSinceContractSigned(player) < 8) return { available: false, reason: "Acabas de firmar: no tiene sentido pedir más." };
      if (loan) return { available: false, reason: "Estás cedido: no es tu club." };
      break;
    case "minutos":
      if (role === "titular") return { available: false, reason: "Ya eres titular." };
      break;
    case "brazalete":
      if (player.flags?.capitan_club) return { available: false, reason: "Ya eres el capitán." };
      if (since > 0 && player.week - since < 20) return { available: false, reason: "Llevas poco en el club para optar al brazalete." };
      break;
  }
  return { available: true };
}

/** Quién habla en cada club (el nombre sale del reparto fijo del jugador, igual que en el resto del juego). */
function cast(player: Player) {
  const agent = player.agent_name && !/^(Tu |Sin |sin )/.test(player.agent_name) ? player.agent_name : "tu representante";
  return {
    coach: getNpcName(player, "entrenador"),
    president: getNpcName(player, "presidente"),
    director: getNpcName(player, "director_deportivo"),
    agent,
  };
}

const pickOne = <T,>(list: readonly T[], rng: () => number): T => list[Math.floor(rng() * list.length)];

export function resolveClubRequest(player: Player, kind: ClubRequestKind, rng: () => number = Math.random): ClubRequestResult {
  const stamp = { [askKey(kind)]: String(player.week) };
  const { coach, president, director, agent } = cast(player);
  const club = player.club;
  const role = computeRole(player).role;
  const relEnt = player.rel_entrenador ?? 50;
  const relVes = player.rel_vestuario ?? 50;
  const media = player.media ?? 50;
  const fama = player.fama ?? 50;
  const forma = player.forma ?? 60;
  const age = playerAge(player.week);
  const level = getClubLevel(club);
  const need = NEED[level];
  const ctrLeft = contractUntil(player) - player.week;
  const roll = rng();

  if (kind === "transferible") {
    const roleAdj = role === "apartado" ? 0.4 : role === "suplente" ? 0.3 : role === "rotacion" ? 0.12 : -0.2;
    const p = clamp(0.35 + (ctrLeft <= 10 ? 0.3 : ctrLeft <= 20 ? 0.1 : 0) + roleAdj + (relEnt < 40 ? 0.12 : 0) + (age >= 31 ? 0.15 : 0) - (media >= 88 ? 0.15 : 0), 0.08, 0.92);
    const base = {
      title: `Pides salir del ${club}`,
      label: "Pedir ser transferible",
      description: `Pides una reunión con ${director}, el director deportivo, y con ${agent} a tu lado le dices sin rodeos que quieres salir. Se hace un silencio largo en el despacho. ${president} lo sabrá antes de que acabe el día.`,
    };
    if (roll < p) {
      const interest = pickInterestedClub(player);
      const benched = rng() < (relEnt < 40 ? 0.4 : 0.22);
      const flags: Record<string, string> = {
        ...stamp,
        transfer_listed: String(player.week),
        // Con la salida pactada, las ofertas pueden llegar aunque hayas fichado hace poco.
        listed_until: String(player.week + 25),
        transfer_interest: interest,
        transfer_interest_week: String(player.week - 1),
        transfer_interest_source: "listado",
        ...(benched ? { coach_bench: "3" } : {}),
      };
      const text = pickOne(
        [
          `${director} asiente despacio: «Lo hemos hablado. Si llega una oferta razonable, no te vamos a poner problemas». Quedas en el mercado y ${agent} ya está llamando.`,
          `«No es lo que queríamos, pero no retenemos a nadie a la fuerza», dice ${director}. Te ponen en la lista de transferibles. Esa misma tarde suena tu nombre en la prensa.`,
          `${director} te mira un rato y cierra la carpeta: «Vale. Mira lo que hay en el mercado, que nosotros también». Sales con la sensación de haber abierto una puerta que ya no se cierra.`,
        ],
        rng,
      );
      const bench = benched
        ? ` ${coach} no se lo toma bien: te quita de las convocatorias unas semanas «para no mezclar cosas», dice. Es su forma de decirte que ya estás con un pie fuera.`
        : "";
      return {
        ok: true,
        ...base,
        outcomeText: `${text}${bench}`,
        consequences: { rel_entrenador: -4, rel_aficion: -3, moral: benched ? -2 : 2, flags },
      };
    }
    if (roll < p + 0.28) {
      return {
        ok: false,
        ...base,
        outcomeText: `${director} no dice que no, pero tampoco que sí: «Ahora no es el momento. Hablamos cuando se abra la ventana y veamos qué hay». Te vas con la promesa de volver a sentarte y con ganas de que sea pronto.`,
        consequences: { moral: -1, flags: stamp },
      };
    }
    return {
      ok: false,
      ...base,
      outcomeText: `${president} lo corta en seco: «Eres importante para este proyecto y no te vamos a vender». ${coach} te dedica un gesto seco en el siguiente entrenamiento. Te quedas, y con la sensación de que alguien ha tomado nota de tu petición.`,
      consequences: { rel_entrenador: -3, moral: -3, flags: stamp },
    };
  }

  if (kind === "cesion") {
    const p = clamp((role === "apartado" || role === "suplente" ? 0.8 : role === "rotacion" ? 0.55 : 0.12) + (age <= 24 ? 0.1 : 0) - (age >= 29 ? 0.4 : 0), 0.05, 0.9);
    const base = {
      title: "Pides salir cedido",
      label: "Pedir una cesión",
      description: `Le dices a ${coach} que necesitas jugar y le pides una cesión a un club donde puedas tener minutos. Él te escucha con los brazos cruzados y te remite a ${director}.`,
    };
    if (roll < p) {
      const loanClub = pickLoanClub(player);
      return {
        ok: true,
        ...base,
        outcomeText: `${director} lo ve razonable: «Te hace falta jugar y a nosotros nos viene bien que crezcas. Veremos quién te quiere». En unas semanas tendrás noticias de ${loanClub}.`,
        consequences: {
          moral: 2,
          rel_entrenador: 1,
          flags: { ...stamp, listed_until: String(player.week + 25), transfer_interest: loanClub, transfer_interest_week: String(player.week - 1), transfer_interest_source: "cesion" },
        },
      };
    }
    return {
      ok: false,
      ...base,
      outcomeText: role === "titular" || role === "rotacion" ? `${coach} lo tiene claro: «Cuento contigo. No te voy a dejar ir». Es un cumplido, aunque no era la respuesta que buscabas.` : `${director} niega con la cabeza: «Ahora mismo no hay un club que te dé lo que necesitas y nos interese a nosotros. Sigue trabajando».`,
      consequences: { moral: -1, rel_entrenador: role === "titular" ? 1 : -1, flags: stamp },
    };
  }

  if (kind === "renovacion") {
    const base = { title: "Pides renovar", label: "Pedir la renovación" };
    if (ctrLeft > 30) {
      return {
        ok: false,
        ...base,
        description: `Pides una reunión con ${president} para hablar de tu futuro. Aún te quedan ${Math.round(ctrLeft / 10)} temporadas de contrato.`,
        outcomeText: `${president} sonríe: «Estamos encantados contigo y tranquilos: tienes contrato de sobra. Hablamos cuando toque». No hay mala cara, pero tampoco cifras.`,
        consequences: { flags: stamp },
      };
    }
    const roleAdj = role === "titular" ? 0.15 : role === "rotacion" ? 0 : -0.25;
    const p = clamp(0.45 + (media >= need ? 0.1 : 0) + (relEnt - 50) / 150 + (fama - 50) / 300 + roleAdj, 0.1, 0.9);
    const description = `Pides una reunión con ${president} y ${director} para hablar de tu renovación. ${agent} ha preparado las cifras y tú, el discurso.`;
    if (roll < p) {
      const deal = renewalDeal(player, 1);
      const negotiated = roll > p * 0.6;
      const salary = negotiated ? round1k(deal.salary * 0.93) : deal.salary;
      const clause = negotiated ? Math.round(deal.clauseM * 0.9) : deal.clauseM;
      return {
        ok: true,
        ...base,
        description,
        outcomeText: `${negotiated ? "Tras una hora de tira y afloja, " : ""}${president} firma contigo: ${eur(salary)} brutos al año durante ${deal.years} años, una prima de ${eur(deal.bonus)} y una cláusula de ${eurFee(clause)}. ${agent} sale del despacho con esa sonrisa que da miedo.`,
        consequences: { patrimonio: deal.bonus, moral: 5, rel_entrenador: 2, fama: 1, flags: { ...stamp, ...contractFlags(player, salary, club, deal.years, clause), ctr_enfriado: "" } },
      };
    }
    return {
      ok: false,
      ...base,
      description,
      outcomeText: `${president} no se mueve: «Ahora mismo no podemos mejorar lo que ya tienes. Volvemos a hablar más adelante». ${agent} se lleva las cifras de vuelta y tú, la sensación de haber llegado un poco pronto.`,
      consequences: { moral: -2, rel_representante: -1, flags: stamp },
    };
  }

  if (kind === "sueldo") {
    const base = { title: "Pides una mejora salarial", label: "Pedir una mejora salarial" };
    const description = `Sin hablar de renovar, le dices a ${director} que tu sueldo se ha quedado corto para lo que rindes. ${agent} aporta una lista de comparaciones con otros jugadores.`;
    const p = clamp(0.4 + (fama - 50) / 250 + (relEnt - 50) / 250 + (role === "titular" ? 0.1 : role === "rotacion" ? 0 : -0.2), 0.1, 0.8);
    if (roll < p) {
      const current = playerAnnualGross(player);
      const annual = round1k(current * (1.1 + rng() * 0.06));
      const f = contractFlags(player, annual, club, 1);
      const raise = {
        salary_fixed: f.salary_fixed,
        salary_mult: f.salary_mult,
        salary_fix_v: f.salary_fix_v,
        salary_club: f.salary_club,
      };
      return {
        ok: true,
        ...base,
        description,
        outcomeText: `${director} lo piensa un par de días y vuelve con una oferta: ${eur(annual)} brutos al año (+${eur(annual - current)}), sin tocar la duración del contrato. «Para que veas que cuidamos a los nuestros».`,
        consequences: { moral: 4, flags: { ...stamp, ...raise } },
      };
    }
    return {
      ok: false,
      ...base,
      description,
      outcomeText: `${director} niega con educación: «Estás en la banda salarial que corresponde al club. Si sigues así, lo hablamos en la renovación». No te sube nada, pero tampoco te lo toma a mal.`,
      consequences: { moral: -2, rel_entrenador: -1, flags: stamp },
    };
  }

  if (kind === "minutos") {
    const base = { title: `Hablas con ${coach}`, label: "Hablar con el míster" };
    const description = `Esperas a que se vacíe el vestuario y le pides a ${coach} un minuto a solas. Le dices lo que piensas: que estás para jugar más y que no te lo vas a callar.`;
    const p = clamp(0.5 + (relEnt - 50) / 120 + (forma - 60) / 200 + (media >= need ? 0.1 : -0.1), 0.15, 0.85);
    if (roll < p) {
      return {
        ok: true,
        ...base,
        description,
        outcomeText: `${coach} te escucha con atención y asiente: «Tienes razón en una cosa: llevas semanas entrenando mejor que el que juega. El domingo vas de inicio, y a partir de ahí, ya sabes dónde está el listón».`,
        consequences: { rel_entrenador: 6, moral: 4, flags: { ...stamp, coach_bench: "0", bench_streak: "0" } },
      };
    }
    return {
      ok: false,
      ...base,
      description,
      outcomeText: `${coach} no se altera: «Aquí se gana el sitio entrenando, no pidiéndolo. Cuando lo merezcas, lo sabrás». No hay gritos, pero te quedas con la sensación de que la conversación ha cambiado cómo te mira.`,
      consequences: { rel_entrenador: -3, moral: -3, flags: stamp },
    };
  }

  // brazalete
  const tenure = num(player.flags?.club_since) > 0 ? player.week - num(player.flags?.club_since) : 0;
  const p = clamp(0.15 + (relVes - 50) / 100 + (fama - 50) / 250 + (tenure >= 40 ? 0.1 : 0) + (age >= 24 ? 0.05 : 0) - (media < need ? 0.1 : 0), 0.05, 0.75);
  const base = { title: "Pides el brazalete", label: "Pedir el brazalete" };
  const description = `Te acercas a ${coach} con una petición que llevas semanas ensayando: quieres el brazalete de capitán. Él te mira de arriba abajo antes de contestar.`;
  if (roll < p) {
    return {
      ok: true,
      ...base,
      description,
      outcomeText: `${coach} sonríe por primera vez en la reunión: «Lo hemos hablado con los veteranos. Llevas tiempo ganándotelo». El brazalete es tuyo. La plantilla te aplaude en el siguiente entrenamiento y la afición lo celebra en redes.`,
      consequences: { rel_vestuario: 4, rel_aficion: 3, fama: 3, moral: 6, flags: { ...stamp, capitan_club: true } },
    };
  }
  return {
    ok: false,
    ...base,
    description,
    outcomeText: `${coach} pone cara de circunstancias: «Esto no se pide: se te da. Y todavía hay quien lo merece más que tú». En el vestuario se enteran antes de la cena, y algún compañero tarda en volver a mirarte igual.`,
    consequences: { rel_vestuario: -3, moral: -3, flags: stamp },
  };
}
