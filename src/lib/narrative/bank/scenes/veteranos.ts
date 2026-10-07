/**
 * Veteranía y despedida. Aquí se cobra el largo plazo: la despedida del estadio convoca a quien
 * se cruzó contigo (el loro del utillero, el amigo al que ayudaste, los críos del campo del
 * barrio), y los cameos solo salen si de verdad viviste aquellas escenas.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const VETERANOS: BankScene[] = [
  S("vt-treinta", "veterano", { minAge: 29, maxAge: 31, notFlags: ["vt_treinta"] }, "vida",
    "Cumples treinta años y el calendario te mira",
    "Una tarta con una vela en forma de «3» y otra con forma de «0». Tus compañeros jóvenes, que podrían ser tus hermanos pequeños, cantan con una mezcla de cariño y de pena. Uno de ellos, muy serio, dice: «Ya eres de los de la experiencia». El masajista te pasa un bote de crema para las rodillas, «por si acaso».",
    [
      o("a", "Soplar las velas y decir que estás mejor que nunca", "Plantar cara a los años", { moral: 4, forma: 1, rel_vestuario: 2, flags: { vt_treinta: "orgullo" } }, "Soplas con fuerza. Te sale una carcajada grande y varios compañeros prometen no jugar contigo en el rondo esta semana. Esa noche duermes con una sonrisa, aunque tengas una rodilla quejándose."),
      o("b", "Aprovechar para hacer balance y planificar los próximos años", "Pensar a largo plazo", { rel_representante: 2, reputacion: 2, moral: 1, flags: { vt_treinta: "balance" } }, "Quedas con tu agente al día siguiente y habláis de contratos, de la segunda vida, de qué vas a hacer cuando se acabe. Salís con tres folios, un café y un poco de vértigo."),
      o("c", "Pedir que no lo comenten: no hay nada que celebrar", "Sin dramas", { moral: -2, flags: { vt_treinta: "negacion" } }, "Dices que odias los cumpleaños. El vestuario respeta tu deseo, pero te deja en la taquilla una carta con treinta cosas que has hecho bien. La lees dos veces en el coche."),
    ]),
  S("vt-rodillas", "veterano", { minAge: 28, clubTurns: [3, 400], notFlags: ["vt_rodillas"] }, "vida",
    "Tus rodillas empiezan a hablar",
    "Por las mañanas, el primer escalón de la escalera se ha vuelto un problema. En el campo no lo notas hasta el minuto 60, pero en la ducha, tu cuerpo hace ruidos que no habías oído nunca. El fisio te observa caminar, entorna los ojos y dice: «Hay que empezar a cuidar lo que queda». Una frase que no suena nada bien.",
    [
      o("a", "Dedicar tiempo y dinero a un plan serio de prevención", "Cuidarte de verdad", { patrimonio: -1500, forma: 3, moral: 2, flags: { vt_rodillas: "plan" } }, "Contratas a un preparador personal y cambias la dieta. En dos meses duermes mejor y las rodillas protestan menos. Tu cuerpo, en el fondo, solo pedía respeto."),
      o("b", "Seguir como siempre y esperar que aguanten", "Negarlo", { moral: 1, forma: -2, flags: { vt_rodillas: "negacion" } }, "Dices que no pasa nada. Pasa. A los tres meses, un partido de domingo te recuerda lo que has ignorado, con un pinchazo en la rodilla izquierda. Tu fisio no dice «te lo dije». Solo mira."),
      o("c", "Hablarlo con el míster y negociar descansos", "Gestionar la carga", { rel_entrenador: 3, forma: 2, flags: { vt_rodillas: "gestion" } }, "El míster te escucha y propone jugar menos minutos en la liga y más en las citas grandes. Aceptas. Es una renuncia pequeña a cambio de una carrera más larga."),
    ]),
  S("vt-novato-pregunta", "veterano", { minAge: 27, clubTurns: [2, 400], notFlags: ["vt_novato"] }, "vestuario",
    "Un chaval del filial te pide consejo",
    "Se acerca a ti en el pasillo con el miedo del primer día. Tiene diecisiete años, unas botas demasiado grandes y una pregunta: «¿Cómo se aguanta cuando todo sale mal?». Cuando le miras a los ojos, ves a alguien que se parece mucho a un chaval que, hace años, preguntaba lo mismo a un veterano que ya no está.",
    [
      o("a", "Sentarte con él media hora y contárselo todo", "Ser su mentor", { reputacion: 4, moral: 5, rel_vestuario: 3, flags: { vt_novato: "mentor" } }, "Le cuentas tus cosas: la primera expulsión, el primer abucheo, la llamada de tu madre. «No se aguanta —acabas—. Se sigue». El chaval apunta algo en el móvil. Cuando se va, notas que tú también te has quedado más tranquilo."),
      o("b", "Darle una frase corta y una palmada en el hombro", "Ir al grano", { reputacion: 1, moral: 1, flags: { vt_novato: "breve" } }, "«Aguanta el primer año y el resto viene», le dices. El chaval sonríe, no dice nada, y desaparece por el pasillo. Esa frase le acompañará más años de los que imaginas."),
      o("c", "Decirle que no tienes tiempo ahora", "Pasar de largo", { moral: -2, reputacion: -2, flags: { vt_novato: "nada" } }, "Le dices que hablaréis otro día. Ese día no llega. Años después, el chaval, ya con fama, contará en una entrevista que «el veterano nunca tuvo tiempo». Y tú lo leerás."),
    ]),
  S("vt-novato-vuelve", "veterano", { after: [after("vt-novato-pregunta", "a", 20, 100)], minAge: 30 }, "vestuario",
    "El chaval al que ayudaste ya juega en el primer equipo",
    "Hay un debutante en la alineación y lo reconoces desde el túnel: es el chaval de las botas grandes, ahora con las botas a medida. Antes de salir al campo, se te acerca, te da un abrazo rápido y te dice al oído: «Esto es por lo del pasillo». Tú no sabes qué decir. Los dos sabéis que no hace falta.",
    [
      o("a", "Darle un último consejo antes de salir", "Un gesto de padrino", { moral: 7, reputacion: 4, rel_vestuario: 3, flags: { vt_novato_marca: true } }, "«Disfruta», le dices. «Esto dura menos de lo que crees». El chaval asiente, sale al campo y marca en el minuto 34. Al celebrarlo, te busca con la mirada y levanta el puño. Se te humedecen los ojos."),
      o("b", "Quedarte en silencio y sonreír", "Dejar que hable el campo", { moral: 5, reputacion: 2 }, "Le guiñas un ojo y ya está. Esa noche te manda un mensaje: «Gracias por no decirme nada. Solo por estar». Lo lees tres veces en el sofá, con el móvil muy cerca de la cara."),
    ]),
  S("vt-oferta-lejana", "veterano", { minAge: 31, fama: [55, 100], clubTurns: [4, 400], notFlags: ["vt_lejana"] }, "representante",
    "Una liga lejana te ofrece una fortuna",
    "Tu agente llega con una sonrisa que no le habías visto nunca. «Hay un club de una liga lejana, con estadios nuevos y cero impuestos, que te ofrece tres veces lo que ganas. Contrato de dos años. Y una casa con piscina. Y un chófer». Te enseña unas fotos de un sitio con rascacielos, sol y un campo de entrenamiento tan limpio que parece un decorado.",
    [
      o("a", "Escuchar con interés y negociar un contrato aparte", "Abrir la puerta", { rel_representante: 3, patrimonio: 4000, moral: 2, flags: { vt_lejana: "abierta", quiere_salir: true } }, "Tu agente empieza a hablar de cláusulas y comisiones. En dos semanas, el rumor se filtra y la afición se divide. Hay quien te llama «mercenario» y quien dice que «mereces cobrar por lo que has dado»."),
      o("b", "Descartarlo sin dudar: tu sitio es este", "Quedarte", { rel_aficion: 6, rel_entrenador: 3, reputacion: 3, moral: 3, flags: { vt_lejana: "no" } }, "Lo cuentas en una rueda de prensa: «Aquí me siento en casa». La grada te canta una canción que aún no existía. Tu agente suspira, mira su móvil y dice: «Qué romántico eres»."),
      o("c", "Pedir un año para pensarlo con la familia", "Sin prisa", { moral: 1, rel_representante: -1, flags: { vt_lejana: "pensando" } }, "Pides tiempo y lo entienden… hasta que el club de la liga lejana ficha a otro. Tu agente lo comenta con una frase seca: «Hay oportunidades que no esperan».")
    ]),
  S("vt-comentarista", "veterano", { minAge: 32, fama: [50, 100], clubTurns: [3, 400], notFlags: ["vt_comentarista"] }, "prensa",
    "Una cadena de televisión te propone comentar partidos",
    "Es una oferta suave, de las que se dejan caer: «Un par de partidos al mes, de comentarista invitado, sin dejar el fútbol». Te pasan el micrófono y un papel con tres frases que debes pronunciar con voz de entendido. Tu agente te mira por encima de las gafas: «Si te gusta, es el principio de otra carrera. Si no, es una anécdota con sueldo».",
    [
      o("a", "Probar con un partido y ver qué tal", "Ensayar la segunda vida", { fama: 3, rel_representante: 2, moral: 3, flags: { vt_comentarista: "probado" } }, "Comentas un partido de otra liga con un excompañero. Dices «ahí tenía que ir el pase» seis veces, y nadie se queja. Al final, el director te felicita: «Tienes oído». Te vas con una sensación rara: te ha gustado."),
      o("b", "Rechazarlo para no distraerte de tu carrera", "Concentración total", { forma: 1, rel_entrenador: 2, moral: 0, flags: { vt_comentarista: "no" } }, "Dices que prefieres concentrarte en el campo. Tu agente archiva el correo con tres palabras: «Ya volverán». Y tiene razón: volverán cuando menos te lo esperes."),
    ]),
  S("vt-carnet", "veterano", { minAge: 31, clubTurns: [3, 400], notFlags: ["vt_carnet"] }, "entrenamiento",
    "Te apuntas al curso de entrenador",
    "Las tardes libres se te han llenado de cuadernos, pizarras magnéticas y gente que habla de «bloques medios» con acento extranjero. Eres el único del curso con una camiseta de un club de Primera, y eso se nota. El profesor, que fue segundo entrenador de un mundialista, te pregunta: «¿Usted por qué quiere ser entrenador?». Te quedas mudo.",
    [
      o("a", "Contestar con total sinceridad", "«Para no dejar el vestuario»", { moral: 3, reputacion: 2, flags: { vt_carnet: "vestuario" } }, "Dices que lo que más teme del retiro es perder el vestuario. El profesor te mira, asiente y apunta algo en su libreta. «Esa es una razón mejor que la mayoría», comenta."),
      o("b", "Contestar con ambición", "«Quiero ganar títulos desde el banquillo»", { moral: 2, rel_entrenador: -1, flags: { vt_carnet: "titulos" } }, "El profesor sonríe: «Eso lo dicen todos». Te asigna ser el primero en exponer un entrenamiento, delante de veinte entrenadores. Sudas más que en un derbi."),
      o("c", "Contestar con humor", "«Porque no sé hacer otra cosa»", { moral: 4, rel_vestuario: 1, flags: { vt_carnet: "humor" } }, "La clase se desmorona de risa. «Al menos es honesto», dice el profesor. Luego te pasa los apuntes de las tres primeras semanas, porque «tú, de táctica, vas justito»."),
    ]),
  S("vt-hijo-grada", "veterano", { flags: ["hijos"], minAge: 28, clubTurns: [2, 400] }, "vida",
    "Tu hijo te ve jugar por primera vez desde la grada",
    "Lleva una camiseta con tu apellido, más grande de lo que le corresponde, y unos cascos para el ruido. Va de la mano de tu pareja, mirando el campo como quien contempla un océano. Cuando sales al calentamiento, te busca entre los jugadores, te señala con el dedo y grita algo que desde el campo no se entiende, pero que por el gesto sabes qué es: «¡Papá!».",
    [
      o("a", "Saludarle desde el césped con una sonrisa enorme", "Un saludo", { moral: 8, rel_aficion: 3, forma: 1 }, "Levantas el brazo, él da un salto y casi se cae del asiento. El estadio, que lo ha visto en la pantalla gigante, se rompe en un «ooooh» general. Juegas con una sonrisa que no se te quita en noventa minutos."),
      o("b", "Dedicarle tu primer gol de la tarde", "Algo para él", { moral: 10, fama: 3, rel_aficion: 4, flags: { gol_hijo: true } }, "Marcas en el minuto 54 y corres hacia la esquina de la grada, haces el gesto de dormir a un bebé y señalas a tu hijo. Él, en brazos de su madre, aplaude sin saber por qué. La foto sale en todos los diarios."),
    ]),
  S("vt-camiseta-retirada", "veterano", { minAge: 33, fama: [75, 100], clubTurns: [30, 400], notFlags: ["vt_dorsal"] }, "especial",
    "El club quiere retirar tu dorsal",
    "Se lo cuentas a tu madre antes que a nadie. En un acto sencillo, en el descanso de un partido contra un rival histórico, el presidente quiere colgar tu camiseta en el techo del estadio. Nadie más volverá a llevar ese número. Te pasas la mano por la cara: nunca pensaste que un día un club entero te diría «gracias» con un dorsal.",
    [
      o("a", "Aceptar con orgullo y subir al campo con tus padres", "Compartirlo con tu familia", { moral: 12, rel_aficion: 8, reputacion: 6, flags: { vt_dorsal: true } }, "Subes con tu madre agarrada del brazo. Cuando la camiseta sube al techo, el estadio ruge. Tu padre, a un metro, se tapa la boca con la mano para que nadie vea que llora."),
      o("b", "Pedir que se retire solo cuando tú te retires", "Esperar al final", { reputacion: 4, rel_aficion: 3, moral: 4, flags: { vt_dorsal: "luego" } }, "Dices que aún te quedan partidos por jugar. El presidente sonríe, aprieta tu mano y dice: «Aquí estará». La afición lo celebra con una ola enorme."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a veteran footballer on the pitch at half time watching his jersey being raised to the stadium roof, family beside him, emotional tears, floodlights, no logos or readable text" }),
  S("vt-despedida", "veterano", { minAge: 33, fama: [45, 100], clubTurns: [20, 400], notFlags: ["vt_despedida"] }, "especial",
    "Una vuelta de honor que se te hace corta",
    "Aún no has dicho que te retiras, pero el club ha decidido que, por si acaso, hay que hacerte un homenaje: una vuelta de honor, un vídeo con tus mejores goles y un partido de despedida con exjugadores. Todo el barrio ha venido. Hay bufandas con tu cara, pancartas con tu apellido y una orquesta tocando un himno que suena sospechosamente a «Gracias por todo».",
    [
      o("a", "Dar la vuelta de honor saludando a todos", "Disfrutarlo", { moral: 10, rel_aficion: 8, reputacion: 5, fama: 3, flags: { vt_despedida: "disfrute" } }, "Das la vuelta al campo despacio, tocando manos, firmando camisetas, abrazando niños. A mitad de la vuelta, te das cuenta de que todos esos ojos son testigos de tu historia. No quieres que acabe."),
      o("b", "Dar un discurso breve y emocionado", "Hablar con el corazón", { moral: 8, reputacion: 7, rel_aficion: 6, flags: { vt_despedida: "discurso" } }, "Subes al círculo central con un micro. «Gracias —dices—. Por hacerme sentir que mi sitio estaba aquí». Se hace un silencio que podrías cortar con un cuchillo. Luego, un rugido."),
      o("c", "Pedir que no haya nada especial, sin ceremonias", "Un adiós discreto", { moral: 2, reputacion: 3, flags: { vt_despedida: "discreta" } }, "Prefieres no hacer ruido. Al final, solo el utillero te espera en el vestuario con una caja: «Es el balón de tu primer gol. Lo guardaba». Te quedas sin palabras. Era lo único que de verdad querías."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a veteran footballer doing a lap of honour in a packed stadium at dusk, fans waving scarves and banners, emotional smile, golden light, no logos or readable text" }),
  // ───── Cameos de la despedida: solo salen si viviste aquellas escenas ─────
  S("vt-cameo-loro", "veterano", { after: [after("vt-despedida", undefined, 2, 8)], flags: ["loro_leyenda"] }, "vestuario",
    "Evaristo, en primera fila de tu despedida",
    "En la tribuna, junto al utillero, hay una jaula tapada con una tela del club. Cuando acabas tu discurso, el utillero la destapa con un gesto teatral y, desde dentro, un loro viejo, con mucha dignidad, suelta con la voz de aquel míster: «¡Esto no es un hotel!». Los veteranos se parten. Los jóvenes, sin saber por qué, te abrazan.",
    [
      o("a", "Subir a la tribuna y abrazar al utillero y al loro", "Cerrar el círculo", { moral: 9, rel_vestuario: 6, reputacion: 3 }, "Le das un abrazo al utillero. Al loro, una pipa. Evaristo contesta con tu apellido, pronunciado con la entonación del speaker. «Lo ha aprendido solo», jura el utillero. Nadie le cree. Todos lo agradecen."),
      o("b", "Decirle al micrófono: «Gracias a quien me ha aguantado todo este tiempo»", "Un chiste final", { moral: 6, fama: 2, rel_vestuario: 4 }, "Lo dices mirando a la jaula. El estadio estalla, el loro se ofende, y el vídeo se hace viral con el título «El mejor fichaje del club fue un pájaro»."),
    ]),
  S("vt-cameo-campo", "veterano", { after: [after("vt-despedida", undefined, 2, 8)], flags: ["campo_inaugurado"] }, "vida",
    "Los críos del campo de tu barrio, con la camiseta del equipo",
    "Una fila de treinta niños con la equipación de la escuela de tu barrio sale al césped y se pone en hilera, detrás de una pancarta pintada a mano: «De este campo salió un crack. Gracias por volver». Algunos de los chavales son hijos de los que jugaban contigo en el barro. El entrenador de siempre, ya muy mayor, camina el último con un bastón.",
    [
      o("a", "Jugar un último partidillo con ellos en el césped", "Volver a los doce años", { moral: 10, rel_aficion: 6, reputacion: 5, forma: 1 }, "Te quitas las botas de profesional y juegas descalzo diez minutos con los críos. Un niño te hace un túnel y todo el estadio celebra. Piensas en el campo de tierra y piensas que, en el fondo, nunca has dejado de jugar allí."),
      o("b", "Abrazar al viejo entrenador antes que a nadie", "Agradecerle todo", { moral: 9, reputacion: 6, rel_entrenador: 0 }, "Le das un abrazo largo, sin palabras. «Lo hiciste tú, yo solo te miraba», murmura. «Mentira», contestas. El estadio entero se queda en silencio, sin saber por qué se emociona."),
    ]),
  S("vt-cameo-nacho", "veterano", { after: [after("vt-despedida", undefined, 2, 8)], flags: ["nacho_cerrado"] }, "vida",
    "Nacho, con una bicicleta de regalo",
    "Entre la gente, al fondo de la grada, un hombre con una gorra y una camiseta vieja levanta una bicicleta por encima de su cabeza. Es Nacho, el de la pachanga, el del taller del barrio. Baja las escaleras con la bici en brazos, atraviesa la valla de seguridad con una sonrisa disculpándose, y te la entrega en mitad del césped. «Para tus rutas de jubilado», dice.",
    [
      o("a", "Subirte a la bici y dar una vuelta de honor con él", "Un homenaje a dos", { moral: 11, rel_aficion: 7, reputacion: 5, fama: 3 }, "Dais una vuelta al campo montados cada uno en una bici, entre aplausos y carcajadas. Dos amigos del barrio, con las rodillas mal, haciendo el ridículo. Es la mejor vuelta de honor de la historia del club."),
      o("b", "Darle las gracias y guardarla en el vestuario", "Con cariño", { moral: 7, reputacion: 3 }, "Le abrazas y le dices que no la va a usar nadie más que tú. Esa tarde, en el vestuario, pegas una nota en el manillar: «De Nacho. Para siempre»."),
    ]),
  S("vt-cameo-quique", "veterano", { after: [after("vt-despedida", undefined, 2, 8)], flags: ["restaurante_exito"] }, "vida",
    "Quique prepara la cena de tu despedida",
    "En el vestuario, tras el homenaje, hay un camión de reparto aparcado en la puerta trasera. Del camión bajan veinte cajas con croquetas, jamón y una tarta con tu cara en azúcar. Quique, con el delantal manchado, se limpia las manos y dice: «Para mi primo, el cliente más famoso de Bar el Crack». Detrás, tres camareros con bandejas y la prensa local.",
    [
      o("a", "Cenar con todo el vestuario y los compañeros que han venido", "Una noche larga", { moral: 9, rel_vestuario: 8, patrimonio: 500, reputacion: 3 }, "La cena dura hasta las cuatro de la madrugada. Quique, con el delantal de gala, cuenta mil veces la historia de la servilleta. A las tres, todos cantan. A las cuatro, todos lloran. A las cinco, todos piden más croquetas."),
      o("b", "Hacer un brindis por el primo que creyó en ti antes que nadie", "Reconocérselo", { moral: 10, reputacion: 5, rel_aficion: 3 }, "Subes a una silla con un vaso en la mano. «Por Quique —dices—, que sabía de croquetas y de mí antes que yo». El restaurante entero aplaude y alguien dice: «Y por la servilleta». Os reís hasta que se acaban las croquetas."),
    ]),
  S("vt-balance", "veterano", { minAge: 32, clubTurns: [10, 400], flags: ["trofeos"], notFlags: ["vt_balance"] }, "prensa",
    "Un periodista te pide hacer balance de tu carrera",
    "Es una entrevista larga, de las que se hacen en un sofá, con luz de tarde y una taza de café entre las manos. «Tienes tu vitrina llena, tus números, tu nombre en los libros. ¿Qué te llevas de todo esto?». Piensas en las madrugadas, en los viajes, en las llamadas de tus padres. El periodista espera, con el bolígrafo en el aire.",
    [
      o("a", "Responder que lo más importante han sido las personas", "Hablar de la gente", { reputacion: 6, moral: 6, rel_aficion: 4, flags: { vt_balance: "personas" } }, "Dices los nombres: tu madre, el viejo entrenador, el utillero, un chaval al que ayudaste. El periodista deja de apuntar. «Esto es el titular», dice. Tú no sabes cuál. Tienes los ojos húmedos."),
      o("b", "Hablar de los títulos y de lo que costó ganarlos", "Orgullo del trabajo", { reputacion: 4, moral: 4, fama: 3, flags: { vt_balance: "titulos" } }, "Cuentas lo que costó cada trofeo, lo que no se ve en las fotos. El periodista asiente: «Hay quien cree que es fácil». Respondes con una sonrisa cansada: «Hay quien no ha visto los entrenamientos»."),
      o("c", "Quitar importancia: «Soy un tipo con suerte»", "Modestia", { reputacion: 5, moral: 3, flags: { vt_balance: "suerte" } }, "Lo dices con una sonrisa sincera. El periodista no lo publica así; pone: «El mejor jugador de su generación dice que tuvo suerte». Hay quien le cree. Hay quien no."),
    ]),
  S("vt-balance-vacio", "veterano", { minAge: 32, clubTurns: [10, 400], notFlags: ["trofeos", "vt_balance"] }, "prensa",
    "«No ganaste nada, ¿qué te llevas?»",
    "Es una pregunta de las que duelen. El periodista no lo hace con maldad; lo hace con la curiosidad de quien ha visto a mil jugadores acabar sin una vitrina. Te mira con cara amable y espera. Tú piensas en las noches de entrenamiento, en los abrazos del vestuario, en los goles que nadie recuerda. Y piensas que eso también es fútbol.",
    [
      o("a", "Contestar que el fútbol es más que ganar", "Defender lo vivido", { reputacion: 6, moral: 5, rel_aficion: 4, flags: { vt_balance: "mas" } }, "Dices que has jugado quince años de lo que más amas y que eso no se mide con una copa. «Hay quien lo entiende y quien no», concluyes. Un aficionado te escribe esa noche: «Yo sí»."),
      o("b", "Contestar con humor: «Gané una bicicleta, ¿eso cuenta?»", "Reírte de ti mismo", { reputacion: 4, moral: 4, fama: 2, flags: { vt_balance: "humor" } }, "El periodista se ríe. La frase corre por redes con la etiqueta #LaBicicleta. Un fabricante te manda una, de verdad. «Para que sigas ganando», dice la nota."),
      o("c", "Callarte unos segundos y decir: «Aún me queda un año»", "Seguir peleando", { forma: 2, moral: 3, flags: { vt_balance: "peleando" } }, "Contestas que todavía no has terminado. El periodista sonríe. Esa noche, te quedas entrenando solo en el campo, con las luces a medio apagar. Algo dentro de ti, aunque cansado, sigue vivo."),
    ]),
];
