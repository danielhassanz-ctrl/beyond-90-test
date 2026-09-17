import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { getNpcName } from "@/lib/narrative/npcs";
import { NO_CLUB_YET } from "@/lib/constants";

/**
 * Frase de prensa y opinión del entrenador para la cabecera de "Historia"
 * — calcado del prototipo de referencia, que mostraba una cita fija de
 * prensa y un aviso de relación en cada pantalla. A diferencia de esa
 * referencia (sitio estático sin backend, la cita nunca cambiaba), aquí
 * se deriva de las estadísticas reales del jugador y rota con las
 * semanas — sin gastar ninguna llamada a la IA, es solo texto elegido
 * según fama/media/relación.
 */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick(pool: string[], seed: string): string {
  return pool[hashString(seed) % pool.length];
}

export function getPressQuote(player: Player): string {
  const seed = `${player.id}:prensa:${Math.floor(player.week / 10)}`;
  // La prensa real usa apodos con normalidad ("la Pulga", "el Niño") —
  // más auténtico aquí que el apellido formal.
  const name = displayName(player);
  const club = player.club;

  if (club === NO_CLUB_YET) {
    return pick(
      [
        `"${name} sigue sonando en despachos, pero todavía no ha firmado por nadie."`,
        `"Varios clubes preguntan por ${name}. De momento, sigue sin equipo."`,
        `"El mercado observa a ${name} de cerca a la espera de que firme su primer contrato."`,
      ],
      seed,
    );
  }

  if (player.fama >= 75) {
    return pick(
      [
        `"${name} ya no es una promesa: es una realidad en ${club}."`,
        `"Cuando ${name} coge el balón, todo el estadio lo nota."`,
        `"${club} tiene en ${name} a uno de los suyos de verdad."`,
      ],
      seed,
    );
  }
  if (player.fama >= 45) {
    return pick(
      [
        `"${name} va ganándose el sitio en ${club}, partido a partido."`,
        `"Todavía no es titular indiscutible, pero ${name} convence."`,
        `"${club} confía en ${name} para el proyecto a medio plazo."`,
      ],
      seed,
    );
  }
  return pick(
    [
      `"${club} protege a ${name}: paciencia y minutos medidos."`,
      `"${name} sigue esperando su oportunidad en ${club}."`,
      `"Nadie habla todavía de ${name} fuera de ${club}, pero el club cree en él."`,
    ],
    seed,
  );
}

export function getCoachOpinion(player: Player): string {
  const coachName = getNpcName(player, "entrenador");
  const value = player.rel_entrenador;

  if (value >= 75) return `${coachName} confía en ti sin fisuras: eres de los primeros nombres en su lista.`;
  if (value >= 55) return `${coachName} está contento con tu progresión — sin sorpresas, así le gusta.`;
  if (value >= 35) return `${coachName} te ve como una opción, no todavía como una certeza.`;
  if (value >= 15) return `${coachName} necesita ver algo más de ti pronto para confiar del todo.`;
  return `La relación con ${coachName} está rota. Toca reconstruirla desde cero.`;
}
