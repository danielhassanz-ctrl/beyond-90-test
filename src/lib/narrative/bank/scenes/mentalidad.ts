/**
 * La cabeza: el síndrome del impostor, el día que desconectas de las redes, la rabia que se te
 * escapa en un partido, la gratitud que aprendes tarde. Aquí las consecuencias son internas
 * (moral, forma, cómo te trata el vestuario) y a veces tardan meses en aparecer.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const MENTALIDAD: BankScene[] = [
  S("mn-impostor", "mente", { minAge: 18, media: [66, 99], fama: [30, 100], clubTurns: [4, 400], notFlags: ["mn_impostor"] }, "vida",
    "Te despiertas convencido de que no mereces estar aquí",
    "Es una mañana cualquiera: café, entrenamiento, vestuario. Pero algo se te ha puesto en el pecho. Miras a tus compañeros y piensas: «Son mejores que yo». Al leer los comentarios de la afición, solo ves los negativos. Te dices que todo ha sido suerte. Que en cualquier momento alguien llamará a la puerta para decirte que se han equivocado. Nadie lo hace. Pero el pensamiento se queda.",
    [
      o("a", "Hablarlo con el psicólogo del club o con alguien de confianza", "Sacarlo fuera", { moral: 6, reputacion: 3, forma: 2, flags: { mn_impostor: "hablo", terapia: true } }, "Te dicen que es muy común entre los que más trabajan. «Cuanto más sabes, más ves lo que te falta», explica el psicólogo. Te da un cuaderno: «Apunta cada noche tres cosas que has hecho bien». Es una tontería. Funciona."),
      o("b", "Hacer una lista de tus mejores partidos y releerla", "Buscar pruebas", { moral: 4, forma: 1, flags: { mn_impostor: "lista" } }, "La lista tiene doce partidos. Los repasas en vídeo. Hay jugadas de las que te sientes orgulloso, y otras que ni recordabas. «No es suerte», te dices en voz baja. Y por un rato, lo crees."),
      o("c", "Callarte y trabajar el doble para demostrarte que sí vales", "Compensar", { forma: 2, moral: -3, rel_vestuario: -1, flags: { mn_impostor: "callo" } }, "Entrenas de más, comes de menos, duermes poco. A los dos meses, un fisio te avisa: «Estás agotado». Las dudas, lejos de irse, se han hecho más grandes. Lo que necesitas no es más esfuerzo, es hablar."),
    ]),
  S("mn-impostor-vence", "mente", { after: [after("mn-impostor", "a", 8, 80)], minAge: 20 }, "vida",
    "Ayudas a un compañero joven que se siente igual que te sentías tú",
    "Lo ves en un rincón, con la cabeza gacha, durante un descanso. Es un chaval de diecinueve años, el nuevo talento, el que todos miran. Pero su cara dice lo contrario: tiene los ojos cansados, las manos nerviosas. Te acuerdas de la mañana de tu duda. Te sientas a su lado, sin decir nada, durante un minuto. «¿Te puedo contar algo?», preguntas.",
    [
      o("a", "Contarle tu experiencia y lo que te ayudó", "Ser su referente", { moral: 8, reputacion: 6, rel_vestuario: 5, flags: { mn_mentor_joven: true } }, "Le hablas del cuaderno, de las tres cosas, de lo que sientes cuando entras en el campo. El chaval te escucha sin pestañear. Al final, dice: «Pensaba que era el único». Respondes: «Nadie lo es»."),
      o("b", "Darle una palmada y una frase corta: «Disfruta»", "Un gesto discreto", { moral: 5, reputacion: 3, flags: { mn_mentor_joven: "gesto" } }, "No dices más. Él sonríe, un poco aliviado. Años después, te recordará la frase en una entrevista: «Un veterano me dijo que disfrutara, y fue lo mejor que escuché»."),
    ]),
  S("mn-detox", "mente", { minAge: 17, fama: [30, 100], clubTurns: [3, 400], notFlags: ["mn_detox"] }, "vida",
    "Dejas las redes sociales una semana y descubres que existe el mundo",
    "Fue una decisión impulsiva después de un comentario cruel: borras las aplicaciones, apagas las notificaciones y le pides a tu agente que se encargue de lo esencial. Los dos primeros días, sientes un hormigueo en los dedos. Al tercero, empiezas a leer un libro. Al cuarto, a salir a pasear. Al quinto, un niño te saluda en el parque y no lleva móvil. Sonríes sin saber por qué.",
    [
      o("a", "Mantenerlo más tiempo y revisar solo lo necesario", "Cambiar de hábito", { moral: 7, forma: 2, reputacion: 2, flags: { mn_detox: "mantengo" } }, "Vuelves a las redes un mes después, con menos tiempo y más calma. Descubres que casi nada importante se ha perdido. Tu agente nota el cambio: «Te veo más tranquilo». Lo estás."),
      o("b", "Volver al cabo de una semana con ganas de ponerte al día", "Un paréntesis", { moral: 3, flags: { mn_detox: "vuelvo" } }, "Recuperas el móvil, lo enciendes con una mezcla de ansiedad y curiosidad. Hay doscientos mensajes. Ninguno es urgente. La semana ha servido para recordar que se puede vivir con menos ruido."),
      o("c", "Recaer a los dos días y fingir que no ha pasado nada", "Caer en la tentación", { moral: -1, flags: { mn_detox: "recaigo" } }, "Al segundo día, abres una aplicación «solo para mirar». Dos horas después, sigues. Te prometes intentarlo otra vez. Seguramente lo harás: es una de esas batallas que se ganan a pasos."),
    ]),
  S("mn-rabia", "mente", { minAge: 17, clubTurns: [3, 400], notFlags: ["mn_rabia"] }, "partido",
    "Pierdes los nervios con un rival que te provoca y casi te expulsan",
    "Lleva veinte minutos susurrándote cosas al oído: sobre tu familia, sobre tu último partido, sobre tu apellido. Las palabras se acumulan como piedras en un bolsillo. En el minuto 67, tras una entrada, te giras, le empujas con las dos manos y le miras con los ojos inyectados. El árbitro saca la amarilla. El rival, desde el suelo, sonríe. Es lo que quería.",
    [
      o("a", "Respirar hondo, levantar la mano y pedir disculpas al árbitro", "Controlarte", { reputacion: 4, rel_entrenador: 3, moral: -1, flags: { mn_rabia: "control" } }, "Tu gesto desarma al estadio. El árbitro, sorprendido, asiente. El rival se queda sin su victoria. Al acabar el partido, el míster te abraza: «Esa fue la mejor decisión del día»."),
      o("b", "Seguir jugando enfadado y tirar de rabia", "Quemar la ira", { forma: 1, rel_entrenador: -2, moral: -1, flags: { mn_rabia: "rabia" } }, "Corres, presionas, ganas balones. Con la rabia, juegas bien, pero a los quince minutos, otra entrada tuya hace que el árbitro tenga que advertirte. El míster te cambia en el 80. «Estás perdiendo la cabeza», murmura."),
      o("c", "Encararte con el rival y responderle con la misma moneda", "Entrar al trapo", { reputacion: -4, rel_entrenador: -4, moral: -3, flags: { mn_rabia: "trapo", coach_bench: "1" } }, "La segunda amarilla llega a los cuatro minutos. Te vas expulsado, con la grada dividida entre aplausos y abucheos. El míster, de brazos cruzados, te mira. «Mañana, hablaremos». Un partido de sanción."),
    ]),
  S("mn-rabia-lecci", "mente", { after: [after("mn-rabia", undefined, 2, 20)], minAge: 18 }, "entrenamiento",
    "El míster te pone un ejercicio para trabajar la frustración",
    "Es una tarde tranquila, con el campo vacío y el sol bajo. El míster te hace tirar penaltis sin portero mientras tres compañeros te gritan frases desagradables desde detrás. «Ahora, tira», dice, con calma. Tú aprietas los dientes, piensas en las palabras del rival, en el insulto, en el ruido. Colocas el balón. Respiras. Es una escuela distinta de las que has conocido.",
    [
      o("a", "Concentrarte en el balón y marcar los cinco, sin hacer caso", "Dominar la mente", { forma: 2, rel_entrenador: 4, moral: 5, reputacion: 2, flags: { mn_control: true } }, "Ignoras las frases con una calma que te sorprende. Metes cinco de cinco. El míster asiente: «Eso es lo que quiero en el minuto 85». Al volver a casa, te das cuenta de que cada vez te enfadas menos."),
      o("b", "Fallar dos penaltis por perder los nervios", "Aprender de la derrota", { moral: -1, rel_entrenador: 2, flags: { mn_control: "falla" } }, "Los dos fallos, ante la voz, te molestan. «Eso es lo que vamos a trabajar», dice el míster, sin una sombra de reproche. Repetís el ejercicio durante una semana. Al final, ya no falla ninguno."),
    ]),
  S("mn-gratitud", "mente", { minAge: 20, clubTurns: [6, 400], notFlags: ["mn_gratitud"] }, "vida",
    "Haces una lista de las personas que te han ayudado y descubres que son muchas",
    "Fue una idea de tu psicólogo, o de tu madre, o de un libro: escribir quién te ayudó a llegar. Empiezas con tres nombres: tu madre, tu padre, tu primer entrenador. Luego, el utillero que te prestó unas botas, la vecina que te llevaba a los partidos, el profesor que te dejó ir a un torneo. A las dos horas, tienes cuarenta y ocho nombres. Te quedas mirando la lista con una emoción muy tranquila.",
    [
      o("a", "Escribir una nota breve a cada uno que siga vivo", "Agradecer", { moral: 10, reputacion: 5, rel_vestuario: 1, flags: { mn_gratitud: "notas" } }, "Tardas cuatro semanas. Algunos no contestan. Otros, sí: una carta de cuatro líneas de la vecina que te llevaba, con una foto. «Aquel niño que pesaba lo que una pluma», escribe. Esa carta es una de tus cosas más preciadas."),
      o("b", "Invitar a algunos a un partido y dedicarles un gol", "Un homenaje en el campo", { moral: 9, rel_aficion: 4, reputacion: 4, flags: { mn_gratitud: "partido" } }, "Los sientas en una zona especial. En el gol, te giras hacia ellos y levantas el brazo. Hay lágrimas en una fila entera. Al acabar, la vecina te abraza: «Ahora estás pesando algo más»."),
      o("c", "Guardarte la lista como recordatorio personal", "Un tesoro privado", { moral: 6, flags: { mn_gratitud: "privada" } }, "La pegas en el interior de tu taquilla. Cada vez que dudas, la miras. Los nombres son una especie de equipo invisible. Años después, la entregarás, enmarcada, a alguien que lo necesite."),
    ]),
  S("mn-meditar", "mente", { minAge: 17, clubTurns: [3, 400], notFlags: ["mn_meditar"] }, "vestuario",
    "Un compañero te convence de meditar diez minutos antes de cada partido",
    "Se llama Íñigo, tiene una voz suave y un cojín morado que lleva en la mochila. «Cierra los ojos, siente tu respiración, suelta el pasado y el futuro», dice, sentado en la esquina del vestuario con las piernas cruzadas. El resto del equipo lo mira como a un extraterrestre. Tú, que antes de cada partido pones la cabeza a mil, dudas. Hay algo en su calma que te llama la atención.",
    [
      o("a", "Probarlo con él durante dos semanas", "Entrar en el círculo", { forma: 2, moral: 5, rel_vestuario: 3, flags: { mn_meditar: "pruebo" } }, "Los primeros días, no consigues dejar de pensar en el rival. A la semana, logras diez segundos de silencio. A las dos, sales al campo más tranquilo. Al tercer partido, se une otro compañero. Al quinto, medio vestuario medita. El capitán, de mala gana, también."),
      o("b", "Reírte con cariño de su cojín y seguir con lo tuyo", "Pasar de la meditación", { rel_vestuario: 3, moral: 1, flags: { mn_meditar: "no" } }, "Le haces una broma, él sonríe, sigue meditando. A final de temporada, Íñigo es el que menos tarjetas ve. Piensas, con un punto de envidia, que quizá deberías haberle hecho caso."),
      o("c", "Proponer una versión a tu manera: respirar con música", "Adaptarlo", { forma: 1, moral: 4, rel_vestuario: 2, flags: { mn_meditar: "musica" } }, "Haces una lista de canciones relajantes y la pones en el vestuario. Es tan eficaz como cualquier otro método. Íñigo, agradecido, la lleva consigo. «Es la banda sonora de nuestra calma», dice."),
    ]),
  S("mn-fama-cansa", "mente", { minAge: 19, fama: [70, 100], clubTurns: [5, 400], notFlags: ["mn_fama"] }, "vida",
    "Un día quieres salir a la calle y que nadie te reconozca",
    "Son las cuatro de la tarde de un martes, con sol, un parque cercano y una necesidad enorme de caminar sin que nadie te pare. Te pones una gorra, unas gafas, una sudadera con capucha. Cruzas la puerta del portal. A los quince metros, un señor te mira, sonríe y dice: «Buenas tardes, campeón». A los treinta, tres chicos se acercan con el móvil. A los cuarenta, desistes.",
    [
      o("a", "Aceptar con paciencia las fotos y los saludos, una vez más", "Ser amable", { rel_aficion: 4, moral: -1, reputacion: 3, flags: { mn_fama: "amable" } }, "Posas con diez personas. Una señora te da un caramelo. Llegas al parque tras cuarenta minutos. Descubres que hoy no necesitabas estar solo: necesitabas ser querido. Y lo has sido."),
      o("b", "Buscar un sitio donde nadie te conozca: otra ciudad, un pueblo, un monte", "Escapar", { moral: 6, forma: 1, patrimonio: -150, flags: { mn_fama: "escapo" } }, "Conduces dos horas hasta un pueblo con una iglesia y dos bares. Nadie te mira. Pides un café y lo bebes, solo, junto a una ventana. Es el mejor café de tu vida. Vuelves con la cabeza ligera."),
      o("c", "Dar una charla sobre el precio de la fama en tu próxima rueda de prensa", "Sacarlo fuera", { reputacion: 5, fama: 2, moral: 3, flags: { mn_fama: "charla" } }, "Hablas con calma de la presión, de la pérdida de intimidad, del cariño que a veces cansa. La prensa, sorprendida por tu sinceridad, lo recoge con respeto. Mucha gente te escribe para darte las gracias."),
    ]),
  S("mn-optimismo", "mente", { minAge: 17, clubTurns: [3, 400], moral: [0, 50], notFlags: ["mn_optimismo"] }, "vida",
    "Una vecina te regala una planta con una nota: «Cuídala y ella te cuidará»",
    "Es un cactus pequeño, en una maceta de barro, con una etiqueta escrita a mano: «Aguanta de todo». Te la entrega una anciana del portal, con una mirada que no admite excusas. «Te veo triste, hijo. Los cactus son buenos para eso». Tú, que tienes la moral por los suelos, aceptas por educación. La pones en la ventana de la cocina y te olvidas de ella.",
    [
      o("a", "Cuidarla con esmero: regarla, hablarle, ponerle música", "Hacerte cargo", { moral: 6, forma: 1, flags: { mn_optimismo: "cuido" } }, "Cada mañana, antes del entrenamiento, miras el cactus. A los dos meses, ha dado una flor. Piensas: «Si aguanta él…». Se lo cuentas a la vecina, que sonríe: «Ya te lo dije»."),
      o("b", "Dejarla en la ventana y mirarla de vez en cuando", "Un cuidado a medias", { moral: 3, flags: { mn_optimismo: "mitad" } }, "El cactus sobrevive sin esfuerzo. Un día, te das cuenta de que lleva más tiempo que tú sin quejarse. Te ríes solo en la cocina. Algo ha cambiado."),
      o("c", "Regalársela a alguien más que la necesite", "Pasar el testigo", { moral: 4, reputacion: 3, flags: { mn_optimismo: "regalo" } }, "Se la das a un compañero que atraviesa una mala racha. Él se ríe, luego se emociona. «Qué cosa más rara», dice. Pero la lleva a todos los viajes. Un día te dice: «Me ha dado una flor»."),
    ]),
];
