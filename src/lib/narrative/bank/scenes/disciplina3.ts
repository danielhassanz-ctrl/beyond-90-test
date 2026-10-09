/**
 * La grada también juzga: te lesionas, te ven de vacaciones con tu pareja en una isla y la afición no lo perdona; o te
 * pitan en tu propio estadio por algo que hiciste fuera. Las pitadas son un estado (estado_pitada) que te pesa en el
 * campo hasta que la gente cambia de opinión.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const ADULTO: BankWhen = { minAge: 18, maxAge: 40 };

export const DISCIPLINA3: BankScene[] = [
  S("dc-isla-lesion", "disciplina", { ...ADULTO, injured: true, flags: ["pareja"], fama: [30, 100], notFlags: ["dc_isla", "estado_pitada"], clubTurns: [3, 400] }, "prensa",
    "Te ven en una isla con {pareja} mientras estás lesionado",
    "Se suponía que estabas en casa, con el pie en alto y la libreta del fisio abierta. En lugar de eso, un turista con un móvil te ha grabado en una playa de arena blanca, con {pareja}, un cóctel con sombrilla y una sonrisa que no combina con una rotura de ligamento. El vídeo da la vuelta a la grada en una tarde. Tu club, cuando se entera, no dice nada: es mala señal.",
    [
      o("a", "Pedir perdón público: «Fue una decisión mía y me equivoqué»", "Asumirlo", { rel_aficion: -5, rel_entrenador: -2, moral: -3, multa: 1, flags: { dc_isla: true, estado_pitada: "@WEEK+4", estado_escandalo: "@WEEK+2" } }, "Lo cuentas en un vídeo corto, de pie, sin excusas, con la cara de quien lo siente de verdad. La prensa lo valora; la grada, algo menos. Las siguientes semanas, cada vez que sales a calentar, se oye un murmullo que se parece mucho a una advertencia."),
      r("b", "Explicar que era parte de la recuperación mental", "Defender", 0.3,
        "Funciona a medias: el fisio sale a respaldarte («descansar la cabeza también es recuperación») y un par de periodistas conocidos compran el argumento. La mayoría de la afición se lo traga con un gesto escéptico, pero lo deja correr.", { rel_aficion: -2, moral: -1, flags: { dc_isla: true, estado_pitada: "@WEEK+2" } },
        "No funciona. Alguien saca tus fotos de la semana anterior, con la rodilla vendada y el cóctel, y el club tiene que desmentirte en un comunicado muy educado y muy frío. Tu nombre es tendencia durante dos días con adjetivos que no son bonitos.", { rel_aficion: -9, rel_entrenador: -5, multa: 2, moral: -4, flags: { dc_isla: true, estado_pitada: "@WEEK+6", estado_escandalo: "@WEEK+4" } }, "reputacion"),
      o("c", "No decir nada y volver a entrenar más duro que nadie", "Con hechos", { rel_aficion: -4, forma: -1, rel_entrenador: 1, flags: { dc_isla: true, estado_pitada: "@WEEK+5" } }, "Callas. Haces el doble de fisio, llegas el primero y te vas el último. El club lo ve y no lo comenta. La afición, que no tiene cámaras en el gimnasio, seguirá pensando lo que ha visto en la playa hasta que vuelvas a ganarte su cariño con un partido."),
    ]),
  S("dc-isla-amigos", "disciplina", { ...ADULTO, injured: true, fama: [30, 100], notFlags: ["pareja", "dc_isla", "estado_pitada"], clubTurns: [3, 400] }, "prensa",
    "Te ven en una playa de vacaciones mientras estás lesionado",
    "Ibas a pasar un fin de semana tranquilo en casa de un amigo de la infancia, pero el plan se convirtió en un vuelo a una isla, un barco alquilado y dos días de fiesta con la rodilla vendada. El vídeo lo ha subido un desconocido con un titular que no dejan lugar a dudas: «Lesionado para jugar, sano para esto». Tu club, de momento, no ha comentado.",
    [
      o("a", "Pedir perdón y volver a tu plan de recuperación sin falta", "Rectificar", { rel_aficion: -4, rel_entrenador: -2, moral: -2, multa: 1, flags: { dc_isla: true, estado_pitada: "@WEEK+3" } }, "Lo reconoces ante el club y ante la afición, sin dramatizar. El fisio te pone una sesión doble sin hablar y el míster, cuando te ve, solo pregunta cuándo vuelves."),
      o("b", "Quitarle importancia: «Es mi vida y mi rodilla»", "Plantarte", { rel_aficion: -8, rel_entrenador: -5, fama: 2, multa: 2, flags: { dc_isla: true, estado_pitada: "@WEEK+5", estado_escandalo: "@WEEK+3" } }, "Tu frase se reproduce en todos los programas deportivos y los tertulianos la repiten con voz de grave. Cuando por fin vuelves, la grada, que lo ha entendido todo menos tu postura, te recibe con una pitada larga."),
    ]),
  S("dc-pitada-vuelta", "disciplina", { ...ADULTO, after: [after("dc-isla-lesion", undefined, 2, 14)], notFlags: ["dc_pitada_vuelta"] }, "partido",
    "Tu vuelta: la grada te recibe a pitos",
    "Por fin estás sano y por fin sales a calentar. Al anunciar tu nombre por megafonía, el estadio entero responde con un silbido largo, de los que se sienten en las costillas. En el córner, un grupo de aficionados despliega una pancarta con una palabra que no es amable. El míster te mira desde la banda y no hace ni un gesto: quiere ver qué haces.",
    [
      r("a", "Responder jugando: ganarte a la gente con el balón", "Con hechos", 0.5,
        "Te dejas la piel en cada balón. A los veinte minutos, el primer pase largo sale perfecto; a los cuarenta, un recorte, una combinación, una asistencia. En el minuto 70, tu nombre vuelve a sonar por megafonía y la grada, casi sin darse cuenta, lo aplaude. La pitada se ha terminado.", { rel_aficion: 9, moral: 6, fama: 2, flags: { dc_pitada_vuelta: true, estado_pitada: "", estado_racha: "@WEEK+2" } },
        "No es tu noche. El balón te quema, la grada lo huele y cada error se paga el doble. Sales del campo con una pitada más sonora que la inicial y el ánimo por los suelos.", { rel_aficion: -3, moral: -4, flags: { dc_pitada_vuelta: true, estado_pitada: "@WEEK+3" } }, "media"),
      o("b", "Besarte el escudo y pedir perdón con un gesto antes de empezar", "Gesto a la grada", { rel_aficion: 3, moral: 1, flags: { dc_pitada_vuelta: true, estado_pitada: "@WEEK+2" } }, "Cuando sales al césped, miras a la grada, te llevas la mano al escudo y asientes con la cabeza. Una parte de la gente aplaude; otra sigue silbando. Algo ha cambiado, pero hay que seguir ganándoselo."),
      o("c", "Ignorarlos y tratar de jugar como si no pasara nada", "Entereza", { rel_aficion: -2, moral: -2, forma: -1, flags: { dc_pitada_vuelta: true, estado_pitada: "@WEEK+4" } }, "Haces tu partido sin levantar la vista. Los pitos disminuyen con el paso de los minutos, pero no desaparecen. Al acabar, el míster te dice: «Hay cosas que no se esquivan: se aguantan». Y se va sin esperar respuesta."),
    ]),
  S("dc-pitada", "disciplina", { ...ADULTO, flags: ["estado_escandalo"], rel: { aficion: [0, 72] }, notFlags: ["dc_pitada", "estado_pitada"], clubTurns: [3, 400], roles: ["titular", "rotacion"] }, "partido",
    "La grada te pita en tu propio estadio",
    "No es por cómo juegas: es por lo que ha pasado esta semana fuera del campo. Cada vez que tocas el balón, un sector de la grada responde con silbidos, y el resto, que no sabe si unirse, calla. Un niño de la primera fila te mira con cara de no entender por qué la gente que te quería ahora te silba.",
    [
      r("a", "Pedir el balón más que nunca: no esconderte", "Dar la cara jugando", 0.5,
        "Pides el balón, vas a por todos los duelos y a los treinta minutos, una pared en la frontal termina con un remate al palo. La grada, que esperaba un acobardado, descubre a un jugador que se atreve. Los silbidos bajan.", { rel_aficion: 6, moral: 4, flags: { dc_pitada: true, estado_pitada: "" } },
        "La presión te supera. Fallas dos pases fáciles y los silbidos se convierten en un murmullo general. Sales del campo con la certeza de que esto va a durar más de lo que pensabas.", { rel_aficion: -3, moral: -4, flags: { dc_pitada: true, estado_pitada: "@WEEK+4" } }, "moral"),
      o("b", "Hablar con los ultras después del partido", "Cara a cara", { rel_aficion: 5, moral: 2, rel_vestuario: 1, flags: { dc_pitada: true, estado_pitada: "@WEEK+1" } }, "Te acercas a la peña con el pelo mojado. Hablas diez minutos con ellos, sin discurso preparado. Un hombre de sesenta años te dice: «Aquí queremos que te quedes, pero que te portes». Es la frase más justa que te han dicho en meses."),
      o("c", "No decir nada y esperar a que se les pase", "Resignarte", { rel_aficion: -2, moral: -2, flags: { dc_pitada: true, estado_pitada: "@WEEK+4" } }, "Los silbidos van y vienen según los partidos, y tú aprendes a jugar con ellos de fondo. No se van del todo hasta que un día, sin avisar, alguien en la grada empieza a aplaudirte y los demás se contagian."),
    ]),
];
