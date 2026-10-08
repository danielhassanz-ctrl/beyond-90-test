/**
 * Cantera (16-19): la pizzería a medianoche, el técnico duro que te dice que no vales, la primera
 * llamada de la selección sub-17, el compañero de residencia que no llega. Pequeñas escenas con
 * una segunda parte: lo que te dijeron de adolescente suele volver cuando ya no hace falta.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const CANTERA2: BankScene[] = [
  S("ca-pizza", "cantera", { minAge: 16, maxAge: 19, clubTurns: [1, 30], notFlags: ["ca_pizza"] }, "vida",
    "Una pizza a medianoche en la residencia, a escondidas del encargado",
    "Son las doce y diez y alguien ha pedido cuatro pizzas con una mochila de por medio. Seis chavales, a oscuras, reparten porciones en el pasillo del segundo piso, con el sigilo de un comando. Hay un guardia que hace la ronda a la una. Otro chaval vigila en la escalera. Por la ventana, aparece el repartidor con una sonrisa que dice: «No he visto nada».",
    [
      o("a", "Unirte a la pizza y disfrutar del momento", "Entrar en la banda", { rel_vestuario: 6, moral: 6, forma: -1, flags: { ca_pizza: "unido" } }, "Comes una porción de cuatro quesos con la espalda pegada a la pared. A la una, aparece el guardia, olfatea el aire, y dice con voz grave: «Huele a pizza». Nadie contesta. Se marcha. Esa noche, nace una hermandad."),
      o("b", "Quedarte en tu habitación por si te pillan", "Prudencia", { forma: 1, moral: -1, flags: { ca_pizza: "prudente" } }, "Te quedas leyendo. A la mañana siguiente, te enteras de que el encargado los pilló. Todos recibieron un castigo menos tú. Sientes alivio y, a la vez, algo de pena: te perdiste la mejor noche."),
      o("c", "Ofrecerte como vigía y controlar la escalera", "El centinela", { rel_vestuario: 5, moral: 4, flags: { ca_pizza: "vigia" } }, "Con una linterna y cara de sargento, controlas los pasos del guardia. Te salvas, y los salvas. Al día siguiente, en el desayuno, el que cargó con las pizzas te pone un trozo en el plato: «Por el servicio»."),
    ]),
  S("ca-no-vales", "cantera", { minAge: 16, maxAge: 19, clubTurns: [2, 40], notFlags: ["ca_no_vales"] }, "entrenamiento",
    "Tu entrenador de cantera te dice, a la cara, que no vas a llegar",
    "Lo hace sin maldad, con la dureza de quien ha visto cientos de chavales pasar por su despacho. «No creo que tengas el nivel. Te lo digo ahora porque es mejor que lo sepas». Te quedas mirándole. Detrás de él, una pared llena de fotos de futbolistas que sí llegaron. Tú no estás en ninguna. Notas cómo se te aprieta el estómago. Pero algo, dentro, se enciende.",
    [
      r("a", "Contestarle con calma que le demostrarás que se equivoca", "Aceptar el desafío", 0.6, "Esa tarde, empiezas a entrenar una hora más. Y otra. A los dos meses, el entrenador te mira distinto. «Algo ha cambiado», murmura. Tú no dices nada. Pero guardas la frase para siempre.", { forma: 3, moral: 5, rel_entrenador: 3, flags: { ca_no_vales: "reto" } }, "Te esfuerzas más de la cuenta y te lesionas por exceso de carga. El entrenador, al verte lesionado, dice: «Lo sabía». Duele, pero también te enciende. A los tres meses, vuelves más fuerte.", { forma: -2, moral: -2, flags: { ca_no_vales: "lesion" } }, "moral"),
      o("b", "Contárselo a tus padres y dejar que te abracen", "Buscar refugio", { moral: 4, reputacion: 1, flags: { ca_no_vales: "familia" } }, "Tu madre te prepara tu plato favorito. Tu padre se sienta frente a ti y dice: «Ese hombre no sabe lo que dice». No sabes si es verdad, pero esa noche duermes mejor."),
      o("c", "Callarte y rendirte un poco por dentro", "Dejar que duela", { moral: -5, forma: -1, flags: { ca_no_vales: "dudo" } }, "No dices nada. Entrenas con las rodillas flojas. A los quince días, ves a un chaval llorar por una frase parecida. Te acercas, le pones la mano en el hombro y dices: «Ese hombre no sabe lo que dice». Y por fin lo crees."),
    ]),
  S("ca-no-vales-vuelve", "cantera", { after: [after("ca-no-vales", "a", 12, 120)], minAge: 20 }, "vestuario",
    "El entrenador que dijo que no llegarías te pide una foto",
    "Han pasado los años, el club te ha convertido en un nombre propio, y un día, en el túnel, un hombre con el pelo ya blanco te espera con un balón en las manos. Es él, tu entrenador de cantera, que ahora trabaja en una escuela. «No sé si te acuerdas —dice con voz humilde—. Pero me equivoqué contigo. ¿Me firmas el balón?». Tienes un nudo enorme.",
    [
      o("a", "Firmarle el balón con una dedicatoria sincera", "Con elegancia", { moral: 9, reputacion: 6, rel_aficion: 3, flags: { ca_perdon: true } }, "Escribes: «Gracias por la frase. Fue la mejor clase». El hombre la lee, se emociona y te da un abrazo torpe. «Pues me alegro de haberme equivocado», murmura. Y los dos os reís por primera vez."),
      o("b", "Contarle lo que significó aquel día", "Decirle la verdad", { moral: 8, reputacion: 5, flags: { ca_perdon: true } }, "Le cuentas que esa frase te hizo trabajar más que ninguna otra. «No lo hice a propósito», dice. «Lo sé —contestas—. Pero funcionó». Os quedáis hablando una hora, sentados en el banquillo."),
      o("c", "Firmarle el balón en silencio y marcharte", "Orgullo herido", { moral: 2, reputacion: 1, flags: { ca_perdon: "frio" } }, "Firmas sin decir nada. Él lo guarda con cuidado. Cuando te vas, notas que algo se queda sin cerrar. Años después, te enterarás de que murió. Y lamentarás no haber dicho más."),
    ]),
  S("ca-sub17", "cantera", { minAge: 16, maxAge: 18, media: [55, 99], fama: [5, 100], notFlags: ["ca_sub17"] }, "especial",
    "Te convocan con la selección sub-17 por primera vez",
    "Es un correo electrónico escueto, con el escudo de tu país y una lista de nombres. El tuyo es el undécimo. Lo lees tres veces. Se lo enseñas a tu entrenador, que asiente con la ceja levantada. «Es el primer paso», dice. En casa, tu madre ya ha empezado a hacer maletas. Tu hermano pequeño llama a todos sus amigos para contárselo. Tú todavía no te lo crees.",
    [
      o("a", "Aceptar con ilusión y preparar la maleta con cuidado", "Dar el paso", { moral: 9, rel_entrenador: 2, reputacion: 3, flags: { ca_sub17: "voy" } }, "En la concentración, conoces a chavales de todo el país, con acentos que no esperabas. Compartes habitación con uno que tiene un vocabulario desbordante. Os hacéis amigos para siempre. Es solo el principio."),
      o("b", "Pedirle consejo a tu entrenador antes de ir", "Estudiar el momento", { moral: 6, rel_entrenador: 3, flags: { ca_sub17: "consejo" } }, "El entrenador te da tres consejos: «No intentes demostrarlo todo en el primer día. Escucha a los mayores. Y duerme». Los sigues al pie de la letra. En el primer entrenamiento, el seleccionador te mira con respeto."),
    ]),
  S("ca-residencia-adios", "cantera", { minAge: 16, maxAge: 20, clubTurns: [4, 60], notFlags: ["ca_adios"] }, "vida",
    "Tu compañero de habitación no pasa el corte y se va de la residencia",
    "Lo ves llegar del despacho con una carpeta bajo el brazo y una cara de piedra. «No me renuevan», dice. Se sienta en su cama y empieza a recoger sus cosas, una a una: una camiseta, un cargador, una foto de su familia. No hay drama, no hay lágrimas. Solo el ruido de la cremallera de la mochila. Tú, desde tu cama, intentas buscar algo que decir.",
    [
      o("a", "Ayudarle a recoger y pasar la última noche con él", "Acompañarle", { moral: -2, rel_vestuario: 5, reputacion: 4, flags: { ca_adios: "acompaño" } }, "Le ayudas con las cajas, os cenáis unos bocadillos en el suelo y habláis de todo menos del fútbol. A la mañana siguiente, en el autobús, os dais un abrazo largo. Él te susurra: «Llega por los dos»."),
      o("b", "Regalarle tu camiseta firmada por todo el grupo", "Un recuerdo", { moral: 1, rel_vestuario: 6, patrimonio: -30, flags: { ca_adios: "camiseta" } }, "Pasas por todas las habitaciones con la camiseta pidiendo firmas. Se la das en la puerta. Él la guarda en la mochila sin decir nada. Años después, la enmarcará en el salón de su casa."),
      o("c", "Quedarte callado, sin saber qué hacer", "No encontrar las palabras", { moral: -4, flags: { ca_adios: "callo" } }, "No dices nada. Él tampoco. Cuando la puerta se cierra, te quedas mirando su cama vacía. Esa noche, no duermes. Prometes que, si alguna vez llegas, le llamarás."),
    ]),
  S("ca-adios-vuelve", "cantera", { after: [after("ca-residencia-adios", "a", 12, 140)], minAge: 23 }, "vida",
    "Aquel compañero de cantera te escribe un mensaje inesperado",
    "Es un mensaje de voz, con ruido de fondo, de un taller de coches. «Soy yo, ¿te acuerdas? El de la habitación 12. Me va bien: tengo mi propio taller y dos hijos. Quería decirte que sigo todos tus partidos. Y que cuando me dijiste que llegarías por los dos, lo hice mío». Se le quiebra la voz. «Gracias por no olvidarme».",
    [
      o("a", "Llamarle y proponerle ir a verte jugar con su familia", "Invitarle", { moral: 9, reputacion: 4, rel_aficion: 2, flags: { ca_reencuentro: true } }, "Se presenta con su mujer y sus dos hijos, con camisetas con tu nombre. Después del partido, os abrazáis en el túnel. «Lo cumpliste —dice—. Llegaste por los dos». Y, por primera vez en años, te das cuenta de lo que pesaba aquella frase."),
      o("b", "Contestarle con un audio igual de largo y sincero", "Responder con el corazón", { moral: 7, reputacion: 3, flags: { ca_reencuentro: true } }, "Hablas durante cinco minutos sin parar. Le cuentas cómo cada noche, antes de dormir, pensabas en su cama vacía. Él te contesta con un único mensaje: «Lo sabía». Y lo sabías tú también."),
    ]),
  S("ca-fan-club", "cantera", { minAge: 17, maxAge: 22, fama: [10, 80], clubTurns: [3, 80], notFlags: ["ca_fan"] }, "vida",
    "Una chaval de catorce años lleva tu club de fans… y te escribe",
    "Se llama Lucía, es de un pueblo pequeño, y desde hace dos años actualiza una cuenta con tus partidos, goles y asistencias. Tiene treinta y cuatro seguidores, un pequeño archivo de vídeos editados con una app gratuita y una constancia que asusta. Esta noche te escribe: «Hola, soy la administradora de tu club de fans. ¿Podrías saludarnos en un vídeo? Es mi cumpleaños y mis amigas no me creen».",
    [
      o("a", "Grabarle un vídeo largo y personal", "Hacerle el día", { moral: 7, rel_aficion: 6, reputacion: 3, flags: { ca_fan: "video" } }, "Grabas un vídeo de un minuto con una frase para ella y otra para sus amigas. A los diez minutos, la cuenta ha pasado de treinta y cuatro a cuatro mil seguidores. Lucía te escribe: «Me he echado a llorar». Y tú, también."),
      o("b", "Mandarle una camiseta firmada y una nota", "Un regalo", { moral: 6, rel_aficion: 5, patrimonio: -40, flags: { ca_fan: "camiseta" } }, "La camiseta llega en una semana, con una nota escrita a mano. Lucía la cuelga en la pared de su habitación. Años después, será periodista deportiva y te entrevistará. Y se acordará del regalo."),
      o("c", "Contestar con un emoji de aplauso y seguir con lo tuyo", "Poco tiempo", { moral: 0, flags: { ca_fan: "emoji" } }, "Pasa un mes. Un día, ves en redes un hilo de Lucía: «Mi ídolo me contestó con un emoji. ¡Es el mejor día de mi vida!». Te quedas pensando que, por muy poco, hubieras podido darle algo más."),
    ]),
];
