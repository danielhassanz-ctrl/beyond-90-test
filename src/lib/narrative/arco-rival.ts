import type { GameEvent } from "@/types/career";
import { MODE_TARGET_WEEKS } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getPersonName } from "@/lib/narrative/npcs";
import { canPlayNow } from "@/lib/narrative/state-rules";

/**
 * Arco narrativo de varios capítulos: el compañero de la misma quinta con
 * el que creciste dando patadas al mismo balón, cuya carrera avanza (o se
 * tuerce) en paralelo a la tuya durante años. Patrón real muy conocido en
 * el fútbol — dos canteranos del mismo pueblo o academia que acaban en
 * caminos muy distintos y se vuelven a cruzar en los momentos grandes.
 *
 * 4 capítulos, cada uno un evento normal (no un partido simulado aparte):
 *   0. Se marcha a probar suerte y firma su primer contrato en otro sitio.
 *   1. Vuestros clubes se cruzan en un partido "de los que se marcan en rojo".
 *   2. Se sabe cómo le está yendo a él, en paralelo a cómo te va a ti.
 *   3. El duelo grande (una final) — capítulo cierre, hito compartible.
 *
 * El nombre del rival es fijo para toda la carrera del jugador (semilla
 * sin semana ni club, a diferencia de "rival_puesto" en npcs.ts, que SÍ
 * cambia de club en club — aquí el rival tiene que seguir siendo la
 * MISMA persona aunque tú cambies de equipo diez veces).
 */

const FASE_MAX = 4;

function getFase(player: Player): number {
  return Number(player.flags?.arco_rival_fase ?? 0);
}

function getRivalName(player: Player): string {
  return getPersonName(player, "arco-rival-identidad", "m");
}

/**
 * Los huecos entre capítulos se calculan como fracción de la duración
 * total del modo de carrera (20/90/200 semanas) en vez de semanas fijas
 * — con semanas fijas, este arco jamás habría podido completarse en modo
 * Express (20 semanas totales), y el capítulo 4 pedía semana 60+.
 */
function targetWeek(player: Player, fraction: number): number {
  return Math.round(MODE_TARGET_WEEKS[player.mode] * fraction);
}

export function shouldTriggerArcoRival(player: Player): boolean {
  if (player.club === NO_CLUB_YET) return false;
  // Un arco de 4 capítulos necesita margen real entre cada uno; en modo
  // Express (20 semanas en total) casi nunca llega a cerrarse antes de
  // que la carrera termine (medido: se completa en 1 de cada 50 carreras
  // simuladas) — mejor no arrancarlo que dejarlo siempre a medias.
  if (player.mode === "express") return false;
  // Los capítulos 2 y 3 son partidos: hay que poder jugarlos.
  if (!canPlayNow(player)) return false;
  const fase = getFase(player);
  if (fase >= FASE_MAX) return false;

  const umbrales = [0.12, 0.35, 0.6, 0.82];
  if (player.week < targetWeek(player, umbrales[fase])) return false;

  const lastWeek = Number(player.flags?.arco_rival_last_week ?? 0);
  const minGap = Math.max(4, Math.round(MODE_TARGET_WEEKS[player.mode] * 0.15));
  if (lastWeek > 0 && player.week - lastWeek < minGap) return false;

  if (fase === 0 && (player.fama ?? 0) < 8) return false;
  if (fase === 1 && (player.fama ?? 0) < 15) return false;

  const chance = [0.14, 0.16, 0.16, 0.14][fase];
  return Math.random() < chance;
}

