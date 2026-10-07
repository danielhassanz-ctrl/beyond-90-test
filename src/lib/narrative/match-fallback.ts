/**
 * Crónica de partido escrita en código. Era la red de seguridad cuando la IA
 * fallaba, y ahora es el camino habitual: con el presupuesto de IA por carrera
 * (ai-budget.ts) solo los partidos importantes gastan una llamada, así que la
 * mayoría de las crónicas salen de aquí. Por eso tiene que tener variedad y
 * vida: distintas aperturas según el resultado, la jugada decisiva ya vivida,
 * el entrenador y los compañeros con su nombre, y tres reacciones sorteadas de
 * un surtido (prensa, míster, vestuario, familia, redes, representante), cada
 * una con varias frases, para que dos partidos seguidos no se parezcan.
 *
 * La primera frase conserva el formato exacto que lee extractStatsFromEvent
 * ("Ante X en Y, jugaste N minutos. Nota: N/10. Goles: G. Asistencias: A.
 * Marcador: a-b (Equipo-Rival).").
 */
import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import type { MatchWeek } from "@/lib/calendar/match-calendar";
import { computeRole } from "@/lib/narrative/role";
import { getNpcName, getTeammateName } from "@/lib/narrative/npcs";

interface Decision {
  outcome?: string;
  sit?: string;
  min?: string | number;
}

const COMP_LABEL: Record<string, string> = {
  liga: "La Liga",
  copa: "Copa del Rey",
  champions: "Champions League",
  europa: "Europa League",
  internacional: "Partido internacional",
};

const HEADLINES: Record<string, string[]> = {
  goal: ["tu gol marca el partido", "noche de goleador", "el gol que cambia la tarde", "tú abres la lata"],
  wondergoal: ["una genialidad para el recuerdo", "golazo de los que se repiten mil veces", "el gol que ya está en los vídeos"],
  assist: ["tu pase abre la defensa", "el asistente de la noche", "la jugada empieza en tus botas"],
  miss: ["ocasión clara fallada", "la que no entró", "el palo que lo cambia todo"],
  miss_bad: ["la jugada que salió mal", "un riesgo que costó caro", "el balón que no debió perderse"],
  save: ["una intervención decisiva", "la noche de las manos", "el rechace que salva el punto"],
  concede: ["una acción que pesa en el marcador", "el gol que escuece", "un despiste en mal momento"],
  clean_tackle: ["una entrada de manual", "firmeza atrás", "el cierre perfecto"],
  contained: ["partido de oficio", "sin sobresaltos", "trabajo sin brillo", "una tarde discreta"],
  beaten: ["un momento para olvidar", "te superan en una jugada clave", "la jugada que se te escapa"],
  foul_committed: ["una falta que cuesta caro", "amarilla y susto", "el contacto de más"],
  penalty_conceded: ["el penalti que lo cambia todo", "una salida que sale cara", "la mano en el peor momento"],
};

function rnd<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffled<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function parseScore(line: string): { own: number; rival: number } | null {
  const m = line.match(/(\d{1,2})\s*-\s*(\d{1,2})/);
  return m ? { own: Number(m[1]), rival: Number(m[2]) } : null;
}

type Result = "win" | "draw" | "loss";

/** Cómo remató la jugada decisiva ya vivida, en una frase. */
function playLine(outcome: string, sit: string, minute: string): string {
  const where = minute ? `En el minuto ${minute}, ` : "";
  const s = sit ? sit.charAt(0).toLowerCase() + sit.slice(1).replace(/\s*No hay tiempo para pensar demasiado — tienes que decidir ya\.?/, "") : "";
  const base = s ? `${where}${s}` : "";
  const endings: Record<string, string[]> = {
    goal: ["Y no perdonaste: el balón acabó dentro.", "Lo resolviste con sangre fría y la grada estalló.", "Definiste sin pestañear."],
    wondergoal: ["Y te sacaste de la manga algo que nadie esperaba: golazo.", "Lo que hiciste después aún lo están repitiendo en las redes."],
    assist: ["Y soltaste el pase justo para que otro la metiera.", "Viste el hueco antes que nadie y serviste el gol."],
    miss: ["Pero el remate se fue desviado por centímetros.", "Pero el balón se estrelló en el palo y se negó a entrar."],
    miss_bad: ["Pero lo intentaste de más y el balón se perdió sin peligro.", "Pero la jugada salió mal y el rival salió a la contra."],
    save: ["Y tu intervención evitó un gol cantado.", "Y la salvaste cuando todo el estadio ya cantaba el gol."],
    concede: ["Pero la acción acabó en gol del rival.", "Pero aquello terminó en una ocasión clarísima para ellos."],
    clean_tackle: ["Y cortaste la jugada con una entrada limpia.", "Y cerraste el espacio justo a tiempo."],
    contained: ["Y lo controlaste sin sobresaltos.", "Y lo resolviste con oficio, sin florituras."],
    beaten: ["Pero te ganaron la partida en la acción.", "Pero el rival fue más rápido y te dejó atrás."],
    foul_committed: ["Pero llegaste tarde y el árbitro señaló falta.", "Pero el contacto fue de más y llegó la amarilla."],
    penalty_conceded: ["Pero el contacto fue dentro del área: penalti.", "Pero el árbitro no dudó: penalti en contra."],
  };
  const end = rnd(endings[outcome] ?? endings.contained);
  return base ? `${base} ${end}` : end;
}

