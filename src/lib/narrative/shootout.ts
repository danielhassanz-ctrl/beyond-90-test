/**
 * La tanda de penaltis como escena propia. Cuando una eliminatoria (Champions, Europa, Copa, Mundial,
 * Eurocopa, Copa América) se va a los penaltis, el jugador no la lee en una frase: la vive. Tira uno
 * (o, si es portero, intenta parar uno), con riesgo real, y lo que ocurre en ese momento inclina el
 * resultado final de la tanda. La crónica llega después con el desenlace ya decidido.
 */
import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";

type Flags = Record<string, string | boolean>;

export const isPenaltyShootout = (scoreLine: string | undefined): boolean => /penaltis/i.test(scoreLine ?? "");

const safe = (key: string) => key.replace(/[^a-z0-9]/gi, "_");
export const pensFlag = {
  scene: (k: string) => `pens_scene_${safe(k)}`,
  pre: (k: string) => `pens_pre_${safe(k)}`,
  line0: (k: string) => `pens_line0_${safe(k)}`,
  yo: (k: string) => `pens_yo_${safe(k)}`,
  final: (k: string) => `pens_final_${safe(k)}`,
  line: (k: string) => `pens_line_${safe(k)}`,
};

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  return h >>> 0;
}

export interface ShootoutCtx {
  /** Clave estable del partido (matchKey o etapa del torneo). */
  key: string;
  team: string;
  rival: string;
  /** "Mundial 2030", "Champions League"... */
  comp: string;
  /** Marcador de los 90-120 minutos, sin la tanda: "1-1". */
  regular: string;
  /** Ronda: "Final", "Semifinal", "Octavos de final"... */
  round: string;
  /** Si la tanda decide un título o una final. */
  decisive: boolean;
  /** Selección: la cabecera usa la bandera del país. */
  national?: boolean;
}

