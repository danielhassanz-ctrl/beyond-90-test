/**
 * EL RIVAL DE TU VIDA. Una rivalidad que dura toda la carrera con {mega1} (el mismo de rivals.ts: mismo nombre y
 * mismo club mientras dure). La primera decisión elige el camino —guerra abierta, respeto o frialdad— y la historia
 * se bifurca: cada camino tiene sus propias escenas y, más adelante, todos se cruzan con la selección, el Balón de
 * Oro, una lesión y el final de una carrera. Quién gana cada duelo se queda guardado (nm_tu / nm_el) y se nota.
 * Todo escrito a mano: cero llamadas a la IA.
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene } from "../types";

const GRANDE = { minAge: 18, maxAge: 33, fama: [35, 100] as [number, number], media: [66, 99] as [number, number] };

export const RIVALES3: BankScene[] = [
  // ───── Capítulo 1: se enciende ─────
  S("nm-1", "nemesis", { ...GRANDE, notFlags: ["nm_camino"] }, "prensa",
    "{mega1} y tú, en la misma portada",
    "Una revista deportiva os pone juntos en la portada: tú, de {club}, a la izquierda; {mega1}, ese {mega1_pos} de {mega1_club}, a la derecha. El titular lo resume todo con cuatro palabras: «La generación de dos». Dentro, doce páginas que os comparan en velocidad, en goles, en sangre fría. Tu representante te la deja sobre la mesa abierta por la página tres. «Esto va a durar años», dice. «Tú decides cómo».",
    [
      o("a", "Retarlo en público: «Que gane el mejor»", "Guerra abierta", { fama: 3, rel_aficion: 2, reputacion: -1, flags: { nm_camino: "guerra" } }, "Lo dices en la primera entrevista que te ponen delante, mirando a cámara, sin rodeos. Esa misma tarde la frase es un titular y el hashtag con vuestros dos nombres, tendencia. En {mega1_club}, alguien se ha tomado el vídeo como una declaración de guerra. Y lo es."),
      o("b", "Mandarle un mensaje: «Qué suerte competir contigo»", "Respeto", { reputacion: 3, moral: 2, flags: { nm_camino: "respeto" } }, "Se lo escribes con las manos un poco sudadas, sin saber si contestará. Contesta a los veinte minutos: «Lo mismo digo. Que gane el que más se lo curre». No sabéis que ese intercambio de dos líneas será, con los años, lo más importante que os habéis dicho."),
      o("c", "Decir que tú no compites con nadie", "Frialdad", { moral: 1, forma: 1, reputacion: 1, flags: { nm_camino: "frio" } }, "«Yo compito conmigo mismo», dices en zona mixta. A unos les parece madurez y a otros, soberbia. {mega1} lo lee en el autobús y se queda un rato mirando por la ventana. No contesta. Pero lo recuerda."),
    ], { weight: 12 }),

  // ───── Camino de la guerra ─────
  S("nm-g1", "nemesis", { after: [after("nm-1", "a", 4, 90)] }, "prensa",
    "{mega1} te responde, y no con flores",
    "La respuesta de {mega1} llega en una entrevista de una hora y se resume en tres frases: «Respeto a todos los compañeros. A algunos les cuesta más respetarse a sí mismos. Yo me quedo con los títulos». Tres minutos después, la frase tiene más difusión que cualquier gol de la jornada. Tu móvil vibra sin parar. Tu míster te mira desde el otro lado del vestuario con una ceja levantada.",
    [
      o("a", "Subir el tono: una indirecta que se haga viral", "Escalar", { fama: 4, rel_aficion: 3, reputacion: -2, moral: 2, flags: { nm_g1: "escala" } }, "Subes una foto tuya con el trofeo del mes y una sola palabra: «Títulos». La grada ya está en bandos. En los dos clubes, los aficionados empiezan a cantar cosas sobre el otro que no se pueden repetir aquí."),
      o("b", "Responder con elegancia: «Cada uno juega su partido»", "Subir el nivel", { reputacion: 4, rel_aficion: 2, moral: 1, flags: { nm_g1: "elegante" } }, "Una frase corta y una media sonrisa. Los analistas dicen que has «ganado el cruce sin elevar la voz». Tú no lo has hecho por ellos, pero te sienta bien. {mega1} lee el titular con la mandíbula apretada."),
      o("c", "No decir nada: que hable el campo", "Silencio", { forma: 3, moral: -1, flags: { nm_g1: "silencio" } }, "Te callas, entrenas con rabia y el sábado marcas dos goles. En zona mixta alguien te pregunta por {mega1}. «¿Quién?», dices, y sonríes. Es mentira, pero cuela."),
    ], { weight: 6 }),
  S("nm-g2", "nemesis", { after: [after("nm-g1", "a", 6, 90)], clubTurns: [2, 400] }, "vestuario",
    "El club os pide que paréis",
    "El director deportivo te llama a su despacho con una carpeta de recortes. «Entre tú y {mega1} habéis convertido esto en un circo», dice sin alzar la voz. «El patrocinador está encantado, la liga no tanto, y el míster, directamente agotado. Te pedimos que bajes el tono. Es una petición, no una orden». Sobre la mesa hay también una propuesta: una sesión de fotos conjunta, tú y {mega1}, para una campaña de la liga.",
    [
      o("a", "Aceptar la tregua y hacerte la foto con él", "Tregua", { reputacion: 4, rel_entrenador: 3, rel_aficion: -1, moral: 1, flags: { nm_g2: "tregua", nm_tregua: true } }, "Os ponen espalda con espalda, cruzados de brazos, durante cuarenta minutos. Ninguno dice nada hasta el último plano, cuando {mega1} murmura: «Te veo mejor que el año pasado». «Y tú, peor de lo que dices», contestas. Os reís los dos, a pesar de todo."),
      o("b", "Negarte: «Lo mío no se vende a un patrocinador»", "Plantarte", { fama: 3, rel_aficion: 4, rel_entrenador: -3, reputacion: -1, flags: { nm_g2: "plante" } }, "La negativa te cuesta una charla seria con el míster y una multa simbólica del club. A cambio, tu grada te adora: eres el que no se vende. {mega1} acepta la sesión él solo, y la campaña sale con una silla vacía a su lado."),
      r("c", "Llevarlo a tu terreno: proponer un duelo benéfico entre los dos", "Jugarte la imagen", 0.5,
        "Al director le encanta la idea. Un partido benéfico entre equipos de niños, uno con vuestro nombre, otro con el de {mega1}. Recaudáis más de lo que esperaba nadie, y tú sales de allí con la mejor imagen de tu carrera.", { reputacion: 5, fama: 4, moral: 4, rel_aficion: 3, flags: { nm_g2: "benefico", nm_tregua: true } },
        "El director frunce la nariz: «Un duelo, con los dos como estrellas, es echar gasolina». Le parece una mala idea y te lo dice con educación. Sales sin foto, sin partido y con la sensación de haber sobreactuado.", { moral: -2, reputacion: -1, flags: { nm_g2: "rechazado" } }, "reputacion"),
    ], { weight: 6 }),

  // ───── Camino del respeto ─────
  S("nm-r1", "nemesis", { after: [after("nm-1", "b", 4, 90)] }, "prensa",
    "{mega1} te escribe de verdad",
    "Meses después del primer mensaje, {mega1} te escribe otra vez, esta vez sin protocolo. No es un cumplido: es un audio de once segundos, grabado en lo que parece un autobús de equipo, con el ruido de fondo de cuarenta tíos cantando. «Oye, vi tu último partido. Hay una cosa que haces con la cadera cuando recibes de espaldas que no hace nadie. ¿Me la enseñas? Te enseño yo lo que quieras».",
    [
      o("a", "Contestar y quedar para entrenar juntos en verano", "Aceptar", { moral: 4, forma: 2, media: 1, reputacion: 3, flags: { nm_r1: "entreno" } }, "Quedáis en agosto en un campo de tierra de un pueblo que ninguno de los dos sabe pronunciar. Dos semanas de entrenamientos a doble sesión, comidas en un bar con tele y una libreta compartida. Volvéis los dos mejores, y los dos sin decir una palabra a la prensa.", { thread: th("favor", "{mega1}", "Os debéis un favor: entrenasteis juntos en verano y os enseñasteis lo que sabíais.") }),
      o("b", "Responder con otro audio, y dejarlo ahí", "Mantener la distancia", { moral: 2, reputacion: 2, flags: { nm_r1: "audio" } }, "Le mandas uno de nueve segundos con una broma sobre su pelo. Os reís cada uno en su lado. Es el tipo de amistad que se hace de lejos, y que no necesita más."),
      o("c", "Dejarlo en visto: no es el momento", "Prudencia", { moral: 0, reputacion: 1, flags: { nm_r1: "visto" } }, "No contestas, aunque lo piensas tres veces esa noche. Un mes después, un compañero te dice que {mega1} sigue diciendo que eres de los pocos que se lo curran de verdad. Algún día contestarás."),
    ], { weight: 3, isMilestone: true, milestoneType: "dm_instagram", dm: { handle: "{mega1_handle}", name: "{mega1}", platform: "instagram", message: "Hay una cosa que haces con la cadera cuando recibes de espaldas que no hace nadie. ¿Me la enseñas? Te enseño yo lo que quieras." } }),
  S("nm-r2", "nemesis", { after: [after("nm-r1", "a", 8, 90)], clubTurns: [2, 400] }, "vida",
    "Una cena con {mega1} que no sale en ninguna foto",
    "Última noche de la segunda semana de entrenamientos. Cenáis en la terraza de un bar de pueblo que ha cerrado la cocina para vosotros, con una luz amarilla y dos cervezas sin alcohol. {mega1} pide lo mismo que tú, para no darte ventaja. Habláis de todo menos de fútbol, hasta que él dice, con el tenedor en el aire: «Sabes que cuando volvamos a vernos en un campo voy a intentar quitártelo todo». «Lo sé», contestas. «Yo también». Brindáis con agua.",
    [
      o("a", "Aprovechar la noche para contarle algo que nunca has contado", "Abrirte", { moral: 5, reputacion: 2, flags: { nm_r2: "confesion", nm_amigo: true } }, "Le hablas del miedo que sentías a los dieciséis, de la noche en que casi lo dejas todo. {mega1} te escucha sin decir nada. «Yo también», dice al final. Es la primera vez que ninguno de los dos finge. Os despedís con un abrazo que no sale en ninguna foto."),
      o("b", "Mantener las cartas ocultas: cenar y punto", "Competir", { forma: 2, reputacion: 1, flags: { nm_r2: "cena" } }, "La cena es agradable, y tú vigilas cada palabra. Al día siguiente, en el campo, os cruzáis con la mirada en el túnel y los dos sonreís. Los respetos, intactos; los secretos, a salvo."),
      o("c", "Proponerle una apuesta: el que pierda, paga la próxima", "Picarlo", { fama: 2, moral: 3, flags: { nm_r2: "apuesta", nm_amigo: true } }, "Cerráis el trato con un apretón de manos delante del camarero, que se lo toma muy en serio. Esa apuesta, cuatro temporadas después, seguirá en pie, y el camarero, con suerte, seguirá recordando quién debía una cena a quién."),
    ], { weight: 6 }),

  // ───── Camino de la frialdad ─────
  S("nm-f1", "nemesis", { after: [after("nm-1", "c", 5, 90)] }, "vida",
    "Te cruzas con {mega1} en un aeropuerto",
    "Cinco de la mañana, terminal vacía, un café que sabe a plástico. A tres puertas de la tuya, sentado con la capucha puesta y los auriculares al cuello, está {mega1}, de {mega1_club}. Os habéis mirado un segundo, ninguno ha levantado la mano. Un fotógrafo de aeropuerto, de esos que lo saben todo, ya ha sacado la cámara. Si os ve juntos, mañana es portada.",
    [
      o("a", "Acercarte y darle la mano, sin cámaras", "Dar el primer paso", { reputacion: 4, moral: 3, flags: { nm_f1: "mano", nm_tregua: true } }, "Cruzáis dos frases —«Qué temprano», «Qué remedio»— y un apretón de manos que dura exactamente lo que tarda el fotógrafo en bajar la cámara. «Menos mal que no hay prensa», dice él. «Menos mal», contestas. Es la conversación más larga que habéis tenido jamás."),
      o("b", "Ignorarlo: no os debéis nada", "Mantener la frialdad", { moral: 0, forma: 1, flags: { nm_f1: "ignorado" } }, "Os miráis un segundo, apartáis la vista a la vez y seguís cada uno con lo vuestro. El fotógrafo no tiene foto. La historia no se mueve ni un milímetro, y lo sabéis los dos."),
      o("c", "Posar para la foto del fotógrafo, juntos pero cada uno a su lado", "Montar el espectáculo", { fama: 4, rel_aficion: 2, reputacion: -1, flags: { nm_f1: "foto" } }, "La foto es portada de dos diarios deportivos: vosotros, a metro y medio, mirando a cámaras distintas. El titular, ingenioso a su manera: «Mismo aeropuerto, distintos mundos». Es la foto que más os han pedido para el resto de la carrera."),
    ], { weight: 6 }),

  // ───── Capítulo 2: el duelo directo (una variante por camino) ─────
  S("nm-2g", "nemesis", { after: [after("nm-1", "a", 14, 90)], media: [68, 99], clubTurns: [2, 400] }, "partido",
    "{mega1_club}, en la jornada que lo decide todo",
    "El calendario ha querido que el choque entre {club} y {mega1_club} sea un duelo personal. En el túnel, antes de salir, {mega1} y tú os cruzáis sin mirar. «Hoy me lo cobro todo», murmura. «Cobra lo que puedas», contestas. En la grada, treinta mil personas llevan semanas esperando este momento. El árbitro hace sonar el silbato.",
    [
      r("a", "Salir a por él: ir a cada balón como si fuera el último", "Todo o nada", 0.5,
        "Ganas el duelo personal. Un gol, una asistencia y la última jugada del partido es tuya: un sprint de setenta metros que acaba en tus brazos. {mega1} te mira desde el suelo con la camiseta empapada. «Te debo una», dice. «Dos», contestas. La grada te canta durante diez minutos.", { fama: 5, moral: 6, media: 1, rel_aficion: 4, flags: { nm_tu: true, nm_el: "", nm_duelo: true } },
        "Te pasas de intensidad y {mega1} te pasa por encima: un gol de los suyos, de los que valen una portada, y una tarjeta amarilla tuya por una entrada de más. Sales del campo con la cabeza gacha. Él, con una sonrisa cansada. «Otra vez será», te dice al pasar.", { moral: -5, fama: -1, rel_aficion: -2, flags: { nm_el: true, nm_tu: "", nm_duelo: true } }, "media"),
      o("b", "Jugar tu partido, sin entrar en provocaciones", "Cabeza fría", { forma: 2, reputacion: 3, moral: 1, flags: { nm_2g: "frio", nm_duelo: true } }, "El partido es un correcalles y acaba en tablas. Los analistas se quejan de que «no hubo duelo». Tú sabes por qué: el duelo estaba dentro de cada uno. Y los dos os fuisteis del campo con la sensación de haber dejado algo para más adelante."),
    ], { weight: 6 }),
  S("nm-2r", "nemesis", { after: [after("nm-1", "b", 14, 90)], media: [68, 99], clubTurns: [2, 400] }, "partido",
    "Un partido contra tu amigo {mega1}",
    "Hoy toca {mega1_club}. Hace una semana, {mega1} y tú os mandasteis un mensaje: «Que gane el mejor». Se lo dijisteis en serio. En el calentamiento, os guiñáis un ojo desde cada mitad del campo. El estadio huele a césped recién cortado y a algo más: el aire de las cosas que importan. Empieza el partido y, a los diez minutos, os chocáis en una disputa y os ayudáis a levantaros.",
    [
      r("a", "Competir al máximo, con deportividad", "Duelo limpio", 0.5,
        "Es un partido de los de enmarcar. Cada uno tiene tres ocasiones, cada uno las marca, y el empate llega en el último minuto. Os abrazáis en el centro del campo. En la grada, un niño sostiene una pancarta con vuestros dos nombres escritos con rotulador. Os la pide el árbitro y os la hace firmar a los dos.", { fama: 4, moral: 5, rel_aficion: 4, reputacion: 4, flags: { nm_tu: true, nm_el: "", nm_duelo: true } },
        "Esta vez le toca a él: un golazo de falta en el minuto ochenta decide el partido. Te acercas a felicitarle y él, aún con la camiseta en la mano, te dice: «Esta noche, la cena la pago yo». Pierdes el partido y ganas la manera.", { moral: -3, reputacion: 3, flags: { nm_el: true, nm_tu: "", nm_duelo: true } }, "media"),
      o("b", "Quitarle hierro y disfrutar el partido", "Disfrutarlo", { moral: 4, forma: 1, reputacion: 2, flags: { nm_2r: "disfrute", nm_duelo: true } }, "Lo vives como un regalo: dos amigos jugando uno contra otro en un estadio lleno. No hay ganador, pero a la vuelta, en el autobús, un compañero te dice que no recuerda haberte visto sonreír tanto en un partido."),
    ], { weight: 6 }),
  S("nm-2f", "nemesis", { after: [after("nm-1", "c", 14, 90)], media: [68, 99], clubTurns: [2, 400] }, "partido",
    "Frente a {mega1}, sin saludos",
    "Hay partidos en los que se nota que dos jugadores se han evitado durante años. Este es uno. {mega1} y tú coincidís en el túnel sin cruzar una palabra; en el campo, os marcáis de lejos, con respeto y con una especie de pacto invisible: nada de provocaciones, nada de gestos. Solo juego. El míster dice en la charla: «Hoy no hay nombres. Hay un partido».",
    [
      r("a", "Hacerte con el partido con un juego impecable", "Dejar que hable el fútbol", 0.5,
        "Tu partido es perfecto, de los que se estudian después en las escuelas. Cuando acaba, {mega1} se te acerca por primera vez en cuatro años y te da la mano con una sola frase: «Muy bien». Es todo lo que dice, y es suficiente.", { fama: 4, moral: 5, reputacion: 3, flags: { nm_tu: true, nm_el: "", nm_duelo: true } },
        "{mega1} firma un partido enorme y te lo hace pasar mal. Al terminar, no hay saludo, pero tampoco hay desprecio: solo el cansancio de quien ha medido sus fuerzas y ha descubierto que el otro es de verdad.", { moral: -3, flags: { nm_el: true, nm_tu: "", nm_duelo: true } }, "media"),
      o("b", "Gestionar el partido y no entrar en el duelo", "No picar", { forma: 2, reputacion: 2, flags: { nm_2f: "gestion", nm_duelo: true } }, "Haces lo que toca, ni más ni menos. Hay quien dice que te faltó chispa; tú sabes que la rivalidad que no se alimenta tampoco se come. Y cada partido sin cruzarte con {mega1} añade una capa más de silencio entre los dos."),
    ], { weight: 6 }),

  // ───── Capítulo 3: el Balón de Oro ─────
  S("nm-3", "nemesis", { flags: ["nm_camino", "nm_duelo"], fama: [65, 100], media: [78, 99], minAge: 21, maxAge: 36, notFlags: ["nm_3"] }, "prensa",
    "{mega1} está en la lista del Balón de Oro, igual que tú",
    "La lista de nominados llega un martes por la mañana, con un sobre que huele a papel caro. Tu nombre está, y el de {mega1} está justo debajo. Una radio os pone a los dos al micrófono con una pregunta sencilla y trampa: «Si no gana el uno, ¿quién quieres que lo gane?». En el estudio hay una sola silla libre y la sensación de que cualquier respuesta tuya se va a citar durante años.",
    [
      o("a", "«Si no soy yo, que sea él. Se lo merece»", "Reconocerle", { reputacion: 6, rel_aficion: 3, moral: 2, fama: 2, flags: { nm_3: "reconoce", nm_tregua: true } }, "La frase sale en todos los medios al día siguiente. Los comentaristas la llaman «un gesto de grande». {mega1} te manda un mensaje de una palabra: «Gracias». No hace falta más."),
      o("b", "«El premio es mío, y lo sabe»", "Ir a por todo", { fama: 5, rel_aficion: 4, reputacion: -3, moral: 2, flags: { nm_3: "mio" } }, "El titular es feroz. Los tuyos te aplauden; los de {mega1_club}, no. En la gala, la mesa de los dos queda a tres metros, y ninguno de los dos mira hacia ella en toda la noche."),
      o("c", "«El que lo gane, que lo disfrute. Yo sigo a lo mío»", "Quitarle hierro", { moral: 2, reputacion: 3, flags: { nm_3: "neutral" } }, "Una respuesta de manual, que no engaña a nadie pero tampoco incendia a nadie. El presentador te lo agradece con una sonrisa de alivio profesional."),
    ], { weight: 5 }),

  // ───── Capítulo 4: la lesión (cruce con las lesiones largas) ─────
  S("nm-4g", "nemesis", { after: [after("nm-1", "a", 10, 90)], injured: true, notFlags: ["nm_4"] }, "vida",
    "Un mensaje de {mega1} que no esperabas",
    "Cuarta semana de baja. La rodilla duele menos que la cabeza. Y entonces, en el móvil, un mensaje de {mega1}: «Vuelve pronto. Me aburro sin ti». Debajo hay una foto: él, en el banquillo de {mega1_club}, con unas muletas de adorno que alguien le ha dado como broma, y un cartel escrito a mano: «Se busca rival». La última persona de la que esperabas esto es la primera en acordarse de ti.",
    [
      o("a", "Contestar con la verdad: «Gracias. Tenía el día malo»", "Bajar la guardia", { moral: 6, reputacion: 3, flags: { nm_4: "gracias", nm_tregua: true, nm_amigo: true } }, "No es una tregua pactada, es algo mejor: un reconocimiento. Hablas con él casi una hora esa noche. Descubrís que tenéis más en común de lo que la prensa ha querido nunca contar."),
      o("b", "Responder con una sola frase: «Te espero en el campo»", "Mantener el pulso", { moral: 3, forma: 1, flags: { nm_4: "pulso" } }, "Te quedas pensando en ello toda la rehabilitación. Es el mejor combustible que tienes: saber que, cuando vuelvas, él estará esperándote en el otro lado."),
      o("c", "No contestar: no quieres su compasión", "Orgullo", { moral: -2, flags: { nm_4: "orgullo" } }, "Dejas el móvil boca abajo y miras al techo. Es una victoria a medias: el orgullo te protege y te aísla a la vez. Cuando vuelves, él ya no escribe. La rivalidad sigue; la puerta, un poco más cerrada."),
    ], { weight: 6, isMilestone: true, milestoneType: "dm_instagram", dm: { handle: "{mega1_handle}", name: "{mega1}", platform: "instagram", message: "Vuelve pronto. Me aburro sin ti." } }),
  S("nm-4r", "nemesis", { after: [after("nm-1", "b", 10, 90)], injured: true, notFlags: ["nm_4"] }, "vida",
    "{mega1} aparece en tu rehabilitación",
    "Un martes por la tarde, mientras haces series de cuádriceps bajo la mirada de tu fisio, se abre la puerta del gimnasio y entra {mega1}, con una bolsa de deporte al hombro y una caja de pastelitos de la cafetería de al lado. «Me ha dicho tu agente a qué hora venías», dice. «No te levantes, ya sé que no puedes». Dejas la banda elástica en el suelo y te ríes por primera vez en tres semanas.",
    [
      o("a", "Dejarle quedarse: entrenáis juntos la tarde entera", "Compañía", { moral: 7, forma: 2, reputacion: 3, flags: { nm_4: "tarde", nm_amigo: true } }, "Pasa tres horas allí. Te corrige la postura en un ejercicio, te cuenta lo del chisme del vestuario de su club y se va con la promesa de volver el jueves. Vuelve el jueves. Y el siguiente. Cuando recibes el alta, tienes un amigo más y una rutina que no quieres dejar."),
      o("b", "Agradecérselo y pedirle que te deje solo", "Intimidad", { moral: 2, reputacion: 1, flags: { nm_4: "solo" } }, "Entiende a la primera. Te deja la caja de pastelitos y un «cuando quieras» en una nota. No vuelve, pero la nota te la guardas en la cartera."),
    ], { weight: 6 }),
  S("nm-4f", "nemesis", { after: [after("nm-1", "c", 10, 90)], injured: true, notFlags: ["nm_4"] }, "prensa",
    "{mega1} habla de tu lesión en una entrevista",
    "En una entrevista de las que se publican un domingo, a {mega1} le preguntan por tu baja. Duda un segundo, que el periodista graba y alarga en el montaje. «Es una pena», dice. «Un jugador como él necesita estar en el campo. La liga es peor sin él». Ni una palabra más. Ni una de menos. La frase, justa y medida, es lo más bonito que se ha dicho de ti en meses, viniendo de quien viene.",
    [
      o("a", "Agradecérselo con un mensaje público", "Reconocer el gesto", { reputacion: 5, rel_aficion: 3, moral: 4, flags: { nm_4: "agradece", nm_tregua: true } }, "«Gracias por las palabras. Nos vemos en el campo», escribes. La respuesta de {mega1} es un solo emoji: un puño cerrado. Los analistas, que llevaban años esperando algo, lo llaman «el primer gesto de la rivalidad»."),
      o("b", "Callarte: no tienes por qué contestar", "Seguir a lo tuyo", { moral: 1, flags: { nm_4: "callas" } }, "No contestas. Alguien comenta que «no sabe encajar un elogio». Tú sabes que sí sabes, pero que el momento de decirlo todavía no ha llegado. Quizá, con los años, llegue."),
    ], { weight: 6 }),

  // ───── Capítulo 5: la selección ─────
  S("nm-5", "nemesis", { flags: ["nm_camino", "nm_duelo", "sel_debut"], media: [72, 99], notFlags: ["nm_5"] }, "vestuario",
    "Compartís vestuario con {mega1} en la selección",
    "Hay quien dice que el mejor fútbol del mundo se juega con la camiseta de un país, y quien dice que eso solo pasa cuando los egos caben en el mismo vestuario. En la concentración, el seleccionador os coloca en la misma habitación: tú, {mega1} y una sola mesa de noche. Cada uno deja su maleta con cuidado, sin mirar la del otro, como dos gatos en una caja. Es la primera vez que dormís bajo el mismo techo.",
    [
      o("a", "Romper el hielo: «¿Quién ronca más?»", "Humor", { moral: 4, rel_vestuario: 3, reputacion: 2, flags: { nm_5: "humor", nm_tregua: true } }, "«Yo», dice él. «Yo más», contestas. Pasáis esa noche entre risas contenidas hasta las tres de la mañana. En el entrenamiento del día siguiente os pasáis el balón como si lo hubierais hecho toda la vida, y el seleccionador, desde el banquillo, apunta algo en su libreta sin decir nada."),
      o("b", "Pedir al seleccionador otra habitación", "Mantener distancia", { moral: -1, rel_vestuario: -1, reputacion: -1, flags: { nm_5: "distancia" } }, "El seleccionador te mira con paciencia de padre. «¿Estás seguro?». Lo estás. Te cambian a una habitación con un compañero joven que te mira con ojos de fan. No es lo que buscabas, pero tampoco te quejas. En el autobús, {mega1} te mira un segundo y aparta la vista."),
      o("c", "Competir por el puesto con todo, pero con respeto", "Duelo sano", { forma: 2, media: 1, rel_vestuario: 2, reputacion: 3, flags: { nm_5: "duelo" } }, "En el primer entrenamiento a dos toques, os lleváis por delante el balón y las piernas del otro más de una vez. El seleccionador pita para pararlo. «Así quiero que juguéis», dice. «Pero a la contra, no entre vosotros». Os reís a la vez, sin querer."),
    ], { weight: 4 }),

  // ───── Final: el último duelo ─────
  S("nm-6", "nemesis", { flags: ["nm_camino", "nm_3"], minAge: 31, media: [70, 99], notFlags: ["nm_6"] }, "vida",
    "{mega1}: veinte años de comparaciones",
    "Una televisión os junta en un plató, a los dos, sillones enfrentados y una mesa baja con dos tazas de café que nadie bebe. La presentadora lee en voz alta los titulares de dos décadas: portadas, polémicas, goles, finales. {mega1} escucha con una media sonrisa y tú con otra. «Dime la verdad», dice ella al cierre. «¿Qué ha sido el otro para vosotros?». Los dos os miráis. Hay una pausa de cuatro segundos que dura una carrera entera.",
    [
      o("a", "«Me hizo mejor. Sin él, no habría llegado hasta aquí»", "Reconocerlo todo", { moral: 8, reputacion: 8, rel_aficion: 5, fama: 3, flags: { nm_6: "respeto", nm_final: "respeto" } }, "El plató se queda en silencio. {mega1} te mira, traga saliva y dice, bajito: «Lo mismo». La presentadora, que lleva veinticinco años en esto, se seca un ojo con el dorso de la mano. Esa noche, los mensajes de los aficionados de los dos bandos se mezclan en la misma conversación. Y es, probablemente, el momento más bonito de la rivalidad.", { thread: th("favor", "{mega1}", "Cerrasteis la rivalidad con un abrazo: os debéis una amistad para toda la vida.") }),
      o("b", "«Fue un rival complicado. Y un buen rival»", "Sinceridad medida", { moral: 3, reputacion: 4, flags: { nm_6: "medido", nm_final: "respeto" } }, "Una respuesta justa, sin lágrimas pero con peso. {mega1} sonríe y asiente: «Más o menos, lo mismo». Dos frases que dicen mucho más de lo que parecen. En el pasillo, al salir, se queda un segundo contigo sin decir nada. Después, se va."),
      o("c", "«Rival, y punto. Los amigos son otra cosa»", "Mantener la frontera", { moral: 0, reputacion: 1, fama: 2, flags: { nm_6: "frontera", nm_final: "frio" } }, "La presentadora sonríe incómoda. {mega1} te mira un segundo largo, hace un gesto de «fue bonito mientras duró» y cambia de tema. Cuando acaba la entrevista, no os despedís. Es la forma que tenéis de respetaros: sin sentimentalismos, hasta el final."),
    ], { weight: 6, isMilestone: true, milestoneType: "dm_instagram", dm: { handle: "{mega1_handle}", name: "{mega1}", platform: "instagram", message: "Veinte años compitiendo contigo. Me hiciste mejor. Gracias por cada partido." } }),
];
