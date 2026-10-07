import { dec, G, W, A, M, MB, S, C, CT, K, B, F, P, type NewDecision } from "./dsl";

export const MIDFIELDER_NEW: NewDecision[] = [
  dec("Recibes entre líneas, a media vuelta, con el área rival a un pase de distancia.", [
    ["Filtrar el pase al hueco para el delantero", "La asistencia que rompe el partido", 0.45, ["El pase corta tres líneas y el delantero se queda solo ante el portero. Una asistencia de las que hacen ruido.", A], ["El pase se pasa de fuerza y el portero lo recoge sin apuros.", MB]],
    ["Girarte y disparar desde la frontal", "Asumir el riesgo", 0.26, ["Te giras, armas la pierna y el disparo seco se mete pegado al palo. Golazo desde fuera del área.", W], ["Disparas con ganas, pero el balón sale por encima del larguero.", M]],
    ["Tocar de primeras al extremo y seguir el juego", "Un toque rápido", 0.62, ["Lo tocas de primeras y el extremo arranca con espacio. Moviste a todos con un solo gesto.", K], ["El toque sale blando y el defensa corta.", MB]],
  ]),
  dec("Robas un balón en el centro del campo y se abre un espacio enorme por delante.", [
    ["Conducir el balón y lanzar la contra tú solo", "Liderar la jugada", 0.4, ["Avanzas treinta metros con el balón pegado al pie y se la dejas al delantero en su carrera. Contra de manual.", A], ["Te frena el último defensor con una falta táctica. Se acaba la jugada.", F]],
    ["Dar un pase largo a la espalda de los centrales", "Ir directo", 0.38, ["Un pase largo de cuarenta metros que cae como un guante. El delantero se planta solo.", A], ["El pase se pasa de largo y sale por la línea de fondo.", MB]],
    ["Parar el juego y asegurar la posesión", "Mejor un rival menos", 0.7, ["Frenas, miras y das el pase seguro. El equipo respira y se ordena.", K], ["Te lo quitan al dudar y el rival sale a la contra.", MB]],
  ]),
  dec("El rival os presiona en la salida de balón, pegado a vuestra área, y te toca asumir el pase.", [
    ["Salir jugando con un pase corto", "Confiar en el toque", 0.55, ["Un pase corto entre dos rivales: el equipo sale limpio de la presión y gana metros.", K], ["El pase sale flojo y se lo roban en zona peligrosa.", MB]],
    ["Despejar con un pase largo", "Quitarte el peligro de encima", 0.5, ["El balón vuela al otro lado del campo y tu delantero la baja. Alivio y avance en una jugada.", K], ["El pase largo se queda en nada y el rival recupera sin problemas.", MB]],
    ["Aguantar el balón y esperar un hueco", "Sangre fría", 0.4, ["Aguantas, aguantas, y cuando el rival se lanza, lo sorteas con un regate. Eres un genio.", K], ["Aguantas demasiado: un rival te roba el balón y se queda solo con el portero.", C]],
  ]),
  dec("Te llega un balón dividido justo al borde de la frontal y dos rivales corren hacia él.", [
    ["Llegar el primero y rematar de primeras", "Valentía", 0.34, ["Llegas medio segundo antes y la pegas con el alma. El balón se cuela entre dos defensas y entra pegado al palo.", G], ["Llegas, pero el golpeo sale mordido y el balón va a las manos del portero.", M]],
    ["Cuerpear y proteger el balón", "Ganar la posición", 0.55, ["Pones el cuerpo y ganas el balón. Con la cabeza fría, lo dejas a un compañero libre.", K], ["Te cargan, te quitan el balón y te frenan en seco.", MB]],
    ["Dejarla pasar y esperar el rebote", "Jugar con la cabeza", 0.5, ["La dejas pasar, el rival se lleva el toque y tú te encuentras el balón suelto en tu pie.", K], ["La dejas pasar, pero se escapa sin que nadie la controle.", MB]],
  ]),
  dec("Un córner a favor te deja solo en el borde del área, con el balón botando hacia ti.", [
    ["Volea de primeras desde fuera", "Un riesgo con premio", 0.24, ["Cogiste la volea con todo y el balón entró como un obús. Golazo de los que se recuerdan.", W], ["La volea sale alta y desviada. Casi.", M]],
    ["Controlar con el pecho y jugar al hueco", "Más seguridad", 0.5, ["Controlas con el pecho y metes un pase picado al segundo palo. Gol de un compañero tras tu pase.", A], ["El control te sale pesado y el rival aprovecha la contra.", MB]],
    ["Devolver el balón al área con un centro", "Jugarlo otra vez", 0.55, ["Centras con la zurda y un compañero remata con la cabeza. Dos veces, un solo gol.", A], ["El segundo centro se pierde sin remate.", MB]],
  ]),
  dec("Tienes el balón y el equipo necesita un cambio de ritmo: el partido está dormido.", [
    ["Acelerar la jugada con un pase vertical", "Despertar a todos", 0.5, ["Tu pase vertical despierta al equipo: tres toques rápidos y el balón entra en el área.", A], ["El pase te sale demasiado largo y el defensa lo despeja.", MB]],
    ["Regatear a un rival y buscar espacio", "Una jugada individual", 0.4, ["Dejas a un rival atrás con un regate corto y encuentras un hueco. El equipo gana metros.", K], ["Te vence el rival en el regate y se queda con el balón.", MB]],
    ["Cambiar de lado con un pase de cuarenta metros", "Abrir el campo", 0.55, ["Cambio de orientación perfecto: el extremo recibe solo, con espacio. Eres un cirujano.", A], ["El cambio se queda corto y el lateral rival lo intercepta.", MB]],
  ]),
  dec("Recibes de espaldas con dos rivales cerrándote las dos únicas líneas de pase.", [
    ["Girar sobre ti mismo y salir con el balón", "Un giro de bailarín", 0.42, ["Giras sobre el pie de apoyo y dejas a ambos rivales mirando al cielo. Eres un genio.", K], ["Te giras demasiado tarde y uno de los dos te roba.", MB]],
    ["Devolver el balón al compañero de atrás", "Jugar sin riesgos", 0.7, ["Devuelves el balón con un toque sencillo y el equipo recupera la calma.", K], ["El pase atrás se queda corto y el rival lo corta.", MB]],
    ["Intentar un pase imposible entre los dos rivales", "Una jugada de genio", 0.22, ["El balón pasa entre ambos, como una aguja por el ojo de un hilo, y llega al delantero. Qué visión.", A], ["El pase choca con una pierna rival y se pierde.", MB]],
  ]),
  dec("Ves a tu lateral desmarcado por la banda, pero el pase tiene que ser perfecto: hay un rival muy cerca.", [
    ["Meterle un pase al hueco con la zurda", "La asistencia fina", 0.45, ["El pase cae como una caricia en la carrera del lateral, que centra al área. Un ejercicio de arquitectura.", A], ["El pase se va largo y el lateral no llega.", MB]],
    ["Tocar corto y que el lateral venga a por el balón", "Más conservador", 0.62, ["Le das el balón con seguridad y el lateral se hace con el control. Todo correcto.", K], ["El toque corto lo intercepta el rival.", MB]],
    ["Cambiar el juego hacia el otro lado", "Dejar la jugada y buscar espacio", 0.5, ["Cambias el juego con un balón largo y tu equipo gana metros. Pocas veces se ve un cambio tan limpio.", K], ["El cambio sale demasiado alto y sale por la línea de fondo.", MB]],
  ]),
  dec("Un rebote te cae en el pico del área, a veinticinco metros, y tus dos delanteros te piden el balón a gritos.", [
    ["Pegarle de primeras con la zurda", "Un cañonazo", 0.22, ["El balón sale como un misil y se clava en la escuadra. Los comentaristas se levantan de la silla.", W], ["El balón sale desviado, casi hasta la grada.", M]],
    ["Pasar al delantero que está mejor colocado", "Una asistencia de manual", 0.5, ["Das el pase al mejor colocado, que define con calma. Fácil, bonito y eficaz.", A], ["El pase llega mal y el defensa se lo lleva.", MB]],
    ["Controlar y levantar la cabeza", "Esperar el mejor momento", 0.55, ["Controlas, miras y pones el balón entre dos centrales. Una asistencia de pizarra.", A], ["Te quitan el balón mientras controlas.", MB]],
  ]),
  dec("Cortas un pase rival en tres cuartos de campo y tienes el campo abierto por delante.", [
    ["Lanzar la contra de primeras", "Velocidad ante todo", 0.5, ["Tocas rápido y tu equipo se lanza al ataque con tres hombres. Gol al final de una jugada de tres pases.", A], ["El pase sale mal y el rival corta de nuevo.", MB]],
    ["Avanzar con el balón y esperar apoyos", "Algo más de calma", 0.55, ["Avanzas con el balón controlado y recibes apoyos. El equipo se ordena y busca el hueco.", K], ["Te cierran por los lados y pierdes el balón.", MB]],
    ["Disparar de primeras", "Una idea atrevida", 0.2, ["Le pegas desde lejos con todo y se mete por la escuadra. El portero ni se estira.", W], ["Disparas, pero el portero lo atrapa sin problema.", M]],
  ]),
  dec("El rival se repliega en bloque y te deja un metro de espacio a treinta metros de la portería.", [
    ["Probar suerte con un disparo desde lejos", "Todo o nada", 0.2, ["Un disparo raso y cruzado desde treinta metros que se cuela entre las piernas de un defensa. Gol.", W], ["Disparas, pero el balón choca con un defensa y sale desviado.", M]],
    ["Pasar a un compañero y moverte al espacio", "Juego asociado", 0.55, ["Pase corto, desmarque rápido, devolución en el hueco. Tres toques de ensueño.", A], ["Te pasan la pared pero el pase sale mal.", MB]],
    ["Aguantar el balón y esperar a que el rival salga", "Paciencia", 0.58, ["Aguantas el balón con calma hasta que el rival se mueve y abre un hueco. Eres un maestro del tempo.", K], ["Te presionan de repente y pierdes el balón.", MB]],
  ]),
];

