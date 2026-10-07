/**
 * Redes y prensa: lo viral, lo absurdo y lo que nunca se borra. Una celebración fallida que se
 * convierte en meme, una entrevista incómoda, un reto de baile con el vestuario. Algunas marcas
 * (el apodo, el meme, la polémica) vuelven a cobrarse más adelante.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const REDES: BankScene[] = [
  S("rd-celebracion-fallida", "redes", { minAge: 16, clubTurns: [2, 400], fama: [15, 100], notFlags: ["rd_celebra"] }, "prensa",
    "Tu celebración sale fatal y se hace viral",
    "Marcas, corres hacia la esquina, intentas un mortal con voltereta hacia atrás… y aterrizas de espaldas contra el cartel de un patrocinador. Un chaval lo ha grabado desde la grada y a los diez minutos el vídeo tiene medio millón de visualizaciones. Alguien lo ha puesto con una música de dibujos animados. En el vestuario, un compañero lee los comentarios en voz alta.",
    [
      o("a", "Reírte de ti mismo y subir tu propia versión", "Ganar el meme", { fama: 5, rel_aficion: 4, moral: 5, flags: { rd_celebra: "ria" } }, "Subes un vídeo de tres segundos, de ti, repitiendo el mortal en un césped de pachanga, aterrizando de pie. La frase: «Tardé años, pero lo conseguí». La gente te adora un poco más."),
      o("b", "Pedir que lo borren: «No es un buen recuerdo»", "Proteger tu imagen", { reputacion: 1, moral: -2, flags: { rd_celebra: "borro" } }, "Pides al club que haga una petición. El vídeo, naturalmente, se reproduce por todas partes. «Efecto Streisand», dice tu agente. Y el meme es un poco más grande."),
      o("c", "Ignorarlo y concentrarte en el siguiente partido", "Frialdad", { moral: 1, forma: 1, flags: { rd_celebra: "paso" } }, "Lo dejas correr. En dos días, el vídeo se acaba. En una semana, el meme ya ha desaparecido. Un compañero, medio en broma, te dice: «Se te daba muy bien perder la dignidad»."),
    ]),
  S("rd-apodo", "redes", { minAge: 16, clubTurns: [3, 400], fama: [20, 100], notFlags: ["rd_apodo"] }, "prensa",
    "La afición te pone un apodo y se queda",
    "Todo empezó en un hilo de un foro: alguien dijo que celebrabas como «un pato mareado» y la frase quedó. Ahora, en cada partido, la grada grita «¡Pato, Pato!» cuando coges el balón. Hay pancartas, camisetas y hasta una canción improvisada. El club te pregunta si quieres que el apodo aparezca en tu camiseta de la próxima temporada.",
    [
      o("a", "Abrazar el apodo y ponerlo en la camiseta", "Hacerlo tuyo", { fama: 4, rel_aficion: 6, moral: 5, flags: { rd_apodo: "adoptado" } }, "Tu camiseta sale con «PATO» bajo el número. Ese año vende más que las de tus compañeros. Un día, un niño te dice: «Eres mi pato favorito». Y lo escuchas con todo el orgullo del mundo."),
      o("b", "Aceptarlo pero sin camiseta", "Un término medio", { fama: 2, rel_aficion: 3, moral: 2, flags: { rd_apodo: "tolerado" } }, "Dices que prefieres que quede entre vosotros y la grada. El apodo se mantiene en los cánticos y en las pancartas, pero no sale en los productos. Te sientes más tranquilo y la afición, algo más cómplice."),
      o("c", "Pedir que lo dejen: no te gusta", "Rechazarlo", { moral: -2, rel_aficion: -2, flags: { rd_apodo: "rechazado" } }, "Explicas en una entrevista que prefieres tu nombre. La grada lo respeta, pero te canta «Pato, Pato» con más ganas que nunca, sin que puedas evitarlo. A veces, un apodo es más fuerte que la voluntad."),
    ]),
  S("rd-entrevista-incomoda", "redes", { minAge: 18, fama: [30, 100], clubTurns: [3, 400], notFlags: ["rd_entrevista"] }, "prensa",
    "Una entrevista de televisión se vuelve incómoda",
    "Era una charla amable, de las de sofá, hasta que la presentadora, con una sonrisa muy dulce, suelta: «Tu entrenador dice que eres un jugador difícil. ¿Qué le responderías?». El estudio se queda en silencio. Tu agente, detrás de la cámara, hace gestos con las manos. Es una trampa elegante. Y todos esperan tu respuesta.",
    [
      o("a", "Sonreír y decir algo ingenioso para salir del paso", "Capear con humor", { fama: 3, reputacion: 3, rel_entrenador: 1, flags: { rd_entrevista: "humor" } }, "«Difícil de marcar, supongo», dices. La presentadora se ríe, el estudio también, y el titular del día siguiente es esa frase. El míster te escribe: «Bien jugado»."),
      o("b", "Defender al entrenador y a ti mismo con calma", "Una respuesta madura", { reputacion: 5, rel_entrenador: 4, moral: 2, flags: { rd_entrevista: "madurez" } }, "«Me exige mucho porque cree que puedo dar más. Es lo que quiero de un entrenador». La presentadora asiente, algo decepcionada. Tu agente te mira con una sonrisa orgullosa."),
      o("c", "Responder con sinceridad brutal", "Decir lo que piensas", { fama: 4, rel_entrenador: -5, reputacion: -2, moral: 2, flags: { rd_entrevista: "bruto" } }, "Dices lo que piensas. El estudio se paraliza. La entrevista es viral. Al día siguiente, el míster te cita en su despacho: «Tenemos que hablar de lo que se dice y lo que se calla»."),
    ]),
  S("rd-reto-baile", "redes", { minAge: 16, clubTurns: [2, 400], notFlags: ["rd_baile"] }, "vestuario",
    "El vestuario entero se apunta a un reto de baile",
    "Alguien del filial lo ha propuesto: grabar un baile viral con los veintidós jugadores, en el túnel, con la música a todo volumen. El problema es que el capitán no sabe bailar, el míster mira desde la puerta con cara de preocupación y tú tienes el ritmo de una lavadora. Tres cámaras, cuatro tomas y cero coordinación.",
    [
      o("a", "Liderar el baile con total entrega y ridículo", "Dejarte la piel", { fama: 4, rel_vestuario: 6, moral: 5, flags: { rd_baile: "lider" } }, "El baile es un desastre y el vídeo, un éxito. Cuatro millones de visualizaciones y una invitación a un programa de la tarde. El capitán, entre las sombras, sonríe con orgullo."),
      o("b", "Hacer de grabador y evitar salir", "Un perfil bajo", { rel_vestuario: 2, moral: 1, flags: { rd_baile: "camara" } }, "Eres el de la cámara. Te lo agradecen, pero cuando el vídeo triunfa, todos hablan de cómo salieron ellos. Sales en los créditos de un compañero: «Producción: tú». Y se te hace raro."),
      o("c", "Proponer un baile a lo tuyo, ridículo y propio", "Poner tu sello", { fama: 3, rel_vestuario: 4, reputacion: -1, moral: 4, flags: { rd_baile: "propio" } }, "Inventas un paso que consiste en dar dos vueltas y señalar al cielo. Los compañeros lo copian. En redes, lo bautizan «El Crack». Ahora hay un baile con tu nombre."),
    ]),
  S("rd-polemica-peinado", "redes", { minAge: 17, fama: [30, 100], clubTurns: [2, 400], notFlags: ["rd_peinado"] }, "prensa",
    "Tu nuevo corte de pelo divide al país",
    "Fue una tontería: te lo cortaste con el barbero de tu barrio, con un diseño atrevido, casi geométrico. Pero la foto se ha viralizado y ahora todo el mundo tiene una opinión. Un tertuliano dice que «es una falta de respeto al fútbol». Un humorista lo imita en un programa. Tu madre, por teléfono: «Hijo, ¿qué te has hecho en la cabeza?».",
    [
      o("a", "Defenderlo con orgullo y subir otra foto", "Sacar pecho", { fama: 5, rel_aficion: 3, moral: 3, flags: { rd_peinado: "orgullo" } }, "Subes un selfi con la frase: «Mi pelo, mis reglas». Medio millón de likes. A la semana, cien chavales del barrio llevan el mismo corte. Tu barbero cuelga tu foto en el escaparate."),
      o("b", "Cambiártelo discretamente al día siguiente", "Rectificar", { reputacion: 1, moral: -1, flags: { rd_peinado: "cambio" } }, "Vuelves al barbero y le pides «el de siempre». Él se ríe: «Qué rápido te asustas». Sales con un peinado clásico. En redes, alguien pone: «Se acabó el rebelde»."),
      o("c", "Tomártelo con humor y responder al humorista", "Entrar al juego", { fama: 4, moral: 4, rel_aficion: 2, flags: { rd_peinado: "humor" } }, "Respondes con un vídeo imitando al humorista imitándote a ti. El humorista te invita al programa. Os hacéis amigos. Y tu pelo, que ya no importa a nadie, sigue ahí."),
    ]),
  S("rd-fan-obsesivo", "redes", { minAge: 18, fama: [45, 100], clubTurns: [3, 400], notFlags: ["rd_fan"] }, "vida",
    "Un seguidor se sabe tu vida mejor que tú",
    "Se llama Andrés, tiene treinta y tres años, una cuenta con diez mil seguidores y la costumbre de publicar, cada día, datos tuyos: tu hora de entrenamiento, tu cafetería favorita, el modelo de tus botas de hace seis años. Esta mañana, en una gasolinera, un tipo con tu camiseta te saluda: «¡Qué tal el café del martes!». Es Andrés. No parece peligroso. Pero asusta.",
    [
      o("a", "Charlar con él y poner límites con simpatía", "Hablar claro", { reputacion: 3, moral: 3, rel_aficion: 2, flags: { rd_fan: "limites" } }, "Le invitas a un café y le dices que te halaga, pero que necesitas intimidad. Andrés se pone rojo, pide perdón, y a partir de ese día se convierte en el mejor defensor de tu perfil en redes."),
      o("b", "Pedirle al club que se encargue", "Poner distancia", { moral: -1, reputacion: 1, flags: { rd_fan: "club" } }, "El departamento de seguridad habla con él. Andrés se retira, avergonzado, y escribe una carta de disculpas. Se te queda un poso amargo: no has sido tú quien le ha hablado."),
      o("c", "Bloquearlo en todas las redes", "Cortar por lo sano", { moral: 2, flags: { rd_fan: "bloqueado" } }, "Lo bloqueas. En dos días, aparece una cuenta nueva con el nombre «AndresVuelve». Lo bloqueas de nuevo. En una semana, ya no hay rastro. O eso crees."),
    ]),
  S("rd-fan-obsesivo-regalo", "redes", { after: [after("rd-fan-obsesivo", "a", 15, 120)], minAge: 22 }, "vida",
    "Andrés te manda un regalo muy raro",
    "Es una caja envuelta en papel de periódico, con una nota en tinta azul: «De un amigo del café del martes». Dentro, un álbum de fotos artesanal con recortes de todos tus partidos, anotaciones a mano y un capítulo entero dedicado a «lo que aprendí de ti». Hay doscientas páginas. Lo recorres con una mezcla de ternura y estupefacción.",
    [
      o("a", "Escribirle una respuesta cálida y firmarle una camiseta", "Agradecer", { moral: 6, rel_aficion: 5, reputacion: 3 }, "Le mandas la camiseta con una dedicatoria: «Para Andrés, el mejor historiador de mi carrera». Él responde con un vídeo llorando de alegría. Años después, publicará un libro sobre tu carrera. Con tu permiso."),
      o("b", "Guardar el álbum y no contestar", "Prudencia", { moral: 1, reputacion: 1 }, "Lo guardas en una caja, en el trastero. Años después, al mudarte, lo encuentras. Pasas una tarde entera releyéndolo. Entiendes que hay formas muy raras de querer a alguien."),
    ]),
  S("rd-meme-grande", "redes", { minAge: 18, fama: [50, 100], clubTurns: [4, 400], notFlags: ["rd_meme"] }, "prensa",
    "Un fallo tuyo se convierte en el meme del año",
    "Fue un gol cantado, a puerta vacía, con el portero tirado en el suelo. Y fallaste. El balón dio en el palo, rebotó en tu cara y salió fuera. Esa imagen —tu cara de sorpresa, con el balón rebotando— se ha convertido en un meme con mil versiones. Ya hay camisetas, tazas y hasta una pegatina para el móvil. En el vestuario, nadie se atreve a decirte nada. Hasta que el capitán lo hace.",
    [
      o("a", "Aprovechar el meme y vender la camiseta con tu cara de susto", "Convertirlo en negocio", { patrimonio: 3500, fama: 4, moral: 4, reputacion: -1, flags: { rd_meme: "negocio" } }, "Lanzas una camiseta con la imagen y la frase «Casi». Se agota en veinticuatro horas. Una parte de lo recaudado va a una escuela de fútbol. En redes, te llaman «el rey del fallo». Lo llevas con orgullo."),
      o("b", "Reírte públicamente: «Hoy fallé, mañana marco dos»", "Con elegancia", { fama: 3, rel_aficion: 4, moral: 3, flags: { rd_meme: "humor" } }, "Subes una foto del balón con el palo y la frase. El siguiente partido, marcas dos. La grada te dedica una ovación larga, en recuerdo de aquel fallo. Eres un poco más querido."),
      o("c", "Enfadarte y pedir que lo retiren", "Perder el humor", { moral: -3, reputacion: -2, fama: 1, flags: { rd_meme: "enfado" } }, "Pides al club que haga algo. El meme, claro, se multiplica. «Pierde el humor y gana visibilidad», comenta un periodista. Un compañero te dice, con cariño: «Aprende a reírte, que dura menos»."),
    ]),
  S("rd-tuit-viejo", "redes", { minAge: 20, fama: [45, 100], clubTurns: [4, 400], notFlags: ["rd_tuit"] }, "prensa",
    "Alguien desentierra un tuit tuyo de cuando tenías catorce años",
    "Es un tuit de hace años, escrito con una ortografía dudosa y un humor de adolescente. Dice algo sobre tu equipo actual que no suena precisamente cariñoso. Lo ha desenterrado una cuenta con ganas de líos, y en dos horas la afición está dividida entre quienes te perdonan y quienes se sienten traicionados. Tu agente, al teléfono, tiene un tono de funeral.",
    [
      o("a", "Pedir perdón con un mensaje corto y sincero", "Dar la cara", { reputacion: 5, rel_aficion: 3, moral: 1, flags: { rd_tuit: "perdon" } }, "Escribes: «Tenía catorce años y no sabía nada. Hoy este club es mi casa». La afición, mayoritariamente, lo acepta. Una pancarta de un fan, semanas después: «Los jóvenes se equivocan; los grandes lo reconocen»."),
      o("b", "Hacer una broma sobre tu «yo de catorce años»", "Reírte del pasado", { fama: 4, rel_aficion: 4, moral: 3, flags: { rd_tuit: "humor" } }, "Subes una foto de ti con quince años: «Cuando pensaba que sabía de fútbol». La gente se ríe contigo. El tuit pierde su fuerza. El club te lo agradece con un comunicado cariñoso."),
      o("c", "No decir nada y que se olvide solo", "Dejar pasar", { moral: -1, rel_aficion: -1, flags: { rd_tuit: "silencio" } }, "El silencio dura dos semanas. La polémica se apaga, pero queda una sombra. Cuando marcas el siguiente gol, algún espectador del fondo grita: «¡Y el tuit, qué!». Se ríe él y se ríen otros."),
    ]),
  S("rd-programa-tarde", "redes", { minAge: 18, fama: [55, 100], clubTurns: [4, 400], notFlags: ["rd_programa"] }, "prensa",
    "Te invitan a un programa del corazón sin querer",
    "Todo empezó con una llamada: «Es una charla sobre fútbol», te dijeron. Al llegar, descubres que el programa es «Cuéntamelo todo» y que, en la silla de enfrente, hay una periodista con una libreta llena de preguntas que no tienen nada que ver con el balón. Hay un ex tuyo en pantalla, una tía que no conoces y un presentador con la sonrisa de un depredador. Es una emboscada.",
    [
      o("a", "Levantarte y marcharte con elegancia", "Cortar por lo sano", { reputacion: 5, fama: 2, moral: 2, flags: { rd_programa: "salgo" } }, "Te quitas el micrófono, le das las gracias al presentador y sales con la cabeza alta. El vídeo se hace viral, pero para bien: «El delantero que no se dejó engañar». Tu agente te manda un emoji de aplauso."),
      o("b", "Quedarte y responder con humor a todo", "Entrar al juego", { fama: 6, rel_aficion: 2, reputacion: -2, moral: 3, flags: { rd_programa: "humor" } }, "Respondes con ironía a cada pregunta. El programa se convierte en una comedia. Terminas el programa con la audiencia más alta del trimestre. Y con un pequeño sermón de tu agente."),
      o("c", "Quedarte e intentar explicar tu versión con seriedad", "Defenderte", { fama: 3, reputacion: 1, moral: -3, flags: { rd_programa: "serio" } }, "Explicas lo que haces con serenidad. La periodista busca una frase que tergiverse. Al final, la entrevista se edita para cortar tu mejor respuesta. La próxima vez, tu agente leerá la letra pequeña."),
    ]),
  S("rd-premio-humor", "redes", { minAge: 18, fama: [35, 100], clubTurns: [4, 400], notFlags: ["rd_premio_humor"] }, "vida",
    "Te nominan al «Premio al peor peinado del año»",
    "Es un galardón de broma que una web de humor concede cada diciembre. Tú no sabías que existía hasta que una periodista te llamó para pedir tu reacción. «Estás nominado junto a un cantante, una influencer y un político», dice. «¿Aceptas?». Te quedas mirando el móvil, pensando en tu agente, en tu madre y en el espejo.",
    [
      o("a", "Aceptar y asistir a la gala con una peluca", "Ir de cabeza", { fama: 5, rel_aficion: 5, moral: 6, flags: { rd_premio_humor: "gala" } }, "Llegas con una peluca naranja. Ganas, con un discurso de dos minutos que acaba en lágrimas de risa. El premio es una peineta de cartón dorado. La pones en el pasillo, junto a los trofeos serios. Es la que más gente fotografía."),
      o("b", "Rechazar con elegancia", "Mantener la compostura", { reputacion: 2, moral: 0, flags: { rd_premio_humor: "no" } }, "Declinas amablemente. El premio se lo lleva el político, que lo recoge con una sonrisa forzada. Pasas desapercibido, que no es lo que quería tu agente."),
    ]),
];
