/**
 * LOS HIJOS. A partir de los 27-28 años (con pareja estable) empiezan a llegar hijos, y después otro cada 2-3 temporadas, pero
 * no siempre ni todos igual: cada carrera tiene su propio ritmo (hay quien tiene uno, dos, tres o cuatro hijos, y alguno tiene
 * mellizos), así que dos partidas no se parecen. El primero lo cuentan las escenas del banco (p2-embarazo / p2-nacimiento); los
 * siguientes los genera este módulo, con embarazo y nacimiento, y el nombre del niño o la niña.
 *
 *   hijos          bandera de siempre (hay al menos un hijo): otras escenas la usan
 *   hijos_n        cuántos hijos hay
 *   hijos_info     JSON [{ n: nombre, w: semana de nacimiento, f: true si es niña }]
 *   hijo_last_week semana del último nacimiento
 *   embarazo / embarazo_week   embarazo en curso (compartido con el banco)
 */
import type { GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { partnerOf, partnerRel, partnerFirstName } from "@/lib/narrative/partner";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";

type Flags = Record<string, string | boolean>;

export interface Child {
  n: string;
  w: number;
  f?: boolean;
}

const NAMES_M = ["Lucas", "Hugo", "Mateo", "Leo", "Martín", "Daniel", "Pablo", "Álvaro", "Marco", "Nico", "Bruno", "Enzo", "Gael", "Thiago", "Dario", "Adrián"];
const NAMES_F = ["Lucía", "Sofía", "Martina", "Julia", "Emma", "Valeria", "Carla", "Alba", "Noa", "Irene", "Aitana", "Vega", "Mía", "Chloe", "Paula", "Olivia"];

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return h >>> 0;
}

export function readChildren(flags: Flags | null | undefined): Child[] {
  const raw = flags?.hijos_info;
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as Child[];
    return Array.isArray(parsed) ? parsed.filter((c) => c && typeof c.n === "string") : [];
  } catch {
    return [];
  }
}

export function childCount(flags: Flags | null | undefined): number {
  // Partidas anteriores a este registro: si hay `hijos`, al menos hay uno.
  return Math.max(readChildren(flags).length, parseInt(String(flags?.hijos_n ?? "0"), 10) || 0, flags?.hijos ? 1 : 0);
}

/** El ritmo de ESTA carrera: edad del primero (27-29), cuántos hijos tendrá en total (1-4) y los huecos entre ellos (20-30 turnos). */
export function childPlan(playerId: string): { startAge: number; total: number; gaps: number[] } {
  const startAge = 27 + (hash(`${playerId}:hijo:edad`) % 3);
  // Reparto: 1 hijo (25 %), 2 (40 %), 3 (25 %), 4 (10 %).
  const r = hash(`${playerId}:hijo:total`) % 100;
  const total = r < 25 ? 1 : r < 65 ? 2 : r < 90 ? 3 : 4;
  const gaps = [0, 1, 2, 3].map((i) => 20 + (hash(`${playerId}:hijo:gap:${i}`) % 11));
  return { startAge, total, gaps };
}

const pickName = (playerId: string, n: number, girl: boolean) => {
  const pool = girl ? NAMES_F : NAMES_M;
  return pool[hash(`${playerId}:hijo:nombre:${n}`) % pool.length];
};

