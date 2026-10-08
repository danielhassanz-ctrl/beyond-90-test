/**
 * Noches europeas y viajes: la víspera en una ciudad que no conoces, el hotel con un nombre
 * impronunciable, el rival que te regala algo antes del partido. Solo para clubes que juegan
 * en Europa, con pequeñas consecuencias en el vestuario y en tu cabeza.
 */
import { S, o, r } from "../dsl";
import type { BankScene } from "../types";

export const EUROPA: BankScene[] = [
  S("eu-victoria-ciudad", "europa", { minAge: 17, clubLevels: ["grande", "europeo"], clubTurns: [3, 400], notFlags: ["eu_ciudad"] }, "vida",
    "La víspera en una ciudad que no conoces, con una hora libre",
    "Es un vuelo de tres horas y un hotel junto a un río que no sabes pronunciar. Faltan veintiséis horas para el partido de tu vida y el míster os da una hora libre antes de la cena. Hay un puente de piedra, una plaza con palomas y un puesto de castañas. Tus compañeros se dividen: unos descansan, otros salen a hacerse fotos. Tú te quedas quieto en la puerta del hotel.",
    [
      o("a", "Pasear solo por la ciudad como un turista más", "Perderte entre las calles", { moral: 6, rel_aficion: 2, flags: { eu_ciudad: "paseo" } }, "Caminas sin rumbo, con la capucha puesta. Compras unas castañas, te sientas en un banco y miras pasar a la gente. Un niño te dice algo en un idioma que no entiendes, y sonríes. Vuelves al hotel con una paz que nadie te pidió."),
      o("b", "Salir con tres compañeros a hacer turismo", "Hacer grupo", { rel_vestuario: 6, moral: 5, forma: -1, flags: { eu_ciudad: "grupo" } }, "Os perdéis en un mercadillo, compráis bufandas absurdas y os hacéis una foto con una estatua. Cuando volvéis, el míster os mira y sonríe: «Veo que habéis recargado». Lo habéis hecho."),
      o("c", "Quedarte en la habitación estudiando al rival", "Concentración total", { forma: 2, rel_entrenador: 3, moral: 0, flags: { eu_ciudad: "estudio" } }, "Revisas vídeos hasta las diez. Cuando bajas a cenar, tu cabeza está llena de movimientos del rival. En el partido, adivinas tres pases. El míster te lo agradece con una mirada. No hace falta más."),
    ]),
  S("eu-regalo-rival", "europa", { minAge: 18, clubLevels: ["grande", "europeo"], clubTurns: [3, 400], notFlags: ["eu_regalo"] }, "vestuario",
    "Un jugador del equipo rival te deja un regalo en la puerta del hotel",
    "Es un paquete envuelto en papel de periódico del país, con una nota escrita en inglés: «Mañana nos veremos en el campo. Hoy, que comas bien». Dentro hay una caja de dulces típicos y una camiseta firmada del rival. El utillero la huele con sospecha. El míster levanta una ceja: «¿Será una trampa?». Todos te miran.",
    [
      o("a", "Aceptar el regalo y mandarle uno de vuelta", "Corresponder", { reputacion: 5, moral: 4, rel_vestuario: 2, flags: { eu_regalo: "corresponde" } }, "Le mandas una camiseta tuya con una nota: «Que gane el mejor». Al día siguiente, os dais la mano en el túnel. El partido es durísimo, pero limpio. Al final, os abrazáis. Así se gana el respeto de un rival."),
      o("b", "Probar los dulces con todo el vestuario por si acaso", "Tomártelo con humor", { rel_vestuario: 6, moral: 5, forma: -1, flags: { eu_regalo: "dulces" } }, "Os los comparten, medio con miedo, medio con ganas. Están buenísimos. El utillero, que los probó el primero, dice: «No pasa nada». Tres horas después, el rival aparece con otra caja. «Para los suplentes», dice."),
      o("c", "Devolver el regalo sin abrirlo por precaución", "Prudencia", { reputacion: 1, moral: -1, flags: { eu_regalo: "devuelto" } }, "Lo devuelves con una nota formal. El rival, sorprendido, te mira en el túnel con una ceja levantada. No hay hostilidad, pero tampoco calidez. Un partido más, un rival menos."),
    ]),
  S("eu-himno-europa", "europa", { minAge: 17, clubLevels: ["grande", "europeo"], clubTurns: [3, 400], notFlags: ["eu_himno"] }, "especial",
    "Suena el himno de la competición y se te pone la piel de gallina",
    "Lo has oído mil veces por televisión, pero nunca en directo, en el campo, con las dos filas de jugadores sobre el césped y miles de gargantas cantando. Es una melodía que viene de siglos atrás, con coros que se elevan. Notas la espalda recta, las piernas firmes y un vacío extraño en el estómago. A tu lado, un compañero veterano cierra los ojos y aprieta los puños.",
    [
      o("a", "Cerrar los ojos y escuchar cada nota", "Dejarte llevar", { moral: 8, forma: 2, flags: { eu_himno: "ojos" } }, "Cuando los abres, el campo parece más grande. Los colores, más vivos. Juegas con una claridad que no tenías. Después del partido, un periodista te preguntará qué comiste. Y tú dirás: «Himno»."),
      o("b", "Mirar a la grada buscando a tu familia", "Buscar a los tuyos", { moral: 9, rel_aficion: 3, flags: { eu_himno: "familia" } }, "Los localizas en la tercera fila, tu hermano pequeño subido a un asiento. Les haces un gesto discreto. Tu madre se lleva la mano al pecho. Es una de esas imágenes que se quedan fijadas para siempre."),
    ]),
  S("eu-viaje-ruso", "europa", { minAge: 17, clubLevels: ["grande", "europeo"], clubTurns: [3, 400], notFlags: ["eu_frio"] }, "partido",
    "Un partido a veinte bajo cero con unos guantes que no son tuyos",
    "El césped es una pista de hielo y el aire corta las mejillas. El utillero ha repartido guantes, gorros, calentadores y una pomada de olor intenso que, según él, «evita el frío y los pecados». Desde la grada, los hinchas rivales cantan con vapor saliéndoles de la boca. Tú, con dos pares de calcetines, sientes que los dedos de los pies no te obedecen.",
    [
      o("a", "Jugar con todo el abrigo posible y sin quejarte", "Resistir", { forma: 1, moral: 3, rel_entrenador: 3, flags: { eu_frio: "resisto" } }, "Corres con los brazos pegados al cuerpo y la cara medio tapada. En el descanso, el utillero te trae un té caliente. Al final, ganáis 1-0 con un gol tuyo en el 87. Celebras con las manos heladas."),
      o("b", "Quejarte al árbitro del estado del campo", "Reclamar", { rel_entrenador: -2, moral: -1, flags: { eu_frio: "reclamo" } }, "El árbitro, con la barba escarchada, te mira: «Es igual para todos». Te quedas sin respuesta. Juegas peor, y aprendes que hay batallas que no se ganan con quejas."),
      o("c", "Proponer a un compañero un truco: calentar con saltos entre jugadas", "Ingeniarte", { forma: 2, moral: 4, rel_vestuario: 3, flags: { eu_frio: "saltos" } }, "Os pasáis la segunda parte saltando en cada parón. El rival, desconcertado, os mira como si fuerais una banda de ranas. Pero funciona: ninguno se lesiona. El míster lo apunta."),
    ]),
  S("eu-hotel-extrano", "europa", { minAge: 17, clubLevels: ["grande", "europeo"], clubTurns: [3, 400], notFlags: ["eu_hotel"] }, "vestuario",
    "El hotel de la concentración tiene una piscina de olas y una discoteca a las doce",
    "Es un hotel enorme, de los de cinco estrellas con una moqueta que traga ruidos. En el sótano, una discoteca vibra con una música que se cuela por los conductos del aire. A las doce, el míster sube a las habitaciones y comprueba cada puerta con una linterna. Tres jugadores, escondidos bajo las camas, aguantan la risa. El de la habitación 408 estornuda.",
    [
      o("a", "Quedarte en la habitación y dormir con tapones", "Cumplir las normas", { forma: 2, rel_entrenador: 3, moral: 0, flags: { eu_hotel: "duermo" } }, "Con los tapones puestos, duermes como un lirón. Al día siguiente, tres compañeros aparecen con ojeras, y el míster, con una sonrisa fría, pasa lista. Tú juegas fresco y marcas. Aprendes la diferencia entre aguantar y vivir."),
      o("b", "Bajar un rato a la discoteca y volver pronto", "Un momento de risa", { rel_vestuario: 6, forma: -2, rel_entrenador: -3, moral: 4, flags: { eu_hotel: "disco" } }, "Bailas veinte minutos. Cuando vuelves, ves la linterna del míster en el pasillo. Te escondes en el cuarto de baño. Esa noche no duermes. A la mañana siguiente, un compañero te dice: «Valió la pena». Y no sabes si es verdad."),
      o("c", "Convencer a tus compañeros de que vuelvan a sus habitaciones", "Poner orden", { rel_vestuario: 3, rel_entrenador: 4, reputacion: 3, flags: { eu_hotel: "orden" } }, "Subes a por ellos con una excusa. Cuando el míster aparece, todos duermen. «No sé cómo lo has hecho —dice— pero gracias». Esa semana, ganas más confianza que goles."),
    ]),
  S("eu-viejo-estadio", "europa", { minAge: 18, clubLevels: ["grande", "europeo"], clubTurns: [3, 400], notFlags: ["eu_viejo"] }, "especial",
    "Juegas en un estadio con cien años de historia y una grada que suena como un trueno",
    "Es un coliseo de piedra, con bancos de madera y una grada que se levanta casi sobre el césped. Cuando sales, el ruido te golpea el pecho. Las bufandas, los tambores, los cantos de generaciones. Un veterano del equipo, a tu lado, murmura: «Aquí jugaron los mejores». Hay una placa en la pared del túnel con nombres que reconoces. Uno de ellos fue tu ídolo.",
    [
      o("a", "Tocar la placa antes de salir, como una tradición secreta", "Rendir homenaje", { moral: 8, reputacion: 4, flags: { eu_viejo: "placa" } }, "Rozas con los dedos el metal frío. Es un gesto instintivo. Un compañero lo ve y lo copia. A los cinco minutos, todo el equipo lo ha hecho. Es una tradición que, sin querer, empiezas tú."),
      o("b", "Salir al campo con los ojos fijos en la grada, memorizando cada detalle", "Absorberlo", { moral: 7, forma: 1, rel_aficion: 2, flags: { eu_viejo: "grada" } }, "Cada rostro, cada bandera. Juegas con una intensidad que desconocías. Cuando acaba, aunque perdéis, sientes que ha sido un privilegio."),
      r("c", "Dejarte llevar por el ambiente y tirar a puerta desde lejos", "Una locura", 0.25, "El balón entra por la escuadra, con un estruendo que hace temblar el estadio. Es un gol histórico, en un campo histórico. Los locales, de pie, te aplauden. El mejor gol de tu vida.", { moral: 14, fama: 8, rel_aficion: 6, flags: { eu_viejo: "golazo" } }, "La mandas a la grada, a treinta metros de la portería. Un aficionado rival la coge, la besa y se la lleva. El estadio lo celebra con una ovación. Aprendes a ser humilde.", { moral: -2, rel_aficion: -1, flags: { eu_viejo: "fallo" } }, "fama"),
    ]),
  S("eu-eliminado", "europa", { minAge: 17, clubLevels: ["grande", "europeo"], clubTurns: [3, 400], notFlags: ["eu_elim"] }, "vestuario",
    "Caéis eliminados en el último minuto y nadie quiere subir al avión",
    "Estáis en el túnel, sentados en el suelo, con las botas puestas y la mirada perdida. En el estadio, los locales celebran un gol que llegó en el 93. El delegado, con voz suave, pide que subáis al autobús. Nadie se mueve. Un joven suplente llora con la cabeza entre las rodillas. El capitán, de pie, mira la pared, sin decir nada.",
    [
      o("a", "Sentarte con el suplente y decirle que esto también pasa", "Hacer de hermano mayor", { rel_vestuario: 7, reputacion: 4, moral: -3, flags: { eu_elim: "hermano" } }, "Le pones un brazo sobre los hombros y le cuentas tu peor noche. Él te mira, sin hablar. Cuando por fin se levanta, te susurra: «Gracias». Y sabes que acabas de ganar a alguien para toda la vida."),
      o("b", "Levantarte y animar a todos a subir con la cabeza alta", "Liderar", { rel_vestuario: 5, reputacion: 5, moral: 0, flags: { eu_elim: "lidero" } }, "«Hemos perdido, pero hemos jugado como equipo», dices. El capitán asiente. Uno a uno, os levantáis. El autobús, aunque silencioso, tiene una dignidad nueva."),
      o("c", "Quedarte en el suelo con la cabeza baja y vaciarte por dentro", "Dejar salir el dolor", { moral: -5, forma: -1, flags: { eu_elim: "vacio" } }, "Pasas diez minutos allí. Cuando por fin te levantas, el vestuario está vacío. El utillero, en un rincón, te espera con una toalla. «Mañana saldrá el sol», murmura. Y sabes que no es verdad. Pero lo agradeces."),
    ]),
  S("eu-aficion-viaje", "europa", { minAge: 17, clubLevels: ["grande", "europeo", "modesto"], clubTurns: [3, 400], notFlags: ["eu_afic"] }, "vida",
    "Dos mil aficionados te esperan a las seis de la mañana en el aeropuerto de otra ciudad",
    "Han viajado en autocares, en trenes, en coches compartidos. Llevan bufandas, banderas y un tambor que suena a pesar de la hora. Cuando cruzas la puerta de llegadas, con el sueño en la cara, te reciben con un cántico. Una señora mayor, con una pancarta artesanal, te grita: «¡Gana por mi marido!». Se te hace un nudo en la garganta.",
    [
      o("a", "Saludar a todos uno por uno, aunque tardes", "Bajar a verles", { rel_aficion: 8, moral: 7, reputacion: 3, flags: { eu_afic: "saludo" } }, "Tardas cuarenta minutos en atravesar el pasillo. Firmas bufandas, te haces fotos, abrazas a una señora que llora. El míster, a lo lejos, hace un gesto: «Déjale». Esa noche, sientes que cada gol será por alguno de ellos."),
      o("b", "Hacerles un gesto desde lejos y seguir con el equipo", "Mantener el protocolo", { rel_aficion: 3, moral: 2, flags: { eu_afic: "gesto" } }, "Levantas los brazos con una sonrisa. La gente grita. Un niño, desde arriba de los hombros de su padre, te lanza un beso. Sales en el autobús, con la sensación de que todo ha sido muy rápido."),
    ]),
  S("eu-trofeo-cena", "europa", { minAge: 18, clubLevels: ["grande", "europeo"], flags: ["trofeos"], clubTurns: [3, 400], notFlags: ["eu_cena"] }, "vida",
    "La cena de gala de la competición, con tus ídolos en la mesa de al lado",
    "Es un salón con arañas de cristal, mesas redondas y camareros de guante blanco. En la mesa contigua cenan tres leyendas retiradas, con ese aire sereno de los que ya lo han ganado todo. Uno de ellos, el que fue tu ídolo de niño, te lanza una mirada y levanta la copa. Hay un silencio. Tu agente te susurra: «Ve a saludarle». Tú no sabes si podrás caminar.",
    [
      o("a", "Acercarte a su mesa y presentarte con humildad", "Ir a saludar", { moral: 8, reputacion: 6, fama: 2, flags: { eu_cena: "saludo" } }, "Le das la mano con dos dedos temblorosos. «Eres el chico que ha marcado esa semifinal —dice—. Me gustó cómo lo celebraste». No respiras. Esa noche escribirás en tu cuaderno: «Mi ídolo me dijo que le gustó mi celebración»."),
      o("b", "Levantar tu copa desde tu sitio y sonreír", "Corresponder sin molestar", { moral: 5, reputacion: 3, flags: { eu_cena: "copa" } }, "Os saludáis desde la distancia con un gesto. Es suficiente. Esa copa es un lazo invisible entre dos generaciones. Más tarde, te llega un mensaje con su firma: «Sigue así»."),
      o("c", "Quedarte quieto y mirar el plato, abrumado", "Quedarte sin palabras", { moral: -1, flags: { eu_cena: "mudo" } }, "No te mueves. Cuando levantas la vista, ya se han ido. Pasas el resto de la noche pensando en lo que pudo ser. Años después, cuando te toque a ti sentarte en esa mesa, harás lo contrario."),
    ]),
];
