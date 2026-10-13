/**
 * La despedida cuando fichas por otro club. Antes era una sola frase («abrazos sinceros… y alguna mirada fría») que se
 * repetía en cada traspaso. Ahora se compone con lo que de verdad ha pasado: cómo te llevas con el vestuario y con la
 * afición, cuánto llevas en el club, si eras el capitán y los títulos que has ganado allí, y la variante cambia en
 * cada salida (el índice avanza con el número de clubes por los que has pasado).
 */
import type { Player } from "@/types/player";
import { readTrofeos, INDIVIDUAL } from "@/lib/honours";
import { canonicalClub } from "@/lib/calendar/leagues";
import { getNpcName } from "@/lib/narrative/npcs";

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h ^ (h >>> 15)) >>> 0;
}

/** Variante estable para esta partida que cambia en cada salida (club_changes): nunca dos despedidas seguidas iguales. */
function pickFor<T>(list: readonly T[], player: Pick<Player, "id" | "flags">, slot: string): T {
  const step = parseInt(String(player.flags?.club_changes ?? "0"), 10) || 0;
  return list[(hash(`${player.id}:${slot}`) + step) % list.length];
}

const LOCKER_WARM = [
  "En el vestuario no hay quien se quede sin abrazarte: el utillero te regala las botas de entrenar «para que no se te olvide de dónde vienes».",
  "El vestuario organiza una cena de despedida sin que te enteres. Hay discursos, un vídeo con tus mejores jugadas y más de un ojo brillante.",
  "Los compañeros te hacen pasillo a la salida del último entrenamiento. Alguien empieza a cantar y acabáis todos cantando.",
  "Te dejan en la taquilla una camiseta firmada por toda la plantilla. En la espalda, con rotulador: «Vuelve cuando quieras».",
  "El capitán te agarra del cuello con cariño: «Aquí te vamos a echar mucho de menos. Allí, no te olvides de quién te hizo grande».",
];
const LOCKER_MIXED = [
  "En el vestuario unos te abrazan de verdad y otros se limitan a darte la mano. Es lo normal cuando alguien se va: todos entienden que es negocio, pero no todos lo llevan igual.",
  "Te despides uno por uno. Hay un par de bromas, un par de «ya hablaremos» que nadie cree del todo y un abrazo largo del que no te lo esperabas.",
  "La despedida es correcta: cuatro frases amables, una foto de grupo y un «mucha suerte» que suena a sincero la mitad de las veces.",
  "Recoges la taquilla entre bromas y silencios. Nadie se atreve a decir lo que todos piensan: que el equipo se queda un poco más pobre.",
];
const LOCKER_COLD = [
  "En el vestuario apenas levantan la vista del móvil. Un «suerte» a medias, un gesto con la cabeza y la puerta que se cierra con más ruido del necesario.",
  "Nadie organiza nada. Recoges la taquilla en silencio mientras dos compañeros hablan, muy alto, de otra cosa. Se nota que se alegran de que te vayas.",
  "La despedida dura lo que tarda el utillero en guardarte las botas en una bolsa. Algunos compañeros ni aparecen; los que sí, miran al suelo.",
  "Hay quien te desea suerte y quien te mira como si ya te hubieras ido hace semanas. El ambiente de las últimas semanas ha hecho su trabajo.",
];

