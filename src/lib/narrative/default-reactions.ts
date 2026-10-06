/**
 * Red de seguridad de reacciones: algunas escenas escritas a mano (rumores de
 * mercado, arcos de rival/hermano/reencuentro/patrocinador, ofertas) tienen
 * opciones sin reacción propia, y el jugador elegía y la partida seguía sin
 * decir nada. Aquí se reconoce el TIPO de decisión por su etiqueta y se
 * devuelve una reacción concreta, con variantes para no repetirse.
 *
 * Solo se usa si la opción no trae outcomeText ni tirada de éxito/fracaso:
 * una reacción escrita a mano para esa opción siempre manda.
 */
import type { EventOption } from "@/types/career";
import type { Player } from "@/types/player";

interface Rule {
  test: RegExp;
  lines: string[];
}

/** {agent} = representante, {coach} no se usa: el entrenador cambia de una partida a otra. */
const RULES: Rule[] = [
  {
    test: /en visto|^ignor|seguir andando|contestar en otro momento|no pronunciarte|dejar que se apague|no decir nada/i,
    lines: [
      "Lo dejas ahí, sin contestar. Un rato después ya ha pasado a otra cosa, pero tú sabes que el silencio también cuenta.",
      "No respondes. A veces la mejor jugada es no tocar el balón, y esta vez decides no tocarlo.",
      "Guardas el móvil en el bolsillo y sigues a lo tuyo. Nadie dirá que no tuviste cabeza.",
    ],
  },
  {
    test: /hable con|pasarle el marrón|que se entere de todo|comentarlo con tu representante|pedirle cuentas|esa misma noche/i,
    lines: [
      "Le pasas el asunto a {agent}. «Yo me encargo», responde sin dudar, y cuelgas con una preocupación menos en la cabeza.",
      "{agent} escucha en silencio y solo dice: «Déjamelo a mí». Para eso le pagas, y esta vez se nota.",
      "Se lo cuentas todo a {agent} de un tirón. Al otro lado del teléfono se oye una libreta abrirse: ya está tomando notas.",
    ],
  },
  {
    test: /redes|publicarlo|subirlo|humor/i,
    lines: [
      "Lo subes con tu toque. En una hora hay cientos de comentarios y la mitad son memes tuyos.",
      "Pulsas «publicar» antes de arrepentirte. Cuando vuelves a mirar, el vestuario entero te ha respondido con emojis.",
    ],
  },
  {
    test: /seguirle la corriente|pedir el postre/i,
    lines: [
      "Le sigues la corriente con cara de póquer y pides el postre. Nadie sabe si le crees, y justo ahí está la gracia.",
    ],
  },
  {
    test: /firmar el acuerdo|aceptar y volcarte|aceptar el acuerdo/i,
    lines: [
      "Firmas. La marca te hace una foto con el bolígrafo en la mano y, esa misma tarde, tu cara ya está en su cuenta oficial.",
      "Estampas la firma y te dan un apretón de manos largo. Ahora ya no eres solo un jugador: eres también la cara de alguien.",
    ],
  },
  {
    test: /prometerle todo tu apoyo|estar ahí de verdad/i,
    lines: [
      "Se lo prometes mirándole a los ojos. Él no dice nada, pero esa noche duerme con tu camiseta puesta.",
    ],
  },
  {
    test: /frialdad|guardar las distancias|evitar cualquier contacto/i,
    lines: [
      "Marcas distancia. No es lo más bonito que has hecho, y lo sabes, pero es lo que te sale hoy.",
      "Contestas lo justo y cambias de tema. Se nota que algo se queda por el camino.",
    ],
  },
  {
    test: /abrazarlo|alegrarte de verdad|volveros inseparables|verlo también como competencia|despedida cordial|prometerle que seguiréis/i,
    lines: [
      "Os dais un abrazo de los de verdad, de los que se dan sin cámaras. Algunas cosas no necesitan palabras.",
      "Sonríes y lo dices en serio. Cuando te das la vuelta, te das cuenta de lo mucho que lo echabas de menos.",
    ],
  },
  {
    test: /vivirlo (en privado|con la cabeza fría)|cabeza fría|sin dramatizar/i,
    lines: [
      "Lo vives por dentro, sin hacerlo público. Hay cosas que pesan menos cuando no las cuentas a nadie.",
      "Respiras hondo y lo dejas pasar con calma. Mañana, de todo esto, solo quedará lo que tú decidas recordar.",
    ],
  },
  {
    test: /usarlo como motivación|guardarte la rabia|entrenar el doble|motivación pura/i,
    lines: [
      "Te lo guardas dentro y lo conviertes en combustible. Al día siguiente eres el primero en llegar al campo.",
      "Aprietas los dientes y te vas a entrenar. Hay rabias que, bien usadas, valen más que cualquier charla.",
    ],
  },
  {
    test: /pedirle la camiseta|gane quien gane|orgulloso igualmente|decirle que estás orgulloso/i,
    lines: [
      "Se lo dices sin adornos, y por su cara entiendes que era justo lo que necesitaba oír.",
    ],
  },
  {
    test: /cambiar de representante/i,
    lines: [
      "Le dices que hasta aquí. No grita ni protesta: recoge sus papeles, te mira un segundo de más y se va. Esa misma tarde ya estás firmando con otro.",
    ],
  },
  {
    test: /hacerte el tonto|guardar silencio|pasar del reto|no entrar al trapo/i,
    lines: [
      "Haces como que no has visto nada. Tu silencio dice más que cualquier respuesta, y todos lo notan.",
      "Te muerdes la lengua. No es fácil, pero ya aprendiste que no todo reto merece respuesta.",
    ],
  },
  {
    test: /ir a verlo en persona|mandarle un mensaje|insistir en que no tire|pagarle una preparación|preguntar a /i,
    lines: [
      "Das el paso sin pensártelo demasiado. A veces estar presente vale más que cualquier palabra bonita.",
      "Haces lo que sientes que toca. No cambia el mundo, pero a esa persona le cambia el día.",
    ],
  },
  {
    test: /punzada de envidia|avisarle de lo dura|apuntarte en serio|retar directamente/i,
    lines: [
      "Lo dices o lo piensas, y te das cuenta de que dolía más de lo que querías admitir. Aun así, sigues adelante.",
      "Te lo tomas muy en serio, quizá demasiado. Pero al menos nadie podrá decir que no pusiste ganas.",
    ],
  },
  {
    test: /despedir.*fichar/i,
    lines: [
      "Se lo dices a la cara, sin dramas. Recoge su maletín despacio y, ya en la puerta, suelta: «Vas a echar de menos mis llamadas». Esa tarde ya estás cenando con tu nuevo representante.",
      "Cortas la relación con una llamada corta y firme. Al otro lado se hace un silencio largo antes de un «como quieras». Hay amistades de negocio que no sobreviven a una factura rara.",
    ],
  },
  {
    test: /dejarlo pasar por esta vez/i,
    lines: [
      "Lo dejas pasar, esta vez. Pero apuntas la cifra en una libreta: la próxima, no habrá próxima.",
      "Decides no montar una escena. Te quedas con una sensación incómoda que no se va tan fácilmente como el cargo.",
    ],
  },
  {
    test: /ponerte serio|esta vez vamos a aprovecharlo/i,
    lines: [
      "Lo dices con una seriedad que no es tuya. Él asiente despacio: sabe que, si esto sale bien, será porque los dos quisieron.",
    ],
  },
  {
    test: /presentarle a tu representante|pagarle los estudios|pagarle una preparación/i,
    lines: [
      "Se lo ofreces sin hacer ruido. Él te mira un segundo, intentando no emocionarse, y asiente: «Te lo devolveré, de una manera u otra».",
    ],
  },
  {
    test: /mensaje sincero|buscarlo antes del partido|saludarlo/i,
    lines: [
      "Das el primer paso. Sea cual sea la respuesta, te quitas un peso: a veces el rival más duro es el silencio.",
      "Escribes sin florituras, tal como lo piensas. La respuesta tarda, y cuando llega es más corta y más humana de lo que esperabas.",
    ],
  },
  {
    test: /se rompe algo|dejar que la comparación te pique|llevaros bien, sin más/i,
    lines: [
      "Lo guardas dentro. No es un drama, pero hay cosas que cambian de sitio sin que nadie se dé cuenta del momento exacto.",
      "Te lo tomas como viene: sin heroicidades y sin rencores. Con el tiempo, estas cosas se colocan solas.",
    ],
  },
  {
    test: /pedir que tu representante lo revise|pedir explicaciones directas|frenar el crecimiento del acuerdo/i,
    lines: [
      "Pides tiempo y que lo revisen con lupa. La marca no se ofende, pero se nota que esperaban un sí rápido. Mejor prudente que arrepentido.",
      "Dejas claro que no firmas a ciegas. Al otro lado cambian el tono: ahora te hablan como a alguien con quien hay que negociar de verdad.",
    ],
  },
  {
    test: /descansar de verdad|aprovechar el rato libre/i,
    lines: [
      "Te tumbas, apagas el móvil y por una vez no piensas en nada. Mañana el cuerpo te lo agradecerá.",
    ],
  },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function defaultReaction(option: Pick<EventOption, "label">, player: Pick<Player, "agent_name">): string | null {
  const rule = RULES.find((r) => r.test.test(option.label));
  if (!rule) return null;
  const agent = player.agent_name && !/^(Tu |Sin |Nueva )/.test(player.agent_name) ? player.agent_name : "tu representante";
  return pick(rule.lines).replace(/\{agent\}/g, agent);
}
