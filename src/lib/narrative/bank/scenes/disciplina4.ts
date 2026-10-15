/**
 * Lo que viene después de que te vean de vacaciones estando lesionado (disciplina3.ts): el club no se queda callado. El
 * presidente te cita (a veces para reñirte y a veces para reírse), el míster te habla claro y, cuando te recuperas, o te
 * dejan fuera de la convocatoria como castigo o te meten en el equipo sin problemas, según cómo hayas gestionado todo
 * lo anterior (la bandera dc_castigo_vuelta y tu relación con el entrenador).
 */
import { S, o, r, after } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const ADULTO: BankWhen = { minAge: 18, maxAge: 40 };
const PADRES = ["dc-isla-lesion", "dc-isla-amigos"] as const;

const make = (parent: (typeof PADRES)[number]): BankScene[] => {
  const k = parent === "dc-isla-lesion" ? "p" : "a";
  return [
    S(`dc-isla-presi-${k}`, "disciplina", { ...ADULTO, injured: true, after: [after(parent, undefined, 1, 4)], notFlags: ["dc_presi"] }, "especial",
      "El presidente te cita en su despacho",
      "El vídeo de la isla ha llegado también al palco. La secretaria te llama a media mañana con un tono demasiado neutro: «El presidente quiere verte». Su despacho huele a puro viejo y a fotos enmarcadas de títulos que no son tuyos. Se queda un rato mirando por la ventana antes de girarse: «Tengo que preguntarte una cosa muy sencilla: ¿en qué estabas pensando?».",
      [
        o("a", "Pedir perdón, aceptar lo que decida el club y avisar siempre antes de viajar", "Con humildad", { rel_entrenador: 1, rel_aficion: 1, moral: -2, multa: 1, flags: { dc_presi: true, dc_permiso: true } }, "Lo reconoces sin adornos. El presidente asiente despacio y, tras un silencio largo, dice: «Multa, la que toca. Y desde ahora, cuando salgas del país, el club lo sabe antes que la prensa». Te da la mano. No es una amnistía, pero sí una forma de seguir adelante."),
        r("b", "Defender que tu tiempo libre es tuyo y que la rodilla no estaba para tanto", "Plantarte", 0.4,
          "El presidente te escucha sin pestañear y, de pronto, se echa a reír, una risa corta y seca. «Me recuerdas a mí a tu edad. Mientras vuelvas bien, no tengo nada que decirte. Pero que no se repita en las semanas de prensa». Sales del despacho con el pecho ligeramente más hinchado y la sensación de haberte librado por un pelo.", { rel_aficion: -1, moral: 2, fama: 1, flags: { dc_presi: true } },
          "No le hace ninguna gracia. Se levanta, rodea la mesa y te mira desde muy cerca: «Esto no es una democracia, es un club». La multa es ejemplar, el comunicado, frío, y el míster ya sabe que te has enfrentado a la directiva. Tu vuelta, desde luego, no va a ser tan sencilla.", { rel_entrenador: -3, multa: 3, moral: -4, flags: { dc_presi: true, dc_castigo_vuelta: true } }, "reputacion"),
        r("c", "Sonreír y quitarle hierro: «Me han pillado, presidente»", "Con humor", 0.5,
          "Sonríe a pesar suyo. «Eres insoportable», admite, sirviéndose un café. Te da un permiso por escrito para «descansar la cabeza» cuando el fisio lo apruebe y una advertencia que suena más a consejo que a amenaza. Sales del despacho con una complicidad que nadie esperaba.", { rel_entrenador: 1, rel_aficion: 1, moral: 3, flags: { dc_presi: true } },
          "El humor no cuela. «No tiene ninguna gracia», dice, y el silencio que sigue te lo hace sentir en la nuca. La multa llega ese mismo día y el club filtra a la prensa que «estudia medidas». Hay chistes que se pagan caros.", { rel_entrenador: -2, multa: 2, moral: -3, fama: -1, flags: { dc_presi: true } }, "fama"),
        o("d", "Llevar a tu representante y negociar una multa menor y un comunicado conjunto", "Con un plan", { rel_representante: 2, multa: 1, patrimonio: -400, moral: 1, flags: { dc_presi: true, dc_permiso: true } }, "Tu representante llega con una carpeta y una sonrisa de las que cobran por hora. Entre los dos pactan una multa moderada, un comunicado serio y una cláusula de «consulta previa» para futuros viajes. El presidente firma sin ganas, pero firma. Tu agente te susurra al salir: «Esto es lo que se llama contener el daño»."),
      ]),
    S(`dc-isla-mister-${k}`, "disciplina", { ...ADULTO, injured: true, after: [after(parent, undefined, 1, 5)], notFlags: ["dc_mister_isla"] }, "entrenamiento",
      "El míster te habla claro",
      "El entrenador te espera después de la sesión de gimnasio con los brazos cruzados y la mandíbula apretada. No te saluda. Espera a que los demás se vayan, cierra la puerta del vestuario y dice, con calma, que es peor que un grito: «He visto el vídeo. No hablo de lo que hagas en tus vacaciones. Hablo de lo que se ve de ti cuando estás lesionado y todo el equipo te mira».",
      [
        o("a", "Prometerle que no volverá a pasar y que no publicarás nada sin avisar", "Pedir perdón", { rel_entrenador: 2, moral: -1, rel_vestuario: 1, flags: { dc_mister_isla: true, dc_sin_redes: true } }, "Se lo prometes mirándole a los ojos. El míster asiente, sin sonreír: «Pues no lo publiques. Ni esto, ni nada. Lo que pasa aquí, aquí se queda». Te da una palmada seca en el hombro. Es lo más parecido a un perdón que vas a conseguir hoy."),
        o("b", "Discutir: «Lo que hago en mi tiempo es cosa mía»", "Responder", { rel_entrenador: -6, moral: -2, rel_vestuario: -1, flags: { dc_mister_isla: true, dc_castigo_vuelta: true, estado_castigo: "@WEEK+3" } }, "Se lo dices con la voz más alta de lo que querías. El míster no responde: se queda mirándote hasta que oyes tus propias palabras. «Bien», dice por fin. «Lo apunto». No vuelve a mirarte en toda la semana, y tú sabes perfectamente qué significa eso."),
        r("c", "Ofrecerte a hacer doble sesión de rehabilitación para compensarlo", "Con trabajo", 0.6,
          "No dice nada durante un rato largo. «Eso sí me gusta», admite al fin. «Pero que no sea un teatro». No es un teatro: las tres semanas siguientes te quedas la última hora de cada día con el fisio. El míster te ve pasar y asiente, casi sin querer.", { rel_entrenador: 4, forma: 1, moral: 2, flags: { dc_mister_isla: true } },
          "El míster niega despacio. «Las cosas no se compensan sudando, se compensan siendo serio. Ven cuando lo entiendas». Te quedas en el vestuario con el eco de la frase y una rodilla que, sorprendentemente, duele más.", { rel_entrenador: -1, moral: -2, flags: { dc_mister_isla: true } }, "moral"),
      ]),
    // La vuelta: castigado (fuera de la convocatoria)…
    S(`dc-isla-fuera-${k}`, "disciplina", { ...ADULTO, after: [after(parent, undefined, 3, 18)], flags: ["dc_castigo_vuelta"], notFlags: ["dc_vuelta_done"] }, "entrenamiento",
      "Tu vuelta: el míster te deja fuera de la convocatoria",
      "Estás recuperado, entrenas con el grupo y llegas a la lista del sábado con ilusión. Tu nombre no está. El míster no te da explicaciones; el preparador físico baja la mirada; en el vestuario, alguien susurra «castigo» y alguien más le manda callar. Hay cosas que no se dicen y se entienden perfectamente.",
      [
        o("a", "Aceptarlo en silencio y trabajar más que nadie", "Entereza", { rel_entrenador: 2, moral: -2, forma: 1, flags: { dc_vuelta_done: true, dc_castigo_vuelta: "", estado_castigo: "@WEEK+2" } }, "No dices nada. El sábado ves el partido desde la grada, con la bufanda al cuello y la rabia en el estómago. El lunes, en el entrenamiento, eres el primero en llegar. El míster no comenta nada, pero tu nombre vuelve a aparecer en la lista del siguiente partido."),
        o("b", "Pedirle explicaciones: «Si hay castigo, que sea a la cara»", "Plantarte", { rel_entrenador: -3, moral: -2, rel_vestuario: 1, flags: { dc_vuelta_done: true, dc_castigo_vuelta: "", estado_castigo: "@WEEK+3" } }, "Lo esperas en su despacho. «Ya lo sabes», dice. «No hay más que hablar». Te vas con la rabia a medias y un mensaje clarísimo: hay una línea que no se cruza con este hombre, y cruzarla tiene un precio."),
        o("c", "Hablar con el capitán para que medie", "Con apoyos", { rel_vestuario: 3, rel_entrenador: 1, moral: 1, flags: { dc_vuelta_done: true, dc_castigo_vuelta: "" } }, "El capitán te escucha con una mueca de «esto lo has hecho tú». Pero acaba hablando con el míster, a puerta cerrada. Tres días después estás en la lista, con una única condición: «ni un titular más». Te lo dice el capitán con voz seria y una media sonrisa."),
      ]),
    // …o metido en el once sin problemas (si la relación está sana)…
    S(`dc-isla-dentro-${k}`, "disciplina", { ...ADULTO, after: [after(parent, undefined, 3, 18)], notFlags: ["dc_castigo_vuelta", "dc_vuelta_done"], rel: { entrenador: [42, 100] } }, "entrenamiento",
      "Tu vuelta: el míster cuenta contigo sin dudar",
      "Te dan el alta, el míster te llama a su despacho y por un segundo se te encoge el estómago. «Lo de la isla ya está hablado», dice. «Aquí se juega lo que se entrena. Y tú has entrenado como un animal». Te señala la pizarra: tu nombre en el once del sábado. No hace falta añadir nada más, pero él lo añade igual: «Y, esta vez, ni una foto de más».",
      [
        o("a", "Darle las gracias y devolvérselo con un partidazo", "Agradecer", { rel_entrenador: 3, moral: 4, forma: 1, flags: { dc_vuelta_done: true, estado_confianza: "@WEEK+3" } }, "No dices más que «gracias, míster». El sábado, cada balón que tocas es una forma de devolver lo que te ha dado. La grada, al principio escéptica, se rinde en la segunda parte. Al acabar, el míster se te acerca y, sin mirarte, murmura: «Así sí»."),
        o("b", "Pedir perdón al vestuario antes del partido", "Un gesto de equipo", { rel_vestuario: 4, moral: 2, flags: { dc_vuelta_done: true } }, "Antes de salir al campo, delante de todos, dices que la cagaste y que no volverá a pasar. Nadie aplaude: alguien suelta un «ya era hora», y todos sonríen. Es la mejor forma de volver a ser uno más."),
      ]),
    // …o al banquillo si la relación con el míster no da para más.
    S(`dc-isla-banquillo-${k}`, "disciplina", { ...ADULTO, after: [after(parent, undefined, 3, 18)], notFlags: ["dc_castigo_vuelta", "dc_vuelta_done"], rel: { entrenador: [0, 41] } }, "entrenamiento",
      "Tu vuelta: al banquillo, de momento",
      "Te dan el alta y el míster te recibe con una frase muy ensayada: «Hay que ir poco a poco». No hace falta que diga más: el once sale sin ti y el banquillo te espera con una manta de más. Sabes que no es solo físico: lo de la isla se ha quedado entre vosotros como una piedra pequeña en el zapato.",
      [
        o("a", "Ganártelo en los entrenamientos, sin quejas", "Paciencia", { rel_entrenador: 3, forma: 1, moral: -1, flags: { dc_vuelta_done: true } }, "Entrenas cada día como si fuera la final. Tardas tres semanas en volver al once, pero cuando lo haces, el míster no te dice nada: solo te señala la banda con un gesto de cabeza, que es su manera de decir «adelante»."),
        o("b", "Hablar con tu representante para estudiar tus opciones", "Plan B", { rel_representante: 2, rel_entrenador: -2, moral: 0, flags: { dc_vuelta_done: true } }, "Tu agente lo ve claro: «Si el míster no confía, el mercado sí». No es una decisión inmediata, pero queda anotado. En el club, alguien se entera de que has llamado, y el ambiente se enfría un poco más."),
      ]),
  ];
};

export const DISCIPLINA4: BankScene[] = [...make("dc-isla-lesion"), ...make("dc-isla-amigos")];
