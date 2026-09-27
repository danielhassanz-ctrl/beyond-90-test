import type { GameEvent } from "@/types/career";
import { MODE_TARGET_WEEKS } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getNpcName } from "@/lib/narrative/npcs";

/**
 * Arco narrativo: tu hermano también quiere ser futbolista y su historia
 * avanza en paralelo a la tuya. Patrón real y muy humano — el hermano
 * pequeño que persigue el mismo sueño a la sombra del que ya lo consiguió,
 * con toda la mezcla de orgullo, presión y comparación que eso trae.
 *
 * Usa el rol "hermano" ya existente en npcs.ts (nombre estable para toda
 * la carrera, comparte tu primer apellido) — no hace falta inventar un
 * personaje nuevo, ya vive en el sistema de nombres del juego.
 *
 * 4 capítulos:
 *   0. Tu hermano te confiesa que también quiere intentarlo.
 *   1. Su primera prueba en una academia (desenlace incierto).
 *   2. El momento de la verdad: firma su primer contrato... o no.
 *   3. Cierre, distinto según el capítulo 2: debut como profesional
 *      (hito compartible) o encuentra su camino fuera del fútbol
 *      (cierre emotivo, sin foto — no es tu logro, es el suyo en privado).
 */

const FASE_MAX = 4;

function getFase(player: Player): number {
  return Number(player.flags?.arco_hermano_fase ?? 0);
}

function targetWeek(player: Player, fraction: number): number {
  return Math.round(MODE_TARGET_WEEKS[player.mode] * fraction);
}

export function shouldTriggerArcoHermano(player: Player): boolean {
  if (player.club === NO_CLUB_YET) return false;
  // Igual que arco-rival: en modo Express (20 semanas) casi nunca hay
  // tiempo de cerrar las 4 fases (medido: 2 de cada 50 simuladas).
  if (player.mode === "express") return false;
  const fase = getFase(player);
  if (fase >= FASE_MAX) return false;

  const umbrales = [0.1, 0.3, 0.5, 0.7];
  if (player.week < targetWeek(player, umbrales[fase])) return false;

  const lastWeek = Number(player.flags?.arco_hermano_last_week ?? 0);
  const minGap = Math.max(4, Math.round(MODE_TARGET_WEEKS[player.mode] * 0.12));
  if (lastWeek > 0 && player.week - lastWeek < minGap) return false;

  if (fase === 0 && (player.fama ?? 0) < 5) return false;

  const chance = [0.15, 0.18, 0.18, 0.16][fase];
  return Math.random() < chance;
}

