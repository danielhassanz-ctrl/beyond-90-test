import { dec, S, C, P, K, type NewDecision } from "./dsl";

export const GOALKEEPER_NEW: NewDecision[] = [
  dec("El delantero rival se planta solo ante ti y el estadio entero contiene la respiración.", [
    ["Salir a cerrar el ángulo con todo el cuerpo", "Agresivo", 0.4, ["Sales, te haces enorme y el disparo se estrella contra tu pecho. Paradón de portero grande.", S], ["Sales, pero el delantero te la pica por encima. Gol.", C]],
    ["Quedarte en la línea y esperar el disparo", "Confiar en tus reflejos", 0.5, ["Aguantas hasta el último instante y sacas el disparo con la mano cambiada. Lo has leído perfecto.", S], ["El delantero te engaña, la manda al otro palo y no llegas.", C]],
    ["Tirarte a sus pies para quitarle el balón", "Lo arriesgas todo", 0.3, ["Te lanzas a sus pies y le robas el balón limpio. El estadio aplaude de pie.", S], ["Le derribas dentro del área. El árbitro señala penalti.", P]],
  ]),
  dec("Un centro bombeado cae en tu área pequeña, con varios cuerpos saltando a la vez.", [
    ["Salir a por todas y atrapar el balón", "Dominar tu área", 0.45, ["Sales con fuerza, te elevas por encima de todos y atrapas el balón con las dos manos. Sin discusión.", S], ["Calculas mal la salida y el balón cae a los pies del delantero. Gol.", C]],
    ["Despejar con los puños sin pensarlo", "La seguridad por delante", 0.58, ["Despejas con los puños y el balón se va a la banda. Peligro anulado.", S], ["Los puños no llegan y el rival remata con comodidad.", C]],
    ["Quedarte bajo palos y cubrir tu línea", "No arriesgar", 0.5, ["Te quedas en el sitio y atrapas el remate con una estirada espectacular.", S], ["Te quedas clavado al suelo y el remate se cuela por el palo corto.", C]],
  ]),
  dec("El rival lanza un penalti y tienes que decidir hacia qué lado tirarte.", [
    ["Tirarte a tu izquierda", "Una apuesta de instinto", 0.3, ["Te tiras a tu izquierda y atrapas el penalti con las dos manos. Eres un héroe.", S], ["Te tiras al lado equivocado. Gol.", C]],
    ["Esperar hasta el último momento y tirarte", "Leer su carrera", 0.34, ["Lees su carrera, te tiras en el último instante y la sacas con la punta de los dedos.", S], ["Esperas y el rival la cruza por el otro lado.", C]],
    ["Hablar con él y ponerle nervioso", "Una jugada psicológica", 0.28, ["Le dices algo al oído, el rival duda y la manda al poste. Fallado.", S], ["El rival ni te mira, la coloca bien y marca.", C]],
  ]),
  dec("Un tiro lejano viene directo hacia ti, con efecto y a mucha velocidad.", [
    ["Blocar el balón con los dos puños", "Seguridad", 0.55, ["Blocas con fuerza y el balón se queda controlado. Una parada limpia.", S], ["El balón se te cuela entre las manos y se mete dentro. Horror.", C]],
    ["Intentar atraparlo con las dos manos", "Un gesto de confianza", 0.4, ["Atrapas el balón con una seguridad de oro. No hay rechace, no hay peligro.", S], ["El efecto te engaña y el balón rebota hacia el delantero.", C]],
    ["Despejar a córner con una mano", "Cortar el peligro", 0.62, ["Despejas con la palma, la mandas a córner y evitas el rechace. Lo haces parecer sencillo.", S], ["No llegas a tiempo y el balón se cuela por la escuadra.", C]],
  ]),
  dec("Un contragolpe rival deja a su delantero en un mano a mano con el central, y tú tienes que decidir cuándo salir.", [
    ["Salir fuera del área para cortar con el pie", "Un barredor", 0.4, ["Sales fuera del área, cortas el balón con un pie de futbolista. La grada se rinde.", S], ["Te pasas de revoluciones y el delantero te regatea.", C]],
    ["Quedarte bajo palos y esperar el remate", "La opción prudente", 0.55, ["Esperas, el delantero chuta y te lanzas con una estirada magnífica. Parada del partido.", S], ["El remate es potente y rastrero. Te llega tarde. Gol.", C]],
    ["Gritar a tu defensa para que cierre antes", "Organizar la línea", 0.5, ["Tu grito hace reaccionar al central, que corta la jugada. El mejor cierre es el que se organiza.", S], ["Tu grito llega tarde y el delantero ya está solo.", C]],
  ]),
  dec("Un jugador rival lanza un disparo a bocajarro tras un rechace y apenas tienes tiempo de reaccionar.", [
    ["Intentar un paradón de reflejos", "Puro instinto", 0.34, ["Estiras las manos y rechazas el balón con una parada milagrosa. Aún no sabes cómo.", S], ["El balón pasa tan rápido que ni te mueves. Gol.", C]],
    ["Cerrar el ángulo con el cuerpo", "Hacerte grande", 0.5, ["Te haces grande y el balón se estrella contra ti. Un portero muro.", S], ["Te quedas pequeño: el balón entra entre tu pierna y el poste.", C]],
    ["Lanzarte a las piernas del rival", "Una apuesta extrema", 0.28, ["Te lanzas a sus pies y bloqueas el disparo con la cara. Se te oye gritar de dolor, pero lo has parado.", S], ["Chocas con el rival antes de que chute: penalti.", P]],
  ]),
  dec("Tu defensa te hace un pase atrás con un rival presionando y no tienes mucho tiempo.", [
    ["Despejar de primeras al lateral", "Seguridad", 0.7, ["Despejas con el pie hacia la banda. El rival se queda a medias.", S], ["El despeje sale flojo y el rival lo recoge a su favor.", C]],
    ["Controlar y sacar jugando con el pie", "Un portero moderno", 0.4, ["Controlas con el pie, te zafas del rival y sacas jugando al lateral. El estadio aplaude.", K], ["Controlas mal y el rival te roba el balón delante de la portería.", C]],
    ["Sacar largo al delantero con una volea", "Directo", 0.45, ["Tu volea desde el área vuela cuarenta metros y deja al delantero solo. Qué pase.", K], ["El pase sale mordido y el rival lo recoge.", C]],
  ]),
  dec("Un córner en contra: la defensa se organiza y el balón viaja directo a la zona del primer palo.", [
    ["Salir a puñetazos y despejar", "Ir a por todas", 0.5, ["Sales con decisión y despejas con los puños con autoridad.", S], ["Sales, pero un rival se interpone y remata a puerta vacía.", C]],
    ["Atrapar el balón con las manos", "Valentía", 0.42, ["Subes alto y atrapas el córner sin rechace. Una salida de portero de manual.", S], ["Se te cae el balón al suelo y el delantero remata.", C]],
    ["Quedarte en la línea y esperar", "Confiar en tus defensas", 0.5, ["Esperas y tu defensa corta el centro de cabeza. Gran trabajo en equipo.", S], ["El rival cabecea y no llegas a la estirada.", C]],
  ]),
  dec("Un jugador rival te hace una falta evidente al salir a un balón dividido y se queda tendido en el suelo.", [
    ["Pedir al árbitro que pite falta", "Reclamar con vehemencia", 0.5, ["El árbitro pita falta a tu favor y te permite sacar con calma.", K], ["El árbitro no pita y el jugador sigue. Sigue el partido.", C]],
    ["Seguir con el balón y sacar rápido", "Aprovechar el despiste", 0.4, ["Sacas rápido con la mano, el rival aún está en el suelo y lanzas una contra a velocidad.", K], ["Sacas, pero el árbitro pita falta por el tiempo perdido.", C]],
    ["Ayudar al rival a levantarse", "Una muestra de deportividad", 0.8, ["Le das la mano y el estadio entero te aplaude. Tu fair play se recuerda.", K], ["Le ayudas, pero la jugada continúa y se aprovechan de ti.", C], { rel_aficion: 3, reputacion: 2 }],
  ]),
  dec("Te llega un disparo cruzado y raso, pegado al palo, que va a entrar si no te estiras al máximo.", [
    ["Estirarte con toda la longitud de tu cuerpo", "Llegar donde nadie llega", 0.42, ["Te lanzas, estiras el brazo y desvías el balón a córner con la punta de los dedos. Parada de las que hacen historia.", S], ["Te estiras, pero el balón queda un palmo más allá. Gol.", C]],
    ["Colocarte bien para quitar el ángulo", "Anticiparte", 0.55, ["Estabas ya donde tenías que estar. El balón te da en la mano y sale a córner.", S], ["Llegas tarde y el balón se cuela por el palo.", C]],
    ["Confiar en el defensa que cubre el palo", "Delegar", 0.3, ["Tu defensa despeja el balón en la línea. Un trabajo en equipo digno de mención.", S], ["Tu defensa no llega y el balón entra.", C]],
  ]),
  dec("Un delantero rival se te acerca por detrás en un córner y te agarra del cuello para impedir tu salida.", [
    ["Zafarte y salir al balón con fuerza", "Imponerte", 0.45, ["Te lo quitas de encima con el hombro y atrapas el balón con las dos manos.", S], ["No te sueltas del todo y el balón se cuela por encima de tu cabeza.", C]],
    ["Pedirle al árbitro que pite falta", "Reclamar", 0.4, ["El árbitro, atento, ve el agarrón y pita falta en ataque. Un respiro.", K], ["El árbitro lo deja seguir y el rival remata solo.", C]],
    ["Dejar de salir y quedarte bajo palos", "No complicarte", 0.5, ["Te quedas en la línea y atrapas el remate sin mayor problema.", S], ["Te quedas bajo palos pero el remate te supera. Gol.", C]],
  ]),
  dec("Estás a punto de sacar de puerta y ves a tu delantero solo en la banda, pero un rival le marca de cerca.", [
    ["Sacar largo a la cabeza del delantero", "Un balón largo y directo", 0.45, ["Tu saque vuela cuarenta metros y el delantero baja el balón con el pecho. Tu equipo respira.", K], ["El saque sale mordido y el rival lo recoge.", C]],
    ["Sacar corto a un defensa", "Salir jugando", 0.58, ["Sacas corto y el equipo se organiza. Una salida de balón tranquila y limpia.", K], ["El pase sale flojo y un rival lo roba en zona peligrosa.", C]],
    ["Esperar un poco y buscar otro apoyo", "Jugar con calma", 0.5, ["Esperas, el equipo se mueve y encuentras una línea de pase limpia.", K], ["Esperas demasiado, el árbitro te amonesta por perder tiempo.", C]],
  ]),
  dec("Un jugador rival se lanza a por un balón dividido y chocas con él al salir, a punto de pitarse algo.", [
    ["Decir al árbitro que fue limpio", "Defender tu entrada", 0.45, ["El árbitro lo ve igual que tú y dice «sigan». Respiras aliviado.", S], ["El árbitro lo ve diferente y señala penalti. Maldición.", P]],
    ["Quedarte en el suelo, aparentando dolor", "Un pequeño teatro", 0.35, ["El árbitro, convencido de que el rival fue más violento, pita falta a tu favor. Un truco de viejo zorro.", S], ["El árbitro no cae en la trampa y sigue el juego. Te tienes que levantar.", C]],
    ["Levantarte y seguir como si nada", "Profesionalidad", 0.6, ["Te levantas con la mano en alto y el árbitro asiente. Todo continúa sin pitar nada.", S], ["Te levantas, pero el rival ya ha rematado a puerta vacía.", C]],
  ]),
];