/** Frase del entrenador / ambiente, según cómo fue. */
function coachLine(coach: string, result: Result, rating: number, goals: number): string {
  if (goals > 0 && result === "win") return rnd([`${coach} te aplaude desde la banda al cambiarte.`, `${coach} te busca en el túnel: "Así, justo así."`, `${coach} no dice nada, pero te revuelve el pelo al pasar.`]);
  if (rating < 5.5) return rnd([`${coach} se queda mirando el césped un buen rato antes de entrar al vestuario.`, `En el túnel, ${coach} pasa a tu lado sin una palabra. El silencio pesa más que una bronca.`, `${coach} apunta algo en su libreta y no levanta la vista.`]);
  if (result === "loss") return rnd([`${coach} reúne al grupo en el césped: "Hoy duele, y que duela."`, `${coach} no grita. Solo pide que mañana se entrene como si fuera una final.`]);
  if (result === "draw") return rnd([`${coach} se encoge de hombros: "Un punto es un punto, pero sabía a poco."`, `${coach} asiente despacio: ni contento ni enfadado.`]);
  return rnd([`${coach} sonríe sin exagerar y manda a todos a recuperar.`, `${coach} lo resume en una frase: "Esto es trabajo, y hoy salió."`, `En el vestuario, ${coach} reparte palmadas y pide cabeza fría para el siguiente.`]);
}

interface ReactionKit {
  id: string;
  label: string;
  subtitle: string;
  consequences: (ctx: Ctx) => Record<string, number>;
  text: (ctx: Ctx) => string[];
}

interface Ctx {
  coach: string;
  mate: string;
  rival: string;
  result: Result;
  goals: number;
  bad: boolean;
  rating: number;
}

const mediaFor = (ctx: Ctx) => (ctx.rating >= 8 ? 3 : ctx.rating >= 7 ? 1 : ctx.rating < 5.2 ? -2 : ctx.rating < 5.8 ? -1 : 0);

