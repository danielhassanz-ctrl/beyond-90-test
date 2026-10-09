/**
 * La vida fuera del campo: la guitarra que dejaste a los doce años, el canal de videojuegos del
 * vestuario, la pintura de tu abuela, la pesca de los domingos. Un hobby bien elegido te cambia el
 * humor, y con los años puede convertirse en el plan B (o en el plan A) cuando cuelgues las botas.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const HOBBIES: BankScene[] = [
  S("hb-guitarra", "hobby", { minAge: 17, clubTurns: [3, 400], notFlags: ["hb_guitarra"] }, "vida",
    "Encuentras tu vieja guitarra en un trastero y se te escapa un acorde",
    "Estaba bajo una manta, con una cuerda rota y una pegatina de un grupo de los noventa. La tomas, la afinas con el móvil y notas cómo los dedos recuerdan lo que la cabeza había olvidado. Suena un acorde. Luego otro. Una melodía que no sabías que conocías. En el salón, tu pareja, tu madre o tu mejor amigo te observa sin decir nada. Hay una luz suave en la ventana. Parece una película.",
    [
      o("a", "Retomarla en serio: clases, práctica y una guitarra nueva", "Volver a la música", { moral: 7, patrimonio: -400, reputacion: 2, flags: { hb_guitarra: "serio", hobby: "guitarra" } }, "Un profesor, un chico de veinticinco años con rastas, te enseña tres canciones en un mes. Al segundo, tocas en el vestuario. Al tercero, el capitán te pide una versión de su favorita. Descubres que hay un lado tuyo que lleva años esperando."),
      o("b", "Tocar de vez en cuando, solo, para desconectar", "Un refugio privado", { moral: 5, forma: 1, flags: { hb_guitarra: "refugio", hobby: "guitarra" } }, "Cada noche, antes de dormir, diez minutos de acordes. No hay público, ni metas, ni exigencia. Sientes que el día se alisa, como una sábana. Tu forma de dormir mejora. Y la de jugar, también."),
      o("c", "Volver a guardarla: no tienes tiempo", "Resignarte", { moral: -1, flags: { hb_guitarra: "no" } }, "La devuelves al trastero con una pequeña punzada. A los años, cuando la encuentres de nuevo, descubrirás que la cuerda rota sigue ahí. Y que aún sabes tocar."),
    ]),
  S("hb-guitarra-banda", "hobby", { after: [after("hb-guitarra", "a", 8, 80)], minAge: 18 }, "vida",
    "Los del vestuario montan un grupo de música y te piden que seas el guitarrista",
    "Empezó como una broma: el portero con una batería de juguete, el capitán con un bajo comprado en un rastro, el lateral cantando con voz de gallo. Ensayáis en el sótano del club, entre pesas y camillas. Cuando alguien menciona que falta un guitarrista, todos te miran. «Tú tocas, ¿no?». Tocas. Por un segundo, los ves como una banda de verdad, con un nombre, un logotipo y un concierto en un garito.",
    [
      o("a", "Aceptar y ensayar dos veces por semana", "Entrar en la banda", { moral: 8, rel_vestuario: 8, fama: 2, flags: { hb_banda: true } }, "Os llamáis «Los Suplentes». El primer concierto, en un bar, tiene cuarenta asistentes y un cartel torcido. El segundo, doscientos. El tercero, un patrocinador. Desde entonces, hay un día de la semana en que el vestuario no pierde ni un minuto."),
      o("b", "Ofrecerte solo como músico invitado en los conciertos más importantes", "Colaborar sin atarte", { moral: 5, rel_vestuario: 4, flags: { hb_banda: "invitado" } }, "Subes al escenario en tres actuaciones al año. La grada, al verte con la guitarra, enloquece. Un periodista escribe: «El delantero que toca». Y tú, entre canciones, sonríes."),
      o("c", "Decirles que prefieres no mezclar el fútbol con la música", "Marcar tu límite", { moral: 0, rel_vestuario: -2, flags: { hb_banda: "no" } }, "Los compañeros lo respetan, pero no entienden. Cuando, años después, la banda grabe un disco, verás el nombre en la carátula. Y sentirás una nostalgia por un camino que no tomaste."),
    ]),
  S("hb-gaming", "hobby", { minAge: 17, clubTurns: [3, 400], notFlags: ["hb_gaming"] }, "vida",
    "Un compañero te engancha a un videojuego y descubres que se te da mejor que el fútbol",
    "Te lo prestó para un viaje en autobús: un juego de estrategia, con mapas, unidades y una tutorial interminable. A los diez minutos, estabas dentro. A las dos horas, olvidabas comer. Al llegar al hotel, un compañero te preguntó si podía jugar contigo en línea. Resultaste ser, sorprendentemente, buenísimo. A los cinco días, tienes un rival que te odia y una racha de siete victorias.",
    [
      o("a", "Convertirte en streamer y compartir tus partidas con el mundo", "Abrir un canal", { fama: 4, rel_aficion: 4, moral: 4, flags: { hb_gaming: "streamer", hobby: "gaming" } }, "Tu primer directo tiene cuarenta espectadores, el segundo, mil. A la semana, tienes una comunidad que te llama «El Delantero Táctico». El club, al principio, lo ve con recelo. Luego, con un acuerdo comercial."),
      o("b", "Jugar solo con tus compañeros en las noches de concentración", "Un vicio compartido", { moral: 6, rel_vestuario: 7, forma: -1, flags: { hb_gaming: "equipo", hobby: "gaming" } }, "Las noches de hotel se convierten en torneos. El capitán, que no sabía ni encender la consola, se vuelve un monstruo. El míster, que los encuentra a las doce, murmura: «No os quedéis hasta tarde». Y se sienta a mirar."),
      o("c", "Dejarlo antes de que te consuma las horas de sueño", "Autocontrol", { forma: 2, moral: 1, flags: { hb_gaming: "dejo" } }, "Borras la aplicación. Esa noche duermes diez horas. A los dos meses, un compañero te ofrece volver. Dices que no. Y te sientes más orgulloso de eso que de cualquier jugada."),
    ]),
  S("hb-pintura", "hobby", { minAge: 18, clubTurns: [3, 400], notFlags: ["hb_pintura"] }, "vida",
    "Heredas los óleos de tu abuela y empiezas a pintar sin saber por qué",
    "Estaban en una caja con olor a trementina: tubos secos, pinceles duros y un lienzo a medio hacer con un paisaje de olivos. Tu madre te los entrega con una frase torpe: «Los quería para ti». Una tarde de lluvia, sin nada que hacer, abres un tubo, mezclas un color y pasas el pincel por el lienzo. No es bonito. Pero algo se mueve en tu pecho, tranquilo, como un animal que despierta.",
    [
      o("a", "Apuntarte a un taller de pintura una tarde por semana", "Aprender de verdad", { moral: 7, reputacion: 3, patrimonio: -150, flags: { hb_pintura: "taller", hobby: "pintura" } }, "La profesora, una mujer de pelo plateado y manos llenas de pintura, te mira el primer cuadro: «Tienes ojo para el movimiento». Es lógico: llevas la vida estudiando cuerpos en acción. En seis meses, pintas un partido con una intensidad que te sorprende."),
      o("b", "Pintar en secreto, para ti, sin enseñar nada a nadie", "Un tesoro íntimo", { moral: 6, flags: { hb_pintura: "secreto", hobby: "pintura" } }, "Los cuadros se acumulan en un armario. Nadie sabe. Al cabo de los años, cuando alguien los descubra, dirá: «No sabía que tuvieras esto». Y tú: «Yo tampoco»."),
      o("c", "Regalar el lienzo a tu madre y dejarlo ahí", "Cerrar el círculo", { moral: 4, reputacion: 2, flags: { hb_pintura: "regalo" } }, "Tu madre cuelga el cuadro de olivos terminado en el salón. «Mi madre lo habría terminado igual», dice, con la voz rota. Desde entonces, cada vez que lo ves, piensas que has devuelto algo a una persona que ya no está."),
    ]),
  S("hb-pintura-expo", "hobby", { after: [after("hb-pintura", "a", 12, 120)], minAge: 22 }, "prensa",
    "Una galería te propone exponer tus cuadros y el director del club no sabe si es una broma",
    "Llegó por correo: un sobre grueso, con membrete elegante y una invitación a exponer en una galería del centro. «Sus cuadros tienen una energía muy particular», decía la carta. El director deportivo, al enterarse, levantó una ceja. «¿Pintas?». «Algo», respondiste. «¿Y se venden?». Hay una pausa. «No sé».",
    [
      o("a", "Aceptar y dedicar los beneficios a una causa benéfica", "Exponer con generosidad", { fama: 4, reputacion: 6, rel_aficion: 4, moral: 6, patrimonio: 2500, flags: { hb_expo: true } }, "La exposición se llama «Movimiento». Los cuadros se agotan en tres días. Una niña de seis años se queda un rato enorme ante uno: el de un portero en el aire. «Ese soy yo», dices, medio en broma. Ella, muy seria: «Pues eres bueno»."),
      o("b", "Aceptar pero con un seudónimo, sin que se sepa quién eres", "Con identidad secreta", { fama: 1, reputacion: 3, moral: 5, patrimonio: 800, flags: { hb_expo: "seudonimo" } }, "Firmas «A. Olivar». La crítica, intrigada, escribe sobre «un artista emergente con un dominio del gesto singular». Cuando se descubre quién eres, el efecto es doble: respeto y estupor."),
      o("c", "Declinar con amabilidad: la pintura es solo tuya", "Proteger el espacio", { moral: 2, flags: { hb_expo: "no" } }, "La galería lo acepta. Meses después, tus cuadros, más grandes, se quedan en tu casa. Los miras cada tarde con una paz extraña. Hay cosas que valen más cuando no se venden."),
    ]),
  S("hb-pesca", "hobby", { minAge: 19, clubTurns: [3, 400], notFlags: ["hb_pesca"] }, "vida",
    "El utillero te lleva a pescar un domingo y descubres la paciencia",
    "Es en un pantano a las cinco de la mañana, con una neblina que sube del agua y dos cañas de segunda mano. El utillero, con un termo de café y una gorra de visera, se sienta sin hablar. Tú, acostumbrado a correr, te agitas en el banco. «Calla y mira», murmura. Pasan cuarenta minutos sin que ocurra nada. Y de pronto, el flotador se hunde. Sientes un tirón en el brazo. Una carpa enorme sale a la superficie, brillando.",
    [
      o("a", "Convertir la pesca en tu ritual de los domingos", "Hacerlo costumbre", { moral: 7, forma: 1, rel_vestuario: 3, flags: { hb_pesca: "ritual", hobby: "pesca" } }, "Cada domingo antes de un partido libre, amaneces junto al agua. Aprendes a esperar. A los meses, notas que lo haces también en el campo: leer el juego, no precipitarte. El utillero, orgulloso, murmura: «Ya eres de los nuestros»."),
      o("b", "Soltar la carpa y regalarle la caña al utillero", "Un gesto bonito", { moral: 5, reputacion: 3, flags: { hb_pesca: "suelto" } }, "La carpa se pierde en el agua con un destello. El utillero, conmovido, te tiende un trozo de pan con embutido. «Mi padre decía: pescar es devolver». Comes el bocadillo con una paz que ningún gol te ha dado."),
      o("c", "Contarlo en redes y convertirlo en un reto de superación", "Compartir la experiencia", { fama: 3, rel_aficion: 3, moral: 3, flags: { hb_pesca: "redes" } }, "La foto, con la carpa y tu cara de asombro, tiene cien mil likes. Una marca de equipamiento te ofrece un contrato. El utillero, indignado, murmura: «Qué cosas». Pero acepta una caña nueva con una media sonrisa."),
    ]),
  S("hb-fotografia", "hobby", { minAge: 18, clubTurns: [3, 400], notFlags: ["hb_foto"] }, "vida",
    "Una cámara de segunda mano te enseña a mirar el vestuario con otros ojos",
    "Te la regalan por tu cumpleaños, con un estuche algo desgastado y un objetivo que se atasca. Empiezas a hacer fotos al azar: la taquilla del portero, las botas del lateral, una toalla colgada en el pasillo. Al revisarlas, descubres algo que no esperabas: en cada imagen hay una historia que nadie había contado. Tu compañero de al lado, al verlas, murmura: «Qué buenas». Sientes un hormigueo desconocido.",
    [
      o("a", "Hacer un reportaje del vestuario durante toda la temporada", "Convertirte en cronista", { moral: 6, rel_vestuario: 5, reputacion: 3, flags: { hb_foto: "reportaje", hobby: "foto" } }, "Durante nueve meses, retratas a todos: sus caras antes de un partido, sus manos vendadas, sus sonrisas. Al final, el club publica un libro con tus imágenes. El título: «Lo que nadie ve». Las ventas se destinan a un albergue."),
      o("b", "Seguir haciendo fotos solo para ti y guardarlas en una carpeta", "Un archivo íntimo", { moral: 5, flags: { hb_foto: "archivo", hobby: "foto" } }, "Cada noche, repasas las imágenes del día. Hay una de tu madre cocinando, de tu padre leyendo el periódico, de un niño en la grada. Algún día, cuando te retires, serán un tesoro."),
      o("c", "Regalar la cámara a un chaval del filial que siempre mira todo", "Pasar el talento", { moral: 4, reputacion: 4, flags: { hb_foto: "regalo" } }, "El chaval, tímido, la agarra con las dos manos. Años después, será fotógrafo oficial de un gran club. Te escribirá: «Tu cámara me abrió los ojos»."),
    ]),
  S("hb-cocina", "hobby", { minAge: 19, patrimonio: [1500, 100000000], clubTurns: [3, 400], notFlags: ["hb_cocina"] }, "vida",
    "Haces un curso de cocina de tres meses y tu casa huele a ajo por primera vez",
    "Te lo recomendó el nutricionista, con una media sonrisa: «Cocinar es una de las mejores formas de cuidarte». El curso es una cocina enorme, con delantales, cuchillos relucientes y un chef con barba que no admite excusas. En la primera clase, te cortas el dedo. En la segunda, quemas una salsa. En la tercera, haces un huevo perfecto. Lo miras, atónito, como si fuera un gol.",
    [
      o("a", "Seguir con el curso y cocinar para el vestuario cada viernes", "Hacerte el cocinero", { moral: 7, rel_vestuario: 7, forma: 1, flags: { hb_cocina: "viernes", hobby: "cocina" } }, "Los viernes, tu casa es una taberna. El vestuario llega con vino y expectativa. Los primeros platos son un desastre; los terceros, una delicia. El capitán, en la sobremesa, sentencia: «Este hombre no tiene que retirarse. Tiene que abrir un restaurante»."),
      o("b", "Cocinar solo para ti y tu familia, con calma", "Un placer discreto", { moral: 6, forma: 1, flags: { hb_cocina: "familia", hobby: "cocina" } }, "Cuando tu madre prueba tu primer guiso, se queda en silencio. «Se parece al de tu abuela», murmura. No dices nada. Pero esa noche, en la cama, piensas en lo que acabas de lograr: recuperar un sabor."),
      o("c", "Abandonar el curso: la cocina no es lo tuyo", "Reconocerlo", { moral: -1, flags: { hb_cocina: "no" } }, "Sigues pidiendo comida a domicilio. De vez en cuando, haces un huevo. Es lo único que dominas. Pero te quedas con un respeto nuevo por quien cocina cada día."),
    ]),
  S("hb-plan-b", "hobby", { minAge: 30, flags: ["hobby"], clubTurns: [10, 400], notFlags: ["hb_planb"] }, "vida",
    "Descubres que tu afición de toda la vida podría ser tu plan B para cuando te retires",
    "Fue una charla con tu agente, una tarde de otoño, con un café y una libreta. «Si dejaras el fútbol mañana, ¿qué harías?». Respondes sin pensar: «No lo sé». Él te mira y sonríe: «Sí lo sabes. Llevas años haciéndolo en tus ratos libres». Miras tus manos. Hay callos de guitarra, manchas de pintura, huellas de caña. Todo lo que has hecho por placer, de repente, parece un camino.",
    [
      o("a", "Empezar a preparar la transición: formación, contactos y un pequeño proyecto", "Construir el plan B", { moral: 7, reputacion: 4, patrimonio: -1500, flags: { hb_planb: "construyo", segunda_vida_hobby: true } }, "Dedicas dos tardes por semana a formarte y a hablar con gente del sector. Cuando, años después, te retires, no habrá vacío: habrá una puerta. Tu agente, al verlo, dice: «Qué listo has sido»."),
      o("b", "Seguir disfrutándolo como afición y no pensar en el futuro", "Seguir con la afición", { moral: 4, flags: { hb_planb: "afición" } }, "Prefieres que siga siendo un placer. Cuando, dentro de tiempo, lo necesites, lo tendrás. O no. Pero hoy, el hobby seguirá siendo lo que es: tu forma de estar bien."),
      o("c", "Decir que el fútbol es tu vida y no hay plan B", "Todo o nada", { moral: 2, reputacion: 1, flags: { hb_planb: "no" } }, "Tu agente lo respeta. «Cuando llegue el momento, ya veremos». Y es verdad. Pero cuando llega, descubres que haber tenido un plan habría sido más cómodo."),
    ]),
];
