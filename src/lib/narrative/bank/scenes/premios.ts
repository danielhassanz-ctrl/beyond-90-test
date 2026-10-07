/**
 * Premios y citas de la juventud: el Golden Boy (el mejor sub-21 del año, a
 * los 17-20 años) y los Juegos Olímpicos con la selección sub-23. Cada cita
 * se encadena: nominación, gala o torneo, y lo que deja (un trofeo en la
 * vitrina o una espina clavada) cuenta para la historia del jugador.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const PREMIOS: BankScene[] = [
  // ───────────── GOLDEN BOY ─────────────
  S("gb-nominacion", "premios", { minAge: 17, maxAge: 20, media: [68, 99], fama: [32, 100], turn: [4, 6], notFlags: ["golden_boy", "gb_nominado"], minWeek: 15 }, "prensa",
    "Estás en la lista del Golden Boy",
    "Un diario deportivo italiano publica la lista de cien jóvenes de veintiún años o menos que optan al Golden Boy, el premio al mejor joven de Europa. Tu nombre es el cuarenta y siete, pero ya tienes a tres periodistas en la puerta preguntando cómo se vive «con tanta ilusión». Tu madre ha guardado la hoja con un imán en la nevera.",
    [
      o("a", "Vivirlo con ilusión y decirlo en voz alta", "Que se note que te hace ilusión", { fama: 3, moral: 5, rel_aficion: 2, flags: { gb_nominado: true } }, "Dices ante las cámaras que es el sueño de un chaval de tu barrio. La frase se hace viral y los de la peña del club te escriben: «Vas a ganarlo, ya verás»."),
      o("b", "Quitarle importancia: «Es un premio de periodistas»", "Mantener los pies en el suelo", { reputacion: 3, moral: 2, flags: { gb_nominado: true } }, "Dices que lo importante es el equipo. Tu entrenador asiente con aprobación desde la banda, y tu madre te dice por teléfono, bajito: «Qué bien hablas, hijo»."),
      o("c", "Pedirle a tu agente que mueva el nombre entre los votantes", "Una pequeña campaña", { fama: 4, rel_representante: 3, reputacion: -2, flags: { gb_nominado: true } }, "Tu agente hace tres llamadas y una cena. Funciona, y se nota: la prensa hablará de «campaña discreta». Pero no deja de ser un premio al que optas con ventaja ajena."),
    ], { weight: 1.5 }),
  S("gb-gala", "premios", { after: [after("gb-nominacion", undefined, 1, 4)], minAge: 17, maxAge: 20 }, "especial",
    "La noche del Golden Boy",
    "Una sala de Turín con mil quinientas personas y una alfombra roja que huele a laca. Los cinco finalistas esperáis sentados en la primera fila con la corbata un poco torcida. Cuando el presentador sube al escenario, el sobre pesa más que cualquier trofeo. Se hace un silencio de estadio antes de un penalti. «And the Golden Boy is…».",
    [
      r("a", "Prepararte un discurso breve y sincero por si acaso", "Una noche con el corazón en la mano", 0.34, "Dicen tu nombre. Te levantas con las piernas de gelatina. El discurso sale entero: tu madre, tu padre, Nacho y el campo de tierra. Cuando acabas, la sala te aplaude de pie. Eres el mejor joven de Europa.", { fama: 12, moral: 12, rel_aficion: 6, reputacion: 6, flags: { golden_boy: true } }, "Dicen otro nombre. Aplaudes con una sonrisa que sabe a ceniza y cuando vuelves a casa, tu madre te ha preparado croquetas. «Para mí eres el mejor», dice. Terminas segundo, la espina clavada del finalista.", { fama: 4, moral: -3, flags: { gb_finalista: true } }, "media"),
      r("b", "Ir sin discurso preparado: lo que salga", "Fiarte del momento", 0.3, "Dicen tu nombre. Subes al escenario sin papeles y tartamudeas tres frases que luego serán meme y homenaje a la vez. «Gracias, mamá», dices. Y el mundo entero se enamora un poco de ti.", { fama: 14, moral: 11, rel_aficion: 7, reputacion: 4, flags: { golden_boy: true } }, "No dicen tu nombre. Sonríes, aplaudes, y al salir un periodista te pregunta cómo te sientes. «Con ganas de entrenar», dices. Eres finalista y todos lo olvidarán antes que tú.", { fama: 4, moral: -3, flags: { gb_finalista: true } }, "fama"),
      o("c", "Declinar asistir: te toca partido al día siguiente", "Primero el equipo", { rel_entrenador: 4, reputacion: 2, moral: -1, flags: { gb_finalista: true } }, "Mandas un vídeo desde el hotel de concentración. El equipo gana el partido y tu vídeo se hace tendencia. No sabrás nunca qué sobre abrió el presentador, y en el fondo prefieres no saberlo."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a young footballer in a dark suit on a gala stage holding a golden trophy, flashbulbs and elegant audience, emotional smile, cinematic lighting, no logos or readable text" }),
  S("gb-vitrina", "premios", { after: [after("gb-gala", undefined, 3, 14)], flags: ["golden_boy"] }, "vida",
    "El Golden Boy en la vitrina de casa",
    "Llevas el trofeo en una bolsa de deporte hasta casa de tus padres, como quien trae una barra de pan. Tu madre lo coloca en la estantería del salón, entre una foto de tu comunión y un jarrón que no usa nadie. Tu padre lo mira, lo toca con un dedo, lo mira otra vez. Y dice, muy serio: «Habrá que comprar una vitrina».",
    [
      o("a", "Comprar tú la vitrina y colocarla con ellos", "Un gesto para recordar", { patrimonio: -450, moral: 9, reputacion: 2 }, "Montáis la vitrina entre los tres, con un destornillador torcido y muchas discusiones. Cuando acabáis, tu padre coloca el trofeo en el centro y da un paso atrás, con los brazos cruzados, sin decir nada. Es su manera de llorar."),
      o("b", "Dejarlo en el salón, entre las fotos, sin más", "Lo natural", { moral: 6 }, "El Golden Boy se queda junto a la foto de tu comunión. Cada visita, tu madre le quita el polvo con un trapo que reserva para eso. Para ella, no es un trofeo: es una prueba de que valió la pena."),
    ]),
  S("gb-otra-vez", "premios", { after: [after("gb-gala", "c", 6, 40)], minAge: 18, maxAge: 20, notFlags: ["golden_boy"] }, "prensa",
    "Otra vez en la lista del Golden Boy",
    "Un año después, el nombre vuelve a la lista. Esta vez, más arriba: el decimotercero. La prensa te mira con otros ojos: ya no eres «el prometedor», sino «el que se quedó a las puertas». Tu agente te lo dice sin rodeos: «O ahora, o nunca».",
    [
      r("a", "Ir a por él con todo", "Todo o nada", 0.4, "Esta vez dicen tu nombre. Subes al escenario con el discurso de hace un año, ya gastado en el bolsillo, y lo sacas del bolsillo con una media sonrisa. Eres el mejor joven de Europa, un año tarde y por eso más dulce.", { fama: 12, moral: 12, rel_aficion: 6, flags: { golden_boy: true } }, "No es tu año. De nuevo finalista. Piensas que el siguiente, quizá, y se te pasa el mal sabor en dos días.", { moral: -3, fama: 3 }, "media"),
      o("b", "Pasar del premio y centrarte en el campo", "Que hable el fútbol", { forma: 2, moral: 3, reputacion: 2 }, "Esta vez no vas ni a la cena. Entrenas por la mañana y por la tarde. El premio, que decide otro, ya no te quita el sueño."),
    ]),
  // ───────────── JUEGOS OLÍMPICOS ─────────────
  S("jjoo-convocatoria", "premios", { olimpicos: "antesala", maxAge: 23, minAge: 18, media: [62, 99], turn: [7, 10] }, "vida",
    "Te llaman para los Juegos Olímpicos",
    "El seleccionador sub-23 te escribe un mensaje largo y emocionado: va a llevar a los Juegos a un grupo de jóvenes con tres veteranos de refuerzo, y te quiere en el centro del campo. «Un Juego Olímpico no se juega todos los días. Y menos a tu edad». Tu club no está del todo contento: sería en pleno verano.",
    [
      o("a", "Aceptar con ilusión y hablarlo con tu club", "Cumplir un sueño", { moral: 7, fama: 2, rel_entrenador: -2, flags: { olimpico_convocado: true } }, "Se lo cuentas al míster con una sonrisa que no puedes disimular. Él suspira, se rasca la cabeza y dice: «Ve. Y vuelve entero». Esa noche, no puedes dormir."),
      o("b", "Declinar para descansar y preparar la pretemporada", "Cuidar el cuerpo", { forma: 2, rel_entrenador: 3, moral: -3 }, "Se lo dices al seleccionador con respeto. Él lo entiende y te desea suerte. En agosto, viendo los partidos por televisión, no puedes evitar sentir un pellizco."),
      o("c", "Pedir a tu club que decida por ti", "Dejarlo en sus manos", { rel_entrenador: 2, moral: -1, flags: { olimpico_convocado: true } }, "El club, tras mucho dudar, os deja ir. Ese gesto no se te olvida, ni al míster que en voz baja dice «esto lo cobraré»."),
    ], { weight: 1.3 }),
  S("jjoo-aldea", "premios", { olimpicos: "ano", flags: ["olimpico_convocado"], after: [after("jjoo-convocatoria", undefined, 1, 40)], maxAge: 24 }, "especial",
    "La Villa Olímpica",
    "Una habitación para dos, una cama pequeña para tu altura y un ventanal desde donde se ve el pebetero. En el comedor cenas junto a una nadadora de dieciséis años y un gimnasta con más tatuajes que tú. Alguien te cuenta, con entusiasmo, que el mejor sitio para ver la ceremonia es el tejado, pero está prohibido.",
    [
      o("a", "Subir al tejado con un par de compañeros", "Un poco de rebeldía", { rel_vestuario: 5, moral: 6, reputacion: -1 }, "Subís por una escalera de incendios con una bolsa de gominolas y os sentáis a ver los fuegos artificiales. Es la imagen que contarás durante cuarenta años. Un guardia os ve, sonríe y no dice nada."),
      o("b", "Quedarte en la habitación y descansar", "Cabeza fría", { forma: 3, moral: 2 }, "Duermes diez horas. Al día siguiente, te sientes un robot recién enchufado. Tu compañero de habitación, desde la otra cama, murmura: «Tú sí que sabes».", { }),
      o("c", "Pasear por la Villa y hablar con deportistas de otras disciplinas", "Aprender de otros", { moral: 6, reputacion: 2, fama: 1 }, "Hablas con una saltadora de pértiga que lleva ocho años sin ganar nada y que te dice, con calma: «Aquí no se gana, se llega. Y llegar ya es muchísimo»."),
    ]),
  S("jjoo-semifinal", "premios", { olimpicos: "ano", after: [after("jjoo-aldea", undefined, 1, 10)], maxAge: 24 }, "partido",
    "La semifinal olímpica",
    "El estadio está a rebosar y el aire huele a césped y a nervios. Os jugáis un sitio en la final de los Juegos Olímpicos. En el vestuario, el seleccionador no habla de táctica: reparte un papelito con una frase a cada uno. El tuyo dice solo: «Disfruta». El capitán lo lee en voz alta y se le quiebra la voz.",
    [
      r("a", "Salir a jugar con alegría, sin presión", "Disfrutar de verdad", 0.52, "Jugáis la mejor media hora de vuestras vidas. Ganáis 2-1 con un gol tuyo en el minuto 80. Estáis en la final olímpica y no podéis dejar de gritar.", { moral: 10, fama: 5, rel_vestuario: 4, flags: { olimpico_final: true } }, "El partido se os escapa en el último suspiro. Lloras en el césped, con las manos en la cara. Os queda el partido por el bronce.", { moral: -4, rel_vestuario: 2, flags: { olimpico_bronce: true } }, "moral"),
      r("b", "Dar la cara y asumir la responsabilidad", "Liderar el equipo", 0.46, "Lideras la presión y marcas el ritmo. Acabáis 1-0 y el pitido final os cae encima como una ola. Estáis en la final.", { moral: 9, fama: 6, rel_vestuario: 5, reputacion: 3, flags: { olimpico_final: true } }, "Pierdes un balón decisivo en el minuto 88 y se convierte en gol rival. Aguantas las lágrimas hasta el túnel. Os queda el bronce.", { moral: -5, reputacion: -1, flags: { olimpico_bronce: true } }, "media"),
    ], { isMilestone: true, milestoneType: "escena", imageScene: "Photorealistic photo of a young football team celebrating in a packed Olympic stadium, arms raised, emotional faces, summer evening light, no logos or readable text" }),
  S("jjoo-final", "premios", { olimpicos: "ano", flags: ["olimpico_final"], after: [after("jjoo-semifinal", undefined, 1, 8)], maxAge: 24 }, "especial",
    "La final de los Juegos Olímpicos",
    "Hay una medalla de oro en juego y te lo repites mientras te atas las botas: «Solo un partido más». El himno suena más lento que nunca. Al otro lado, tu rival sale con la cara de quien ha dormido poco y lleva mucho tiempo pensando en lo mismo. En la grada, tu familia, con una bandera que tiene más años que tú.",
    [
      r("a", "Salir con todo desde el primer minuto", "Un partido a muerte", 0.5, "Una final olímpica no se olvida. Ganáis 2-1 con un penalti en el minuto 90. Cuando te cuelgan la medalla, te quedas mirándola un largo rato. Pesa más de lo que pensabas.", { moral: 14, fama: 10, rel_aficion: 6, reputacion: 5, flags: { olimpico_medalla: "oro" } }, "Perdéis por la mínima y la medalla es de plata. Lloras sin ningún pudor. Cuando te la cuelgan, la besas igualmente: es una plata que sabe a todo menos a derrota.", { moral: 3, fama: 6, reputacion: 3, flags: { olimpico_medalla: "plata" } }, "forma"),
      r("b", "Jugar con calma y dejar que el partido te llegue", "Control y cabeza fría", 0.42, "No es un partido brillante, pero lo ganáis con oficio y un gol de córner en el 70. El oro te lo cuelgan en una ceremonia que dura nueve minutos y que recordarás como los más rápidos de tu vida.", { moral: 12, fama: 9, reputacion: 5, flags: { olimpico_medalla: "oro" } }, "Se os va el partido en un contragolpe y la medalla es de plata. Es de las derrotas que, con los años, se parecen mucho a una victoria.", { moral: 2, fama: 5, reputacion: 3, flags: { olimpico_medalla: "plata" } }, "moral"),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a young footballer receiving a medal on an Olympic podium, emotional tears and smile, stadium lights, no logos or readable text" }),
  S("jjoo-bronce", "premios", { olimpicos: "ano", flags: ["olimpico_bronce"], after: [after("jjoo-semifinal", undefined, 1, 8)], maxAge: 24 }, "especial",
    "El partido por el bronce",
    "Es el partido que nadie quiere jugar y que todos quieren ganar. Sigues con las lágrimas de la semifinal pegadas a la camiseta y el seleccionador, en el vestuario, dice solo una cosa: «Hoy se juega por la medalla de vuestra vida, y no es de oro». Detrás de la puerta, el estadio ya canta.",
    [
      r("a", "Salir a por el bronce sin mirar atrás", "Cerrar el torneo con orgullo", 0.62, "Ganáis 3-1 con un gol tuyo. Cuando te cuelgan el bronce, lo aprietas con una mano y miras al cielo. «Una más, de las que importan», piensas.", { moral: 9, fama: 6, reputacion: 3, flags: { olimpico_medalla: "bronce" } }, "Perdéis por un gol en el descuento y os quedáis sin medalla. El cuarto puesto es el peor lugar del mundo. Lo sabéis todos, aunque nadie lo diga.", { moral: -5, fama: 1, flags: { olimpico_medalla: "ninguna" } }, "moral"),
      o("b", "Dar la cara ante la prensa antes del partido", "Un mensaje al país", { fama: 3, reputacion: 3, moral: 3, flags: { olimpico_medalla: "bronce" } }, "Dices ante las cámaras que no hay medalla pequeña. Esa noche, el bronce es un hecho: ganáis 2-0, y tu frase es la más compartida del día."),
    ]),
];