const CAPTAIN = [
  "Le entregas el brazalete al segundo capitán delante de todos. Es un momento incómodo y precioso a partes iguales: nadie dice nada hasta que el entrenador rompe el hielo con un aplauso.",
  "Te toca despedirte también como capitán: dejas el brazalete en manos de otro y por primera vez en meses te sientes ligero… y vacío.",
  "Como capitán, das el último discurso en el vestuario. Lo preparas en el coche, lo tiras a la basura y hablas con el corazón; es el mejor que has dado nunca.",
];
const TITLES = [
  "Pasas por la sala de trofeos antes de irte. Cada copa lleva un poco de ti, y eso nadie lo va a poder quitar.",
  "En el pasillo, la foto de la celebración del título sigue colgada. Te quedas mirándola un segundo más de lo necesario.",
  "Te vas con la vitrina llena y la sensación de haber dejado el club mejor de como lo encontraste.",
];
const LONG_STAY = [
  "Llevas tanto tiempo aquí que salir del vestuario se parece a salir de casa: te sabes el camino de memoria y esta vez lo recorres despacio.",
  "Entraste siendo uno más y sales siendo parte del paisaje. En el club ya hay quien dice que esto no es un traspaso, sino una mudanza.",
  "Se acaba una etapa larga. Al pasar por el aparcamiento te das cuenta de que conoces a los guardias de seguridad por su nombre y de que ellos te conocen a ti.",
];
const SHORT_STAY = [
  "Ha sido poco tiempo, y por eso la despedida es más rara: no hay lágrimas, solo una sensación de que esto podía haber dado para más.",
  "Apenas has tenido tiempo de aprenderte los nombres de los empleados del club, y ya te vas. Alguien bromea con que estabas de paso.",
  "Te vas casi sin haber deshecho la maleta. El club se despide con cortesía, como se despide de quien nunca llegó a sentirse de la casa.",
];
const FANS_WARM = [
  "A la salida, un grupo de aficionados te espera con bufandas y pancartas. Les firmas lo que puedes antes de que el coche arranque.",
  "En redes, la afición te dedica un mensaje de despedida que se hace viral: «Gracias por todo, aquí siempre tendrás casa».",
  "La grada te despide con una ovación en el último entrenamiento abierto. Es imposible no emocionarse.",
];
const FANS_COLD = [
  "En redes, media afición celebra tu marcha y la otra media se lo reprocha a la primera. Nadie queda indiferente.",
  "Algunos aficionados te despiden con silbidos a la puerta del centro de entrenamiento. Otros te piden perdón por ellos. Es una despedida rara.",
  "En las radios deportivas se debate si te vas por dinero o por ambición. Cada tertuliano tiene su teoría y casi ninguno te conoce.",
];

/** Texto de la despedida del club que dejas. */
export function buildFarewell(player: Player): string {
  const club = player.club;
  const flags = player.flags ?? {};
  const since = parseInt(String(flags.club_since ?? "0"), 10) || 0;
  const tenure = since > 0 ? Math.max(0, player.week - since) : 0;
  const titles = readTrofeos(flags).filter((t) => !INDIVIDUAL.has(t.k) && t.c && canonicalClub(t.c) === canonicalClub(club)).length;
  const rel = player.rel_vestuario ?? 50;
  const fans = player.rel_aficion ?? 50;

  const locker = rel >= 65 ? LOCKER_WARM : rel >= 35 ? LOCKER_MIXED : LOCKER_COLD;
  const first = pickFor(locker, player, "locker");

  // La segunda frase: lo más significativo de la etapa que cierras.
  let second: string;
  if (flags.capitan_club) second = pickFor(CAPTAIN, player, "captain");
  else if (titles >= 1) second = pickFor(TITLES, player, "titles");
  else if (tenure >= 25) second = pickFor(LONG_STAY, player, "long");
  else if (tenure > 0 && tenure < 10) second = pickFor(SHORT_STAY, player, "short");
  else if (fans >= 65) second = pickFor(FANS_WARM, player, "fans");
  else if (fans <= 30) second = pickFor(FANS_COLD, player, "fanscold");
  else {
    const coach = getNpcName(player, "entrenador");
    const coachCold = (player.rel_entrenador ?? 50) < 35;
    second = pickFor(
      coachCold
        ? [
            `${coach} ni sale del despacho. Te manda a recoger los papeles con un ayudante y un «que te vaya bien» escrito en una nota.`,
            `${coach} te da la mano sin mirarte a los ojos: «Es lo mejor para todos». Tú piensas lo mismo y no dices nada.`,
            `${coach} se limita a un «gracias por tu trabajo» de manual. Entre vosotros las cosas ya se enfriaron hace tiempo.`,
          ]
        : [
        `${coach} te espera en la puerta del despacho: «Has hecho lo que te pedí y más. Aquí siempre habrá sitio para ti».`,
        `${coach} te da la mano sin decir nada. Luego te suelta una frase seca que te acompañará todo el viaje: «Cuídate».`,
        `${coach} te llama aparte y te da un consejo de entrenador viejo: «Donde vayas, llega siempre el primero y vete el último».`,
        ],
      player,
      "coach",
    );
  }
  return `${first} ${second}`;
}
