/**
 * La grada, otra vez: la pancarta que te insulta con arte, el aficionado que se casa en el
 * estadio, el himno que cantan en tu honor, la peña que te hace socio. Casi siempre hay una
 * respuesta tuya, y una consecuencia en cómo te trata la gente los meses siguientes.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const AFICION3: BankScene[] = [
  S("a3-pancarta-ingenio", "aficion", { minAge: 17, clubTurns: [3, 400], moral: [0, 70], notFlags: ["a3_pancarta"] }, "vida",
    "Una pancarta te critica con tanto ingenio que no sabes si enfadarte o aplaudir",
    "Es enorme, escrita con pintura y mucho tiempo: «Marcas menos que el cartero y llegas más tarde». Debajo, un dibujo tuyo con una carta en la mano. El estadio entero se ríe al verla. Tú, en el calentamiento, la lees con un gesto que oscila entre la indignación y la admiración. Un compañero, a tu lado, murmura: «Hay que reconocer que está currada».",
    [
      o("a", "Aplaudir la pancarta desde el campo y saludar a los autores", "Reírte de ti mismo", { fama: 4, rel_aficion: 6, moral: 4, flags: { a3_pancarta: "aplaudo" } }, "Levantas los dos pulgares hacia la grada. Los autores, tres chavales de veinte años, se ponen en pie. Esa noche, marcas. En el siguiente partido, la pancarta nueva dice: «Retiramos lo dicho. Ya reparte goles»."),
      o("b", "Responder con una frase en redes: «El cartero siempre llega»", "Contraatacar con humor", { fama: 5, rel_aficion: 5, moral: 3, flags: { a3_pancarta: "frase" } }, "La frase se hace viral. Correos, la empresa de reparto, te manda un paquete con una carta de agradecimiento. La afición, por su parte, te dedica una canción. La pancarta se guarda en un museo del club."),
      o("c", "Pedir al club que la retire y que no vuelva a pasar", "Marcar un límite", { moral: -2, rel_aficion: -4, reputacion: -1, flags: { a3_pancarta: "retirar" } }, "El club la retira. La afición lo interpreta como una afrenta. Durante meses, la grada te grita con menos gracia y más veneno. Aprendes que el humor de una grada no se censura."),
    ]),
  S("a3-boda-estadio", "aficion", { minAge: 18, clubTurns: [3, 400], notFlags: ["a3_boda"] }, "vida",
    "Una pareja de aficionados se casa en el estadio y te pide que seas testigo",
    "El club les ha concedido un permiso especial: una ceremonia civil en el centro del campo, a las doce de la mañana, con las bufandas del equipo y un cura con la camiseta bajo la sotana. Los novios, que se conocieron en la grada hace siete años, te han escrito una carta de dos páginas: «Sin ti, no habría sido el mismo estadio». Te piden que firmes como testigo.",
    [
      o("a", "Aceptar con una sonrisa enorme y asistir con tu camiseta", "Ser testigo", { moral: 9, rel_aficion: 8, reputacion: 4, flags: { a3_boda: "testigo" } }, "Firmas el acta con una pluma de plata. La novia, entre lágrimas, te abraza. El cura, desde el centro del campo, termina con un «Y que el árbitro los acompañe siempre». Tres años después, vuelven con un bebé con una camiseta que le llega a los pies."),
      o("b", "Mandarles un vídeo de felicitación y un regalo", "Estar a distancia", { moral: 5, rel_aficion: 4, patrimonio: -150, flags: { a3_boda: "regalo" } }, "El vídeo se proyecta en la pantalla gigante durante la ceremonia. Los novios lloran. Un invitado graba el momento. A los tres días, el vídeo ha tenido un millón de visualizaciones."),
      o("c", "Declinar con cortesía por agenda", "No poder", { moral: -2, rel_aficion: -1, flags: { a3_boda: "no" } }, "Les mandas un mensaje de disculpa. Los novios lo entienden, o eso dicen. En la grada, el domingo, ven tu cara en la pantalla y gritan tu nombre. Sin rencor. Pero sientes que te has perdido algo importante."),
    ]),
  S("a3-boda-hijo", "aficion", { after: [after("a3-boda-estadio", "a", 12, 120)], minAge: 22 }, "vida",
    "El bebé de los novios del estadio te llama «tío» por primera vez",
    "Llega un domingo cualquiera, con una nota en la puerta de tu vestuario: «Venid a vernos al palco». Allí, sentados, los novios del estadio, con un bebé en brazos y los ojos brillantes. Cuando te acercas, el bebé, con una voz minúscula, balbucea una palabra. Los padres, muy serios, esperan. «Dilo otra vez», le dicen. El bebé te mira, sonríe y dice: «Tío».",
    [
      o("a", "Coger al bebé en brazos y hacerte una foto con la familia", "Aceptar el título", { moral: 10, rel_aficion: 6, reputacion: 4, flags: { a3_tio: true } }, "Lo sostienes con la torpeza de quien no sabe sujetar un bebé. «Tío» repite el niño. La foto sale en todos los medios locales. Esa noche, tu madre te llama: «Vaya sobrino más guapo has fichado»."),
      o("b", "Prometerles que serás el padrino cuando bauticen al segundo", "Una promesa", { moral: 8, reputacion: 3, flags: { a3_tio: "promesa" } }, "Se miran, emocionados. «Eso no se le dice a un aficionado en broma», murmura el padre. «No es broma», contestas. Y cumplirás, años después, en un bautizo con campanas."),
    ]),
  S("a3-himno-honor", "aficion", { minAge: 19, fama: [60, 100], rel: { aficion: [75, 100] }, clubTurns: [10, 400], notFlags: ["a3_himno"] }, "especial",
    "La grada compone un cántico con tu nombre y lo canta en el minuto 90",
    "Lo ensayaron durante semanas, en un bar del barrio, con un acordeón, un tambor y una letra que rima tu apellido con cosas tan absurdas como «volcán» y «piragüismo». Un domingo, en el minuto 90 de un partido tenso, tres mil gargantas lo entonan a la vez. El estadio tiembla. Tú, con las manos en las caderas, escuchas tu nombre convertido en música. Sientes un hormigueo que te sube por la espalda.",
    [
      o("a", "Levantar los brazos y dirigir el coro como un director de orquesta", "Entrar en la canción", { moral: 11, rel_aficion: 9, fama: 4, flags: { a3_himno: "dirijo" } }, "Los brazos al cielo, el estadio a tus pies. La canción se repite durante el resto del partido y en todos los siguientes. Un año después, se canta en bodas, bautizos y cumpleaños de todo el barrio."),
      o("b", "Mirar a la grada con las manos en el pecho, emocionado", "Agradecer en silencio", { moral: 10, rel_aficion: 7, reputacion: 3, flags: { a3_himno: "silencio" } }, "No haces nada. Solo miras. Una lágrima te baja por la cara sin que puedas hacer nada. Un fotógrafo la capta. «El hombre al que le cantaron un himno», dice el titular al día siguiente."),
      o("c", "Seguir jugando sin mirar para no perder la concentración", "Mantener el foco", { forma: 2, moral: 3, flags: { a3_himno: "foco" } }, "Aprietas los dientes y sigues jugando. El balón llega y lo conectas con una precisión de reloj. Ganas el partido. Al acabar, un compañero te dice: «Podrías haberles mirado». Respondes: «Lo hice. Con el corazón»."),
    ]),
  S("a3-socio-honor", "aficion", { minAge: 20, fama: [55, 100], clubTurns: [8, 400], notFlags: ["a3_socio"] }, "vida",
    "Una peña te nombra «socio de honor» con un carné de cartón y mucha ceremonia",
    "Es en un local pequeño, con un cartel pintado a mano y una mesa cubierta de embutidos. El presidente de la peña, un hombre con bigote y banderola, lee un pergamino con una voz de ópera: «Por sus servicios al balón y su compañerismo con esta humilde institución». Te colocan una bufanda, te entregan un carné laminado con tu foto y te pasan un vaso de vino de la casa. Hay cincuenta personas aplaudiendo con las manos llenas de jamón.",
    [
      o("a", "Quedarte hasta que se acabe el jamón y el vino", "Celebrarlo con ellos", { rel_aficion: 8, moral: 7, forma: -1, flags: { a3_socio: "fiesta" } }, "Cantas, bailas, firmas bufandas. A las doce, la peña te canta «Cumpleaños feliz» aunque no lo sea. A las dos, te acompañan en procesión hasta el coche. A las tres, te quedas dormido con la cabeza en el volante. Un amigo te lleva a casa."),
      o("b", "Darles las gracias con un discurso breve y entregarles una camiseta firmada", "Un gesto sencillo", { rel_aficion: 6, moral: 5, reputacion: 3, flags: { a3_socio: "discurso" } }, "La camiseta se enmarca y se cuelga en el centro del local, sobre la barra. Cada vez que vas, la señalas con orgullo. El presidente de la peña, con lágrimas, murmura: «La mejor adquisición de la historia»."),
      o("c", "Declinar con elegancia: el honor es tuyo, pero la agenda manda", "Con educación", { rel_aficion: 1, moral: 0, flags: { a3_socio: "no" } }, "El presidente lo entiende. Pero cuando llega la noche de la cena, un compañero te cuenta que «hubo un hueco en la mesa, el tuyo». No dices nada. Pero te pesa."),
    ]),
  S("a3-abucheo", "aficion", { minAge: 18, moral: [0, 60], clubTurns: [3, 400], notFlags: ["a3_abucheo"] }, "partido",
    "Te abuchean en tu propio estadio y no sabes cómo reaccionar",
    "Es tras un error en el minuto 20: un pase atrás que regala un gol. Notas el cambio de ambiente antes de oírlo: un murmullo, luego un silbido, luego una ola de abucheos que te rodean como un enjambre. Cada vez que tocas el balón, sientes que el estadio entero te mira con desconfianza. El capitán, a tu lado, murmura: «Aguanta. Esto se pasa».",
    [
      o("a", "Responder en el campo con una gran jugada", "Callar bocas con el balón", { moral: 5, rel_aficion: 4, forma: 1, flags: { a3_abucheo: "campo" } }, "En el minuto 58, recortas a dos, tiras de zurda y marcas. El estadio, de golpe, se pone en pie. Nadie recuerda el pase del minuto 20. Con un gesto, apuntas a la grada y levantas las manos. Es un perdón y una promesa."),
      o("b", "Hablar con el capitán y pedirle que te apoye en el descanso", "Pedir ayuda", { rel_vestuario: 5, moral: 2, flags: { a3_abucheo: "capitan" } }, "En el túnel, el capitán te agarra del hombro: «Hoy no vas a perder. Hoy vas a ganar con nosotros». En la segunda parte, todos te buscan con más pases. Terminas jugando uno de tus mejores partidos."),
      o("c", "Perder los papeles y hacer un gesto a la grada", "Responder con rabia", { moral: -4, rel_aficion: -6, reputacion: -3, rel_entrenador: -2, flags: { a3_abucheo: "gesto" } }, "Un gesto sin pensar, de esos que no se recuperan. El estadio ruge. Los medios lo resumen en cinco líneas. Tu agente te llama: «Tendremos que arreglar esto». Se tarda semanas."),
    ]),
  S("a3-abucheo-paz", "aficion", { after: [after("a3-abucheo", "c", 4, 30)], minAge: 18 }, "prensa",
    "Pides perdón a la afición con una carta pública que se hace viral",
    "Has pasado tres noches sin dormir, releyendo la imagen de tu gesto. Una mañana, con un café frío y un bolígrafo, escribes: «Perdí la cabeza. No es excusa. Os pido perdón a quienes me habéis dado todo». La carta tiene doce líneas. Se la pasas a tu agente. «¿La publicamos?». Él la lee dos veces, con un silencio solemne. «Es la mejor decisión que has tomado en el mes».",
    [
      o("a", "Publicarla tal como está, sin retoques", "Con transparencia", { rel_aficion: 8, reputacion: 7, moral: 4, flags: { a3_perdon: true } }, "La carta se comparte medio millón de veces. La afición, en el siguiente partido, te dedica una pancarta: «Perdonado». Al verla, se te llenan los ojos. Hay errores que, bien pedidos, cierran heridas."),
      o("b", "Guardarla y mandar mensajes privados a quien más te importa", "Un perdón íntimo", { rel_aficion: 3, moral: 2, reputacion: 2, flags: { a3_perdon: "privado" } }, "Escribes a la peña, al presidente, al capitán, a un par de aficionados conocidos. Las respuestas llegan, algunas frías, otras cálidas. No es un perdón masivo, pero sí uno honesto."),
    ]),
  S("a3-lluvia-grada", "aficion", { minAge: 17, clubTurns: [3, 400], turn: [4, 8], notFlags: ["a3_lluvia"] }, "partido",
    "Caen cuatro litros por metro cuadrado y la grada no se mueve ni un asiento",
    "La lluvia golpea el césped como un tambor. Los paraguas se abren en la tribuna como una colonia de setas. Pero nadie se va. Los hinchas del fondo, empapados, siguen cantando, y a las cinco de la tarde, el campo es un pantano. El árbitro, atónito, pregunta si hay que suspender. Un jugador rival, resbalando, murmura: «Esto es amor». Tú, con el barro hasta el cuello, no puedes sino admirar a esa gente.",
    [
      o("a", "Saludarles desde el centro del campo con los dos brazos y quedarte bajo la lluvia", "Compartir el temporal", { rel_aficion: 8, moral: 6, forma: -1, flags: { a3_lluvia: "comparto" } }, "Te quedas en medio del campo, con los brazos abiertos, bajo el aguacero. La grada, entusiasmada, canta con más fuerza. En los periódicos, la foto es una obra de arte: «El día que la lluvia unió al estadio»."),
      o("b", "Pedirle al árbitro que no suspenda para dar el espectáculo", "Jugar como sea", { rel_aficion: 5, moral: 4, rel_entrenador: 1, flags: { a3_lluvia: "juego" } }, "El árbitro, vencido por la determinación de todos, deja que siga. El partido es una locura de barro y goles. Terminas con calambres, felicidad y una anécdota para toda la vida."),
      o("c", "Pedir con respeto que se suspenda por la seguridad de todos", "Con cabeza", { reputacion: 4, rel_aficion: -1, moral: 1, flags: { a3_lluvia: "suspender" } }, "El árbitro, aliviado, suspende. Parte de la afición lo entiende, otra se queja. En la prensa, alguien escribe: «Un jugador que piensa en los demás». Sentirás que acertaste, aunque no de forma popular."),
    ]),
  S("a3-autobus-nino", "aficion", { minAge: 17, clubTurns: [3, 400], notFlags: ["a3_nino_bus"] }, "vida",
    "Un niño corre hasta el autobús del equipo con un dibujo para ti",
    "Es un martes por la mañana, tras un entrenamiento. El autobús sale de la ciudad deportiva con una cola de coches. De repente, un niño de siete años, con una mochila de dinosaurios, se planta frente a la puerta. Su madre, detrás, grita su nombre. El conductor frena. El chaval sube los escalones con la cara roja y un papel doblado en la mano. «Para el 9», murmura. Lo deposita en tu asiento y se marcha corriendo.",
    [
      o("a", "Abrir el dibujo con cuidado y guardarlo en la taquilla", "Un tesoro", { moral: 7, rel_aficion: 5, flags: { a3_nino_bus: "taquilla" } }, "Es un dibujo de ti con las botas más grandes que el cuerpo y un balón con alas. Debajo, en letras torcidas: «Eres mi favorito». Lo pegas dentro de tu taquilla. Cada vez que dudas, lo miras. Te ayuda más de lo que quisieras reconocer."),
      o("b", "Devolverle la sonrisa con un vídeo corto agradeciéndoselo", "Un gesto de vuelta", { moral: 6, rel_aficion: 6, reputacion: 3, flags: { a3_nino_bus: "video" } }, "Grabas diez segundos: «Gracias por el dibujo. Es el mejor del mundo». Tu agente lo manda a la madre. El niño, al verlo, se pone a gritar de alegría y deja caer la cuchara del desayuno. El vídeo recorre medio barrio."),
      o("c", "Pedirle al club que invite al niño y a su madre al siguiente partido", "Hacerle un regalo mayor", { moral: 8, rel_aficion: 7, reputacion: 5, flags: { a3_nino_bus: "invito" } }, "El club les da dos entradas de palco. Al acabar el partido, bajas a saludarles. El niño, sin palabras, te abraza las piernas. Su madre llora. Un fotógrafo lo capta: la imagen de la jornada."),
    ]),
];