export function buildShootoutEvent(player: Player, ctx: ShootoutCtx): GameEvent {
  const keeper = (player.position ?? "").toLowerCase().includes("portero");
  const name = displayName(player);
  const seed = `${player.id}:${ctx.key}`;
  const slot = (player.media ?? 60) >= 78 ? [1, 5, 4][hash(seed) % 3] : [3, 4, 2][hash(seed) % 3];
  // La tanda va igualada hasta tu turno.
  const base = Math.max(0, slot - 1);
  const own = Math.max(0, base - (hash(seed + "o") % 2));
  const rival = Math.max(0, base - (hash(seed + "r") % 2));
  const tally = base === 0 ? "la tanda no ha empezado" : `la tanda va ${own}-${rival}`;
  const final = ctx.decisive ? "Es el partido que puede cambiar tu vida. " : "";
  const flagKey = pensFlag.yo(ctx.key);
  const where = ctx.national ? `con la camiseta de ${ctx.team}` : `con la camiseta de ${ctx.team}`;

  const intro = [
    `${ctx.round}, ${ctx.comp}. Ciento veinte minutos de nervio y ${ctx.regular} en el marcador: se decide desde los once metros. ${final}`,
    `Nadie ha podido con nadie. ${ctx.regular} tras la prórroga, ${ctx.rival} enfrente y un estadio entero conteniendo la respiración. ${final}`,
  ][hash(seed + "i") % 2];

  if (keeper) {
    const mk = (id: string, label: string, subtitle: string, chance: number, saveText: string, failText: string) => ({
      id,
      label,
      subtitle,
      consequences: {},
      resolve: {
        baseChance: chance,
        statModifier: "media" as const,
        success: { text: saveText, consequences: { moral: 10, fama: 6, rel_aficion: 5, reputacion: 3, media: 1, flags: { [flagKey]: "parada" } } },
        fail: { text: failText, consequences: { moral: -4, fama: -1, flags: { [flagKey]: "fallo" } } },
      },
    });
    return {
      id: `tanda-${safe(ctx.key)}-${Date.now()}`,
      category: "partido",
      title: `Tanda de penaltis ante ${ctx.rival}`,
      description: `${intro}${tally.charAt(0).toUpperCase() + tally.slice(1)} y el lanzador de ${ctx.rival} deja el balón en el punto. Eres ${name} y estás solo, bajo los palos, con todo el estadio mirándote. Le miras a los ojos. Él te mira a ti. Hay que elegir.`,
      ownTeam: ctx.national ? ctx.team : undefined,
      rivalClub: ctx.rival,
      isMilestone: ctx.decisive,
      milestoneType: ctx.decisive ? "carrera" : undefined,
      imageScene: ctx.decisive ? `Photorealistic photo of a goalkeeper diving full stretch to save a penalty in a shootout, ${where}, packed stadium, dramatic floodlights, teammates running in celebration behind him, no logos or readable text` : undefined,
      options: [
        mk("a", "Lanzarte a tu derecha, donde ha tirado siempre", "Fiarte del dato", 0.34, "Te estiras al máximo, con la mano abierta, y rozas el balón lo justo para desviarlo al palo. Un rugido recorre el estadio. Tus compañeros corren hacia ti. Queda por saber cómo acaba esto.", "Te lanzas con todo… y el balón entra por el otro lado, suave, a media altura. Te quedas en el suelo un segundo más de lo necesario."),
        mk("b", "Quedarte en el centro hasta el último instante", "Aguantar la mirada", 0.28, "Aguantas, aguantas… y el balón sale al centro, flojo. Lo atrapas con las dos manos pegado al pecho. El estadio explota. «¡Lo leyó!», gritará luego un comentarista.", "Esperas demasiado. El lanzador, sereno, te engaña por una esquina. Cuando reaccionas, la red ya se mueve."),
        mk("c", "Provocar al lanzador y lanzarte tarde", "Meterte en su cabeza", 0.3, "Le dices algo, le sonríes, te quedas quieto. Él duda un segundo. Un segundo es todo lo que necesitas: te lanzas a tu izquierda y atajas el disparo. La grada se pone en pie.", "Le provocas y no funciona: tira con una frialdad que da miedo. El balón besa la red y tú, con la mandíbula apretada, te levantas."),
      ],
    };
  }

  const mk = (id: string, label: string, subtitle: string, chance: number, goalText: string, missText: string) => ({
    id,
    label,
    subtitle,
    consequences: {},
    resolve: {
      baseChance: chance,
      statModifier: "media" as const,
      success: { text: goalText, consequences: { moral: 9, fama: 5, rel_aficion: 4, reputacion: 2, flags: { [flagKey]: "gol" } } },
      fail: { text: missText, consequences: { moral: -8, fama: -2, rel_aficion: -1, flags: { [flagKey]: "fallo" } } },
    },
  });
  return {
    id: `tanda-${safe(ctx.key)}-${Date.now()}`,
    category: "partido",
    title: `Tanda de penaltis ante ${ctx.rival}`,
    description: `${intro}${tally.charAt(0).toUpperCase() + tally.slice(1)}: es el turno del lanzador número ${slot} de tu equipo, y ese eres tú, ${name}. Caminas desde el círculo central con el balón en la mano. Cada paso dura una hora. El portero de ${ctx.rival} te espera con los brazos abiertos. Lo colocas en el punto. Retrocedes. Respiras.`,
    ownTeam: ctx.national ? ctx.team : undefined,
    rivalClub: ctx.rival,
    isMilestone: ctx.decisive,
    milestoneType: ctx.decisive ? "carrera" : undefined,
    imageScene: ctx.decisive ? `Photorealistic photo of a footballer ${where} running away celebrating after scoring a decisive penalty in a shootout, goalkeeper on the grass behind him, packed stadium roaring, dramatic floodlights, no logos or readable text` : undefined,
    options: [
      mk("a", "Raso, a la esquina izquierda del portero", "Lo seguro", 0.8, "Lo colocas con el interior, pegado al palo. El portero se lanza al otro lado. Gol. Corres hacia tus compañeros con los brazos en alto y el corazón en la garganta. Queda el resto de la tanda.", "El portero adivina el lado y desvía con la punta de los dedos. El balón se va al lateral de la red. Te quedas parado, con las manos en la cara. Todo el estadio suspira."),
      mk("b", "Al ángulo, con toda la fuerza que tengas", "Riesgo y premio", 0.62, "Sale como un misil, a la escuadra, donde no llega nadie. El estadio se viene abajo. Te giras con los puños apretados y gritas algo que no recordarás. Queda el resto de la tanda.", "La mandas demasiado alta: el balón se estrella en el larguero y sale rebotado. Hay un silencio de funeral. Notas cómo se te enfría el cuerpo entero."),
      mk("c", "Paradinha: esperar a que el portero se tire", "Sangre fría", 0.68, "Paras un instante, el portero se lanza, y tú, con una calma que no sabías que tenías, la tocas al otro lado. Gol. El estadio, loco. Es el penalti más lento y más largo de tu vida.", "Esperas demasiado: el portero, que no se mueve, atrapa el balón con las dos manos. Hay un abrazo de compañeros que te levanta del suelo. Pero duele."),
    ],
  };
}

