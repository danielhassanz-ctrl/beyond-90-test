/**
 * Selección, tercera parte: el seleccionador que llama a tu casa, la lesión que enfada a tu club,
 * el día que te dan el brazalete (si alguien te lo prometió en el vestuario), el novato que llega
 * con la maleta de otro. Solo salen si ya has debutado con tu país.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const SELECCION3: BankScene[] = [
  S("s3-llamada-casa", "seleccion", { flags: ["sel_debut"], minAge: 18, notFlags: ["s3_llamada"] }, "especial",
    "El seleccionador llama personalmente a casa de tus padres",
    "Suena el teléfono fijo, ese que nunca nadie coge. Tu madre contesta con prisa, con una mano llena de harina. «¿Diga?». Al otro lado, una voz grave y tranquila: «Soy el seleccionador. ¿Está su hijo?». Tu madre se queda sin habla, deja caer la cuchara y grita, sin tapar el auricular: «¡Que es el seleccionador!». Tú, desde la ducha, no sabes si salir corriendo con la toalla.",
    [
      o("a", "Atender la llamada con la toalla y la voz temblorosa", "Contestar sin pensar", { moral: 8, rel_entrenador: 3, reputacion: 2, fama: 1, flags: { s3_llamada: "toalla" } }, "Hablas con el seleccionador chorreando agua. Te anuncia que cuenta contigo para la próxima convocatoria. Cuando cuelgas, tu madre llora de alegría y tu padre abre la botella buena. Años después, ese teléfono fijo se guardará como un trofeo."),
      o("b", "Ponerte ropa decente y devolver la llamada con calma", "Mantener la compostura", { moral: 6, reputacion: 3, flags: { s3_llamada: "calma" } }, "Tardas diez minutos en vestirte y otros cinco en respirar. Llamas. El seleccionador, con una sonrisa que se nota por teléfono, dice: «Siempre me gustó que un jugador se tomara su tiempo». Te convoca. Y se despide: «Salude a su madre»."),
    ]),
  S("s3-lesion-sel", "seleccion", { flags: ["sel_debut"], minAge: 19, notFlags: ["s3_lesion_sel"] }, "partido",
    "Te lesionas con la selección y tu club se enfada con el seleccionador",
    "Fue un amistoso sin importancia, a veinte minutos del final. Un choque fortuito, un tobillo torcido y el campo viéndote caer. El fisio de la selección te examina: «Un par de semanas». En el hospital, recibes tres llamadas: tu madre, tu agente y el director deportivo de tu club. Este último, con una voz educada y fría, dice: «Hablaremos con la federación sobre cómo se gestionan estas cosas».",
    [
      o("a", "Defender a la selección y quitar hierro al enfado del club", "Mediar", { reputacion: 4, rel_entrenador: -2, moral: -3, flags: { s3_lesion_sel: "defiendo", coach_bench: "2" } }, "Dices ante la prensa que fue una fatalidad y que no culpas a nadie. El club, a regañadientes, acepta. El seleccionador te escribe: «Gracias por el gesto». Regresarás en dos semanas con la rodilla en paz y la fama de leal."),
      o("b", "Darle la razón al club y lamentar la situación", "Ponerte del lado del equipo", { rel_entrenador: 4, rel_aficion: 2, reputacion: -2, moral: -3, flags: { s3_lesion_sel: "club", coach_bench: "2" } }, "El club agradece tu apoyo, la federación, menos. Un directivo de la selección comenta: «Los jugadores que critican, no son convocados». Aprendes lo que cuesta tener dos amos."),
      o("c", "Callarte y concentrarte en la recuperación", "Silencio", { moral: -2, forma: 2, flags: { s3_lesion_sel: "callo", coach_bench: "2" } }, "Dejas que los dos mundos discutan sin ti. La recuperación va más rápida de lo previsto. Cuando vuelves, ninguno te pide cuentas. A veces, el silencio es la política más inteligente."),
    ]),
  S("s3-brazalete", "seleccion", { after: [after("s2-capitan-leyenda", "a", 10, 120)], flags: ["capitan_futuro"], minAge: 24, media: [75, 99], notFlags: ["capitan_seleccion"] }, "especial",
    "El seleccionador te entrega el brazalete en el túnel, sin discurso",
    "No hay cámaras, ni música, ni prensa. Es un martes cualquiera, tras el entrenamiento. El seleccionador te llama aparte, saca de una bolsa un brazalete viejo, descolorido, con una costura mal hecha, y te lo coloca en la mano. «Era del capitán que se retiró —dice—. Lo ha dejado pensando en ti. Lo único que te pido es que lo cuides». Aprietas el brazalete en tu puño. Pesa más de lo que parece.",
    [
      o("a", "Aceptarlo con respeto y prometer cuidarlo", "Asumir el liderazgo", { moral: 12, reputacion: 7, rel_vestuario: 6, rel_aficion: 4, flags: { capitan_seleccion: true } }, "Lo llevas por primera vez en un amistoso, con una mano sobre la tela. Cuando suena el himno, sientes que el país entero te mira. Al final, el viejo capitán te escribe: «Ahora sé que está en buenas manos». Lloras en el vestuario."),
      o("b", "Pedirle un tiempo para prepararte antes de aceptarlo", "Pedir calma", { moral: 4, reputacion: 3, flags: { capitan_seleccion: "luego" } }, "El seleccionador sonríe: «Me alegra que te lo tomes en serio». Tres semanas después, aceptas. Cuando por fin lo llevas, lo haces con la certeza de haber elegido tú, no solo de haber sido elegido."),
    ], { isMilestone: true, milestoneType: "capitania", imageScene: "Photorealistic photo of a footballer receiving an old captain's armband from a coach in a stadium tunnel, solemn emotion, soft light, no logos or readable text" }),
  S("s3-novato", "seleccion", { flags: ["sel_debut"], minAge: 24, notFlags: ["s3_novato"] }, "vestuario",
    "Un debutante llega a la selección con una maleta prestada y los ojos como platos",
    "Es un chaval de diecinueve años, de un club pequeño, con una maleta que no es suya y una mirada que no sabe dónde posarse. Cuando entra en el vestuario, se queda parado, mirando las taquillas con los nombres de los mejores jugadores del país. Le asignan la que está a tu lado. Te saluda con una voz muy suave: «Hola. Soy de un pueblo de cuatrocientos habitantes». Te sonríe. Tú le tiendes la mano.",
    [
      o("a", "Presentarle a todo el mundo y acompañarle el primer día", "Hacerle un hueco", { rel_vestuario: 6, moral: 6, reputacion: 4, flags: { s3_novato: "hueco" } }, "Le presentas al capitán, al portero, al masajista. En la comida, se sienta a tu lado. Cuando le sacan en el partido, marca un gol de cabeza. En la celebración, te busca para abrazarte. Es el inicio de una amistad larga."),
      o("b", "Hacerle una novatada suave y cariñosa", "Bienvenido al equipo", { rel_vestuario: 5, moral: 5, flags: { s3_novato: "novatada" } }, "Le hacéis cantar una canción de su pueblo delante de todos. Lo hace con una voz preciosa. Alguien lo graba y sube el vídeo. El pueblo entero lo ve. Al día siguiente, hay cuatrocientos habitantes en el estadio, todos con bufanda."),
      o("c", "Dejarle que se adapte solo y observarle desde lejos", "Observar", { moral: 1, flags: { s3_novato: "observo" } }, "El primer día lo ves aislado, comiendo solo. Te sientes mal. El segundo, un veterano le habla. El tercero, ya habla con todos. Piensas que quizá habrías podido hacer algo más."),
    ]),
  S("s3-cena-federacion", "seleccion", { flags: ["sel_debut"], minAge: 19, notFlags: ["s3_cena_fed"] }, "vida",
    "La cena con los directivos de la federación se convierte en un karaoke",
    "Es un restaurante con mantel blanco, cubertería de plata y una orquesta discreta. Los directivos, con trajes oscuros y condecoraciones, brindan por la «unidad del fútbol nacional». A medida que pasan las copas, la formalidad se afloja. A las once, el presidente de la federación sube al escenario con un micrófono y canta una balada. A las doce, el capitán, un himno de los ochenta. A la una, te toca a ti.",
    [
      o("a", "Subir al escenario y cantar con toda tu alma, aunque desafines", "Entregarte", { rel_vestuario: 6, moral: 6, fama: 2, reputacion: 2, flags: { s3_cena_fed: "canto" } }, "Cantas una copla que aprendiste de tu abuela. El presidente se levanta y te aplaude de pie. Al acabar, un directivo veterano te dice: «Esa canción la cantaba mi madre». Se le quiebra la voz. Es la mejor actuación de tu carrera."),
      o("b", "Declinar con una sonrisa y acompañar con palmas", "Sin cantar", { rel_vestuario: 2, moral: 3, flags: { s3_cena_fed: "palmas" } }, "Haces las palmas con el ritmo justo. El resto de la noche transcurre entre risas. Nadie te echa en cara que no cantaras. Pero un compañero te dice, riéndose: «Te debo una votación»."),
      o("c", "Excusarte y marcharte pronto a descansar", "Responsabilidad", { forma: 2, rel_entrenador: 2, moral: 0, flags: { s3_cena_fed: "descanso" } }, "El seleccionador te despide con un gesto de aprobación. A la mañana siguiente, mientras los demás dormitan, tú rindes al máximo. En el desayuno, el capitán, con ojeras, murmura: «Qué listo»."),
    ]),
  S("s3-presion-pais", "seleccion", { flags: ["sel_debut"], minAge: 20, fama: [50, 100], notFlags: ["s3_presion"] }, "prensa",
    "Un periódico nacional dedica una portada entera a lo que «se espera de ti»",
    "El titular es enorme: «EL PAÍS CONFÍA EN TI». Debajo, una foto tuya en el entrenamiento, dos columnas de análisis y una frase subrayada de un exjugador: «Será el próximo líder o el próximo fracaso». Tu agente te manda la portada con un solo mensaje: «¿Quieres que respondamos?». Tú, con el café en la mano, notas el peso de millones de ojos.",
    [
      o("a", "Responder con serenidad: «Daré lo mejor, como siempre»", "Una respuesta serena", { reputacion: 5, rel_aficion: 3, moral: 2, flags: { s3_presion: "sereno" } }, "Dices una sola frase ante las cámaras. Los medios la repiten sin añadir nada. La presión baja un poco. En el siguiente partido, juegas con una tranquilidad que sorprende."),
      o("b", "Ignorar la portada y dedicarte a entrenar", "Aislarte", { forma: 2, moral: 1, flags: { s3_presion: "aislo" } }, "Apagas el móvil. Dos días después, en el campo, tu cabeza sigue en la portada. Te das cuenta de que ignorar no es lo mismo que no sentir. Pides un rato al psicólogo de la selección."),
      o("c", "Convertir la presión en un reto público: «Vamos a por todo»", "Subir la apuesta", { fama: 4, rel_aficion: 5, moral: 3, reputacion: -1, flags: { s3_presion: "reto" } }, "La frase es el titular de la noche. El país, entusiasmado, te adopta como su voz. Pero cada partido, desde ahora, será un examen. Lo sabes. Y, extrañamente, te gusta."),
    ]),
  S("s3-regalo-seleccionador", "seleccion", { flags: ["sel_debut"], minAge: 22, media: [72, 99], notFlags: ["s3_regalo_sel"] }, "vestuario",
    "El seleccionador te regala un libro con una dedicatoria enigmática",
    "Es un volumen viejo, de tapas de tela, de una novela sobre un marinero que cruza el océano con una vela remendada. En la primera página, con letra pequeña y firme, el seleccionador ha escrito: «Para el que sabe esperar la ola». No hay más. Te lo entrega al terminar el entrenamiento, sin ceremonia, y se marcha con las manos en los bolsillos. Los compañeros, desde lejos, hacen como que no lo han visto.",
    [
      o("a", "Leerlo entero en el viaje de vuelta y devolverle una nota", "Entrar en su mundo", { moral: 7, rel_entrenador: 5, reputacion: 3, flags: { s3_regalo_sel: "leo" } }, "Lo terminas en tres noches. Le dejas una nota: «Entendí lo de la ola». Él la lee, sonríe y la guarda en el bolsillo interior. Años después, se encontrará entre sus papeles el día que se retire."),
      o("b", "Guardarlo en la mochila y leerlo cuando tengas tiempo", "Posponer", { moral: 2, flags: { s3_regalo_sel: "luego" } }, "Pasan los meses. Un día, en una mala racha, lo abres. La frase de la primera página te golpea. «Esperar la ola». Lo lees de un tirón, esa misma noche."),
      o("c", "Preguntarle directamente qué quería decir", "Pedir explicaciones", { rel_entrenador: -1, moral: 0, flags: { s3_regalo_sel: "pregunto" } }, "«Si te lo explico, pierde la gracia», contesta con una media sonrisa. Te quedas sin respuesta. Pero, extrañamente, empiezas a pensar en la ola cada vez que dudas."),
    ]),
];
