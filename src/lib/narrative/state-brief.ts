/**
 * Resumen del ESTADO REAL del jugador para los prompts de la IA. Sin esto la
 * IA generaba cada escena en el vacío (solo veía títulos y opciones elegidas):
 * podía escribir "confía en ti" con el jugador apartado, ignorar una lesión,
 * una oferta en marcha o el cabreo del vestuario, y las decisiones pasadas no
 * parecían influir en nada. Aquí se traduce el estado a frases que obligan a
 * que la escena nazca de lo que ha pasado.
 */
import type { Player } from "@/types/player";
import type { HistoryItem } from "@/lib/narrative/ai";
import { computeRole, ROLE_LABELS, benchRemaining } from "@/lib/narrative/role";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";
import { NO_CLUB_YET } from "@/lib/constants";
import { playerAge } from "@/types/career";
import { getClubLevel } from "@/lib/calendar/match-calendar";
import { pendingEchoes } from "@/lib/narrative/ledger";

function level(value: number, labels: [string, string, string, string]): string {
  // <30, <50, <75, resto
  return value < 30 ? labels[0] : value < 50 ? labels[1] : value < 75 ? labels[2] : labels[3];
}

/**
 * En qué punto del arco de su carrera está el jugador (promesa → ascenso →
 * cima → madurez → ocaso), para que las escenas empujen la MISMA historia
 * y no un cuento distinto cada turno. Sale de la edad, la media, el nivel
 * del club y lo ganado.
 */
export function arcStage(player: Player): { name: string; theme: string; next: string } {
  const age = playerAge(player.week);
  const media = player.media ?? 50;
  const level = getClubLevel(player.club);
  if (age >= 34 || (age >= 31 && media < 65)) {
    return {
      name: "ocaso (la despedida)",
      theme: "cada partido pesa como si fuera el último; legado, familia, qué viene después del fútbol y cómo quieres que te recuerden.",
      next: "elegir cómo y dónde acabar la carrera (un último gran contrato, volver a casa o colgar las botas).",
    };
  }
  if (age >= 29) {
    return {
      name: "madurez (el referente)",
      theme: "liderazgo, responsabilidad con los jóvenes, el peso del brazalete y de los años, lo que quieres dejar.",
      next: "consolidar una leyenda en un club o buscar un último gran reto.",
    };
  }
  if (media >= 78 && level !== "modesto") {
    return {
      name: "la cima (la estrella)",
      theme: "competir por títulos y premios individuales, la presión de ser el referente, decisiones de imagen y dinero con mucho en juego.",
      next: "ganar el gran título, asentar el estatus o dar un salto a otra liga.",
    };
  }
  if (media >= 62 || age >= 21) {
    return {
      name: "el ascenso (la promesa que se hace jugador)",
      theme: "demostrar que mereces el salto: cada decisión deportiva abre o cierra puertas del mercado y el míster, el vestuario y la afición te miden.",
      next: "dar el salto a un club de más nivel o consolidarte como indiscutible donde estás.",
    };
  }
  return {
    name: "la promesa (hacerse un hueco)",
    theme: "minutos, cantera, primeros contratos, ilusión y dudas; todo es nuevo y cada oportunidad cuenta el doble.",
    next: "ganarte un sitio real en el primer equipo.",
  };
}