const REACTIONS: ReactionKit[] = [
  {
    id: "prensa",
    label: "Dar la cara en zona mixta",
    subtitle: "Hablar con la prensa",
    consequences: (c) => ({ media: mediaFor(c), fama: c.goals > 0 ? 3 : c.bad ? -1 : 1 }),
    text: (c) =>
      c.goals > 0
        ? ["Los micrófonos te buscan a ti. Respondes con calma, y tus palabras abren los informativos de la noche.", `Un periodista te pregunta por el gol y tú le devuelves el mérito al grupo. El titular lo escribe él, pero la frase es tuya.`]
        : c.result === "loss"
          ? ["Respondes a las preguntas incómodas sin esconderte. Nadie te saca una frase fuera de tono, y eso también cuenta.", "Aguantas diez minutos de micrófonos tras la derrota. No hay excusas en lo que dices, y se nota."]
          : ["Atiendes a la prensa con serenidad y sin dar titulares. A veces la mejor entrevista es la que no da que hablar.", "Cuatro preguntas, cuatro respuestas cortas. Esta noche no habrá polémica contigo."],
  },
  {
    id: "mister",
    label: "Revisar el partido con el míster",
    subtitle: "Repasar lo que salió bien y mal",
    consequences: (c) => ({ media: mediaFor(c), rel_entrenador: c.bad ? 1 : 2, forma: 1 }),
    text: (c) => [
      `Os sentáis cinco minutos en el despacho de ${c.coach} con el vídeo parado en tu jugada. No hay reproches: hay detalles concretos que mejorar.`,
      `${c.coach} te enseña tres movimientos tuyos y uno que no hiciste. Sales con deberes y con la sensación de que cuenta contigo.`,
      `Con la tablet en la mano, ${c.coach} te marca un desmarque que se te escapó. "Esto, cuando lo hagas, no hay quien te pare."`,
    ],
  },
  {
    id: "vestuario",
    label: "Salir a cenar con los compañeros",
    subtitle: "Cerrar la noche en grupo",
    consequences: (c) => ({ media: mediaFor(c), rel_vestuario: 3, moral: c.bad ? 2 : 1 }),
    text: (c) => [
      `Acabáis en un bar de tapas hasta que echan el cierre. ${c.mate} cuenta la misma anécdota por tercera vez y, por tercera vez, funciona.`,
      "Cena larga y sin móviles. Entre risas, el partido pesa menos y el grupo se siente un poco más equipo.",
      `${c.mate} paga la primera ronda "por si acaso" y acabáis cantando en la mesa. Mañana nadie recordará el resultado, solo la noche.`,
    ],
  },
  {
    id: "familia",
    label: "Llamar a tu familia",
    subtitle: "Un momento sin cámaras",
    consequences: (c) => ({ media: mediaFor(c), moral: c.bad ? 3 : 2 }),
    text: (c) =>
      c.bad
        ? ["Tu madre no pregunta por el partido: pregunta si has cenado. A veces es justo lo que necesitas oír.", "Tu padre te cuenta que lo vio entero y que se aburrió menos que otras veces. Te sale una sonrisa sin querer."]
        : ["Al otro lado del teléfono hay gritos de la familia entera. Tu madre dice que lo vio llorando; tu padre, que él no lloró, pero está claro que sí.", "Te cuentan cómo lo han vivido en el salón de casa. Te despides con un nudo bueno en la garganta."],
  },
  {
    id: "redes",
    label: "Subir algo a tus redes",
    subtitle: "Compartir con la afición",
    consequences: (c) => ({ media: mediaFor(c), fama: c.goals > 0 ? 3 : 1, rel_aficion: c.bad ? -1 : 2 }),
    text: (c) =>
      c.goals > 0
        ? ["Subes una foto del campo vacío con una sola frase. En una hora tiene más corazones que cualquier otra cosa que hayas publicado.", "Un vídeo corto del festejo, sin texto. La afición hace el resto."]
        : ["Subes un mensaje breve de agradecimiento a la grada. Algunos te lo agradecen y otros te piden más, que también es cariño.", "Una foto del vestuario con un «seguimos». Sin dramas, sin excusas."],
  },
  {
    id: "agente",
    label: "Hablar con tu representante",
    subtitle: "Una lectura fría del partido",
    consequences: (c) => ({ media: mediaFor(c), rel_representante: 2, reputacion: c.goals > 0 ? 1 : 0 }),
    text: () => [
      "Tu representante escucha sin interrumpir y resume: «Lo importante es que te vean en el campo, y hoy te vieron». Cuelga con una promesa de moverlo.",
      "Una llamada corta. «Sigue así, que yo me encargo del ruido de fuera.»",
    ],
  },
  {
    id: "extra",
    label: "Quedarte a entrenar un rato más",
    subtitle: "Trabajo extra sin cámaras",
    consequences: (c) => ({ media: mediaFor(c), forma: 2, rel_entrenador: 1 }),
    text: (c) => [
      `Cuando el estadio se vacía, sigues tú solo con un cubo de balones. ${c.coach} te mira desde la banda y no dice nada.`,
      "Veinte remates más con las luces a medio apagar. Nadie te lo ha pedido, y ese es el punto.",
    ],
  },
];

