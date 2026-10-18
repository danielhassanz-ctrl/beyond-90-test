/**
 * EL PLAN DE ENTRENAMIENTO. Cada pretemporada el preparador y el míster te dejan elegir en qué trabajar esta temporada: un
 * atributo concreto (el que más falta te hace o el que más disfrutas), un plan intensivo que arriesga una sobrecarga o un año de
 * recuperación. Lo que eliges mejora ese atributo de verdad (se ve en tu perfil), cuesta algo de forma y puede subir tu media.
 */
import type { EventOption, GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getNpcName } from "@/lib/narrative/npcs";
import { getAttributes, trainableFor, trainedKey, MAX_TRAINED, profileSummary, type AttrKey } from "@/lib/narrative/attributes";
import { goalsEventId } from "@/lib/narrative/season-goals";

export const trainingPlanId = (season: number) => `entrenamiento-plan-${season}`;

const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;

export function shouldTriggerTrainingPlan(player: Player, usedEventIds: readonly string[]): boolean {
  if (player.club === NO_CLUB_YET || player.status !== "active" || player.club.startsWith("SELECCIÓN:")) return false;
  const season = Math.floor((player.week - 1) / 10);
  const turn = ((player.week - 1) % 10) + 1;
  if (season < 1 || turn < 2 || turn > 6 || playerAge(player.week) < 16) return false;
  if (usedEventIds.includes(trainingPlanId(season)) || player.flags?.[`tp_${season}`]) return false;
  // Después del resumen de temporada y de fijar los objetivos (si toca): el plan de trabajo responde a las metas.
  if (!usedEventIds.includes(`preseason-${season}`)) return false;
  return usedEventIds.includes(goalsEventId(season)) || turn >= 4;
}

const WHY: Record<AttrKey, string> = {
  ritmo: "cada metro que ganes en velocidad vale un gol",
  tiro: "más definición y menos disparos al cielo",
  pase: "ver el pase antes y ejecutarlo mejor",
  regate: "más recursos en el uno contra uno",
  defensa: "duelos, anticipación y lectura del juego",
  fisico: "llegar entero al minuto noventa",
  reflejos: "las paradas de instinto que ganan partidos",
  estirada: "alcanzar lo que parecía imposible",
  saque: "empezar la jugada desde atrás con precisión",
  salidas: "dominar el área en los balones aéreos",
  colocacion: "estar siempre donde llega el balón",
};

export function buildTrainingPlanEvent(player: Player): GameEvent {
  const season = Math.floor((player.week - 1) / 10);
  const coach = getNpcName(player, "entrenador");
  const fisio = getNpcName(player, "fisio");
  const attrs = getAttributes(player);
  const { best, worst } = profileSummary(attrs);
  const age = playerAge(player.week);
  const week = player.week;
  const trainable = trainableFor(player);
  const lowest = [...attrs].sort((a, b) => a.value - b.value);
  // Dos atributos a trabajar: el más flojo y el más valioso del perfil (los que no estén ya al máximo entrenable).
  const room = (k: AttrKey) => num(player.flags?.[trainedKey(k)]) < MAX_TRAINED;
  const picks = [lowest.find((a) => room(a.key) && a.key !== "fisico") ?? lowest[0], [...attrs].sort((a, b) => b.value - a.value).find((a) => room(a.key) && a.key !== lowest[0].key) ?? best].filter((a, i, arr) => arr.findIndex((x) => x.key === a.key) === i);
  const labelOf = (k: AttrKey) => trainable.find((t) => t.key === k)?.label ?? k;
  const mark = { [`tp_${season}`]: true };
  const gain = (key: AttrKey, pts: number) => ({ [trainedKey(key)]: String(Math.min(MAX_TRAINED, num(player.flags?.[trainedKey(key)]) + pts)) });

  const options: EventOption[] = picks.map((a, i) => ({
    id: i === 0 ? "a" : "b",
    label: `Trabajar el ${a.label.toLowerCase()}${i === 0 ? " (tu punto débil)" : " (tu punto fuerte)"}`,
    subtitle: `${a.label} ${a.value} · +${i === 0 ? 4 : 3} esta temporada`,
    consequences: { forma: -3, moral: i === 0 ? 1 : 2, rel_entrenador: 1, flags: { ...mark, ...gain(a.key, i === 0 ? 4 : 3), tp_foco: a.key } },
    outcomeText: `${coach} te prepara un plan a medida: ${WHY[a.key]}. Tres sesiones extra por semana, vídeos de tus errores y una libreta donde apuntas cada avance. ${i === 0 ? "No es lo que más te gusta, pero es lo que más te falta." : "Lo que ya haces bien, hecho muy bien, es lo que decide partidos."}`,
  }));

  options.push({
    id: "c",
    label: "Plan intensivo: doble sesión y trabajo específico",
    subtitle: "Mucho a ganar, con riesgo de sobrecarga",
    consequences: {},
    resolve: {
      baseChance: Math.max(0.35, Math.min(0.7, 0.62 - Math.max(0, age - 27) * 0.03 + ((player.forma ?? 60) - 60) / 200)),
      statModifier: "forma",
      success: {
        text: `${coach} y ${fisio} diseñan un plan exigente y tú lo cumples a rajatabla. Llegas a diciembre con otro cuerpo y otra cabeza: ${labelOf(worst.key)} y ${labelOf(picks[picks.length - 1].key)} suben de forma visible.`,
        consequences: { forma: -2, moral: 3, media: 1, rel_entrenador: 2, flags: { ...mark, ...gain(worst.key, 3), ...gain(picks[picks.length - 1].key, 3), tp_foco: "intensivo" } },
      },
      fail: {
        text: `Te pasas de rosca. A las seis semanas, ${fisio} te para: sobrecarga en los isquiotibiales y una racha de partidos con las piernas de madera. Algo mejoras, pero pagas la factura.`,
        consequences: { forma: -9, moral: -3, rel_entrenador: -1, flags: { ...mark, ...gain(worst.key, 1), tp_foco: "intensivo", estado_bache: String(week + 2) } },
      },
    },
  });

  options.push({
    id: "d",
    label: "Un año de mantenimiento: cuidar el cuerpo",
    subtitle: "Sin ganancias, pero llegas fresco",
    consequences: { forma: 5, moral: 1, flags: { ...mark, tp_foco: "descanso" } },
    outcomeText: `${fisio} lo ve claro: «A veces lo más profesional es no hacer de más». Trabajas con medida, duermes mejor y llegas a los partidos con las piernas descansadas. No mejoras nada nuevo, pero tampoco te rompes.`,
  });

  return {
    id: trainingPlanId(season),
    category: "especial",
    title: "Tu plan de entrenamiento de la temporada",
    description: `${coach} y ${fisio} te enseñan tu perfil en una pantalla del gimnasio: tu mejor atributo es el ${best.label.toLowerCase()} (${best.value}) y el que más te falta, el ${worst.label.toLowerCase()} (${worst.value}). «Esta temporada, ¿en qué quieres trabajar?», pregunta el míster. Hay horas para una cosa bien hecha, no para todo.`,
    options,
  };
}