export function buildArcoRivalEvent(player: Player): GameEvent {
  const fase = getFase(player);
  const week = player.week;
  const rival = getRivalName(player);
  const flags = { arco_rival_fase: String(fase + 1), arco_rival_last_week: String(week) };

  if (fase === 0) {
    return {
      id: `arco-rival-1-${week}`,
      category: "vida",
      title: "El compañero que se marchó a probar suerte",
      description: `Te llega la noticia por un grupo de wasap de la cantera: ${rival}, con quien creciste dando patadas al mismo balón en el mismo campo de tierra, acaba de firmar su primer contrato profesional. Nadie de aquel grupo pensó que sería él el primero.`,
      options: [
        { id: "0", label: "Alegrarte de verdad por él", subtitle: "Sin sombra de envidia", consequences: { moral: 2, flags } },
        { id: "1", label: "Sentir una punzada de envidia", subtitle: "Humano, aunque no te guste", consequences: { moral: -1, forma: 2, flags } },
        { id: "2", label: "Usarlo como motivación pura", subtitle: "Que sea la última vez que va por delante", consequences: { forma: 3, moral: 1, flags } },
      ],
    };
  }

  if (fase === 1) {
    return {
      id: `arco-rival-2-${week}`,
      category: "partido",
      title: "Cara a cara con tu rival de siempre",
      description: `El calendario os enfrenta: tu club y el de ${rival} se cruzan en un partido de los que se marcan en rojo. Todo el entorno lo vende como el duelo entre los dos chavales de aquel mismo barrio.`,
      options: [
        { id: "0", label: "Buscarlo antes del partido para saludarlo", subtitle: "Deportividad primero", consequences: { rel_aficion: 1, moral: 1, flags } },
        {
          id: "1",
          label: "Salir a demostrarle quién manda",
          subtitle: "Sin medias tintas",
          consequences: { flags },
          resolve: {
            baseChance: 0.5,
            statModifier: "forma",
            success: { text: "Le ganas el duelo personal con un partidazo. Los resúmenes solo hablan de ti.", consequences: { fama: 5, moral: 4, forma: 2, flags } },
            fail: { text: "Es él quien decide el partido esta vez. Te felicita con deportividad, lo que te sabe aún peor.", consequences: { moral: -4, fama: 1, flags } },
          },
        },
        { id: "2", label: "Evitar cualquier contacto antes del partido", subtitle: "Concentración total", consequences: { forma: 1, flags } },
      ],
    };
  }

  if (fase === 2) {
    const media = player.media ?? 50;
    const desc =
      media >= 68
        ? `Te enteras por un antiguo compañero común: ${rival} está pasando un mal momento, fuera del equipo titular y con la prensa de su ciudad pidiendo su cabeza. Te acuerdas de cuando erais dos chavales soñando lo mismo.`
        : media <= 48
          ? `${rival} concede una entrevista donde, preguntado por ti, dice sentirse "afortunado por cómo le está yendo la vida ahora mismo". No hace falta que diga más para que te duela.`
          : `Una revista deportiva os pone lado a lado en una comparativa de estadísticas. Empatados casi en todo, como aquellos veranos de críos.`;
    return {
      id: `arco-rival-3-${week}`,
      category: "prensa",
      title: "Lo que le está pasando a tu rival de siempre",
      description: desc,
      options: [
        { id: "0", label: "Escribirle un mensaje sincero", subtitle: "Más allá de la rivalidad", consequences: { moral: 3, reputacion: 2, flags } },
        { id: "1", label: "Guardar las distancias", subtitle: "Cada uno a lo suyo", consequences: { flags } },
        { id: "2", label: "Dejar que la comparación te pique", subtitle: "Y responder en el campo", consequences: { forma: 3, flags } },
      ],
      allowFreeText: true,
      freeTextPrompt: `Si le escribes a ${rival}, ¿qué le dices?`,
    };
  }

  // Fase 3: capítulo de cierre.
  return {
    id: `arco-rival-4-${week}`,
    category: "partido",
    title: "El duelo que todos esperaban",
    description: `Vuestros caminos se cruzan una vez más, esta vez en algo mucho más grande que un partido cualquiera: una final. Después de tantos años, tú y ${rival} coincidís otra vez en el mismo campo, en lados opuestos.`,
    isMilestone: true,
    milestoneType: "duelo_rival",
    imageScene:
      "Photorealistic photo of the photographed man and a rival player embracing on the pitch after a big final, stadium lights, respectful sportsmanship moment, photorealistic sports photography",
    options: [
      {
        id: "0",
        label: "Jugar el partido de tu vida",
        subtitle: "Todo lo que tienes",
        consequences: { flags },
        resolve: {
          baseChance: 0.5,
          statModifier: "forma",
          success: {
            text: `Ganas tú, gana tu equipo, y ganas la conversación que llevas años teniendo contigo mismo. El abrazo con ${rival} al final del partido dice más que cualquier titular.`,
            consequences: { fama: 8, moral: 8, reputacion: 3, flags },
            isWin: true,
          },
          fail: {
            text: `Pierdes la final, pero no la relación: ${rival} te busca después del partido para reconocerte el nivel. Una rivalidad de años no cabe en un marcador.`,
            consequences: { fama: 3, moral: -4, flags },
          },
        },
      },
      { id: "1", label: "Vivirlo con la cabeza fría, sin dramatizar", subtitle: "Es solo un partido más", consequences: { forma: 1, moral: 1, flags } },
      { id: "2", label: "Pedirle la camiseta después, gane quien gane", subtitle: "El resultado ya da igual", consequences: { moral: 3, rel_aficion: 1, flags } },
    ],
  };
}
