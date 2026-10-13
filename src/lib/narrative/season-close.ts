/**
 * Cierre de temporada escrito en código: la red de seguridad para cuando la IA no puede escribir la escena (sin
 * presupuesto o sin respuesta). El cierre de temporada no puede faltar nunca: es el momento en que se cumple un año, se
 * enseña la tarjeta de resumen compartible y arranca la pretemporada. Mismo id que la versión de IA ("preseason-N").
 */
import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { playerAge, seasonLabel, WEEKS_PER_SEASON } from "@/types/career";
import { getNpcName } from "@/lib/narrative/npcs";
import { cityOfClub } from "@/lib/narrative/events";

const pick = <T,>(arr: readonly T[], seed: number): T => arr[Math.abs(seed) % arr.length];

export function buildSeasonCloseEvent(player: Player, season: number): GameEvent {
  const age = playerAge(player.week);
  const club = player.club;
  const city = cityOfClub(club);
  const mister = getNpcName(player, "entrenador");
  const closed = seasonLabel((season - 1) * WEEKS_PER_SEASON + 1);
  const seed = season * 31 + (player.last_name?.length ?? 3);

  const arranques = [
    `Vuelves a pisar la ciudad deportiva de ${club} con una temporada menos en las piernas y un año más en el carnet: ${age} años. Huele a césped recién cortado y a taquilla recién abierta.`,
    `Se acaba el verano y vuelven las instalaciones de ${club}, el olor a pomada y el chándal nuevo. Has cumplido ${age} años y notas que cada pretemporada pesa distinto.`,
    `Primer día de trabajo en ${city}: balones nuevos, caras nuevas y un cartel en la puerta que pone «Bienvenidos». Cumples ${age} años y el vestuario ya te trata de otra manera.`,
  ];
  const motivos = [
    `${mister} reúne a la plantilla en el césped y resume la temporada que acaba de pasar en dos frases. «Lo que hicimos no vale para este año», dice. «Empezamos de cero».`,
    `${mister} te saluda con un apretón seco y un «a trabajar». Sabes que cada pretemporada es una entrevista de trabajo para el sitio de titular.`,
    `${mister} pone el balón en el centro del círculo y no dice nada durante diez segundos. Después: «Quien quiera jugar este año, que se lo gane hoy».`,
  ];

  return {
    id: `preseason-${season}`,
    category: "entrenamiento",
    title: `Cierra la temporada ${closed} y arranca la pretemporada`,
    description: `${pick(arranques, seed)} ${pick(motivos, seed + 1)}`,
    milestoneType: "pretemporada",
    allowFreeText: true,
    freeTextPrompt: "¿Qué te prometes a ti mismo para esta temporada?",
    options: [
      {
        id: "a",
        label: "Volver con hambre: quieres más que el año pasado",
        subtitle: "Empezar fuerte",
        consequences: { forma: 3, moral: 3, rel_entrenador: 1 },
        outcomeText: `Eres el primero en llegar y el último en irte. ${mister} lo anota sin decir nada, y en el segundo entrenamiento ya te sitúa en el primer grupo.`,
      },
      {
        id: "b",
        label: "Volver con calma: la misma rutina de siempre",
        subtitle: "Sin prisas ni promesas",
        consequences: { forma: 2, moral: 2, rel_vestuario: 2 },
        outcomeText: "Sin discursos ni grandes promesas: vuelves a las series, a las charlas de pasillo y a las cenas de grupo. A veces lo mejor es que todo siga igual.",
      },
    ],
  };
}
