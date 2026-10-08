/**
 * La gente que no sale en las fotos: el analista de vídeo, el entrenador de porteros, el médico
 * que huele la mentira, el utillero que guarda tu primer balón, el conductor del autobús que
 * ha visto de todo. Cada uno te cambia algo pequeño que luego se nota en el campo.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const CUERPO_TECNICO: BankScene[] = [
  S("ct-analista", "cuerpo", { minAge: 17, clubTurns: [3, 400], notFlags: ["ct_analista"] }, "entrenamiento",
    "El analista de vídeo te enseña una tendencia tuya que no sabías que tenías",
    "Es un chico de veintiséis años, con gafas, una sudadera con capucha y un portátil lleno de carpetas. Te sienta delante de una pantalla y te enseña doce jugadas seguidas. En todas, antes de recibir, miras hacia la izquierda. «Siempre la izquierda —dice—. Los rivales ya lo saben». Sientes que te han desnudado en medio de la calle. «Pero se arregla», añade con una sonrisa amable.",
    [
      o("a", "Trabajar el cambio con él durante dos semanas", "Corregir la tendencia", { forma: 2, moral: 4, rel_entrenador: 3, flags: { ct_analista: "corrijo" } }, "Cada tarde, una hora delante de la pantalla y media en el campo. El primer partido, te sale algo raro. El segundo, un poco menos. En el tercero, un rival se queda clavado mirando a la izquierda mientras tú recibes por la derecha. Sonríes."),
      o("b", "Aceptarlo pero dejarlo para otro momento", "Posponer", { moral: 1, flags: { ct_analista: "luego" } }, "Pasan las semanas y el vídeo queda en la carpeta. Un día, un rival te roba un balón por la misma razón. Esa noche, mandas un mensaje al analista: «Empezamos mañana»."),
      o("c", "Contestar que tu instinto vale más que cualquier gráfico", "Defender tu forma de jugar", { moral: 2, rel_entrenador: -2, flags: { ct_analista: "instinto" } }, "El analista asiente sin discutir. A los tres meses, te muestra un vídeo de los rivales que te esperan siempre por la izquierda. «No te lo digo para convencerte —dice—. Solo para que lo veas»."),
    ]),
  S("ct-analista-resultado", "cuerpo", { after: [after("ct-analista", "a", 3, 30)] }, "partido",
    "Un rival te espera por la izquierda y tú aparece por la derecha",
    "Estás en el minuto 74 de un partido igualado. Recibes de espaldas, con un central pegado y la grada pidiendo algo. Antes de controlar, tu cabeza gira, por primera vez en años, hacia el lado contrario. El central, que llevaba la mirada fija en la izquierda, se queda a medio paso. Controlas, giras y te encuentras con medio campo libre por delante. Es una jugada pequeña, de las que nadie nota. Salvo tú.",
    [
      r("a", "Acelerar y tirar a puerta", "Aprovechar el hueco", 0.55, "El disparo entra cruzado, junto al palo. Cuando miras al banquillo, el analista, con el portátil en las rodillas, levanta un pulgar silencioso. Esa noche te escribe: «Esto es lo que vimos en el vídeo». Y marcas con una sonrisa que no se te quita.", { moral: 8, fama: 3, rel_entrenador: 3, media: 1 }, "El tiro sale desviado, pero la jugada ha sido buena y el míster lo reconoce: «Esa decisión es nueva». Aunque el gol no llega, la confianza que ganas vale más.", { moral: 3, rel_entrenador: 2 }, "forma"),
      o("b", "Dar un pase al compañero libre por el otro lado", "Asociarte", { moral: 5, rel_vestuario: 3, rel_entrenador: 3 }, "Tu pase deja al extremo solo ante el portero. El gol es suyo, el mérito, compartido. En la celebración, te señala con las dos manos. El míster apunta algo en su libreta con un círculo."),
    ]),
  S("ct-porteros", "cuerpo", { minAge: 17, positions: ["Delantero", "Centrocampista"], clubTurns: [3, 400], notFlags: ["ct_porteros"] }, "entrenamiento",
    "El entrenador de porteros te pide que le tires cuarenta balones a solas",
    "Es un hombre de cincuenta años, con una barba cuidada y unos reflejos que no corresponden a su edad. Te lleva al campo vacío, con un saco de balones. «Tira a donde quieras. Yo no voy a dejar pasar ni uno». Sonríes, incrédulo. A los diez disparos, sientes cómo se te encoge el orgullo: ha parado nueve. «Ahora que sabes cómo piensa un portero, juguemos de verdad», dice.",
    [
      o("a", "Aprender de él y preguntarle cómo te lee", "Hacerte sabio", { forma: 2, moral: 4, rel_entrenador: 2, flags: { ct_porteros: "aprendo" } }, "Te explica cómo ve tus hombros, tu pie de apoyo, tus miradas. Descubres que en el momento del disparo, lo cuentas todo con el cuerpo. A las dos semanas, empiezas a esconderlo. En el siguiente partido, el portero rival se tira al lado equivocado."),
      o("b", "Pedirle una revancha todos los viernes", "Convertirlo en un duelo", { forma: 1, moral: 5, rel_vestuario: 2, flags: { ct_porteros: "duelo" } }, "Los viernes, tras el entrenamiento, os retáis a diez tiros. Al principio, él gana siempre. A los dos meses, te llevas uno. A los cuatro, empatáis. Cuando finalmente le ganas por primera vez, te lleva a cenar."),
      o("c", "Decirle que tu fuerte no es la finalización y que prefieres trabajar otras cosas", "Esquivar", { moral: -1, flags: { ct_porteros: "no" } }, "Él te mira con ojos de maestro paciente. «Todo delantero que dice eso, es porque tiene miedo de fallar», responde. Te quedas pensando. Dos semanas después, vuelves."),
    ]),
  S("ct-medico", "cuerpo", { minAge: 17, clubTurns: [3, 400], notFlags: ["ct_medico"] }, "vestuario",
    "Escondes una molestia al médico y el médico lo nota al primer vistazo",
    "Es en el último ejercicio de la mañana. Una molestia en el aductor, de esas que se sienten al arrancar y se olvidan al calentar. Lo disimulas con una carrera algo más corta, un giro menos brusco. Lo sabe el médico desde la banda, que no deja de mirarte. En el vestuario, mientras te cambias, se sienta a tu lado y dice: «Enséñame esa pierna». Sin preguntas. Sin reproches.",
    [
      o("a", "Decirle la verdad y ponerte en sus manos", "Ser sincero", { forma: 2, rel_entrenador: 3, reputacion: 3, moral: 1, flags: { ct_medico: "verdad" } }, "El médico palpa, asiente, y receta tres días de tratamiento y reposo parcial. «Lo has dicho a tiempo —dice—. Si lo llegas a aguantar, serían tres semanas». Duele menos la derrota de ser sincero que la de callar."),
      r("b", "Insistir en que estás bien y jugar el domingo", "Aguantar", 0.45, "El domingo, el aductor responde sin una queja. Juegas noventa minutos y marcas. El médico, desde la banda, te observa con un gesto de duda. «Tienes suerte», dice al final. Una de esas veces en que la apuesta sale bien.", { moral: 5, rel_entrenador: 1, flags: { ct_medico: "gano" } }, "En el minuto 38, el muslo se rompe con un chasquido seco. Son cuatro semanas de baja. El médico, sin decir «te lo dije», te envuelve el muslo en hielo. Te mira. Hay decepción en esos ojos.", { moral: -8, forma: -4, rel_entrenador: -3, flags: { ct_medico: "lesion", coach_bench: "3" } }, "forma"),
    ]),
  S("ct-utillero-balon", "cuerpo", { minAge: 19, clubTurns: [6, 400], notFlags: ["ct_utillero_balon"] }, "vestuario",
    "El utillero te da el balón de tu primer gol, que llevaba años guardando",
    "Es un martes cualquiera, tras el entrenamiento. El utillero, con la gorra del club y las manos negras de grasa, te llama con un gesto discreto. Abre un armario del fondo, rebusca entre botas viejas y saca una bolsa de plástico. Dentro, un balón desgastado, con la pintura de la costura agrietada y una fecha en rotulador: la de tu primer gol. «Lo recogí yo —dice—. Nadie se acordaba. Yo, sí».",
    [
      o("a", "Abrazarle con las dos manos y dedicarle un agradecimiento sincero", "Devolverle el gesto", { moral: 9, rel_vestuario: 6, reputacion: 4, flags: { balon_primer_gol: true, ct_utillero_balon: "abrazo" } }, "Le agradeces de corazón. Él, abochornado, murmura que «eso no es nada». Esa noche, en casa, pones el balón en una estantería con una pequeña luz. Un día, se lo enseñarás a tus hijos o a tu sobrino, y le contarás el nombre de quien lo guardó."),
      o("b", "Pedirle que lo firmen todos los compañeros y devolverlo al armario", "Hacerlo del vestuario", { moral: 7, rel_vestuario: 8, flags: { balon_primer_gol: true, ct_utillero_balon: "firmas" } }, "El balón pasa de mano en mano durante una semana. Veinticinco firmas, una frase del capitán y un dibujo del portero. Al volver, parece una obra de arte infantil. El utillero lo guarda con más cuidado que nunca."),
      o("c", "Decirle que mejor lo guarde él, que está más seguro", "Dejarlo en sus manos", { moral: 5, rel_vestuario: 2, flags: { balon_primer_gol: "utillero", ct_utillero_balon: "guarda" } }, "El utillero sonríe, orgulloso. «Si cuando te retires lo quieres, aquí estará», dice. Y así es. En tu despedida, será la primera persona que suba a darte la mano con él en la otra."),
    ]),
  S("ct-conductor", "cuerpo", { minAge: 17, clubTurns: [3, 400], notFlags: ["ct_conductor"] }, "vida",
    "El conductor del autobús del equipo te da un consejo de vida entre curvas",
    "Se llama Anselmo, tiene sesenta y dos años, una gorra con el escudo del club y una voz grave que se oye en todos los asientos. Cada viaje, a las siete de la mañana, lleva el autobús como si fuera un piano. Esta noche, de regreso, en una parada para repostar, te mira por el espejo: «Chaval, llevo cuarenta años viendo jugadores. Los que llegan lejos no son los mejores. Son los que se levantan». Se vuelve a mirar la carretera.",
    [
      o("a", "Sentarte a su lado en el siguiente viaje para escuchar más", "Pedirle más sabiduría", { moral: 6, reputacion: 3, flags: { ct_conductor: "escucho" } }, "El resto del viaje, Anselmo te cuenta historias de leyendas que olvidaron levantarse, y de chavales anónimos que se levantaron cien veces. Llegas al hotel con la sensación de haber estudiado un máster. «Gracias, Anselmo», dices. «De nada, chaval»."),
      o("b", "Agradecerle y regalarle una camiseta firmada", "Un gesto de cariño", { moral: 5, reputacion: 2, rel_vestuario: 2, patrimonio: -30, flags: { ct_conductor: "camiseta" } }, "Anselmo la cuelga en el salpicadero, junto a un rosario y una foto de su nieto. En los viajes siguientes, cada vez que te ve, toca la camiseta con dos dedos. Es su forma de decir «buenas»."),
      o("c", "Asentir sin darle más vueltas y dormirte con los auriculares", "No hacer caso", { moral: 0, flags: { ct_conductor: "paso" } }, "Esa noche dejas el autobús sin una palabra. Años después, en una mala racha, recordarás exactamente la frase. Y sabrás de quién era."),
    ]),
  S("ct-cocinero", "cuerpo", { minAge: 17, clubTurns: [3, 400], notFlags: ["ct_cocinero"] }, "vestuario",
    "El cocinero del club pone una paella en el menú y revoluciona al vestuario",
    "Sale de la cocina con un delantal y una paellera de un metro de ancho. «Hoy es domingo —anuncia—. Y los domingos se come paella». El nutricionista, que lo ve desde una mesa, palidece. El vestuario entero, en cambio, se queda mirando, con los ojos brillantes, como niños ante un pastel. El cocinero sirve una ración a cada uno. Tú pruebas un bocado. Es el mejor de tu vida.",
    [
      o("a", "Pedirle la receta y ayudarle a preparar la siguiente", "Meter las manos", { moral: 6, rel_vestuario: 4, flags: { ct_cocinero: "ayudo" } }, "Pasas el sábado con el cocinero, aprendiendo la proporción del arroz y el secreto del sofrito. Cuando sirves tu primera paella, el vestuario aplaude, el nutricionista, con cara de póker, se sirve un trozo."),
      o("b", "Comer dos raciones y pagarlo en el entrenamiento", "Disfrutar sin remordimientos", { moral: 6, forma: -1, rel_vestuario: 3, flags: { ct_cocinero: "dos" } }, "Al día siguiente, el preparador te hace correr el doble. «Tú sabrás por qué», murmura. Lo sabes. Y repetirías."),
      o("c", "Comer lo justo y dar las gracias al nutricionista por su paciencia", "Con medida", { forma: 1, moral: 2, reputacion: 2, flags: { ct_cocinero: "medida" } }, "El nutricionista, agradecido, te regala un cuaderno de menús. Tú agradeces. Piensas que, a veces, la sabiduría es saber cuándo parar."),
    ]),
  S("ct-ayudante-joven", "cuerpo", { minAge: 24, clubTurns: [4, 400], notFlags: ["ct_ayudante"] }, "vestuario",
    "El nuevo ayudante del míster es tu antiguo compañero de cantera",
    "Entra con un chándal nuevo, una libreta bajo el brazo y una sonrisa que reconocerías entre mil. Es Chus, con el que compartiste habitación en la residencia, el que roncaba como un tractor y te copiaba los deberes. El vestuario no sabe nada. Cuando os cruzáis en el pasillo, él hace un gesto de silencio con un dedo. Y tú, que tenías doscientas cosas que decirle, te quedas sin palabras.",
    [
      o("a", "Quedar con él a solas y ponerte al día de todo", "Reencontrarte", { moral: 8, reputacion: 3, flags: { ct_ayudante: "amigo" } }, "Os veis en una cafetería a las diez de la noche. Habláis de la residencia, de los que se fueron, de los que siguen. «Nunca pensé que llegaría hasta aquí», dice él. «Yo tampoco», respondes. Os reís hasta que el camarero os echa."),
      o("b", "Mantener la relación profesional y esperar a que él dé el paso", "Con respeto", { moral: 3, reputacion: 3, flags: { ct_ayudante: "profesional" } }, "Esperas. Una tarde, tras el entrenamiento, Chus te alcanza: «Ahora ya puedo hablarte como a un amigo». Lo hace. Y es la conversación más natural en años."),
      o("c", "Contárselo a todo el vestuario con una broma pesada", "Hacerle una novatada", { rel_vestuario: 5, moral: 4, rel_entrenador: -1, flags: { ct_ayudante: "novatada" } }, "Cuentas que roncaba como un tractor. El vestuario lo bautiza «el tractor». Chus, abochornado, te mira con una mezcla de risa y rabia. «Esto te lo cobro cuando seas capitán», dice. Pero se queda con el mote con orgullo."),
    ]),
  S("ct-medico-cansancio", "cuerpo", { minAge: 19, forma: [0, 60], clubTurns: [4, 400], notFlags: ["ct_cansancio"] }, "vida",
    "Un análisis de sangre revela que llevas semanas agotado sin saberlo",
    "Es una revisión rutinaria, de las que se hacen sin demasiada atención. El médico revisa los resultados, frunce el ceño y vuelve a revisarlos. «Tienes unos niveles de hierro muy bajos —dice—. Y de vitamina D, también. No es una enfermedad. Es agotamiento». Te quedas pensando en las semanas con las piernas pesadas y la cabeza espesa. Todo cobra sentido.",
    [
      o("a", "Seguir al pie de la letra el plan de recuperación", "Cuidarte de verdad", { forma: 5, moral: 4, reputacion: 2, flags: { ct_cansancio: "cuido" } }, "En tres semanas, tu cuerpo responde. Cada mañana, te sientes un poco menos plomizo. En el campo, ves más rápido, corres con más ganas. El médico, al ver tus nuevas cifras, te estrecha la mano: «Eso es disciplina»."),
      o("b", "Pedir al club descansar unos días y desconectar", "Parar", { forma: 4, moral: 4, rel_entrenador: -1, flags: { ct_cansancio: "paro" } }, "El míster accede con una mirada que dice «no te acostumbres». Pasas cuatro días sin balón, durmiendo, comiendo y paseando. Vuelves con otra cara. El vestuario te recibe con aplausos."),
      o("c", "Seguir como siempre: ya se te pasará", "Ignorarlo", { forma: -3, moral: -2, flags: { ct_cansancio: "ignoro" } }, "Los siguientes partidos son un calvario. A los dos meses, una lesión muscular te recuerda lo que el análisis te dijo. El médico, serio, dice: «El cuerpo siempre cobra»."),
    ]),
  S("ct-director-cantera", "cuerpo", { minAge: 21, clubTurns: [6, 400], notFlags: ["ct_dir_cantera"] }, "vida",
    "El director de la cantera te invita a ver entrenar a los chavales y te pide un favor",
    "Es un viernes por la tarde, en un campo con hierba más verde que el del primer equipo. Los chavales, de trece a dieciséis años, entrenan con una seriedad conmovedora. El director, con una sudadera del club, te señala a uno: «Aquel de la camiseta amarilla. Tiene algo. Pero ha perdido la ilusión». Te mira de reojo: «¿Le echarías una mano?».",
    [
      o("a", "Hablar con el chaval y contarle tu experiencia", "Ser un referente", { moral: 7, reputacion: 6, rel_aficion: 2, flags: { ct_dir_cantera: "hablo" } }, "Le cuentas cómo casi lo dejas a los quince. Él te escucha con los ojos muy abiertos. Una semana después, el director te manda un mensaje: «Ha vuelto a entrenar con ganas». Un año después, ese chaval te pedirá un autógrafo con orgullo."),
      o("b", "Entrenar con el grupo un día y compartir sesión", "Entrar en el campo", { moral: 8, forma: 1, reputacion: 4, flags: { ct_dir_cantera: "entreno" } }, "Pasas dos horas con ellos. Les haces rondos, juegas partidillos, bromeas. Al final, un crío te dice: «Eres mejor jugando que en la tele». Hay un aplauso generoso. El chaval de amarillo sonríe por primera vez."),
      o("c", "Decir que no tienes tiempo y proponer que lo haga otro", "Evitar el compromiso", { moral: -1, flags: { ct_dir_cantera: "no" } }, "El director, comprensivo, asiente. Meses después, el chaval deja el fútbol. Te enteras por una nota breve. No sabrás nunca si habrías podido evitarlo."),
    ]),
];
