/** Escenas fijas del juego, parte 6 de 6 (antes vivían en events.ts; el orden del conjunto no ha cambiado). */
import type { GameEvent } from "@/types/career";

export const EVENTS_6: GameEvent[] = [
  {
    id: "ent-bronca-tarde",
    category: "entrenamiento",
    title: "Llegas tarde y el míster lo ve",
    description: "Te has dormido y entras al vestuario con la camiseta del revés. El míster no dice nada. Nadie dice nada. Eso es peor.",
    minWeek: 6,
    options: [
      { id: "a", label: "Pedir perdón delante de todos", subtitle: "Cara y humildad", consequences: { rel_entrenador: 3, rel_vestuario: 2, moral: -1 }, outcomeText: "Pides perdón delante de todos, con la camiseta aún del revés. El míster se muerde la sonrisa y asiente: 'Que no se repita'." },
      { id: "b", label: "Poner una excusa (que el despertador...)", subtitle: "Arriesgado", consequences: {}, resolve: { baseChance: 0.35, statModifier: "reputacion", success: { text: "El vestuario se parte de risa con tu excusa y hasta el míster sonríe.", consequences: { rel_vestuario: 4, rel_entrenador: 1 } }, fail: { text: "El míster ni parpadea y te apunta en su libreta. Esa libreta da miedo.", consequences: { rel_entrenador: -5, moral: -3 } } } },
      { id: "c", label: "Entrenar como si no hubiera pasado nada", subtitle: "Que hablen las piernas", consequences: { forma: 2, rel_entrenador: 1 }, outcomeText: "Entrenas con una intensidad que sorprende a todos. El míster no dice nada, pero no te quita ojo hasta que suena el silbato final." },
    ],
  },
  {
    id: "ent-elogio-publico",
    category: "entrenamiento",
    title: "El míster te elogia delante de todos",
    description: "En plena charla, el míster te señala: \"Mirad cómo trabaja este chaval\". Los veteranos te miran. Algunos sonríen. Otros no tanto.",
    minWeek: 8,
    options: [
      { id: "a", label: "Quitarle importancia: \"Solo hago mi trabajo\"", subtitle: "Humildad", consequences: { rel_vestuario: 4, rel_entrenador: 2 }, outcomeText: "'Solo hago mi trabajo', dices sin mirar a nadie. Un veterano asiente en silencio y, a la salida, te choca el puño sin decir palabra." },
      { id: "b", label: "Sonreír y disfrutar el momento", subtitle: "Te lo has ganado", consequences: { moral: 5, rel_entrenador: 2, rel_vestuario: -2 }, outcomeText: "Sonríes y disfrutas del momento. A tu lado, alguien murmura algo entre dientes; ya se sabe, el elogio ajeno nunca sienta igual a todos." },
    ],
  },
  {
    id: "ent-cambio-posicion",
    category: "entrenamiento",
    title: "\"Desde mañana juegas ahí\"",
    description: "El míster te cambia de sitio en el once sin preguntarte: un puesto que no es el tuyo. \"Confía en mí\", te dice, y se va.",
    minWeek: 15,
    options: [
      { id: "a", label: "Aceptarlo sin rechistar", subtitle: "Ser útil donde haga falta", consequences: {}, resolve: { baseChance: 0.5, statModifier: "media", success: { text: "Te sale mejor de lo que pensabas: el nuevo puesto te abre partidos que no tenías.", consequences: { media: 3, rel_entrenador: 4, moral: 3 } }, fail: { text: "Te sientes fuera de sitio y se nota. Vuelves a tu puesto habitual con el orgullo tocado.", consequences: { moral: -4, forma: -1 } } } },
      { id: "b", label: "Decirle que tu sitio es otro", subtitle: "Ir de frente", consequences: { rel_entrenador: -3, moral: 1 }, outcomeText: "Se lo dices directo, con respeto. El míster te mira un segundo y concede: 'Hoy pruebas ahí y luego lo hablamos'. No es una victoria, pero tampoco un no." },
    ],
    allowFreeText: true,
    freeTextPrompt: "El míster espera tu respuesta. ¿Qué le dices?",
  },
  {
    id: "ent-grada-sin-avisar",
    category: "entrenamiento",
    title: "Te enteras de que no juegas por la lista",
    description: "Ves la convocatoria colgada en el tablón de la ciudad deportiva. Tu nombre no está. Nadie te lo había dicho.",
    minWeek: 10,
    options: [
      { id: "a", label: "Ir al despacho del míster a preguntar", subtitle: "Cara a cara", consequences: {}, resolve: { baseChance: 0.5, statModifier: "reputacion", success: { text: "Te da una razón clara y una fecha: \"Dos semanas y vuelves\". Al menos ya sabes dónde estás.", consequences: { rel_entrenador: 3, moral: 2 } }, fail: { text: "Te dice que es \"una decisión técnica\" y se levanta. Conversación terminada.", consequences: { moral: -4, rel_entrenador: -1 } } } },
      { id: "b", label: "Tragártelo y entrenar más fuerte", subtitle: "Orgullo silencioso", consequences: { forma: 3, moral: -3 }, outcomeText: "Te lo tragas y esa tarde entrenas con rabia contenida. Un compañero te da una palmada: 'Se te nota que te ha dolido'." },
      { id: "c", label: "Quejarte en redes con una indirecta", subtitle: "Mala idea, buen contenido", consequences: { fama: 3, rel_entrenador: -6, moral: 1 }, outcomeText: "Subes una indirecta que, en media hora, tiene diez mil me gusta. El míster, claro, la ve antes de la cena, y en el club alguien te llama para 'hablar'." },
    ],
  },
  {
    id: "ent-concentracion-hotel",
    category: "vestuario",
    title: "La noche de concentración",
    description: "En el hotel te toca compartir habitación con un veterano que ronca como un tractor y ve los partidos del día siguiente en voz alta.",
    minWeek: 6,
    options: [
      { id: "a", label: "Aguantar con humor y unos tapones", subtitle: "Cada uno tiene su cruz", consequences: { rel_vestuario: 3, forma: -1 }, outcomeText: "Te pones los tapones y aguantas con humor. A las tres de la madrugada, el veterano se despierta y te susurra: '¿Tú también roncas, chaval?'." },
      { id: "b", label: "Pedirle al utillero que te cambie de cuarto", subtitle: "Dormir es de profesionales", consequences: { forma: 2, rel_vestuario: -2 }, outcomeText: "Le pides al utillero que te cambie de cuarto. Te lo concede sin preguntar y, al día siguiente, el veterano te mira con una ceja levantada." },
      { id: "c", label: "Sentarte a ver el partido con él y aprender", subtitle: "Convertirlo en clase magistral", consequences: { media: 1, rel_vestuario: 4, forma: -2 }, outcomeText: "Os sentáis a ver el partido con una bolsa de pipas. El veterano te explica cada movimiento, cada pausa, cada trampa. Aprendes más en dos horas que en un mes." },
    ],
  },
  {
    id: "ves-cumple-sorpresa",
    category: "vestuario",
    title: "Tu cumpleaños, versión vestuario",
    description: "Al llegar te esperan con una tarta con tu cara mal pintada, un coro desafinado y una manta para lanzarte por los aires. Alguien ha filmado todo.",
    minWeek: 8,
    options: [
      { id: "a", label: "Entrar en el juego y disfrutarlo", subtitle: "Reír, que es gratis", consequences: { rel_vestuario: 6, moral: 5 }, outcomeText: "Soplas las velas entre cánticos desafinados mientras la manta te lanza por los aires. Es el cumpleaños más ridículo y más feliz que recuerdas." },
      { id: "b", label: "Pedir que borren el vídeo antes de que salga", subtitle: "Control de daños", consequences: {}, resolve: { baseChance: 0.4, statModifier: "fama", success: { text: "Lo borran... y solo lo comparten en el grupo del equipo. Un mal menor.", consequences: { rel_vestuario: 2, fama: 0 } }, fail: { text: "El vídeo ya está en redes: tu manteo, tu cara pintada y tu grito. Tiene 200.000 visitas.", consequences: { fama: 5, moral: 1 } } } },
    ],
  },
  {
    id: "ves-masajista-cotilla",
    category: "vestuario",
    title: "El masajista lo sabe todo",
    description: "Mientras te da un masaje, el fisio suelta como quien no quiere la cosa: \"Dicen que el míster va a cambiar el once el sábado. No te digo más.\"",
    minWeek: 7,
    options: [
      { id: "a", label: "Preguntar más y sacarle la información", subtitle: "Curiosidad con riesgo", consequences: {}, resolve: { baseChance: 0.5, statModifier: "reputacion", success: { text: "Suelta todo: juegas. Llegas preparado y con la cabeza fría.", consequences: { moral: 4, forma: 2 } }, fail: { text: "Se cierra en banda y se lo cuenta a medio vestuario. Ahora todos saben que fisgoneas.", consequences: { rel_vestuario: -3 } } } },
      { id: "b", label: "Hacerte el sordo", subtitle: "Prudencia", consequences: { rel_entrenador: 1 }, outcomeText: "Te haces el sordo y sigues con los ojos cerrados. El fisio se encoge de hombros y, un día después, te cuenta otro chisme igual de jugoso." },
    ],
  },
  {
    id: "ves-companero-cobra-mas",
    category: "vestuario",
    title: "Se filtra lo que cobra un compañero",
    description: "Un diario publica la ficha de un compañero de tu posición. Es el triple de la tuya. En el vestuario nadie habla de otra cosa.",
    minWeek: 20,
    options: [
      { id: "a", label: "Decirle a tu agente que pida subida", subtitle: "Si él cobra, tú también", consequences: { rel_representante: 2, moral: 2 }, outcomeText: "Se lo dices a tu agente y él, sin pestañear, abre una libreta: 'Ya estaba tardando'. En una semana ya tiene una reunión con el club." },
      { id: "b", label: "Demostrar en el campo que lo vales", subtitle: "Que hablen tus números", consequences: { forma: 3, media: 1, moral: -1 }, outcomeText: "No dices nada y entrenas con más ganas que nadie. El míster, que lo capta todo, lo apunta con una media sonrisa." },
      { id: "c", label: "Bromear con él en el vestuario", subtitle: "Que pague el desayuno", consequences: { rel_vestuario: 4, fama: 1 }, outcomeText: "Le dices en broma que te debe un desayuno. Él lo acepta riendo y al día siguiente lleva churros para todo el vestuario." },
    ],
  },
  {
    id: "ves-himno-equipo",
    category: "vestuario",
    title: "Te toca cantar en la novatada",
    description: "Un año después seguís con la tradición: hoy le toca a otro novato, pero te eligen como jurado y con derecho a veto.",
    minWeek: 30,
    options: [
      { id: "a", label: "Ser generoso: aprobar sin mirar", subtitle: "Buen rollo", consequences: { rel_vestuario: 4 }, outcomeText: "Apruebas al novato sin mirar. Él te lo agradece con los ojos y el vestuario te lanza un aplauso. Buen rollo, nada que añadir." },
      { id: "b", label: "Ser el jurado más cruel de la historia", subtitle: "Espectáculo garantizado", consequences: { rel_vestuario: 3, fama: 2, moral: 3 }, outcomeText: "Te lo tomas muy en serio y puntúas con un cero rotundo. El novato se hunde en el sofá y media plantilla llora de risa." },
    ],
  },
  {
    id: "vid-entradas-primos",
    category: "vida",
    title: "Tus primos quieren entradas. Muchas.",
    description: "Te llama un primo del que no sabías el nombre: \"Somos doce, ¿tienes sitio para todos? También viene el vecino\". Ni siquiera juegas de titular.",
    minWeek: 12,
    options: [
      { id: "a", label: "Conseguirles las doce entradas", subtitle: "Familia es familia", consequences: { patrimonio: -900, moral: 3, rel_vestuario: 1 }, outcomeText: "Consigues las doce entradas. Tu primo te llama agradecido y, en el campo, te saluda a gritos desde la grada, con una bufanda que no recuerdas haberle dado." },
      { id: "b", label: "Darles cuatro y disculparte", subtitle: "Poner un límite", consequences: { moral: 1 }, outcomeText: "Les das cuatro y te disculpas. Tu primo lo acepta con una frialdad que dura hasta la Nochebuena, cuando te sirve el primer plato sin mirarte." },
      { id: "c", label: "Decir que este mes no hay entradas", subtitle: "Para evitar el drama", consequences: { moral: -1 }, outcomeText: "Dices que este mes no hay entradas. Ellos se resignan, y tú evitas el drama, aunque en el grupo familiar ya hay audios largos sobre ti." },
    ],
    allowFreeText: true,
    freeTextPrompt: "Tu primo insiste por tercera vez. ¿Qué le contestas?",
  },
  {
    id: "vid-ex-escribe",
    category: "vida",
    title: "Tu ex te escribe justo ahora",
    description: "Aparece un mensaje que empieza con \"Vi que te va muy bien...\" y termina con un \"¿quedamos a tomar un café?\". Sabes perfectamente lo que significa.",
    minWeek: 20,
    options: [
      { id: "a", label: "Quedar y ver qué pasa", subtitle: "Curiosidad y riesgo", consequences: {}, resolve: { baseChance: 0.5, statModifier: "moral", success: { text: "Un café tranquilo y cariñoso, sin dramas. Cierras el capítulo con buen sabor de boca.", consequences: { moral: 4 } }, fail: { text: "El café sale en una foto y en tres tertulias. Te toca dar explicaciones.", consequences: { fama: 4, moral: -4, rel_aficion: -2 } } } },
      { id: "b", label: "Dejarlo en visto", subtitle: "Página pasada", consequences: { moral: 1 }, outcomeText: "Lo dejas en visto. Esa noche duermes con una calma extraña: no es indiferencia, es cierre." },
      { id: "c", label: "Contestar con un emoji y ya", subtitle: "Ni frío ni caliente", consequences: {}, outcomeText: "Contestas con un emoji. Ella responde con otro y con eso se acaba. Ni frío ni caliente, y con cada segundo, un poco más libre." },
    ],
  },
  {
    id: "esp-utillero-leyenda",
    category: "especial",
    title: "El utillero que lleva 40 años aquí",
    description: "Te cuenta, mientras dobla tu ropa, que ha visto pasar a tres campeones de Europa y a un montón de promesas que no llegaron. \"Tú tienes algo\", te suelta. \"Pero cuídalo.\"",
    minWeek: 10,
    options: [
      { id: "a", label: "Escucharle con atención y agradecérselo", subtitle: "Cuando un veterano habla, se escucha", consequences: { moral: 4, rel_vestuario: 3 }, outcomeText: "Escuchas hasta el último detalle. Él acaba, sonríe y te devuelve la camiseta doblada con un esmero casi paternal." },
      { id: "b", label: "Preguntarle cuál fue el mejor jugador que vio", subtitle: "Historias de vestuario", consequences: { moral: 2, rel_vestuario: 2, fama: 1 }, outcomeText: "Se queda pensando un buen rato y luego cuenta una anécdota que no sale en ningún libro. Te la guardas para siempre." },
    ],
    allowFreeText: true,
    freeTextPrompt: "El utillero espera. ¿Qué le dices?",
  },

  // ── Tu cuñado ──────────────────────────────────────────────────────────
  {
    id: "vid-cunado-negocio",
    category: "vida",
    title: "Tu cuñado tiene un negocio infalible",
    description: "Te lo suelta en plena comida familiar, con la copa en alto: un local de padel, un bar de smash burgers y una app, todo a la vez. \"Solo necesito un socio con nombre, y tú lo tienes\". Tu cuñado sonríe demasiado.",
    minWeek: 25,
    options: [
      { id: "a", label: "Invertir un poco por no discutir en Navidad", subtitle: "Paz familiar, cartera en riesgo", consequences: {}, resolve: { baseChance: 0.25, statModifier: "reputacion", success: { text: "Contra todo pronóstico, el bar de smash burgers funciona y ya hay cola los sábados. Tu cuñado no se calla en tres semanas.", consequences: { patrimonio: 6000, moral: 4, fama: 1 } }, fail: { text: "Se cierra el local a los dos meses y el dinero se esfuma. Tu cuñado ya habla de \"un pequeño reajuste\".", consequences: { patrimonio: -4000, moral: -3 } } } },
      { id: "b", label: "Pedirle el plan de negocio por escrito", subtitle: "Cortesía con trampa", consequences: { moral: 2, rel_representante: 1 }, outcomeText: "Le pides el plan por escrito y tu cuñado se queda mudo. En la sobremesa siguiente, saca una servilleta con garabatos y asegura que es 'el borrador'." },
      { id: "c", label: "Decirle que tu representante lo lleva todo", subtitle: "Escudo de agente", consequences: { rel_representante: 1, moral: 1 }, outcomeText: "Dices que tu representante lo lleva todo. Tu cuñado se encoge de hombros y, un segundo después, te manda el mismo negocio por WhatsApp." },
    ],
    allowFreeText: true,
    freeTextPrompt: "Tu cuñado espera tu respuesta con la copa en alto. ¿Qué le dices?",
  },
  {
    id: "vid-cunado-tactico",
    category: "vida",
    title: "Tu cuñado sabe más de fútbol que el míster",
    description: "En la sobremesa te explica, con servilletas y un salero como pivote, por qué tu entrenador no sabe alinear y cómo lo haría él: \"cuatro delanteros y a correr\". Nadie le ha pedido opinión.",
    minWeek: 15,
    options: [
      { id: "a", label: "Darle la razón y pedir el postre", subtitle: "Paz ante todo", consequences: { moral: 3 }, outcomeText: "Le das la razón y pides el postre. Tu cuñado sonríe orgulloso, convencido de haberte convertido en su discípulo." },
      { id: "b", label: "Retarle a jugar contigo un uno contra uno", subtitle: "Que lo demuestre", consequences: {}, resolve: { baseChance: 0.75, statModifier: "forma", success: { text: "Le ganas 5-0 delante de toda la familia. Desde entonces solo comenta las jugadas en voz baja.", consequences: { moral: 5, fama: 1 } }, fail: { text: "Se lesiona de puro esfuerzo y tú te pasas la tarde llevándole hielo. Sales del apuro con la familia enfadada.", consequences: { moral: -2, rel_aficion: 0 } } } },
      { id: "c", label: "Grabarlo y subirlo: 'mi cuñado, el entrenador'", subtitle: "Contenido gratis", consequences: { fama: 4, moral: 2 }, outcomeText: "Grabas su disertación con el salero incluido y lo subes con el título 'Mi cuñado, el entrenador'. En redes lo adoran y tu cuñado te escribe: 'Ya me han pedido entrevistas'." },
    ],
  },
  {
    id: "vid-cunado-agente",
    category: "representante",
    title: "Tu cuñado se ha hecho pasar por tu agente",
    description: "Te enteras por un periodista: tu cuñado lleva semanas escribiendo a clubes de tres países presentándose como \"tu representante\". Ha conseguido una reunión con un club de segunda de Rumanía.",
    minWeek: 30,
    options: [
      { id: "a", label: "Llamarle esa misma noche y cortarlo de raíz", subtitle: "Con cariño, pero sin margen", consequences: { rel_representante: 3, moral: 1 }, outcomeText: "Le llamas esa misma noche, con cariño pero sin margen. Él se queda en silencio unos segundos y luego solo dice: 'Perdona, creí que ayudaba'." },
      { id: "b", label: "Reírte y contarlo en redes", subtitle: "Momento viral", consequences: { fama: 4, moral: 2, rel_representante: -2 }, outcomeText: "Lo cuentas en redes con humor. La historia da la vuelta al país y tu cuñado se convierte, a su pesar, en un meme nacional." },
      { id: "c", label: "Ir a la reunión de Rumanía por curiosidad", subtitle: "Ya que está pagado el billete", consequences: {}, resolve: { baseChance: 0.3, statModifier: "fama", success: { text: "El presidente rumano resulta ser un hincha del fútbol español que te enseña su colección de camisetas. Nada que firmar, muchas anécdotas.", consequences: { fama: 3, moral: 4 } }, fail: { text: "El club no existe como lo describió tu cuñado y vuelves con el billete pagado y ganas de discutir.", consequences: { moral: -3, patrimonio: -800 } } } },
    ],
    allowFreeText: true,
    freeTextPrompt: "Tu cuñado te llama para 'explicarlo todo'. ¿Qué le dices?",
  },
  // ── PATRONES REALES DE CARRERA (skill narrativas-futbol, tanda 2) ──
  {
    id: "ves-pitada-propia-aficion",
    category: "vida",
    title: "Te pita tu propia afición",
    description:
      "Fallas un control sencillo en tu propio estadio y una parte de la grada te pita a ti, justo a ti, en tu casa. El silencio que viene después pesa más que cualquier grito.",
    minWeek: 20,
    maxMedia: 62,
    options: [
      { id: "a", label: "Pedir el balón otra vez sin esconderte", subtitle: "Dar la cara", consequences: { forma: 2, moral: -1, rel_aficion: 2 }, outcomeText: "Pides el balón otra vez, sin esconderte. La siguiente jugada te sale bien y la parte de la grada que pitaba se queda callada un segundo." },
      { id: "b", label: "Bajar los brazos un segundo", subtitle: "Humano, aunque no quede bien", consequences: { moral: -3, rel_aficion: -2 }, outcomeText: "Bajas los brazos un segundo, abatido. Un compañero te da una palmada en la espalda: 'Levanta, que esto es largo'." },
      {
        id: "c",
        label: "Buscar el gol que calle el campo",
        subtitle: "Todo o nada",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "forma",
          success: { text: "Marcas pocos minutos después y el mismo campo que te pitaba se pone en pie. El silencio de antes ahora es tuyo.", consequences: { fama: 4, moral: 6, rel_aficion: 6 } },
          fail: { text: "No llega el gol y el pitido se repite al salir del campo. Te cuesta dormir esa noche.", consequences: { moral: -5, rel_aficion: -3 } },
        },
      },
    ],
  },
  {
    id: "vid-amigos-de-repente",
    category: "vida",
    title: "Amigos que no sabías que tenías",
    description:
      "Desde que empezaste a cobrar de verdad, te escriben primos lejanos, compañeros de instituto que nunca te hablaron y gente que \"siempre creyó en ti\". Todos, sin excepción, necesitan un favor.",
    minWeek: 20,
    minMedia: 55,
    options: [
      { id: "a", label: "Poner un filtro y ayudar solo a quien de verdad conocías", subtitle: "Criterio ante todo", consequences: { moral: 3, reputacion: 2 }, outcomeText: "Pones un filtro y ayudas solo a quien conocías de verdad. Algunos se enfadan, pero los que quedan te lo agradecen con una sinceridad que no esperabas." },
      { id: "b", label: "Decir que sí a casi todo", subtitle: "Total, hay para todos", consequences: { patrimonio: -4000, moral: 2, rel_aficion: 1 }, outcomeText: "Dices que sí a casi todo. En un mes, tu móvil no para y tu cuenta bancaria nota la generosidad." },
      {
        id: "c",
        label: "Prestarle una cantidad grande a uno de ellos",
        subtitle: "\"Te lo devuelvo seguro\"",
        consequences: {},
        resolve: {
          baseChance: 0.35,
          success: { text: "Te lo devuelve puntual, con intereses de gratitud eterna. Uno de los pocos que cumple su palabra.", consequences: { patrimonio: 2000, moral: 3 } },
          fail: { text: "Nunca vuelves a ver ese dinero ni, la mitad de las veces, a esa persona.", consequences: { patrimonio: -6000, moral: -4 } },
        },
      },
    ],
  },
  {
    id: "prensa-ex-companero-pundit",
    category: "prensa",
    title: "Un excompañero te critica en la tele",
    description:
      "Un exjugador con el que compartiste vestuario hace tiempo, ahora comentarista, te dedica minutos enteros en un plató criticando tu actitud y tu rendimiento. Alguien te manda el vídeo sin que se lo pidas.",
    minWeek: 25,
    options: [
      { id: "a", label: "Responderle en una entrevista", subtitle: "Sin insultos, pero sin callarte", consequences: { fama: 3, reputacion: -1 }, outcomeText: "Respondes sin insultar pero sin callarte. La entrevista se hace viral y el exjugador, días después, te manda un mensaje: 'Quizá me pasé'." },
      {
        id: "b",
        label: "Llamarle en privado para aclararlo",
        subtitle: "De jugador a jugador",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          success: { text: "La conversación destensa todo: reconoce que se pasó y hasta lo dice en el siguiente programa.", consequences: { moral: 3, reputacion: 3 } },
          fail: { text: "Cuelga sin ceder terreno y al día siguiente lo cuenta todo, tergiversado, en directo.", consequences: { moral: -3, fama: 2 } },
        },
      },
      { id: "c", label: "Ignorarlo del todo", subtitle: "El campo hablará", consequences: { reputacion: 1 }, outcomeText: "Lo ignoras por completo. Las críticas siguen un par de semanas, hasta que tu siguiente partido las apaga de golpe." },
    ],
  },
  {
    id: "rep-asesor-financiero-cripto",
    category: "representante",
    title: "Un asesor te promete duplicar tu dinero",
    description:
      "Un asesor financiero que no es tu agente contacta contigo directamente: dice tener acceso a una inversión en criptomonedas \"garantizada\" que duplicará lo que metas en seis meses. Tiene una presentación muy convincente.",
    minWeek: 15,
    options: [
      { id: "a", label: "Pasarle el contacto a tu representante antes de nada", subtitle: "Que lo filtre él", consequences: { rel_representante: 2 }, outcomeText: "Le pasas el contacto a tu representante, que lo estudia con calma. A los dos días te escribe: 'Menos mal que me lo contaste'." },
      {
        id: "b",
        label: "Invertir una parte de tus ahorros",
        subtitle: "Confiar en la presentación",
        consequences: {},
        resolve: {
          baseChance: 0.25,
          success: { text: "Contra todo pronóstico, la inversión sube y multiplicas lo puesto. El asesor se victoriza; tú, con dudas, retiras las ganancias.", consequences: { patrimonio: 15000, moral: 2 } },
          fail: { text: "El proyecto se hunde de la noche a la mañana y el asesor desaparece del mapa. Ni rastro del dinero.", consequences: { patrimonio: -20000, moral: -5, rel_representante: -1 } },
        },
      },
      { id: "c", label: "Rechazarlo de plano", subtitle: "Demasiado bonito para ser verdad", consequences: { reputacion: 1 }, outcomeText: "Lo rechazas de plano. El asesor insiste un par de veces, y al final desaparece como llegó." },
    ],
  },
  {
    id: "rep-pedir-carta-libertad",
    category: "representante",
    title: "Pides salir del club",
    description:
      "Estás convencido de que ya has agotado tu etapa aquí. Le pides a tu representante que mueva ficha para forzar una salida, aunque el club, de momento, no quiere ni oír hablar de venderte.",
    minWeek: 40,
    options: [
      {
        id: "a",
        label: "Hacerlo público en una entrevista",
        subtitle: "Presión desde fuera",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          success: { text: "La presión mediática funciona: el club empieza a escuchar ofertas antes de lo previsto.", consequences: { fama: 3, rel_aficion: -4, rel_representante: 2 } },
          fail: { text: "La afición se te echa encima por \"faltar al escudo\" y el club se cierra en banda todavía más.", consequences: { fama: 1, rel_aficion: -8, moral: -4 } },
        },
      },
      { id: "b", label: "Dejar que tu representante lo gestione en privado", subtitle: "Sin ruido", consequences: { rel_representante: 3, moral: -1 }, outcomeText: "Tu representante lo gestiona en privado, sin ruido. En el club, la noticia no se filtra, pero el ambiente cambia: se nota que algo se está moviendo." },
      { id: "c", label: "Echarte atrás y quedarte", subtitle: "No merece la pena el conflicto", consequences: { rel_entrenador: 2, moral: -2 }, outcomeText: "Te echas atrás y te quedas. Tu representante asiente con resignación, aunque se le nota algo decepcionado." },
    ],
    allowFreeText: true,
    freeTextPrompt: "Si lo haces público, ¿qué dices exactamente en la entrevista?",
  },
  {
    id: "sel-convocatoria-snub",
    category: "especial",
    title: "Te dejan fuera de la convocatoria",
    description:
      "Pese a tu buen momento, el seleccionador hace pública la lista y tu nombre no aparece. Los medios se preguntan por qué en directo; tú lo primero que sientes es rabia.",
    minWeek: 30,
    minMedia: 60,
    options: [
      {
        id: "a",
        label: "Pedir explicaciones directamente",
        subtitle: "Cara a cara",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          success: { text: "El seleccionador te da una razón concreta (una posición muy cubierta) y te promete la próxima ventana. Te quedas más tranquilo.", consequences: { moral: 3, reputacion: 1 } },
          fail: { text: "La conversación no aclara nada y te quedas con más dudas que antes.", consequences: { moral: -3 } },
        },
      },
      { id: "b", label: "Convertirlo en motivación silenciosa", subtitle: "Que hablen los números", consequences: { forma: 3, moral: 1 }, outcomeText: "Lo conviertes en motivación silenciosa. En el siguiente entrenamiento, el míster te mira un segundo de más y entiende que lo has asumido." },
      { id: "c", label: "Quejarte públicamente", subtitle: "Que se sepa cómo te sientes", consequences: { fama: 2, reputacion: -2, moral: 1 }, outcomeText: "Lo sueltas en público y tus palabras dan la vuelta al país. El seleccionador responde con frialdad en rueda de prensa: 'Hay muchos jugadores'." },
    ],
  },
  {
    id: "esp-comparado-nueva-joya",
    category: "especial",
    title: "La nueva joya de la cantera te compara",
    description:
      "Sube al primer equipo un canterano de 17 años con una calidad que llama la atención de todo el club. En la sala de prensa te preguntan, sin ningún tacto, si \"tienes miedo de que te quite el sitio\".",
    minWeek: 25,
    options: [
      { id: "a", label: "Apadrinarlo en público", subtitle: "Grandeza, no amenaza", consequences: { reputacion: 4, rel_vestuario: 3, moral: 1 }, outcomeText: "Lo apadrinas en público con elogios sinceros. El chaval se emociona y la afición te adora todavía un poco más." },
      { id: "b", label: "Responder con ambigüedad calculada", subtitle: "Ni sí ni no", consequences: { reputacion: 1 }, outcomeText: "Respondes con ambigüedad calculada. Los periodistas lo analizan durante días sin llegar a ninguna conclusión." },
      { id: "c", label: "Dejar que se note que te incomoda", subtitle: "Sincero, aunque no quede bien", consequences: { moral: -1, reputacion: -2, forma: 2 }, outcomeText: "Dejas que se note que te incomoda. El vestuario capta el gesto y, a partir de entonces, el canterano te evita en los entrenamientos." },
    ],
  },
  {
    id: "ves-perder-capitania",
    category: "vestuario",
    title: "Te avisan de que perderás el brazalete",
    description:
      "El entrenador te llama a su despacho: la próxima temporada, el brazalete de capitán pasará a otro jugador más joven. Te lo dice con respeto, pero la decisión ya está tomada.",
    minWeek: 35,
    options: [
      { id: "a", label: "Aceptarlo con deportividad", subtitle: "El vestuario por encima del ego", consequences: { rel_entrenador: 3, rel_vestuario: 2, moral: -1 , flags: { capitan_club: false } }, outcomeText: "Aceptas con deportividad. En el vestuario, el nuevo capitán te lo agradece con un abrazo que dura más de lo habitual." },
      {
        id: "b",
        label: "Pedir explicaciones",
        subtitle: "Quieres entenderlo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          success: { text: "El entrenador te explica que es una apuesta de futuro, no un reproche a tu liderazgo. Te vas más en paz.", consequences: { moral: 2, rel_entrenador: 1 } },
          fail: { text: "La conversación se queda corta y te vas con la sensación de que hay algo que no te cuenta.", consequences: { moral: -3, rel_entrenador: -1 } },
        },
      },
      { id: "c", label: "Plantear que quizá sea hora de otro club", subtitle: "Sentirte de más aquí", consequences: { rel_representante: 2, moral: -2 }, outcomeText: "Insinúas que quizá sea hora de otro club. El míster se queda mirándote en silencio, y esa tarde la conversación llega a oídos del presidente." },
    ],
  },
  {
    id: "vid-opinion-politica-trampa",
    category: "prensa",
    title: "Te preguntan por un tema que no es fútbol",
    description:
      "En rueda de prensa, un periodista aprovecha para preguntarte por un asunto de actualidad que no tiene nada que ver con el partido. Todas las cámaras esperan tu respuesta.",
    minWeek: 20,
    options: [
      { id: "a", label: "Responder con cautela y volver al fútbol", subtitle: "Diplomacia", consequences: { reputacion: 2 }, outcomeText: "Respondes con cautela y vuelves al fútbol. El periodista, algo frustrado, apunta tu respuesta, y el club respira aliviado." },
      { id: "b", label: "Dar tu opinión sin filtro", subtitle: "Decir lo que piensas", consequences: { fama: 4, reputacion: -2, rel_aficion: -1 }, outcomeText: "Das tu opinión sin filtro. En redes se monta un debate gigante: unos te aplauden, otros te desprecian. El club te pide mesura." },
      { id: "c", label: "Negarte a responder", subtitle: "Esto no toca aquí", consequences: { reputacion: 1, fama: -1 }, outcomeText: "Te niegas a responder con educación. El periodista insiste, tú repites, y el vídeo del corte se convierte en el titular del día." },
    ],
  },
  {
    id: "ent-jugar-con-dolor",
    category: "entrenamiento",
    title: "Jugar dolorido el partido más importante",
    description:
      "Llegas a la semana del partido más importante del año con una molestia que el fisio no ve clara del todo. El equipo te necesita, pero forzar tiene riesgo real.",
    minWeek: 20,
    options: [
      {
        id: "a",
        label: "Jugar igualmente, apretando los dientes",
        subtitle: "El equipo primero",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "forma",
          success: { text: "Aguantas los 90 minutos y sales decisivo. Nadie en la grada sabe lo que te costó.", consequences: { fama: 4, moral: 5, rel_vestuario: 3 } },
          fail: { text: "La molestia se agrava a mitad de partido y te tienes que retirar entre gestos de dolor.", consequences: { forma: -8, moral: -4 } },
        },
      },
      { id: "b", label: "Ser prudente y descansar", subtitle: "Pensar en el resto de temporada", consequences: { forma: 2, rel_entrenador: -2, moral: -2 }, outcomeText: "Decides descansar. El míster lo respeta, aunque no le gusta, y el fisio te sonríe: 'Esta decisión te alarga la carrera'." },
      {
        id: "c",
        label: "Pedir una infiltración para aguantar",
        subtitle: "Jugársela del todo",
        consequences: {},
        resolve: {
          baseChance: 0.6,
          success: { text: "La infiltración funciona: no sientes nada durante el partido.", consequences: { fama: 3, moral: 3 } },
          fail: { text: "El efecto se pasa demasiado pronto y terminas el partido cojeando de verdad.", consequences: { forma: -10, moral: -3 } },
        },
      },
    ],
  },
  {
    id: "ves-companero-crisis-personal",
    category: "vestuario",
    title: "Un compañero te pide ayuda en privado",
    description:
      "Un compañero de vestuario te confiesa, muy afectado, que tiene una deuda de juego que no puede pagar y que no sabe a quién más acudir. Te pide que no se lo cuentes a nadie.",
    minWeek: 20,
    options: [
      { id: "a", label: "Prestarle el dinero sin condiciones", subtitle: "Un compañero es un compañero", consequences: { patrimonio: -5000, rel_vestuario: 6, moral: 2 }, outcomeText: "Le prestas el dinero sin condiciones. Él te abraza en silencio. Semanas después, te lo devuelve entero con una nota: 'Por si algún día me necesitas'." },
      { id: "b", label: "Ayudarle a buscar ayuda profesional", subtitle: "La solución de fondo", consequences: { rel_vestuario: 4, moral: 3, reputacion: 1 }, outcomeText: "Le ayudas a buscar un especialista y le acompañas a la primera cita. No es la solución rápida, pero es la que de verdad cambia las cosas." },
      { id: "c", label: "Decirle que no puedes meterte en esto", subtitle: "No es tu responsabilidad", consequences: { rel_vestuario: -3, moral: -1 }, outcomeText: "Le dices que no puedes meterte. Él asiente y se aleja. Desde entonces, en el vestuario, la complicidad entre vosotros ya no es la misma." },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices exactamente?",
  },
  {
    id: "prensa-dia-mediatico-agotador",
    category: "prensa",
    title: "Día maratón de medios antes del partidazo",
    description:
      "La víspera del partido más esperado del mes se llena de entrevistas, grabaciones para el sponsor y sesiones de fotos que el club ha comprometido sin preguntarte. Llegas al entrenamiento agotado antes de empezar.",
    minWeek: 15,
    options: [
      { id: "a", label: "Cumplir con todo sin quejarte", subtitle: "Parte del trabajo", consequences: { fama: 3, forma: -2, reputacion: 1 }, outcomeText: "Cumples con todo sin una queja. Al llegar a casa estás tan agotado que te duermes con el móvil en la mano." },
      { id: "b", label: "Pedir que recorten la agenda", subtitle: "Cuidar el partido", consequences: { forma: 1, rel_entrenador: 1, fama: -1 }, outcomeText: "Pides que recorten la agenda. El club lo acepta, aunque el responsable de prensa suspira: 'Es la primera vez que nos lo piden'." },
      { id: "c", label: "Saltarte alguna cita sin avisar", subtitle: "Priorizar el descanso", consequences: { forma: 2, reputacion: -2, patrimonio: -1000 }, outcomeText: "Te saltas una cita sin avisar. El responsable de prensa te llama a la noche, molesto, pero esa tarde duermes mejor que en semanas." },
    ],
  },
];