/** ¿Toca anunciar un nuevo embarazo (o el nacimiento del que está en camino)? Solo con pareja estable y de forma gradual. */
export function childStage(player: Player): "embarazo" | "nacimiento" | null {
  const f = player.flags ?? {};
  if (player.club === NO_CLUB_YET || player.status !== "active" || getInjuryRemaining(f) > 0) return null;
  const partner = partnerOf(f);
  if (!partner || partnerRel(f) < 45 || f.pareja_rota_ya) return null;
  const age = playerAge(player.week);
  const plan = childPlan(player.id);
  const pregWeek = parseInt(String(f.embarazo_week ?? "0"), 10) || 0;

  // Embarazo en curso: nace 8 turnos después de anunciarse (solo el de este módulo; el del banco tiene su propia cadena).
  if (f.embarazo && f.hijo_embarazo_propio) {
    return pregWeek > 0 && player.week - pregWeek >= 8 ? "nacimiento" : null;
  }
  if (f.embarazo) return null;
  const n = childCount(f);
  if (age < plan.startAge || age > 41 || n >= plan.total) return null;
  const since = parseInt(String(f.club_since ?? "0"), 10) || 0;
  if (since > 0 && player.week - since < 4) return null;
  // El PRIMERO: a partir de los 27-29 años, con una pareja estable que lleve un tiempo contigo. Si lo habías pospuesto en la
  // conversación, no se te impone enseguida: tres años después.
  if (n === 0) {
    if (partnerRel(f) < 60) return null;
    const postponed = f.p3_hijos === "luego" || f.p3_hijos === "dudo";
    if (postponed && age < plan.startAge + 3) return null;
    return Math.random() < 0.22 ? "embarazo" : null;
  }
  // Los siguientes: ha pasado el hueco de esta carrera (2-3 temporadas desde el último nacimiento).
  const last = parseInt(String(f.hijo_last_week ?? "0"), 10) || 0;
  if (last > 0 && player.week - last < plan.gaps[Math.min(n - 1, plan.gaps.length - 1)]) return null;
  return Math.random() < 0.4 ? "embarazo" : null;
}

