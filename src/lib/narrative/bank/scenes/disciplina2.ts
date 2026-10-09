/**
 * Más disciplina: un coche mal aparcado, una discusión con el árbitro, un viaje sin permiso, una fiesta de cumpleaños que
 * se alarga, un gesto a la grada, una marca rival. Mismo principio: lo que haces fuera o al límite pasa factura después.
 */
import { S, o, r } from "../dsl";
import type { BankScene, BankWhen } from "../types";

const ADULTO: BankWhen = { minAge: 18, maxAge: 40 };
const LIMPIO = ["estado_castigo", "estado_escandalo"];

export const DISCIPLINA2: BankScene[] = [
  S("dc-arbitro", "disciplina", { ...ADULTO, roles: ["titular", "rotacion"], notFlags: [...LIMPIO, "dc_arbitro"], clubTurns: [3, 400] }, "partido",
    "Le dices algo al árbitro que no debías",
    "Minuto 82, empate, falta dudosa que no te pitan y un árbitro que te da la espalda con la tranquilidad de quien conoce el reglamento. Algo te sube por el pecho y, sin haberlo pensado, le sueltas una frase que en el campo se oye clarísima y en tu casa, seguro, no se habría dicho. Él se gira despacio. Saca una tarjeta que no es amarilla.",
    [
      o("a", "Pedir perdón sobre la marcha, con las manos en alto", "Rectificar", { rel_entrenador: -2, moral: -2, flags: { dc_arbitro: true, coach_bench: "1" } }, "Llegas al banquillo con la cabeza gacha. En el descanso, el míster no te grita: «Los árbitros no cambian de opinión. Tú, sí». Te quedas un partido sin jugar y una semana aprendiendo a callar."),
      o("b", "Insistir: «Es verdad lo que he dicho»", "Orgullo", { rel_entrenador: -6, rel_aficion: 2, multa: 1.5, moral: -2, flags: { dc_arbitro: true, coach_bench: "2", estado_castigo: "@WEEK+3" } }, "La grada te aplaude y el club, cuando se entera, no. El comité de competición te sanciona con dos partidos y una multa que te hace mirar el extracto bancario dos veces."),
      r("c", "Hablar con el capitán para que medie con el árbitro en el túnel", "Que lo arreglen los mayores", 0.5,
        "El capitán, que lleva doce años en la competición y conoce al árbitro de vista, lo arregla con una frase: «Es un chaval nuevo, hoy se le ha ido». El árbitro, con la cara seria, lo deja en una tarjeta amarilla. Respiras.", { rel_vestuario: 3, moral: 1, flags: { dc_arbitro: true } },
        "El capitán lo intenta y el árbitro, que no está de humor, incluye en su informe el motivo con todas las palabras. La sanción llega igual, y el capitán, que se había arriesgado por ti, te mira con un poco menos de afecto.", { rel_vestuario: -2, rel_entrenador: -3, multa: 1, flags: { dc_arbitro: true, coach_bench: "1" } }, "reputacion"),
    ]),
  S("dc-viaje-sin-permiso", "disciplina", { ...ADULTO, notFlags: [...LIMPIO, "dc_viaje"], clubTurns: [3, 400], moral: [0, 70] }, "vida",
    "Te escapas el día libre sin avisar al club",
    "Tienes un día libre y un billete de avión de último minuto a otra ciudad, a ver a alguien a quien llevas semanas queriendo ver. No lo piensas mucho: coges la maleta pequeña y te marchas sin avisar a nadie, porque «total, es un día». El problema es que el entrenamiento se ha adelantado a las diez de la mañana y tu teléfono, en modo avión, no recibe las once llamadas.",
    [
      o("a", "Volver de inmediato y presentarte con la verdad", "Dar la cara", { rel_entrenador: -3, multa: 1, moral: -1, flags: { dc_viaje: true } }, "Coges el primer vuelo de vuelta, llegas con el pelo revuelto y la mochila aún con la etiqueta del aeropuerto. «Perdón. No avisé». El míster te mira unos segundos y dicta: «Multa, y hoy, de portero de rondo». Lo aceptas con una sonrisa de alivio."),
      r("b", "Inventar una cita médica de última hora", "Excusa", 0.35,
        "El club tiene tantos médicos y tantas citas que no comprueba una más. Entrenas al día siguiente con una cara de inocente que no se la cree nadie, pero que nadie desmiente.", { moral: 1, flags: { dc_viaje: true } },
        "Alguien del cuerpo médico comenta, con toda naturalidad, que no hay cita alguna a tu nombre. El míster cierra la libreta con un chasquido suave. «Dos mentiras no, ¿eh?».", { rel_entrenador: -8, multa: 2, flags: { dc_viaje: true, coach_bench: "3", estado_castigo: "@WEEK+4" } }, "reputacion"),
      o("c", "Quedarte unas horas más y afrontar las consecuencias a la vuelta", "Apostar fuerte", { moral: 5, rel_entrenador: -6, multa: 2, flags: { dc_viaje: true, coach_bench: "2", estado_castigo: "@WEEK+3" } }, "Merece la pena, de verdad: esa tarde, esa cena y esa conversación valen lo que cuestan. Cuando vuelves, el castigo llega igual. Lo asumes con la certeza rara de quien sabe que volvería a hacerlo."),
    ]),
  S("dc-cumple", "disciplina", { ...ADULTO, fama: [30, 100], notFlags: [...LIMPIO, "dc_cumple", "estado_bache"], clubTurns: [2, 400] }, "vida",
    "Una fiesta de cumpleaños que se alarga",
    "Tu amigo de la infancia cumple veinticinco años y has prometido «solo una hora». La hora se convierte en tres, las tres en seis, y a las cinco de la mañana alguien te sube a una silla para cantar. Hay vídeos. Hay más vídeos. Y hay un entrenamiento a las diez de la mañana al que has prometido llegar como un reloj.",
    [
      o("a", "Irte a las dos y dormir lo que puedas", "Cumplir", { moral: -1, forma: -1, flags: { dc_cumple: true } }, "Te despides entre abucheos cariñosos y llegas a casa a las dos y diez. Duermes siete horas, que no es poco. Tus amigos te lo recriminarán durante años, pero el míster, sin saberlo, se ahorra una bronca."),
      o("b", "Quedarte hasta el final: es la fiesta de tu mejor amigo", "Amistad", { moral: 6, forma: -7, rel_entrenador: -3, flags: { dc_cumple: true, estado_bache: "@WEEK+2" } }, "Es una de las mejores noches de tu vida y uno de los peores entrenamientos. El míster te mira la cara de zombi y decide no decir nada, que es peor. Esa semana juegas con las piernas de otro."),
      o("c", "Quedarte hasta las cuatro y pedirle a un taxi que te deje en el campo a las diez menos cuarto", "Estirar la goma", { moral: 4, forma: -4, flags: { dc_cumple: true } }, "Llegas con una hora y media de sueño, una sonrisa de oreja a oreja y la mochila preparada con antelación. Entrenas a medias, nadie te dice nada y tu mejor amigo te manda un mensaje de agradecimiento con un emoji de corazón."),
    ]),
  S("dc-gesto-grada", "disciplina", { ...ADULTO, fama: [25, 100], notFlags: [...LIMPIO, "dc_gesto"], clubTurns: [3, 400], roles: ["titular", "rotacion"] }, "partido",
    "Un gesto a la grada que se malinterpreta",
    "Te silban durante todo el partido, y cuando por fin marcas, la celebración te sale con un gesto que es mitad broma, mitad rabia, hacia la zona que llevaba noventa minutos gritándote. Las cámaras lo captan. Veinte minutos después de acabar el partido, ya tiene nombre propio en las redes, y no es un nombre bonito.",
    [
      o("a", "Pedir perdón a la afición en un vídeo corto y sincero", "Rectificar", { rel_aficion: 4, moral: -2, flags: { dc_gesto: true } }, "El vídeo dura veinte segundos: «Me pasé. Lo siento. Os debo un partido mejor». Un grupo de ultras responde con una pancarta que dice «Aquí se perdona al que se arrepiente». Te quedas mirando la pantalla con los ojos húmedos."),
      o("b", "Mantener que fue una broma, sin disculpas", "Sin dar el brazo a torcer", { rel_aficion: -6, fama: 3, rel_entrenador: -2, flags: { dc_gesto: true, estado_escandalo: "@WEEK+3" } }, "Lo defiendes con tono tranquilo. La afición, que lo oye todo, te devuelve un silencio helado en el partido siguiente: ni silbidos, ni aplausos, ni un solo cántico con tu nombre. Es peor de lo que parece."),
      o("c", "No decir nada y dejar que el campo hable", "Callar", { moral: -1, rel_aficion: -2, flags: { dc_gesto: true } }, "Entrenas más de lo que acostumbras y juegas el domingo con los dientes apretados. Marcas, esta vez sin gesto, con los brazos abiertos y la mirada en la grada. Algunos aplauden. Otros prefieren esperar otro partido."),
    ]),
  S("dc-marca-rival", "disciplina", { ...ADULTO, fama: [45, 100], flags: ["sponsor_nike"], notFlags: [...LIMPIO, "dc_marca"], clubTurns: [3, 400] }, "representante",
    "Sales en una foto con las botas de otra marca",
    "Una foto tuya en el vestuario, del tipo que se hace sin pensar, con las botas que más te gustan. El problema es que no son las de tu patrocinador. La imagen circula por las redes durante dos horas antes de que alguien del equipo de marketing se dé cuenta. Tu representante te llama con voz de abogado.",
    [
      o("a", "Pedir perdón al patrocinador y ofrecer una acción de compensación", "Reparar", { patrimonio: -3000, rel_representante: 2, reputacion: 1, flags: { dc_marca: true } }, "La marca, que lo entiende mejor de lo que esperabas, te cita en sus oficinas para una sesión de fotos extra. Cuesta una tarde y un favor, pero la relación sale casi reforzada."),
      o("b", "Quitarle importancia: «Solo eran unas botas»", "Defender", { reputacion: -3, patrimonio: -8000, flags: { dc_marca: true } }, "La marca no lo ve igual. Te notifican una penalización contractual con una carta de tres páginas. Tu representante, con la carta en la mano, te dice una frase que no vas a olvidar: «Es una cuestión de confianza»."),
    ]),
  S("dc-pelea-entreno", "disciplina", { ...ADULTO, roles: ["titular", "rotacion", "suplente"], notFlags: [...LIMPIO, "dc_pelea", "estado_mal_ambiente"], clubTurns: [3, 400] }, "entrenamiento",
    "Una entrada que se pasa de la raya en el entrenamiento",
    "En medio de un rondo, un compañero te entra con una dureza que no pega con un entrenamiento. Te tira, te mira, te tiende la mano para levantarte con una media sonrisa. Y tú, que llevas tres días de mal humor, te levantas sin dársela y le empujas con las dos manos. En medio segundo, el campo entero está parado y el míster, de pie, con los brazos cruzados.",
    [
      o("a", "Pedirle perdón al compañero ahí mismo, delante de todos", "Rectificar", { rel_vestuario: 3, rel_entrenador: 1, moral: -1, flags: { dc_pelea: true } }, "Le tiendes la mano y dices: «Me he pasado, tío». Te la estrecha con una sonrisa cansada. El míster asiente imperceptiblemente y manda continuar el rondo. Nadie vuelve a comentarlo."),
      o("b", "Defender tu postura: «Me ha entrado a lesionarme»", "Mantenerte", { rel_vestuario: -4, rel_entrenador: -3, flags: { dc_pelea: true, estado_mal_ambiente: "@WEEK+3" } }, "Puede que tengas razón, puede que no. El vestuario se divide: hay quien te da la razón en voz baja y quien te evita la mirada. El ambiente, durante unas semanas, huele a pelea mal cerrada."),
      o("c", "Irte del campo directo a la ducha", "Marcharte", { rel_entrenador: -5, multa: 0.5, moral: -2, flags: { dc_pelea: true, coach_bench: "1" } }, "Te marchas sin mirar a nadie. El míster te espera en el pasillo y te dice una sola frase: «El campo no es tuyo para irte cuando te enfadas». Esa semana ves el partido desde el banquillo y piensas en eso más veces de las que te gustaría."),
    ]),
];