export const DEFENDER_NEW: NewDecision[] = [
  dec("El extremo rival te encara en velocidad, uno contra uno, cerca de tu área.", [
    ["Cerrarle por dentro y obligarle a ir por fuera", "Defensa inteligente", 0.58, ["Le cierras el interior y el extremo se queda sin opciones. Se va hacia fuera y centra sin peligro. Cierre de libro.", CT], ["El extremo te hace un recorte y se te escapa por la línea de fondo.", B]],
    ["Entrar a robar el balón con el pie", "Un riesgo medido", 0.38, ["Sacas el pie con una precisión milimétrica y te llevas el balón sin tocar al rival. Entrada de ensueño.", CT], ["Entras tarde y el árbitro pita falta.", F]],
    ["Retroceder y esperar apoyo", "Ganar tiempo para el equipo", 0.62, ["Retrocedes y tu compañero llega a ayudarte. Entre los dos cortáis la jugada.", CT], ["Retrocedes demasiado y le dejas espacio para chutar.", C]],
  ]),
  dec("Un balón dividido cae entre tú y el delantero rival dentro del área.", [
    ["Despejar con fuerza hacia la banda", "Quitarte el problema de encima", 0.58, ["Despejas con el empeine y el balón se va a la tribuna. El peligro, anulado.", CT], ["El despeje sale flojo y el delantero se queda con el rebote.", C]],
    ["Cuerpear al delantero y proteger el balón", "Un duelo de fuerza", 0.5, ["Metes el cuerpo, ganas la posición y el balón es tuyo. Tu portero te lo agradece.", CT], ["El delantero te cierra el paso y el árbitro pita falta tuya.", F]],
    ["Tirarte a por el balón con una entrada raso", "Todo o nada", 0.34, ["Te lanzas, tocas el balón y el delantero cae sobre ti. El árbitro lo deja seguir. Entrada de campeón.", CT], ["Llegas tarde, derribas al delantero y el árbitro señala el punto de penalti.", P]],
  ]),
  dec("Un centro lateral llega al área y tienes que decidir si cortar o esperar a tu portero.", [
    ["Saltar y despejar de cabeza", "Cortar el peligro", 0.55, ["Saltas por encima del delantero y despejas con autoridad. Esta vez no hay susto.", CT], ["Fallas el cabezazo y el balón queda botando en el área pequeña.", C]],
    ["Dejar que salga el portero y cubrirle", "Confiar en tu compañero", 0.5, ["El portero sale con decisión, la atrapa y tú le cubres las espaldas. Todo en orden.", S], ["El portero duda, no sale, y el balón cae a los pies del delantero.", C]],
    ["Anticiparte y despejar de primeras al lateral", "Un golpeo sin pensar", 0.52, ["Te adelantas y despejas con el pie hacia la banda, lejos de cualquier peligro.", CT], ["Despejas mal y el balón se queda dentro del área.", C]],
  ]),
  dec("Tu compañero se la juega con un pase arriesgado en tu mitad de campo y un rival la roba y te encara.", [
    ["Cerrar el pasillo central y que vaya a fuera", "Cabeza fría", 0.55, ["Le haces un pasillo hacia la banda y consigue que el ataque pierda velocidad. Un cierre perfecto.", CT], ["El rival se zafa de ti y entra al área.", B]],
    ["Hacer una falta táctica antes de que arranque", "Parar la jugada a toda costa", 0.6, ["Cortas la jugada con una falta limpia, sin tarjeta. Sacrificio por el equipo.", F], ["El árbitro te saca la amarilla por la falta.", F]],
    ["Salir a presionar y buscar el robo", "Valentía", 0.35, ["Sales a presionar y le robas el balón antes de que pueda mirar. Un golpe de efecto.", CT], ["El rival te pasa por encima con un regate y se queda solo.", C]],
  ]),
  dec("Un córner en contra: tu marcador te agarra y el balón llega al segundo palo.", [
    ["Zafarte y atacar el balón con fuerza", "Ir a por todas", 0.4, ["Te quitas el agarrón de encima y despejas de cabeza. Alivio inmenso.", CT], ["Te frena el agarrón y el rival remata sin oposición.", C]],
    ["Marcar al hombre y esperar a que se mueva", "Defensa tradicional", 0.55, ["Lo sigues como una sombra. El balón pasa de largo y no hay remate.", CT], ["Pierdes al hombre en un cruce y remata solo.", C]],
    ["Pedir falta en ataque al árbitro", "Una picardía defensiva", 0.3, ["El árbitro ve el agarrón al revés y pita falta al delantero. Un respiro.", F], ["El árbitro no pita y el delantero remata sin problema.", C]],
  ]),
  dec("El delantero rival gira en el área y se queda solo contra ti con su pierna buena.", [
    ["Ponerte pegado y tapar el disparo", "Ser un muro", 0.5, ["Te lanzas con las piernas abiertas y bloqueas el disparo con el cuerpo. Todo el estadio te aplaude.", CT], ["No llegas a cerrar y el disparo se cuela por entre tus piernas.", C]],
    ["Hacer una entrada raso por detrás", "Un riesgo enorme", 0.3, ["Te lanzas con una entrada limpia y le quitas el balón de los pies. Jugada de campeonato.", CT], ["Tocas al delantero antes que el balón y el árbitro pita penalti.", P]],
    ["Esperar a que se tire y estirarte", "Jugar con paciencia", 0.45, ["Esperas, el delantero titubea y la despejas con la punta de la bota. Una jugada de libro.", CT], ["Te desborda con un recorte y la mete dentro.", C]],
  ]),
  dec("Estás cargado de tarjetas y el delantero rival te provoca para que hagas una entrada de más.", [
    ["Mantener la calma y no entrar al choque", "Cabeza fría", 0.62, ["Aguantas el tirón y el delantero se queda sin excusa. El árbitro lo ve y lo amonesta a él.", K], ["Te contienes tanto que el delantero se escapa en una carrera.", B]],
    ["Cortar la jugada con un empujón sutil", "Una picardía", 0.4, ["Un contacto sutil, imperceptible, y el delantero pierde el equilibrio. El árbitro no pita.", CT], ["El árbitro lo ve y te saca la tarjeta que ya llevabas pendiente.", F]],
    ["Pedirle al árbitro que lo controle", "Delegar", 0.5, ["El árbitro, atento, habla con el delantero. Ahora tendrá cuidado.", K], ["El árbitro no te hace ni caso y la provocación continúa.", K]],
  ]),
  dec("Un pase largo busca la espalda de tu defensa y tienes que decidir: subir la línea o correr hacia atrás.", [
    ["Subir la línea para dejarlo en fuera de juego", "La trampa del fuera de juego", 0.4, ["Subís al unísono y el delantero queda adelantado. El línier levanta la bandera. Una trampa perfecta.", CT], ["Un compañero no sube y el delantero queda habilitado. Gol casi cantado.", C]],
    ["Retroceder y cubrir la espalda", "Defensa clásica", 0.6, ["Retrocedes, ganas la carrera y despejas antes de que llegue el delantero.", CT], ["El delantero te gana el metro y se queda solo.", C]],
    ["Hacer una falta táctica en el medio campo", "Anticipar el peligro", 0.55, ["Cortas la jugada con una falta antes de que se convierta en peligro.", F], ["El árbitro te enseña la amarilla y se acaba el pase.", F]],
  ]),
  dec("Te llega un balón suelto en la banda y el extremo rival ya viene lanzado a por ti.", [
    ["Sacar el balón jugando con un pase raso", "Salir con elegancia", 0.5, ["Salís jugando con un pase al medio, y el extremo rival pasa de largo. Defensa moderna.", K], ["El pase sale flojo y el extremo se queda con el balón.", MB]],
    ["Despejar a la grada sin pensarlo", "Seguridad total", 0.75, ["Despejas con todo, sin mirar, y el balón sale al tercer anfiteatro. Peligro eliminado.", CT], ["El despeje te sale mal y el balón rebota en el extremo.", C]],
    ["Hacer un amago y encarar al extremo", "Una jugada de atrevidos", 0.3, ["Amagas, dejas al extremo atrás y sacas el balón controlado. Desafías la lógica.", K], ["Intentas el regate, pierdes el balón y el extremo se queda solo.", C]],
  ]),
  dec("Un rechace te cae en el área propia, rodeado de rivales que aprietan.", [
    ["Despejar de primeras con fuerza", "Primero, seguridad", 0.65, ["Despejas a la grada y los rivales se quedan con las manos en la cabeza.", CT], ["El despeje sale rebotado y se queda en el área.", C]],
    ["Controlar y salir jugando", "La opción valiente", 0.35, ["Controlas bajo presión, te zafas con un giro y sacas el balón controlado. Defensa de otro planeta.", K], ["Controlas, pero te roban el balón y el delantero se queda solo.", C]],
    ["Cuerpear a los rivales y ganar tiempo", "Mantener la calma", 0.5, ["Cuerpeas al delantero, proteges el balón y esperas la ayuda de un compañero.", CT], ["Te quitan el balón por detrás y se arma la de dios.", C]],
  ]),
];
