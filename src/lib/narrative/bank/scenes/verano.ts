/**
 * El verano del futbolista: unas vacaciones que casi nunca son vacaciones, una pretemporada con
 * calor y con sorpresas, la presentación de camisetas, el amistoso contra un equipo de otra
 * liga. Todas salen en los primeros turnos de la temporada y varias dejan marcas para todo el curso.
 */
import { S, o, r } from "../dsl";
import type { BankScene } from "../types";

export const VERANO: BankScene[] = [
  S("vr-vacaciones-isla", "verano", { minAge: 18, patrimonio: [2500, 100000000], turn: [1, 2], clubTurns: [2, 400], notFlags: ["vr_isla"] }, "vida",
    "Te vas a una isla a «no hacer nada» y el móvil no deja de sonar",
    "Has reservado una cabaña frente al mar, con una hamaca y un cartel que dice «Aquí no hay cobertura». Tardas dos horas en descubrir que sí la hay, en lo alto de una roca. Tu agente te escribe con un «urgente» cada diez minutos. Tu madre te manda una foto de una cena familiar con una carita triste. Tu pareja o tu mejor amigo te mira, con una ceja levantada, mientras tecleas.",
    [
      o("a", "Apagar el móvil y tirarlo al fondo de la maleta", "Desconectar de verdad", { moral: 9, forma: 2, rel_representante: -1, flags: { vr_isla: "apago" } }, "Los primeros dos días, tiemblas. Al tercero, empiezas a leer. Al quinto, a nadar sin mirar la hora. Al décimo, vuelves con la piel tostada y la cabeza vacía. Tu agente, al verte, sonríe: «Con esa cara, ya sé qué contrato firmas»."),
      o("b", "Dedicar una hora al día a lo urgente y el resto, a la isla", "Un equilibrio sensato", { moral: 6, rel_representante: 2, forma: 1, flags: { vr_isla: "equilibrio" } }, "A las diez de la mañana, el móvil. El resto del día, las olas. Cuando vuelves, has resuelto dos negocios y leído un libro. Es una forma civilizada de ser un profesional con vacaciones."),
      o("c", "Responder a todo y trabajar desde la hamaca", "Seguir enganchado", { moral: -2, rel_representante: 4, patrimonio: 1200, flags: { vr_isla: "trabajo" } }, "Cierras dos acuerdos desde la hamaca, uno de ellos muy bueno. Vuelves con el bolsillo más lleno y el cuerpo más cansado. Un compañero, al verte, te dice: «Pareces el único que no se ha ido de vacaciones»."),
    ]),
  S("vr-camisetas-presentacion", "verano", { minAge: 17, turn: [1, 2], clubTurns: [2, 400], notFlags: ["vr_camisetas"] }, "prensa",
    "La presentación de la camiseta nueva y el desfile en el que nadie sabe caminar",
    "Es una gala en el estadio, con focos, humo y una pasarela hecha con la alfombra de siempre. Los jugadores, con la camiseta nueva y un brazalete de modelo, tienen que caminar hasta el centro, girar y volver. El portero tropieza. El capitán, rígido, parece un maniquí. A ti te toca después del lateral, que ha hecho una pirueta. Los fotógrafos, entusiasmados, no paran de disparar.",
    [
      o("a", "Hacer una pose ridícula y arrancar la risa de todos", "Divertir al público", { fama: 4, rel_aficion: 5, moral: 4, flags: { vr_camisetas: "pose" } }, "Te quedas parado en el centro, con los brazos en jarras y una mirada de vampiro. El estadio se parte de risa. El meme se reproduce toda la semana. El director de marketing, entre lágrimas, dice: «Eso no estaba en el guion. Y es lo mejor»."),
      o("b", "Caminar con elegancia y tomarlo con seriedad", "Con profesionalidad", { reputacion: 3, moral: 2, flags: { vr_camisetas: "serio" } }, "Pasas con paso firme, giras con la cabeza alta. Los fotógrafos te hacen una foto perfecta. Un aficionado, en la tercera fila, murmura: «Qué serio». Y tú piensas: «Y qué incómodo»."),
      o("c", "Ceder tu turno al canterano más tímido para que luzca", "Dar protagonismo", { rel_vestuario: 5, reputacion: 4, moral: 3, flags: { vr_camisetas: "cedo" } }, "El chaval, de dieciocho años, sale al centro con las orejas rojas. La grada le dedica una ovación inesperada. Años después, en una entrevista, lo contará: «Aquel día me hicieron sentir parte del equipo»."),
    ]),
  S("vr-amistoso-lejano", "verano", { minAge: 17, turn: [1, 2], clubTurns: [2, 400], clubLevels: ["grande", "europeo"], notFlags: ["vr_lejano"] }, "partido",
    "El club os manda a un amistoso de gira por un país exótico, con un público que no sabe de fútbol",
    "Es un estadio nuevo, con asientos de plástico dorado y una pantalla enorme. Hay diez mil espectadores, dos azafatas con una bandeja de flores y un presentador que anuncia el partido con una voz de circo. A los cinco minutos, el público aplaude cada pase, cada regate, cada saque de banda. Te quedas desconcertado. El míster, desde el banquillo, murmura: «Esto es la gira. No lo cuestiones».",
    [
      o("a", "Jugar con entrega, firmar camisetas al final y hacerte fotos con todos", "Ser embajador", { fama: 5, rel_aficion: 4, moral: 5, patrimonio: 1000, flags: { vr_lejano: "embajador" } }, "Pasas una hora firmando. Un niño te regala una pulsera de hilo. El club, orgulloso, manda un comunicado: «El delantero que enamoró a un país nuevo». Tu agente cierra un patrocinio local en el aeropuerto."),
      o("b", "Cumplir y descansar: viajáis cada tres días y el calor es duro", "Cuidar el físico", { forma: 2, moral: 1, flags: { vr_lejano: "descanso" } }, "Entrenas lo justo y te cuidas. Al volver, eres el que mejor llega. El preparador físico, al ver los números, te estrecha la mano. Sientes que has jugado al largo plazo."),
      o("c", "Intentar un gol imposible para dar espectáculo", "Hacer un número", { fama: 4, moral: 4, rel_entrenador: -1, flags: { vr_lejano: "numero" } }, "Intentas una chilena a medio campo. El balón sube, sube y cae en la cabeza del árbitro. El estadio, entusiasmado, aplaude de pie. El míster, desde la banda, se lleva las manos a la cara. Pero sonríe."),
    ]),
  S("vr-fichaje-llega", "verano", { minAge: 17, turn: [1, 2], clubTurns: [2, 400], clubLevels: ["grande", "europeo"], notFlags: ["vr_fichaje"] }, "vestuario",
    "El fichaje estrella del verano llega con un séquito y una maleta con ruedas",
    "Aparece en el vestuario a las diez de la mañana, con una camisa estampada y un reloj que hace ruido. Detrás, dos asesores, un chófer y un tipo que graba todo con una cámara. El capitán, cruzado de brazos, lo mira. El nuevo, con una sonrisa blanca, extiende la mano: «Perdón por la tardanza». El utillero, que lo conoce de nombre, tiene los ojos como platos. Todo el vestuario contiene la respiración.",
    [
      o("a", "Acercarte y ofrecerle ayuda con la ciudad, el idioma y el vestuario", "Recibirle con calidez", { rel_vestuario: 5, reputacion: 4, moral: 3, flags: { vr_fichaje: "calido" } }, "El nuevo, descolocado, acepta. Te cuenta que lo que más teme es la soledad. Os hacéis amigos. En un mes, el vestuario le abre las puertas. Tú, sin pretenderlo, te has convertido en su guía."),
      o("b", "Observarle un par de semanas antes de juzgar", "Prudencia", { moral: 1, flags: { vr_fichaje: "espero" } }, "En dos semanas, descubres que es un tipo tímido con un séquito grande. Te acercas. «Te estaba esperando», murmura. Hay presencias que parecen enormes y son pequeñas."),
      o("c", "Retarle a un uno contra uno en el campo para marcar jerarquía", "Marcar territorio", { forma: 1, rel_vestuario: 2, moral: 3, flags: { vr_fichaje: "reto" } }, "Ganas 3-2 con un gol de rabona. El nuevo se ríe, te estrecha la mano y dice: «Mis respetos». El capitán asiente, apenas. El vestuario, desde entonces, te considera «el que le ganó al fichaje»."),
    ]),
  S("vr-nuevo-entrenador-pretemp", "verano", { minAge: 17, turn: [1, 1], clubTurns: [2, 400], notFlags: ["vr_pretemp_duro"] }, "entrenamiento",
    "La primera semana de pretemporada: cuarenta grados, un preparador sádico y una cuesta infinita",
    "Es una montaña a las afueras, con un sendero de gravilla y una pendiente que parece diseñada para humillar. El preparador, con unas gafas de sol espejadas, reparte instrucciones con un megáfono: «Diez subidas. Con el balón. Quien vomite, repite». El vestuario, pálido, murmura plegarias. Tú, con el pulso a mil, notas que el sudor te baja por la espalda. Alguien dice: «Esto lo hacen para odiarnos».",
    [
      r("a", "Dar el cien por cien en cada subida y tirar del grupo", "Liderar el esfuerzo", 0.6, "A la quinta subida, ya vas el primero. A la décima, nadie vomita. El preparador, con un silbato en la boca, te mira con respeto. «Tienes cabeza», murmura. Al acabar, el grupo te aplaude. Has marcado el tono de la temporada.", { forma: 4, moral: 5, rel_vestuario: 4, rel_entrenador: 3 }, "A la octava subida, te falla un tobillo y tienes que sentarte. El preparador, sin reproches, te vendará la pierna. «Aguantarás otra vez», dice. Te quedas con la vergüenza y con una promesa.", { forma: -1, moral: -2, rel_entrenador: 0 }, "forma"),
      o("b", "Dosificar el esfuerzo para no lesionarte", "Con cabeza", { forma: 2, moral: 1, rel_entrenador: -1, flags: { vr_pretemp_duro: "dosifico" } }, "Haces las diez subidas a un ritmo estable. El preparador, desde arriba, te lanza una mirada de suspicacia. «No te hagas el listo». Pero llegas al final entero, y esa tarde te sientes mejor que los que se desplomaron."),
      o("c", "Organizar una broma: esconder el megáfono", "Quitar tensión", { rel_vestuario: 6, moral: 4, rel_entrenador: -3, flags: { vr_pretemp_duro: "megafono" } }, "El megáfono desaparece durante veinte minutos. El preparador, rojo, grita sin él. Un compañero se lo devuelve con un lazo. El vestuario ríe. Tu sanción, una subida extra, la haces con una sonrisa."),
    ]),
  S("vr-hotel-playa", "verano", { minAge: 17, turn: [1, 2], clubTurns: [2, 400], notFlags: ["vr_hotel_playa"] }, "vestuario",
    "La concentración de pretemporada es en un hotel de playa donde no se puede ni mojar los pies",
    "Es un lugar de postal: arena blanca, agua cristalina, palmeras. Y un cartel en la puerta del vestuario, del míster: «Playa: cero». Desde el balcón, ves a los turistas bañarse. El portero, con cara de tragedia, murmura: «Esto es una tortura china». Hay una piscina en el patio con un cartel: «Solo para sesiones de recuperación». El fisio la usa con un termómetro.",
    [
      o("a", "Escaparte a la playa a las seis de la mañana, antes de que despierte el míster", "Tentar a la suerte", { moral: 6, rel_vestuario: 4, rel_entrenador: -2, flags: { vr_hotel_playa: "escapo" } }, "Os lanzáis tres compañeros al agua, con las toallas sobre los hombros. Es lo mejor del verano. A las siete, el míster os espera en la orilla con los brazos cruzados. «Veinte minutos más de carrera». Lo pagáis con gusto."),
      o("b", "Pedir permiso al míster para una sesión de baño controlado", "Negociar", { rel_entrenador: 3, moral: 3, flags: { vr_hotel_playa: "permiso" } }, "El míster lo estudia. «Veinte minutos. Con el fisio. Y sin gritar». El baño es un oasis. Desde entonces, se convierte en una tradición: cada pretemporada, un chapuzón en grupo."),
      o("c", "Obedecer y mirar el mar desde el balcón con un café", "Cumplir", { forma: 1, moral: 1, rel_entrenador: 2, flags: { vr_hotel_playa: "cumplo" } }, "Te quedas en el balcón mirando las olas. Piensas en que, en unos años, tendrás todo el tiempo del mundo para bañarte. Y que ahora, lo que tienes, es una temporada."),
    ]),
  S("vr-ultimo-dia", "verano", { minAge: 17, turn: [1, 2], clubTurns: [2, 400], notFlags: ["vr_ultimo"] }, "vida",
    "El último día de vacaciones lo pasas haciendo la maleta y echando de menos lo que no has vivido",
    "Es una tarde de agosto con el sol cayendo, la maleta abierta en la cama y la lista de cosas que prometiste hacer sin tachar. No fuiste a la montaña. No leíste ese libro. No llamaste a tu primo. Miras por la ventana y piensas que el verano se ha pasado en un suspiro. Al otro lado del pasillo, tu madre prepara la cena con la radio puesta. Es la hora de los pequeños arrepentimientos.",
    [
      o("a", "Llamar a tu primo y quedar con él esa misma noche", "Cumplir una promesa", { moral: 6, reputacion: 2, flags: { vr_ultimo: "primo" } }, "Cenáis en una terraza, con una luz cálida y un helado. Hablan de la infancia. Cuando te despides, él te abraza: «Cada verano, igual». Prometes que el próximo, no te irás sin vernos."),
      o("b", "Salir a dar una vuelta por tu barrio hasta que anochezca", "Absorber el barrio", { moral: 5, rel_aficion: 2, flags: { vr_ultimo: "paseo" } }, "Pasas por el campo, por la plaza, por el bar. Te saludan los de siempre. Un niño te pregunta si eres tú. «Soy yo», dices. Y te das cuenta de que, a veces, volver es lo mejor del verano."),
      o("c", "Cerrar la maleta, cenar con tu madre y acostarte pronto", "Prepararte", { forma: 2, moral: 3, flags: { vr_ultimo: "cierro" } }, "Cenáis las dos con la tele puesta. Tu madre te mete en la maleta un tupper con comida para tres días. «Para el viaje», dice. Te acuestas con el corazón lleno y la mochila lista."),
    ]),
];