export function buildArcoHermanoEvent(player: Player): GameEvent {
  const fase = getFase(player);
  const week = player.week;
  const hermano = getNpcName(player, "hermano");
  const flags = { arco_hermano_fase: String(fase + 1), arco_hermano_last_week: String(week) };

  if (fase === 0) {
    return {
      id: `arco-hermano-1-${week}`,
      category: "vida",
      title: "Tu hermano también quiere intentarlo",
      description: `${hermano} te para en la cocina, nervioso, como si llevara días ensayando la frase: "Yo también quiero ser futbolista. Y quiero que me ayudes." Te mira esperando algo más que una respuesta educada.`,
      options: [
        { id: "0", label: "Prometerle todo tu apoyo", subtitle: "Estar ahí de verdad", consequences: { moral: 4, flags } },
        { id: "1", label: "Avisarle de lo dura que es esta vida", subtitle: "Realismo antes que ilusión", consequences: { moral: 1, flags } },
        { id: "2", label: "Reaccionar con cierta frialdad", subtitle: "Ya tienes bastante con lo tuyo", consequences: { moral: -2, flags } },
      ],
      allowFreeText: true,
      freeTextPrompt: `¿Qué le respondes exactamente a ${hermano}?`,
    };
  }

  if (fase === 1) {
    return {
      id: `arco-hermano-2-${week}`,
      category: "vida",
      title: "La primera prueba de tu hermano",
      description: `${hermano} tiene mañana una prueba en una academia de la zona. Se ha pasado la noche sin dormir de los nervios y te pide, sin decirlo del todo, que le acompañes.`,
      options: [
        {
          id: "0",
          label: "Ir con él y darle ánimo antes de entrar",
          subtitle: "Estar presente",
          consequences: { flags },
          resolve: {
            baseChance: 0.55,
            success: { text: `${hermano} hace una prueba sólida y le llaman para seguir el proceso. Sales de allí más orgulloso de lo que esperabas.`, consequences: { moral: 5, flags } },
            fail: { text: `${hermano} se pone nervioso en cuanto empieza y no rinde a su nivel. Vuelve a casa en silencio todo el camino.`, consequences: { moral: -3, flags } },
          },
        },
        { id: "1", label: "Pagarle una preparación física antes de la prueba", subtitle: "Darle una ventaja real", consequences: { patrimonio: -1500, moral: 2, flags } },
        { id: "2", label: "Dejar que lo afronte completamente solo", subtitle: "Que se lo gane por sí mismo", consequences: { moral: -1, flags } },
      ],
    };
  }

  if (fase === 2) {
    return {
      id: `arco-hermano-3-${week}`,
      category: "vida",
      title: "El momento de la verdad para tu hermano",
      description: `Después de meses de proceso, hoy es el día en que un club decide si le ofrece a ${hermano} un contrato de canterano o le da las gracias por el interés. Te llama nada más salir de la reunión, con la voz rara.`,
      options: [
        {
          id: "0",
          label: "Escucharlo con calma antes de reaccionar",
          subtitle: "Sea lo que sea",
          consequences: {},
          resolve: {
            baseChance: 0.5,
            success: { text: `Firma. ${hermano} llora al otro lado del teléfono y tú también, aunque disimules. Empieza su carrera de verdad.`, consequences: { moral: 6, flags: { ...flags, arco_hermano_outcome: "pro" } } },
            fail: { text: `No le ofrecen nada. ${hermano} está destrozado, pero ya habla de "intentarlo en otro sitio, o quizás en otra cosa".`, consequences: { moral: -4, flags: { ...flags, arco_hermano_outcome: "quit" } } },
          },
        },
        { id: "1", label: "Ofrecerle presentarle a tu representante", subtitle: "Mover algún contacto", consequences: { rel_representante: -1, moral: 2, flags } },
      ],
    };
  }

  // Fase 3: cierre, distinto según el desenlace del capítulo anterior.
  const outcome = String(player.flags?.arco_hermano_outcome ?? "pro");
  if (outcome === "quit") {
    return {
      id: `arco-hermano-4-quit-${week}`,
      category: "vida",
      title: "Tu hermano encuentra su camino",
      description: `${hermano} te cuenta, con más paz de la que esperabas, que ha decidido dejar el fútbol y estudiar algo que siempre le había gustado en secreto. "No todos tenemos que ser tú", te dice, sin rencor.`,
      options: [
        { id: "0", label: "Decirle que estás orgulloso igualmente", subtitle: "El fútbol no es lo único que importa", consequences: { moral: 5, flags } },
        { id: "1", label: "Ofrecerte a pagarle los estudios", subtitle: "Un gesto concreto", consequences: { patrimonio: -3000, moral: 4, flags } },
        { id: "2", label: "Insistir en que no tire la toalla con el fútbol", subtitle: "Cuesta soltarlo", consequences: { moral: -1, flags } },
      ],
    };
  }
  return {
    id: `arco-hermano-4-pro-${week}`,
    category: "vida",
    title: "Tu hermano debuta como profesional",
    description: `${hermano} salta al campo por primera vez con la camiseta de su nuevo equipo. Desde la grada, grabando con el móvil temblando, piensas en todas las veces que jugasteis juntos en el patio de casa.`,
    isMilestone: true,
    milestoneType: "hermano_debut",
    imageScene:
      "Photorealistic photo of the photographed man in the stands, emotional, filming with his phone, watching a football match below, family pride moment, natural stadium lighting, photorealistic",
    options: [
      { id: "0", label: "Ir a verlo en persona, cueste lo que cueste", subtitle: "No te lo puedes perder", consequences: { moral: 7, flags } },
      { id: "1", label: "Mandarle un mensaje de apoyo antes del partido", subtitle: "No puedes llegar a tiempo", consequences: { moral: 4, flags } },
      { id: "2", label: "Compartirlo con orgullo en tus redes", subtitle: "Que todos lo sepan", consequences: { moral: 5, fama: 2, flags } },
    ],
  };
}