/** Marcador de la tanda coherente con el desenlace. */
export function pensLine(regular: string, win: boolean): string {
  const pool = win ? ["5-4", "4-3", "3-2", "6-5"] : ["4-5", "3-4", "2-3", "5-6"];
  return `${regular} (${pool[Math.floor(Math.random() * pool.length)]} en penaltis)`;
}

export function regularScore(scoreLine: string): string {
  return scoreLine.split("(")[0].trim();
}

/**
 * Trata la tanda de una eliminatoria. Devuelve { scene } si toca vivirla ahora, o { win, scoreLine, yo }
 * con el desenlace ya ajustado por tu penalti. Sin tanda, devuelve el resultado tal cual.
 */
export function settleShootout(
  player: Player,
  key: string,
  fresh: { win: boolean; scoreLine: string },
  ctx: ShootoutCtx,
): { scene: GameEvent } | { win: boolean; scoreLine: string; yo: string | null } {
  if (!player.flags) player.flags = {};
  const f = player.flags as Flags;
  // Ya cerrada: se reutiliza siempre el mismo desenlace.
  if (f[pensFlag.final(key)]) {
    return { win: f[pensFlag.final(key)] === "win", scoreLine: String(f[pensFlag.line(key)] ?? fresh.scoreLine), yo: (f[pensFlag.yo(key)] as string) ?? null };
  }
  const sceneShown = Boolean(f[pensFlag.scene(key)]);
  if (!sceneShown) {
    if (!isPenaltyShootout(fresh.scoreLine)) return { win: fresh.win, scoreLine: fresh.scoreLine, yo: null };
    f[pensFlag.scene(key)] = true;
    f[pensFlag.pre(key)] = fresh.win ? "win" : "lose";
    f[pensFlag.line0(key)] = fresh.scoreLine;
    return { scene: buildShootoutEvent(player, { ...ctx, regular: regularScore(fresh.scoreLine) }) };
  }
  const yo = (f[pensFlag.yo(key)] as string | undefined) ?? null;
  // La escena se vivió pero aún no hay respuesta guardada: se espera (no debería ocurrir).
  const pre = f[pensFlag.pre(key)] === "win";
  let win = pre;
  if (yo === "gol" || yo === "parada") win = pre || Math.random() < 0.4;
  if (yo === "fallo") win = pre && Math.random() >= 0.4;
  const regular = regularScore(String(f[pensFlag.line0(key)] ?? fresh.scoreLine));
  const line = pensLine(regular, win);
  f[pensFlag.final(key)] = win ? "win" : "lose";
  f[pensFlag.line(key)] = line;
  return { win, scoreLine: line, yo };
}

/** Frase para la crónica sobre lo que hizo el jugador en la tanda. */
export function shootoutInstruction(yo: string | null, win: boolean, keeper: boolean, team: string): string {
  const mine =
    yo === "gol"
      ? "Tu penalti FUE GOL."
      : yo === "parada"
        ? "Tú PARASTE un penalti de la tanda."
        : yo === "fallo"
          ? keeper
            ? "No lograste parar tu penalti."
            : "Tu penalti SE FALLÓ."
          : "";
  return `- La eliminatoria se decidió en una TANDA DE PENALTIS y ${team} ${win ? "LA GANA y pasa" : "LA PIERDE y queda eliminado"}. ${mine} Cuéntalo con la emoción que merece, sin cambiar el desenlace.`;
}