export function buildStateBrief(player: Player, history: HistoryItem[]): string {
  const lines: string[] = [];
  const flags = player.flags ?? {};

  if (player.club !== NO_CLUB_YET) {
    const { role } = computeRole(player);
    const bench = benchRemaining(flags);
    const roleText: Record<string, string> = {
      titular: "es titular habitual",
      rotacion: "está en rotación: juega bastantes partidos pero no es intocable",
      suplente: "es suplente: entra desde el banquillo y juega pocos minutos",
      apartado: "está APARTADO: el entrenador no lo convoca",
    };
    lines.push(`- ROL EN EL EQUIPO: ${ROLE_LABELS[role]} — ${roleText[role]}${bench > 0 ? " (por decisión explícita del entrenador, de momento)" : ""}.`);
  }

  const arc = arcStage(player);
  lines.push(`- ETAPA DE LA HISTORIA: ${arc.name}. Tema de fondo: ${arc.theme} Siguiente paso natural: ${arc.next}`);

  const injured = getInjuryRemaining(flags);
  lines.push(
    injured > 0
      ? `- LESIÓN: está lesionado, le quedan ~${injured} ${injured === 1 ? "mes" : "meses"} de baja (el fisio lo está tratando). NO puede jugar ni entrenar a tope: nada de escenas de partido jugado ni de recuperar sitio en el campo.`
      : "- LESIÓN: sano.",
  );

  lines.push(
    `- ENTRENADOR (${player.rel_entrenador}/100): ${level(player.rel_entrenador, ["relación rota, conflicto abierto", "relación fría, desconfianza", "relación correcta, profesional", "confía en él y se nota"])}.`,
  );
  lines.push(
    `- VESTUARIO (${player.rel_vestuario}/100): ${level(player.rel_vestuario, ["aislado, mal ambiente con él", "poco integrado", "buen compañero", "líder querido del grupo"])}. AFICIÓN (${player.rel_aficion}/100): ${level(player.rel_aficion, ["le pitan", "dividida", "le apoya", "le adora"])}. REPRESENTANTE (${player.rel_representante}/100): ${level(player.rel_representante, ["relación a punto de romperse", "tensa", "buena", "total confianza"])}.`,
  );

  if (player.moral < 35) lines.push(`- ÁNIMO muy bajo (${player.moral}/100): está hundido, y se nota en cómo reacciona.`);
  else if (player.moral > 85) lines.push(`- ÁNIMO altísimo (${player.moral}/100): está en su mejor momento.`);
  if (player.forma < 35) lines.push(`- FORMA muy baja (${player.forma}/100).`);

  const transferInterest = flags.transfer_interest;
  if (typeof transferInterest === "string" && transferInterest && transferInterest !== player.club) {
    lines.push(`- MERCADO: el ${transferInterest} está interesado en él (negociación en marcha); su representante lo está moviendo.`);
  }
  if (flags.loan_active && !flags.loan_returned) lines.push("- Está CEDIDO en otro club ahora mismo.");
  if (typeof flags.torneo_activo === "string" && flags.torneo_activo) lines.push(`- Está concentrado con su selección en un torneo (${flags.torneo_activo}).`);

  const threads = Object.entries(flags)
    .filter(([key]) => key.startsWith("hilo_"))
    .map(([, value]) => String(value))
    .slice(-5);
  if (threads.length > 0) lines.push(`- HILOS ABIERTOS (vínculos, promesas, rencores): ${threads.join(" | ")}.`);

  // Hechos que definen su historia (marcas, capitanías, títulos, casas, familia):
  // una decisión pasada tiene que seguir notándose en lo que es hoy.
  const facts: string[] = [];
  const f = flags as Record<string, string | boolean>;
  const trayectoria = String(f.clubs_history ?? "").split("|").filter(Boolean);
  if (trayectoria.length > 0 && player.club !== NO_CLUB_YET) {
    facts.push(`su trayectoria de clubes: ${[...trayectoria, player.club].join(" → ")}`);
  }
  if (f.sponsor_botas) facts.push(`viste las botas de ${f.sponsor_botas}`);
  if (f.sponsor_reloj) facts.push("es imagen de una marca de relojes de lujo");
  if (f.sponsor_bebida) facts.push("anuncia una bebida energética");
  if (f.capitan_seleccion) facts.push("es capitán de su selección");
  if (f.title_liga) facts.push("ha ganado la Liga");
  if (f.title_champions) facts.push("ha ganado la Champions League");
  if (f.title_balon_oro) facts.push("tiene un Balón de Oro");
  for (const [key, value] of Object.entries(f)) {
    const tr = key.match(/^torneo_result_(.+)_(\d+)$/);
    if (tr && typeof value === "string" && value) {
      const names: Record<string, string> = { mundial: "Mundial", eurocopa: "Eurocopa", copa_america: "Copa América" };
      facts.push(`en el ${names[tr[1]] ?? "torneo"} de ${2026 + Number(tr[2])} terminó: ${value.replace(/_/g, " ")}`);
    }
  }
  const houses = Object.entries(f).filter(([k]) => k.startsWith("propiedad_"));
  if (houses.length > 0) facts.push(`tiene ${houses.length} propiedad(es) compradas`);
  if (f.iguana) facts.push("tiene una iguana como mascota que se hizo famosa");
  if (f.patrocinio_chorizo) facts.push("fue imagen de una línea de chorizo");
  if (typeof f.pareja === "string") facts.push(`su pareja es ${f.pareja}${f.hijos ? " y ya tienen hijos" : ""}`);
  if (facts.length > 0) lines.push(`- SU HISTORIA HASTA HOY: ${facts.join("; ")}.`);

  const pendingDecisions = pendingEchoes(player)
    .slice(0, 3)
    .map((e) => `"${e.t}" → eligió "${e.c}"`);
  if (pendingDecisions.length > 0) {
    lines.push(`- DECISIONES CON PESO AÚN SIN CONSECUENCIA (pueden volver en cualquier momento): ${pendingDecisions.join(" | ")}.`);
  }

  const recent = history
    .slice(0, 4)
    .map((h) => {
      const bits = [`"${h.title}" → eligió "${h.chosen}"`];
      if (h.effects) bits.push(`efecto: ${h.effects}`);
      if (h.outcome) bits.push(`reacción: ${h.outcome}`);
      return `  · ${bits.join(" · ")}`;
    })
    .join("\n");

  return `ESTADO REAL DEL JUGADOR (la escena tiene que ser COHERENTE con esto y nacer de ello):
${lines.join("\n")}
${recent ? `\nDECISIONES RECIENTES Y SUS CONSECUENCIAS (de más reciente a más antigua):\n${recent}\n` : ""}
CONTINUIDAD OBLIGATORIA:
- La escena debe nacer de la ÚLTIMA decisión o del estado de arriba, no de la nada: si la última decisión dejó algo pendiente (una promesa, un enfado, una oferta en marcha, un rencor), toca eso o a quien lo sufre antes que inventar un tema nuevo.
- NUNCA contradigas el estado: no escribas que el entrenador confía si la relación está rota, ni que juega si está lesionado o apartado, ni que le adora la grada si la afición le pita.
- Los cambios de las opciones tienen que ser coherentes con el estado (con el vestuario roto, una broma no sube de golpe la relación con el vestuario; con el míster en contra, un gesto amable apenas mueve nada).`;
}

export { summarizeEffects } from "@/lib/narrative/effects";