export function buildFallbackMatchReport(args: {
  player: Player;
  match: MatchWeek;
  decisionRaw?: string;
  /** Marcador ya decidido (de la Copa/eliminatorias o el torneo), siempre "propio-rival". */
  forcedScoreLine?: string;
  /** En eliminatorias: si tu equipo pasa o cae (importa si se decide en penaltis). */
  forcedWin?: boolean;
  /** Nombre de tu equipo en el marcador (el club, o la selección en un torneo). */
  team: string;
  /** Texto de competición extra, ej. "Mundial 2030". */
  competitionNote?: string;
  /** Eliminatoria a doble partido: "Ida: ... Global: ... Pasa de ronda." */
  tieNote?: string;
}): GameEvent {
  const { player, match, team } = args;
  let decision: Decision = {};
  try {
    decision = args.decisionRaw ? (JSON.parse(args.decisionRaw) as Decision) : {};
  } catch {
    decision = {};
  }
  const outcome = decision.outcome ?? "contained";
  const role = match.competition === "internacional" ? "titular" : computeRole(player).role;

  // Marcador
  let own: number;
  let rival: number;
  const forced = args.forcedScoreLine ? parseScore(args.forcedScoreLine) : null;
  if (forced) {
    own = forced.own;
    rival = forced.rival;
  } else {
    const r = Math.random();
    const strong = (player.media ?? 60) >= 70;
    const win = strong ? 0.58 : 0.45;
    const draw = 0.24;
    if (r < win) { own = 1 + Math.floor(Math.random() * 3); rival = Math.floor(Math.random() * own); }
    else if (r < win + draw) { own = Math.floor(Math.random() * 3); rival = own; }
    else { rival = 1 + Math.floor(Math.random() * 3); own = Math.floor(Math.random() * rival); }
  }

  // Goles y asistencias coherentes con la jugada decisiva ya vivida
  let goals = outcome === "goal" || outcome === "wondergoal" ? 1 : 0;
  const assists = outcome === "assist" ? 1 : 0;
  if (goals === 1 && Math.random() < 0.12) goals = 2;
  if (outcome === "concede" || outcome === "penalty_conceded") rival = Math.max(rival, 1);
  own = Math.max(own, goals + assists);

  // Minutos según el rol; la jugada decisiva tiene que caber dentro
  const rawMin = String(decision.min ?? "");
  const decisionMin = rawMin.includes("+") ? 90 : parseInt(rawMin, 10) || 0;
  let minutes = role === "titular" ? 80 + Math.floor(Math.random() * 11) : role === "rotacion" ? 45 + Math.floor(Math.random() * 26) : 10 + Math.floor(Math.random() * 21);
  minutes = Math.min(90, Math.max(minutes, decisionMin > 0 ? decisionMin + 3 : 0));

  // Nota
  const bad = ["miss_bad", "concede", "beaten", "penalty_conceded", "foul_committed"].includes(outcome);
  let rating = 6.2 + goals * 1.3 + assists * 0.7 - (bad ? 0.7 : 0) + (Math.random() - 0.5);
  rating = Math.max(4.5, Math.min(9.6, rating));
  const nota = rating.toFixed(1);

  const result: Result = own > rival ? "win" : own === rival ? "draw" : "loss";
  const pens = own === rival && args.forcedWin !== undefined;
  const verdict = pens
    ? args.forcedWin ? "gana en los penaltis a" : "pierde en los penaltis ante"
    : result === "win" ? "gana a" : result === "draw" ? "empata con" : "pierde ante";
  const compBase = COMP_LABEL[match.competition] ?? "partido oficial";
  const comp = args.competitionNote ? `${compBase} (${args.competitionNote})` : compBase;
  const headline = rnd(HEADLINES[outcome] ?? HEADLINES.contained);

  const coach = getNpcName(player, "entrenador");
  const mate = getTeammateName(player, `${match.week}:${match.rivalClub}`);
  const venue = match.competition === "internacional" ? "en sede neutral" : match.homeTeam === team ? "en casa" : "a domicilio";
  const stakesText =
    match.stakes === "decisivo"
      ? rnd(["Era de esos partidos que se recuerdan.", "Había mucho en juego y se notaba en cada balón."])
      : match.stakes === "importante"
        ? rnd(["Un partido con peso, de los que miran de reojo en la clasificación.", "No era una jornada cualquiera."])
        : "";
  const ambience =
    result === "win"
      ? rnd([`El ambiente ${venue} fue de los buenos.`, `Se ganó ${venue} y se notó en la grada.`, "Los tres puntos sientan bien a todo el vestuario."])
      : result === "draw"
        ? rnd([`Un empate ${venue} que deja sabor agridulce.`, "Se repartieron los puntos sin que nadie quedara del todo contento."])
        : rnd([`Una derrota ${venue} que se hace larga.`, `Se perdió ${venue}, y los silbidos al final no fueron para nadie en particular.`]);
  const play = decision.sit || decision.outcome ? playLine(outcome, decision.sit ?? "", rawMin) : "";

  // Primera frase con el formato exacto que lee extractStatsFromEvent; después, la narración.
  const description =
    `Ante ${match.rivalClub} en ${comp}, jugaste ${minutes} minutos. Nota: ${nota}/10. Goles: ${goals}. Asistencias: ${assists}. ` +
    `Marcador: ${own}-${rival} (${team}-${match.rivalClub}). Tu equipo ${verdict} ${match.rivalClub}. ` +
    [args.tieNote, stakesText, ambience, play, coachLine(coach, result, rating, goals)].filter(Boolean).join(" ");

  const ctx: Ctx = { coach, mate, rival: match.rivalClub, result, goals, bad, rating };
  // Tres reacciones distintas sorteadas del surtido; una siempre es la del míster o el vestuario.
  const pool = shuffled(REACTIONS);
  const chosen = [pool.find((k) => k.id === "mister" || k.id === "vestuario") ?? pool[0], ...pool.filter((k) => k.id !== "mister" && k.id !== "vestuario")]
    .filter((k, i, arr) => arr.indexOf(k) === i)
    .slice(0, 3);
  const options = chosen.map((k, i) => ({
    id: String.fromCharCode(97 + i),
    label: k.label,
    subtitle: k.subtitle,
    consequences: k.consequences(ctx),
    outcomeText: rnd(k.text(ctx)),
  }));

  return {
    id: `matchday-${match.week}-fallback-${Date.now()}`,
    category: "partido",
    title: `${team} ${own}-${rival} ${match.rivalClub}: ${headline}`,
    description,
    rivalClub: match.rivalClub,
    options,
  };
}
