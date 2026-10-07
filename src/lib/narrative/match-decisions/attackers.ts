import { dec, G, W, A, M, MB, K, F, B, type NewDecision } from "./dsl";

export const ATTACKER_NEW: NewDecision[] = [
  dec("El balón cae botando en la frontal tras un despeje, justo a la altura de tu pierna buena.", [
    ["Pegarle de volea sin dejarla caer", "Todo o nada con la pierna buena", 0.34, ["La golpeas con el alma y el balón se clava en la escuadra antes de que el portero vea de dónde viene. ¡Golazo!", W], ["La golpeas con rabia y se marcha a la grada, tres metros por encima del larguero.", M]],
    ["Controlarla de pecho y perfilarte", "Un segundo más para decidir mejor", 0.55, ["Bajas el balón con el pecho, giras la cadera y la cruzas junto al palo. Gol de manual.", G], ["El control se te escapa un metro y el central llega a despejar.", MB]],
    ["Dejarla de cabeza para el que llega", "Servir antes que rematar", 0.58, ["La bajas con la cabeza justo a la carrera del mediocentro, que no perdona. Asistencia de lujo.", A], ["La cabezada sale larga y el balón muere en la banda.", MB]],
  ]),
  dec("Falta frontal, tres pasos fuera del área, y todo el equipo te mira a ti.", [
    ["Tirarla por encima de la barrera", "Buscar la escuadra con efecto", 0.28, ["Cae justo por detrás de la barrera, se doblada de golpe y se mete por la escuadra. Es un misil.", W], ["Roza la barrera y se marcha a córner. Casi.", M]],
    ["Pegarle raso por el hueco de la barrera", "Pillar al portero adelantado", 0.34, ["La clavas pegada al palo, tan raso que el portero ni se tira. Gol.", G], ["Se la queda el portero con las dos manos, sin apuros.", M]],
    ["Tocarla corta para un compañero desmarcado", "La jugada ensayada", 0.55, ["La jugada ensayada sale de libro: toque corto, remate de otro. Tú solo has puesto el pase.", A], ["La barrera rompe y el rival se lleva el balón en una contra peligrosa.", MB]],
  ]),
  dec("Tu marcador te agarra de la camiseta en pleno desmarque, a la vista de todos, y el árbitro mira hacia otro lado.", [
    ["Aguantar el agarrón y seguir a lo tuyo", "No regalar nada", 0.42, ["Te zafas con un tirón de hombro, recibes el pase y la mandas dentro. Cuando te gira, el central ya no te ve.", G], ["Te frena justo lo suficiente: el pase llega pasado y el balón se va fuera.", M]],
    ["Dejarte caer y reclamar penalti", "Una pequeña dosis de teatro", 0.34, ["El árbitro pita. Penalti. Lo tiras con serenidad mientras el estadio protesta o aplaude.", G], ["El árbitro te enseña la amarilla por simular. Qué vergüenza.", F]],
    ["Girarte y exigirle el balón al compañero", "Quitártelo de encima con la palabra", 0.5, ["Das un grito, el pase llega a tiempo y te quedas sin marca. Lo resuelves con calma.", G], ["Pides el balón a gritos pero el pase no llega y el central te vuelve a atrapar.", MB]],
  ]),
  dec("Contragolpe a tres contra dos: corres con dos compañeros a los lados y solo un central en medio.", [
    ["Abrir al compañero de la derecha", "Fiarte del que viene a tope", 0.58, ["Le sirves el balón en bandeja y el delantero lo mete de primeras. Tu pase vale un gol.", A], ["El pase sale demasiado fuerte y se va por la línea de fondo.", MB]],
    ["Abrir a la izquierda y seguir corriendo", "Dos pases en uno", 0.5, ["Das el pase y recibes la pared. Te quedas sin portero delante: gol.", G], ["El central corta la pared con un pie estirado y el contragolpe se acaba.", MB]],
    ["Encarar tú solo al central", "Asumir el protagonismo", 0.34, ["Regateas al central con un amago de manual y defines con el exterior. Una obra de arte.", W], ["El central te roba el balón sin hacer falta y la jugada muere.", MB]],
  ]),
  dec("Un córner a favor: el balón vuela hacia el segundo palo y tu marcador acaba de perder el rastro.", [
    ["Rematar de cabeza picando al suelo", "Que bote antes del portero", 0.4, ["Cabeceas con una potencia brutal y el balón bota dentro de la portería antes de que el portero reaccione.", G], ["Cabeceas, pero el balón sale alto, sin ángulo.", M]],
    ["Prolongar de cabeza hacia el segundo palo", "Servir antes que rematar", 0.5, ["Prolongas con un toque sutil y un compañero lo empuja en el segundo palo. Tu gol invisible.", A], ["La prolongación se te va larga y sale por la línea de fondo.", MB]],
    ["Atacar el balón con todo el cuerpo", "Sin miedo al choque", 0.3, ["Te lanzas, golpeas con la frente y la mandas dentro. ¡Qué valor!", G], ["El choque con el central te frena y el balón se va fuera.", MB]],
  ]),
  dec("Un centro bombeado cae a tu espalda y no hay tiempo para controlarlo.", [
    ["Intentar una chilena", "El gesto que se recuerda", 0.2, ["Te elevas, te giras en el aire y la pegas con un latigazo que se cuela por la escuadra. Increíble.", W], ["Lo intentas, pero la chilena sale rasa y se pierde por el lateral de la red.", M]],
    ["Girarte y rematar de volea", "Un gesto menos arriesgado", 0.36, ["Te giras en un suspiro y la pegas con la derecha: gol limpio, de los que cuestan hacer.", G], ["El golpeo sale mal, con el exterior, y la manda lejos del arco.", M]],
    ["Controlar con el pecho y asegurar", "Mantener la posesión", 0.58, ["La paras con el pecho, la dejas muerta y ganas un segundo para sacar un buen pase.", K], ["El balón rebota en ti y se va a los pies del rival.", MB]],
  ]),
  dec("Llegas a la línea de fondo con el portero adelantado y un compañero entrando por el segundo palo.", [
    ["Pase de la muerte al segundo palo", "Servir una asistencia", 0.55, ["Pase raso y tenso, el delantero la empuja sin oponentes. Un clásico que funciona.", A], ["El pase se queda corto y un defensa lo corta en el último segundo.", MB]],
    ["Disparar con muy poco ángulo", "Intentar sorprenderle", 0.24, ["Disparas desde un ángulo imposible y el balón se cuela entre el portero y el poste. Gol de pillo.", G], ["El portero ocupa su espacio y desvía a córner.", M]],
    ["Recortar hacia dentro y buscar otro ángulo", "Ganar un metro", 0.4, ["Recortas, abres el ángulo y la mandas a media altura. Gol con mucha técnica.", G], ["Recortas, pierdes el balón en el giro y el portero lo recoge sin esfuerzo.", MB]],
  ]),
  dec("Mano a mano con el portero, pero el ángulo se te cierra por momentos y el defensa te llega por detrás.", [
    ["Picarla por encima del portero", "Delicadeza con riesgo", 0.36, ["Le haces una vaselina perfecta: el balón sube, baja y cae mansamente dentro.", G], ["El portero no se mueve y la atrapa en el aire sin esfuerzo.", M]],
    ["Cruzarla raso, junto al palo largo", "Colocación antes que fuerza", 0.5, ["Cruzas con el interior, firme, y el balón se mete rozando el palo. Lo has hecho mil veces.", G], ["Cruzas, pero demasiado cerca: el portero estira la pierna y la rechaza.", M]],
    ["Regatear al portero y definir a puerta vacía", "La jugada más arriesgada", 0.28, ["Amagas, el portero se lanza y tú ya has pasado. Rematas con la portería vacía. Lo celebran hasta los rivales.", G], ["Te adelantas el balón en el regate y el portero se te echa a los pies.", MB]],
  ]),
  dec("Un compañero te pide la pared en tres cuartos y el lateral rival ya se está adelantando a cortar.", [
    ["Darle la pared y arrancar a toda velocidad", "Un-dos clásico", 0.5, ["Das la pared, el compañero te la devuelve en carrera y te quedas solo delante del portero. Gol.", G], ["El lateral lee la jugada, corta el pase de vuelta y se lleva el balón.", MB]],
    ["Ignorar la pared y cambiar de juego", "Desmarcar al otro lado", 0.55, ["Abres a la banda contraria con un pase largo; el extremo la baja y centra al área. Una jugada de pizarra.", A], ["El cambio de juego sale larguísimo y se pierde en la línea de fondo.", MB]],
    ["Aguantar el balón y esperar a que se descuelgue el lateral", "Un metro más de paciencia", 0.62, ["Esperas, tiras un taconazo y aparece otro compañero libre. Asistencia de listo.", A], ["Te esperas demasiado: te cierran los tres a la vez y te quitan el balón.", MB]],
  ]),
  dec("El central rival duda con el balón al borde de su área y tú vienes lanzado a presionarle.", [
    ["Entrar a robar sin miedo", "Pillar al rival en el fallo", 0.44, ["Le robas el balón con una entrada limpia y te quedas solo con el portero. Gol sin que se enteren.", G], ["Llegas tarde, le haces falta y el árbitro pita.", F]],
    ["Cerrarle la línea de pase y esperar el error", "Presión inteligente", 0.58, ["Le cierras el pase y el central, agobiado, se la regala al mediocentro. Robo limpio y contraataque.", K], ["El central se zafa con un regate y te deja atrás.", B]],
    ["Fingir la presión y dejar que sea tu compañero quien robe", "Engañar al rival", 0.5, ["Finges que vas y el central, nervioso, se la pasa justo al compañero que acechaba. La trampa funciona.", A], ["El central te ve venir y sale con calma. No cae.", K]],
  ]),
  dec("El portero rechaza un disparo flojo y el balón queda muerto en el área, a un metro de ti.", [
    ["Empujarla con el interior sin dudar", "Instinto de goleador", 0.62, ["La empujas con el interior, sin pensarlo, y el balón se hace red. Instinto puro.", G], ["Llegas un segundo tarde: el portero ya se había levantado y se queda con el balón.", M]],
    ["Rematar con fuerza con la derecha", "Buscar el tiro más potente", 0.45, ["Un zambombazo que revienta la red. El portero ni lo ve.", G], ["Pegas con rabia pero el balón sale flojo y va a las manos del portero.", M]],
    ["Ceder el balón al compañero con ángulo libre", "Un gesto generoso", 0.55, ["Se la dejas al compañero con la portería vacía. Gol que firmas con una asistencia.", A], ["La cesión llega rebotada y el defensa despeja.", MB]],
  ]),
  dec("Un balón largo al espacio te deja en carrera con el central, a solo cinco metros de la frontal.", [
    ["Ganarle la carrera con pura velocidad", "Potencia contra pierna", 0.4, ["Aceleras como si tuvieras motor y le sacas medio metro. Plantado ante el portero, defines con calma.", G], ["El central te sujeta del brazo, te frena y el balón sale por la línea.", M]],
    ["Pedirle contacto para sacar falta", "Una picardía antigua", 0.35, ["Notas el empujón, caes y el árbitro pita. Falta peligrosa a favor, en una buena posición.", K], ["Caes demasiado pronto: el árbitro te da la amarilla por exagerar.", F]],
    ["Frenar de golpe y esperar el apoyo", "Cambiar el ritmo", 0.5, ["Frenas y el central, sorprendido, se pasa de largo. Recibes el apoyo y marcas con tranquilidad.", G], ["Frenas pero el apoyo no llega y te quedas aislado.", MB]],
  ]),
  dec("Recibes pegado a la cal y el lateral te espera con las piernas abiertas, esperando el regate.", [
    ["Túnel al lateral y arrancar", "Un gesto de descaro", 0.36, ["Le haces un túnel, te lo llevas por línea de fondo y centras con precisión. Medio estadio lo celebra con un «¡ole!».", A], ["El lateral cierra las piernas, te roba el balón y se lleva la ovación.", MB]],
    ["Recortar hacia dentro y buscar el disparo", "La jugada de siempre", 0.42, ["Recortas, te colocas el balón y la mandas con la zurda a la escuadra. Marcas el gol de la jornada.", G], ["El defensa te lee la intención y bloquea el disparo con el cuerpo.", M]],
    ["Pasar atrás y apoyarte en el lateral propio", "Un juego combinado", 0.58, ["Tocas atrás, el lateral entra en carrera y te devuelve un pase al hueco. Combinación redonda.", A], ["El pase atrás se queda corto y el rival lo intercepta.", MB]],
  ]),
  dec("Sufres falta en la frontal y se arma discusión en el equipo sobre quién la tira.", [
    ["Pedirla tú: llevas una buena racha", "Asumir el riesgo", 0.3, ["La pegas sin dudar: el balón sale por encima de la barrera, baja y entra pegado al palo. Gol de falta directo.", W], ["Pegas con rabia y la mandas a la grada. El capitán te mira con paciencia.", M]],
    ["Dejársela al especialista", "Respetar las jerarquías", 0.5, ["Cedes la falta al especialista, que la mete por la escuadra. Aplaudes la jugada que has provocado tú.", A], ["El especialista la lanza al muro. Vaya jugada.", M]],
    ["Hacer la falta indirecta con un pase corto", "Una jugada ensayada", 0.5, ["Das un pase corto y el compañero que llega a la carrera golpea. Un golazo bien diseñado.", A], ["La jugada ensayada no sale: el muro rompe rápido y sacan el balón.", MB]],
  ]),
  dec("A treinta metros, el balón queda suelto y nadie te presiona: el portero está adelantado.", [
    ["Pegarle de primeras desde lejos", "Un cañonazo sin dudar", 0.2, ["Le das con el alma: el balón sube, baja y se cuela por encima del portero. El estadio se pone de pie.", W], ["Disparas, pero el balón sale por encima del larguero, muy alto.", M]],
    ["Controlar y avanzar unos metros", "Más seguridad", 0.5, ["Avanzas diez metros y tiras a puerta con más ángulo. Gol limpio.", G], ["Avanzas, pero un defensa llega y te roba el balón en el último momento.", MB]],
    ["Pasarla a un compañero mejor colocado", "Jugar en equipo", 0.58, ["Se la das al mejor colocado, que la mete sin problemas. Una asistencia sencilla pero útil.", A], ["Pasas, pero el compañero no esperaba el balón y lo pierde.", MB]],
  ]),
  dec("Tu compañero te deja un balón de tacón en plena área pequeña, sin tiempo para respirar.", [
    ["Empujarla con el interior, sin florituras", "Dejarlo fácil", 0.62, ["Sin florituras, la pones donde el portero no llega. Gol que parece fácil pero no lo es.", G], ["Resbalas al golpear y la mandas fuera.", M]],
    ["Hacer un amago para sentar al defensa", "Un poco de show", 0.36, ["Amagas y el defensa se siente en el suelo. Solo tienes que empujarla con calma.", G], ["El amago te hace perder tiempo y te cierran el espacio.", MB]],
    ["Dar un toque al compañero libre", "Un gesto de desprendimiento", 0.5, ["Con un toque suave, dejas al compañero la portería para él solo. Se lo agradecerá.", A], ["El pase se queda a medias y la defensa despeja.", MB]],
  ]),
  dec("El árbitro añade cinco minutos y el balón te llega a los pies en la última jugada del partido.", [
    ["Rematar de primeras, con todo lo que te queda", "Jugártela en el último suspiro", 0.34, ["En el último segundo, el balón se clava en la red. El estadio explota. Es una noche que no olvidarás.", W], ["Disparas, pero el portero la despeja sobre la bocina. El árbitro pita el final.", M]],
    ["Buscar la falta cerca del área", "Ganar un último tiro", 0.4, ["Provocas la falta justo a la frontal. Habrá una última oportunidad.", K], ["No hay falta. El árbitro mira hacia otro lado y la jugada se acaba.", MB]],
    ["Ceder al compañero libre en la derecha", "Dar la última opción a otro", 0.5, ["La cedes con un pase perfecto y el compañero remata de primeras: golazo en el descuento.", A], ["El pase se va largo. El tiempo se agota.", MB]],
  ]),
  dec("El central gigante del equipo rival te mide casi una cabeza más y salta contigo en un balón aéreo.", [
    ["Anticiparte con una carrera corta", "Ganarle de pillo", 0.4, ["Arrancas medio segundo antes y la cabeceas antes de que él despegue del suelo. Gol de listo.", G], ["Arrancas tarde, te agarra con un brazo y el balón se pierde.", M]],
    ["Fingir el salto y dejarla pasar", "Un truco viejo", 0.45, ["Finges que saltas, el central lo hace y el balón le pasa por encima. Tu compañero lo recoge sin oposición.", A], ["Se la come el central, que despeja sin más.", MB]],
    ["Rematar de cabeza buscando a su espalda", "Juego a la sorpresa", 0.38, ["Giras el cuello y la cabeza te sale perfecta. El portero la ve pasar.", G], ["El choque te desequilibra y la cabeceas sin fuerza.", M]],
  ]),
  dec("Tu compañero filtra un pase y tu desmarque va al borde del fuera de juego, con el línier mirando.", [
    ["Arrancar justo cuando sale el pase", "Perfecto timing", 0.45, ["Arrancas en el momento exacto. El línier baja la bandera, el pase llega y te quedas solo. Gol de matrícula.", G], ["Te adelantas un paso y el línier levanta la bandera.", M]],
    ["Esperar a que el balón salga y luego correr", "Ser prudente", 0.58, ["Esperas medio segundo y corres cuando el balón sale. Estás en juego, y solo frente al portero.", G], ["Esperas demasiado: el defensa cubre y te cierra el hueco.", MB]],
    ["Pedir el balón con la mano levantada y moverte hacia dentro", "Ser el apoyo seguro", 0.62, ["Te ofreces al hueco y recibes. Un toque y a la banda, con tu equipo ganando metros.", K], ["Te marcan de cerca y el balón se pierde.", MB]],
  ]),
  dec("El balón te llega a media altura, con el defensa pegado a tu espalda y poco espacio.", [
    ["Controlar con el pecho y girarte", "Dominio y velocidad", 0.46, ["Controlas con el pecho, te giras de golpe y mandas el balón al fondo. Un movimiento sublime.", G], ["El control te sale rebelde y el defensa te roba el balón.", MB]],
    ["Dejarla de primeras para un compañero", "Una descarga elegante", 0.6, ["La dejas de primeras y tu compañero, libre, define. Solo has tocado el balón una vez.", A], ["La descarga sale blanda y el defensa se la lleva.", MB]],
    ["Cuerpear al defensa y proteger el balón", "Fuerza física", 0.55, ["Pones el cuerpo, resistes el empujón y ganas la falta. Respiras y reordenas al equipo.", K], ["El defensa te vence en el cuerpo a cuerpo y te quita el balón.", MB]],
  ]),
  dec("Ves al portero rival fuera de su área, adelantado, y el balón te cae a treinta y cinco metros de la portería.", [
    ["Intentar el gol de la jornada desde el centro del campo", "Una locura que puede salir", 0.08, ["¡Lo has hecho! El balón vuela sobre el portero y se mete bajo el larguero. Los comentaristas se quedan sin palabras.", W], ["El balón sale lejos y se va por la línea de fondo. Casi.", M]],
    ["Avanzar unos metros y tirar con más garantías", "Más sensato", 0.4, ["Avanzas, sientes que el portero se mueve y la picas por encima. Gol de listo.", G], ["Avanzas, pero un defensa llega a tiempo de bloquear.", M]],
    ["Pasar atrás y mantener la posesión", "No arriesgar", 0.7, ["Pasas atrás con calma y tu equipo respira y reordena. Sin riesgos.", K], ["El pase atrás no llega y el rival aprovecha para contraatacar.", MB]],
  ]),
  dec("Te quedas solo contra el lateral en la banda, con espacio por delante y dos compañeros desmarcándose en el área.", [
    ["Centrar de primeras al punto de penalti", "Un pase al área", 0.5, ["El centro llega medido y el compañero la empuja con la cabeza. Tu asistencia es de las de pizarra.", A], ["El centro se queda corto y el lateral lo intercepta.", MB]],
    ["Encarar al lateral y buscar la línea de fondo", "Desborde y centro raso", 0.42, ["Le ganas la espalda, llegas a línea de fondo y sacas un pase atrás perfecto. Gol de otro.", A], ["El lateral te lee y te roba el balón con una entrada limpia.", MB]],
    ["Recortar hacia dentro y probar con la zurda", "Disparo con rosca", 0.34, ["Recortas, pones el balón en tu pierna buena y la clavas en la escuadra. Qué golazo.", W], ["Recortas pero el disparo sale blando y sin peligro.", M]],
  ]),
  dec("El rival te pisa a propósito y te provoca con una sonrisa delante del árbitro, a punto de saltar tu paciencia.", [
    ["Ignorarlo y seguir jugando", "Mantener la cabeza fría", 0.6, ["Respiras hondo, no dices nada y en la siguiente jugada le ganas el duelo. La mejor respuesta.", K], ["Aguantas pero se te va la concentración y pierdes un balón sencillo.", MB]],
    ["Encararte con él y devolver la provocación", "Defender tu orgullo", 0.3, ["Le dices algo al oído, él se desconcierta y comete un error que te favorece.", K], ["Te pasas de revoluciones: el árbitro te enseña una amarilla y se acerca a avisarte.", F]],
    ["Llamar la atención del árbitro con calma", "Dejar que decida el colegiado", 0.55, ["El árbitro, atento, avisa al rival con una tarjeta. Has ganado la batalla sin ensuciarte.", K], ["El árbitro lo deja pasar y te quedas con la sensación de impotencia.", MB]],
  ]),
  dec("El portero rival y tú vais a por un balón dividido en el borde del área: el que llegue primero decide.", [
    ["Lanzarte a por el balón a toda velocidad", "Ir con todo", 0.4, ["Llegas medio segundo antes y lo desvías con la punta de la bota. Gol de pura garra.", G], ["Chocas con el portero y el árbitro pita falta.", F]],
    ["Frenar y dejar que lo coja el portero", "Evitar el choque", 0.5, ["Frenas, el portero la coge y se te escapa una media sonrisa. Todo en orden.", K], ["Frenas y un defensa aprovecha para despejar a córner.", M]],
    ["Hacer un amago y tocar el balón con el exterior", "Un recurso técnico", 0.32, ["Lo toca con el exterior, el portero se lanza al vacío y tú ya has pasado. Gol de oportunista.", G], ["Fallas el toque, el balón rueda lejos y el portero se queda con él.", M]],
  ]),
  dec("El balón te llega a la pierna menos hábil, con el portero adelantado y la portería casi abierta.", [
    ["Rematar con la pierna mala sin dudarlo", "Confiar en tu entrenamiento", 0.4, ["Con una mala pierna casi buena, metes un gol limpio. Una prueba de las horas extra de entrenamiento.", G], ["Le pegas con un mal toque y el balón sale mordido, flojo y lejos.", M]],
    ["Pasarla a la pierna buena y rematar", "Un toque más", 0.46, ["Pasas a tu pierna buena, te giras y la clavas. Un segundo más, pero el gol es el mismo.", G], ["El toque te sale pesado y el defensa llega a despejar.", MB]],
    ["Dejarla para otro compañero que llega mejor", "Pensar antes de rematar", 0.55, ["Se la dejas a otro compañero en mejor posición. Gol de equipo.", A], ["La pierdes por medio metro y el rival se lleva el balón.", MB]],
  ]),
  dec("Se te escapa el defensa en un rechace y recibes de cara, pero el portero sale como una flecha.", [
    ["Tirar de primeras antes de que cierre el ángulo", "Instinto", 0.42, ["Tiras antes de que llegue. El portero se queda a mitad de camino y el balón se mete por el palo corto.", G], ["Tiras, pero el portero lo cierra con el pecho.", M]],
    ["Esperar a que se tire y marcar a puerta vacía", "Paciencia de cazador", 0.38, ["Esperas medio segundo, el portero se lanza y tú la mandas al otro lado. Muy frío.", G], ["Esperas, pero el portero te lee y no se tira. Te la quita sin esfuerzo.", MB]],
    ["Regatearlo por fuera y buscar el ángulo", "Una jugada con riesgo", 0.3, ["Le dejas pasar de largo y empujas el balón con calma. ¡Qué calidad!", W], ["Te la quita en el regate con una mano y rueda el balón fuera.", MB]],
  ]),
  dec("El partido se ha vuelto trabado y recibes un balón muy lejos de la portería rival.", [
    ["Resguardar la posesión y buscar la falta", "Controlar el ritmo", 0.58, ["Aguantas el balón con el cuerpo, ganas la falta y tu equipo respira. Oficio puro.", K], ["Te lo quitan con una entrada limpia y la contra rival se pone en marcha.", MB]],
    ["Intentar un pase largo a la espalda de la defensa", "Una jugada de riesgo y precisión", 0.35, ["El pase largo cae justo al hueco y tu compañero se queda solo ante el portero. Qué visión.", A], ["El pase sale largo, sin ninguna posibilidad.", MB]],
    ["Retrasar a un compañero y buscar espacios", "Mantener el control", 0.65, ["Retrasas y tu equipo recupera la calma. Es la jugada más aburrida y la más inteligente.", K], ["El pase atrás se queda corto y un rival lo roba.", MB]],
  ]),
  dec("Una falta lateral al área: tu equipo manda un balón colgado con efecto y tú esperas en el segundo palo.", [
    ["Rematar de cabeza picando", "Buscar el gol directo", 0.38, ["Saltas por encima de todos y la cabeza la manda dentro. Un golazo.", G], ["Saltas, pero otro defensa llega antes y despeja.", M]],
    ["Bajarla de cabeza para un compañero", "Una prolongación", 0.5, ["La bajas de cabeza y un compañero la empuja a gol. Tu mérito en la sombra.", A], ["La prolongación sale alta y el portero la atrapa.", MB]],
    ["Fingir el remate y dejarla pasar", "Una trampa para el portero", 0.34, ["Finges rematar, el portero se mueve y el balón sigue hacia el compañero que entra libre. Gol.", A], ["Se la queda el portero, tranquilo, con las dos manos.", MB]],
  ]),
  dec("El míster te grita desde la banda que aceleres: el partido está atascado y el reloj corre.", [
    ["Pedir el balón y asumir la responsabilidad", "Dar un paso al frente", 0.42, ["Recibes y te inventas una jugada en espacio reducido. Gol que rompe el partido.", G], ["Intentas romper la defensa, pero te cierran los tres a la vez.", MB]],
    ["Mover al rival con desmarques sin balón", "Trabajo oscuro", 0.58, ["Con tus movimientos arrastras a dos centrales y dejas hueco para el compañero. Se nota tu trabajo.", A], ["Tus movimientos no sirven de nada: el balón no te llega.", K]],
    ["Probar suerte con un disparo lejano", "Intentar un golpe de efecto", 0.2, ["Un disparo seco y cruzado desde fuera del área. El portero no llega.", W], ["El disparo sale desviado. El míster levanta las manos.", M]],
  ]),
  dec("Recibes de espaldas en la banda con el equipo pidiendo un respiro y dos rivales a punto de cerrarte.", [
    ["Girar con un autopase y salir de la presión", "Un gesto técnico", 0.46, ["Te giras con un autopase y dejas a los dos rivales mirando al cielo. El equipo respira.", K], ["Te ven venir y uno de ellos te roba el balón.", MB]],
    ["Dar un pase atrás sin complicarte", "Seguridad primero", 0.7, ["Un toque sencillo atrás y el equipo recupera el control. Sin brillo, sin riesgo.", K], ["El pase atrás es demasiado flojo y el rival lo corta.", MB]],
    ["Buscar la falta y frenar el juego", "Cortar el ritmo", 0.5, ["Cuerpeas, caes con astucia y el árbitro pita. Has comprado diez segundos de respiro.", K], ["El árbitro no pita y el rival sale a la contra.", MB]],
  ]),
  dec("Estás solo delante del portero y el compañero que te pasa te pide que se la devuelvas para marcar él.", [
    ["Marcar tú, sin pensarlo", "Pensar en el gol", 0.55, ["La mandas dentro sin remilgos. El compañero levanta las manos fingiendo protesta. Todos ríen.", G], ["Fallas por querer ser tú el protagonista. El compañero se lleva las manos a la cabeza.", M]],
    ["Devolverle el balón para que lo marque él", "Un gesto de equipo", 0.62, ["Se la devuelves y él la manda dentro. Se abraza a ti con gratitud.", A], ["Se la devuelves, pero el pase llega mal y el defensa despeja.", MB]],
    ["Hacer un amago y marcar a puerta vacía", "Un poco de show", 0.4, ["Amagas, el portero se tira, y tú empujas con calma. Gol de dibujos animados.", G], ["El amago te hace perder el momento. Te cierran por detrás.", MB]],
  ]),
  dec("En el tramo final, un defensa cansado se queda tirado en el suelo y el balón sigue en juego, libre para ti.", [
    ["Seguir jugando y entrar solo ante el portero", "Aprovechar la ocasión", 0.5, ["Sigues, entras solo ante el portero y la mandas dentro. La grada rival silba, pero el árbitro no ha parado el juego.", G], ["Sigues, pero el árbitro pita porque se ha parado el juego antes. Mala suerte.", M]],
    ["Echar el balón fuera para que atiendan al rival", "Deportividad", 0.8, ["Echas el balón fuera con una sonrisa cortés. El rival se levanta y te da las gracias. La grada, hasta la rival, te aplaude.", K], ["Echas el balón fuera, pero el rival se levanta enseguida y se ríe. Qué listo.", K], { rel_aficion: 3, reputacion: 2 }],
    ["Preguntar al árbitro qué hacer", "Pedir criterio", 0.6, ["El árbitro pita para que atiendan al jugador. Un momento para respirar.", K], ["El árbitro te manda seguir. Tu decisión, entonces, ya está tomada.", K]],
  ]),
];
