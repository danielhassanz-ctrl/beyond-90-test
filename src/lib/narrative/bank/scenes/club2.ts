/**
 * El club por dentro y la cabeza del jugador: el director deportivo que te ficha a tus espaldas, el
 * presidente que cambia de opinión, el psicólogo, la lista de objetivos pegada en la nevera, la
 * invitación a una conferencia. Pequeñas decisiones que te cambian el modo de pensar y de estar.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const CLUB2: BankScene[] = [
  S("c2-director", "club", { minAge: 18, clubTurns: [4, 400], notFlags: ["c2_director"] }, "representante",
    "El director deportivo te cita en su despacho sin avisar de qué va",
    "Es un despacho con una vista enorme del césped y una pared forrada de camisetas enmarcadas. El director, un hombre sereno con gafas de pasta, te ofrece un café. «Voy a ser claro: estamos moviendo piezas en la plantilla. Y no sé aún en qué lugar estás tú». Hay un silencio. Sobre la mesa, una carpeta con tu nombre y una hoja en blanco.",
    [
      o("a", "Preguntarle con respeto qué esperan de ti", "Ir al grano", { rel_representante: 1, reputacion: 3, moral: 2, flags: { c2_director: "pregunto" } }, "El director se reclina en la silla y sonríe. «Eso me gusta». Te explica el plan para los próximos años, con una franqueza poco habitual. Sales del despacho sin certezas, pero con una claridad que no tenías."),
      o("b", "Decirle que aspiras a ser pieza clave y pedirle un compromiso", "Poner tu ambición sobre la mesa", { moral: 3, reputacion: 2, rel_entrenador: -1, flags: { c2_director: "ambicion" } }, "Dices lo que piensas. El director toma nota con aire serio. «Lo valoraré», responde. A los diez días, te llega un contrato con una cláusula de minutos. No es una promesa, pero es una señal."),
      o("c", "Escuchar sin decir nada y esperar a que hable", "Dejarle llevar el ritmo", { moral: 0, flags: { c2_director: "callo" } }, "El director te explica un plan que no te incluye. Asientes. Al salir, te das cuenta de que no has preguntado nada. En el pasillo, tu agente te mira: «¿Qué ha dicho?». «No sé», contestas."),
    ]),
  S("c2-psicologo", "club", { minAge: 17, clubTurns: [3, 400], notFlags: ["terapia", "c2_psicologo"] }, "vida",
    "El club contrata a un psicólogo deportivo y te pide que seas el primero en probar",
    "Es una mujer de unos cuarenta años, con una calma pausada y una libreta que casi nunca abre. Se sienta contigo en un despacho sin cuadros y te sirve un vaso de agua. «No voy a arreglarte —dice—. Solo a ayudarte a escuchar». Te explica cómo la cabeza puede ser un campo de batalla o un aliado. Tú, de brazos cruzados, empiezas a hablar sin darte cuenta.",
    [
      o("a", "Abrirte y contarle lo que te quita el sueño", "Hablar de verdad", { moral: 7, forma: 2, reputacion: 3, flags: { c2_psicologo: "abro", terapia: true } }, "Hablas de la presión, de las expectativas, de lo mucho que odias fallar delante de la gente. Ella escucha, apunta una sola palabra y dice: «Esa es la clave». No te dice cuál. Tardarás semanas en descubrirlo."),
      o("b", "Hablar de fútbol y evitar lo personal", "Mantener la distancia", { moral: 2, flags: { c2_psicologo: "distancia" } }, "Le cuentas tus rutinas, tus manías, tus esquemas. La psicóloga sonríe: «Es un buen resumen del jugador. Ahora, la persona». Te quedas callado. Ella sonríe de nuevo. «Cuando quieras»."),
      o("c", "Decirle que no lo necesitas, pero con amabilidad", "Declinar", { moral: -1, reputacion: 1, flags: { c2_psicologo: "no" } }, "Ella lo acepta con gracia. «Mi puerta está abierta». Pasan los meses. Una noche mala, después de un partido horrible, pasas por delante de su despacho. Dudas. Llamas a la puerta."),
    ]),
  S("c2-objetivos", "club", { minAge: 16, clubTurns: [2, 400], turn: [1, 2], notFlags: ["c2_objetivos"] }, "vida",
    "Escribes tus objetivos de la temporada y los pegas en la nevera",
    "Es un ritual que te enseñó un entrenador de cantera: cada inicio de curso, una hoja con cinco objetivos, una fecha y una firma. Este año escribes: «Marcar diez goles. Jugar treinta partidos. Llamar a mi abuela una vez por semana. Aprender a cocinar. Ser mejor persona que jugador». Pegas el papel en la nevera con un imán de pizza. Tu pareja, tu madre o tu compañero de piso, al leerlo, sonríe.",
    [
      o("a", "Añadir un objetivo que te asusta de verdad", "Apuntar más alto", { moral: 4, forma: 1, flags: { c2_objetivos: "alto" } }, "Escribes: «Ser convocado con la selección». Lo miras un rato. Te late el corazón. Es la primera vez que lo confiesas. Esa tarde, entrenas como si fuera un examen."),
      o("b", "Dejar la lista como está y no complicarte la vida", "Con cabeza", { moral: 2, flags: { c2_objetivos: "simple" } }, "La lista se queda en la nevera. A mitad de temporada, la miras. Has cumplido tres. En junio, cuando la quitas, la guardas en un cajón con las de los años anteriores."),
      o("c", "Compartir los objetivos con tu madre, para tener una testigo", "Compromiso con alguien", { moral: 5, reputacion: 2, flags: { c2_objetivos: "madre" } }, "Se lo lees por teléfono. Tu madre apunta, en su agenda, cada uno. «Así lo recuerdo yo», dice. A fin de curso, te llama: «Llevas siete. Y te falta cocinar». Os reís a carcajadas."),
    ]),
  S("c2-conferencia", "club", { minAge: 20, fama: [45, 100], clubTurns: [4, 400], notFlags: ["c2_conferencia"] }, "prensa",
    "Te invitan a dar una charla a un congreso de empresarios y no sabes de qué hablar",
    "Son quinientas personas en traje, una tarima con una alfombra y un cartel con tu nombre: «Liderazgo bajo presión». Tu agente te pasa un guion de cuarenta páginas. Tú, con las manos sudadas, lees la primera frase y piensas que no sabes nada de liderazgo. Solo sabes lo que has vivido. Respiras hondo.",
    [
      o("a", "Tirar el guion y contar tu historia con naturalidad", "Hablar sin papeles", { fama: 4, reputacion: 7, moral: 6, flags: { c2_conferencia: "natural" } }, "Hablas de tu primer fracaso, de tu madre, de una vez que quisiste dejarlo todo. Se hace un silencio absoluto. Cuando acabas, una señora de la primera fila llora. Te llueven tarjetas y una oferta para una charla internacional."),
      o("b", "Seguir el guion palabra por palabra", "Cumplir con el trabajo", { reputacion: 2, moral: 1, flags: { c2_conferencia: "guion" } }, "Lees cada línea con corrección. Aplausos corteses. Un empresario, al salir, te dice: «Ha sido interesante». Es la palabra más tibia del diccionario."),
      o("c", "Hacer reír al público con anécdotas del vestuario", "Entretener", { fama: 5, rel_aficion: 3, moral: 5, reputacion: 3, flags: { c2_conferencia: "humor" } }, "Cuentas lo del loro, lo de la gallina, lo del cuñado entrenador. Quinientos empresarios se parten. «Esta es la mejor charla del congreso», dice el organizador. Tu agente, aliviado, deja de morderse las uñas."),
    ]),
  S("c2-reunion-capitanes", "club", { minAge: 20, clubTurns: [5, 400], flags: ["capitan_equipo"], notFlags: ["c2_reunion"] }, "vestuario",
    "Como capitán, te toca mediar entre el vestuario y la directiva",
    "Es una reunión con un café frío, tres directivos de traje gris y un orden del día de cuatro páginas. Piden más disciplina, menos ruido, más sonrisas ante las cámaras. En la sala contigua, tus compañeros, que se han enterado, esperan. Cada vez que levantas la vista, ves a un directivo mirar el reloj. Sientes el peso del brazalete como nunca.",
    [
      o("a", "Defender al vestuario con firmeza y datos", "Plantar cara", { rel_vestuario: 8, reputacion: 3, rel_entrenador: -2, flags: { c2_reunion: "defiendo" } }, "Presentas tres puntos y dos excepciones. Los directivos escuchan sin interrumpir. Al final, uno de ellos dice: «Hay que escuchar a quien conoce el día a día». Sales con un acuerdo y el respeto del equipo."),
      o("b", "Buscar un punto medio, cediendo en lo menor", "Negociar", { rel_vestuario: 4, reputacion: 4, rel_entrenador: 2, flags: { c2_reunion: "negocio" } }, "Os repartís las concesiones. Los directivos sonríen. El vestuario, con alguna queja, acepta. «Un acuerdo es un acuerdo», dice el capitán anterior, que te observa desde la puerta."),
      o("c", "Aceptar todo lo que pide la directiva", "Ser dócil", { rel_vestuario: -4, rel_entrenador: 3, moral: -2, flags: { c2_reunion: "dócil" } }, "Sales de la sala con todo firmado. Tus compañeros te miran con una frialdad nueva. En el vestuario, se hace un silencio. Alguien murmura: «Capitán de la directiva». Dolerá un tiempo."),
    ]),
  S("c2-cambio-plan", "club", { minAge: 18, roles: ["titular", "rotacion"], clubTurns: [4, 400], notFlags: ["c2_plan"] }, "entrenamiento",
    "El club cambia de sistema táctico y tu posición desaparece de la pizarra",
    "Es un martes cualquiera y el míster entra con una pizarra nueva: un 3-4-3 con carrileros, un falso nueve y una presión alta que parece sacada de otro planeta. Mira tu posición en el viejo esquema, borra tu nombre con el dedo y lo reescribe con un lápiz más fino en un hueco que todavía no existe. «Vamos a probar», dice. Tú sientes un pequeño vértigo.",
    [
      o("a", "Adaptarte con ganas y pedir más sesiones de vídeo", "Aprender el nuevo papel", { forma: 2, rel_entrenador: 4, moral: 2, flags: { c2_plan: "adapto" } }, "Pasas una semana con vídeos y notas. En el primer partido, te sale algo parecido a lo que quiere el míster. «No está mal», dice al final. Para él, es un diez."),
      o("b", "Preguntar si habrá un puesto para ti en el viejo sistema", "Pedir claridad", { rel_entrenador: -1, moral: 0, flags: { c2_plan: "pido" } }, "El míster te mira y dice: «Eso lo decidiremos juntos». No lo entiendes del todo. Pero a la semana, te llama a su despacho con una propuesta clara. Te alegra preguntar."),
      o("c", "Quejarte en el vestuario y reunir a los descontentos", "Resistirte", { rel_vestuario: 2, rel_entrenador: -5, moral: -2, flags: { c2_plan: "resisto" } }, "Se forma un pequeño grupo de críticos. El míster lo percibe. Un día, entra al vestuario con la pizarra y dice: «Conmigo o fuera». Nadie se atreve a contestar. Tienes que aguantar un mes de miradas oblicuas."),
    ]),
  S("c2-director-vuelve", "club", { after: [after("c2-director", "b", 10, 80)], minAge: 20 }, "representante",
    "El director deportivo te llama para cumplir lo que prometió",
    "Pasan los meses y recibes un mensaje seco: «Pásate por el despacho». En la mesa hay una carpeta con tu nombre, una pluma y una cláusula que reconoces: «Minutos garantizados en competición liguera». El director, sin levantar la vista, dice: «Dijiste que querías ser pieza clave. Aquí tienes la oportunidad». Hay un silencio. «No me falles».",
    [
      o("a", "Firmar con la cabeza alta y agradecerle", "Aceptar el reto", { rel_representante: 2, reputacion: 4, moral: 6, flags: { c2_clausula: true } }, "Firmas. El director te estrecha la mano con firmeza. «Esperamos mucho de ti». En la rueda de prensa, dices: «Voy a demostrar que acertaron». La frase se hace titular. Y el peso se hace real."),
      o("b", "Pedirle un día para consultarlo con tu agente", "Con cabeza", { rel_representante: 3, moral: 2, flags: { c2_clausula: true } }, "Tu agente lee la cláusula dos veces. «Es buena —dice—, pero hay que añadir una cosa». A los tres días, el contrato está listo. Firmas con una sonrisa. Habéis ganado ambos."),
    ]),
  S("c2-trofeo-casa", "club", { minAge: 20, flags: ["trofeos"], clubTurns: [4, 400], notFlags: ["c2_vitrina"] }, "vida",
    "El club pone tu trofeo en una vitrina pública y la gente hace cola para verlo",
    "Es en el vestíbulo del estadio, una vitrina de cristal con luz cálida y una placa con la fecha. Cada mañana, antes del entrenamiento, ves a algunos aficionados pegados al cristal, con niños en brazos. Hoy, mientras te acercas, un anciano te toca el brazo: «Gracias por esto». Te quedas helado. Es una frase que te acompañará toda la tarde.",
    [
      o("a", "Quedarte un rato con ellos, contándoles cómo fue", "Compartir el momento", { moral: 8, rel_aficion: 7, reputacion: 4, flags: { c2_vitrina: "charla" } }, "Hablas veinte minutos con un grupo de aficionados. Un niño te pregunta si pesaba mucho. «Pesaba lo que pesa la ilusión de todos», contestas. Esa frase, dicha sin pensar, acabará en una camiseta."),
      o("b", "Pasar discretamente y tocar el cristal con los nudillos", "Un gesto íntimo", { moral: 5, rel_aficion: 2, flags: { c2_vitrina: "toque" } }, "Es un gesto que repites cada mañana, sin explicarlo. Con el tiempo, un par de compañeros lo imitan. Se convierte en un rito: tocar la vitrina antes de entrenar. Nadie sabe quién empezó. Tú, sí."),
    ]),
];