export function buildChildEvent(player: Player, stage: "embarazo" | "nacimiento"): GameEvent {
  const partner = partnerOf(player.flags) ?? "tu pareja";
  const name = partnerFirstName(partner);
  const n = childCount(player.flags) + 1;
  const week = player.week;
  if (stage === "embarazo") {
    return {
      id: `hijo-embarazo-${n}`,
      category: "vida",
      title: n === 1 ? "Vais a ser padres" : n === 2 ? "Vais a ser padres otra vez" : `Va a haber otro en casa (el número ${n})`,
      description:
        n === 1
          ? `${name} te espera en el salón con un sobre en las manos y los ojos muy abiertos. Dentro, una ecografía en blanco y negro con una mancha pequeña y un latido. «Vamos a ser tres», dice. Te sientas despacio. Lo has imaginado mil veces y no se parece en nada.`
          : `${name} te espera en el salón con una sonrisa que ya conoces. No hace falta que diga nada: lo has visto antes. «Otra vez —dice—. Esta vez sé cómo funciona… y aun así me da el mismo vértigo». Tu hijo mayor, ajeno a todo, construye una torre de bloques en la alfombra.`,
      options: [
        { id: "a", label: "Abrazarla y decirle que no podías estar más contento", subtitle: "Ilusión desbordada", consequences: { moral: 9, flags: { embarazo: true, embarazo_week: String(week), hijo_embarazo_propio: true, pareja_delta: "6" } }, outcomeText: `La levantas del suelo y la haces girar, y ella se ríe y te pide que la sueltes. Esa noche, mirando el techo, calculas cuántas habitaciones hacen falta. «Ya compraremos una casa más grande», murmura ${name}. Os dormís planeando.` },
        { id: "b", label: "Celebrarlo pero hablar con calma de cómo organizaros", subtitle: "Pensar en todo", consequences: { moral: 5, flags: { embarazo: true, embarazo_week: String(week), hijo_embarazo_propio: true, pareja_delta: "3" } }, outcomeText: `Habláis de calendarios, de ayuda en casa, de la guardería. ${name} suspira al final: «Sí, pero primero abrázame». Lo hacéis. Mañana será otro día.` },
        { id: "c", label: "Quedarte pálido y pedir un minuto para respirar", subtitle: "El vértigo", consequences: { moral: 2, flags: { embarazo: true, embarazo_week: String(week), hijo_embarazo_propio: true, pareja_delta: "-2" } }, outcomeText: `Te quedas mirando la pared un buen rato. ${name} te da una palmada en la espalda: «Tranquilo, papá». Y tardas una hora en volver a reírte. Cuando lo haces, ya no puedes parar.` },
      ],
    };
  }
  const girl = hash(`${player.id}:hijo:sexo:${n}`) % 2 === 0;
  const twins = hash(`${player.id}:hijo:mellizos:${n}`) % 100 < 8;
  const first = pickName(player.id, n, girl);
  const second = twins ? pickName(player.id, n + 7, !girl) : "";
  const nombres = twins ? `${first} y ${second}` : first;
  const birthFlags = { embarazo: "", embarazo_week: "", hijo_embarazo_propio: "", hijo_last_week: String(week), hijos: true as boolean };
  const bebe = twins ? "mellizos" : girl ? "una niña" : "un niño";
  return {
    id: `hijo-nacimiento-${n}`,
    category: "especial",
    title: twins ? "Mellizos: la casa se queda pequeña" : n === 1 ? "Nace tu primer hijo" : n === 2 ? "Tu segundo hijo llega al mundo" : `El número ${n}: otro bebé en casa`,
    description: `Las contracciones empiezan en plena semana de partido. ${name} te llama ${n === 1 ? "con la voz temblorosa de quien no sabe qué viene" : "con la voz serena de quien ya lo ha hecho antes"}. En el paritorio ${n === 1 ? "todo es nuevo y enorme: no sabes dónde ponerte ni qué hacer con las manos" : "esta vez todo tiene otro ritmo: sabes dónde sentarte, qué decir, cuándo callarte"}. Y entonces llega: ${bebe}${twins ? "; dos a la vez, que nadie había visto venir" : ""}. Te lo ponen en el pecho y el mundo vuelve a quedarse en silencio.`,
    isMilestone: true,
    milestoneType: "carrera",
    imageScene: "Photorealistic photo of a young footballer holding his newborn baby wrapped in a blanket in a hospital room, his older child peeking at the baby, tears of joy, soft morning light, his partner smiling in the bed behind, no logos or readable text",
    options: [
      { id: "a", label: `Ponerle ${twins ? "nombres" : "nombre"}: ${nombres}`, subtitle: "Un nombre que ya estaba elegido", consequences: { moral: 12, rel_entrenador: 2, patrimonio: -1500, flags: { ...birthFlags, hijos_n: String(n - 1 + (twins ? 2 : 1)), hijos_info: JSON.stringify([...readChildren(player.flags), { n: first, w: week, ...(girl ? { f: true } : {}) }, ...(twins ? [{ n: second, w: week, ...(girl ? {} : { f: true }) }] : [])]), pareja_delta: "8" } }, outcomeText: `${nombres}. Lo dices en voz alta por primera vez y suena exactamente como tenía que sonar. Tu hijo mayor, con la nariz pegada a la cuna, murmura: «Qué pequeño». Y tú piensas, sin decirlo, que acabas de llegar a otro punto de tu vida del que ya no hay vuelta.` },
      { id: "b", label: "Hacerte primero la foto con toda la familia y subirla a redes", subtitle: "Compartirlo con todo el mundo", consequences: { moral: 10, fama: 3, rel_aficion: 3, patrimonio: -1500, flags: { ...birthFlags, hijos_n: String(n - 1 + (twins ? 2 : 1)), hijos_info: JSON.stringify([...readChildren(player.flags), { n: first, w: week, ...(girl ? { f: true } : {}) }, ...(twins ? [{ n: second, w: week, ...(girl ? {} : { f: true }) }] : [])]), pareja_delta: "6" } }, outcomeText: `La foto —tú, ${name}, el hermano mayor y el bebé— corre por las redes en minutos. La afición llena los comentarios de corazones y de bufandas del club diminutas. ${nombres} ya tiene más seguidores que la mayoría de los amigos del vestuario.` },
    ],
  };
}

/** Tras el nacimiento del primero (escena del banco), se anotan su nombre y su fecha para que los demás hijos y Vida cuenten bien. */
export function firstChildPatch(player: Pick<Player, "id" | "week" | "flags">): Flags {
  if (childCount(player.flags) > 0) return {};
  const girl = hash(`${player.id}:hijo:sexo:1`) % 2 === 0;
  const info: Child[] = [{ n: pickName(player.id, 1, girl), w: player.week, ...(girl ? { f: true } : {}) }];
  return { hijos_n: "1", hijos_info: JSON.stringify(info), hijo_last_week: String(player.week), embarazo_week: "" };
}

/** Edad en años de un hijo (10 turnos = un año de juego). */
export function childAgeYears(child: Child, week: number): number {
  return Math.max(0, Math.floor((week - child.w) / 10));
}
