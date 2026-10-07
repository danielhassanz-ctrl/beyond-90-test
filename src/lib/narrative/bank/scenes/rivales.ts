/**
 * Tu generación: dos compañeros de tu edad que te hacen la competencia en tu
 * propio vestuario ({peer1}, {peer2}) y tres megacracks en otros grandes
 * ({mega1}, {mega2}, {mega3}) que hablan de ti, se pican y a veces te
 * respetan. Son los mismos durante toda la carrera (ver rivals.ts), así que
 * una declaración de hace dos temporadas puede volver a cobrarse.
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene } from "../types";

export const RIVALES: BankScene[] = [
  // ───── Compañeros de tu edad ─────
  S("rv-peer-llega", "rival", { minAge: 16, maxAge: 25, clubTurns: [1, 8], notFlags: ["rv_peer_llega"] }, "vestuario",
    "{peer1}, tu misma edad y tu misma posición",
    "Se presenta en el vestuario con una mochila enorme y la mirada de quien ha venido a quitarle el puesto a alguien. Tiene tu edad, juega de {peer1_pos} como tú y ha dejado su nombre pintado con rotulador en la taquilla de al lado. Los veteranos os miran a los dos y sueltan, sin disimular: «Ya tenemos pelea».",
    [
      o("a", "Tenderle la mano y ofrecerte a enseñarle el vestuario", "Competir con buen rollo", { rel_vestuario: 3, moral: 2, flags: { rv_peer_llega: "amigo" } }, "Le enseñas dónde están las duchas buenas, el rincón del utillero y la máquina de café que funciona. {peer1} te mira sorprendido: «No esperaba esto». «Yo tampoco», contestas. Y os reís."),
      o("b", "Marcar territorio desde el primer día", "Que sepa quién manda", { forma: 2, rel_vestuario: -2, moral: 1, flags: { rv_peer_llega: "rival" } }, "No le saludas. En el primer rondo le robas el balón dos veces seguidas. {peer1} no dice nada, pero te mira con una sonrisa torcida que dice: «Esto va a ser divertido»."),
      o("c", "Ignorarlo y centrarte en lo tuyo", "No es asunto tuyo", { forma: 1, flags: { rv_peer_llega: "neutral" } }, "Entrenas como siempre, sin mirar a la taquilla de al lado. Pero a la tercera sesión te das cuenta de que sabes exactamente cuántos regates le han salido."),
    ], { weight: 2 }),
  S("rv-peer-pique", "rival", { after: [after("rv-peer-llega", undefined, 3, 14)], clubTurns: [2, 20] }, "entrenamiento",
    "El míster elogia a {peer1} delante de todos",
    "En la charla de antes del entrenamiento, el míster pone un vídeo de {peer1}: un pase al hueco del último partido del filial. «Así se juega», dice. No te mira. No dice tu nombre. Notas el calor subiéndote por el cuello mientras el vídeo se repite una segunda vez, una tercera.",
    [
      r("a", "Responder en el campo: dar lo mejor de ti en el entrenamiento", "Que hable el balón", 0.6, "Ese día lo das todo. En el último rondo le haces un caño a {peer1} y el míster, desde la banda, levanta una ceja y apunta algo en su libreta. A la salida, te dice: «Así».", { forma: 3, media: 1, moral: 5, rel_entrenador: 3 }, "Quieres demostrar tanto que fuerzas dos pases, pierdes tres balones y acabas con un tirón en el gemelo. {peer1} te ofrece una botella de agua con cara de pena. Es lo peor.", { forma: -3, moral: -4, rel_entrenador: -1 }, "forma"),
      o("b", "Hablar con el míster en privado", "Pedir una explicación", { rel_entrenador: 2, moral: 1 }, "Le pides cinco minutos. El míster te escucha, cruzado de brazos, y dice: «No te he puesto el vídeo por ti, sino para ti. Tú ya sabes lo que haces bien. Él todavía no». Te lo piensas toda la tarde."),
      o("c", "Comentárselo a un compañero de confianza y desahogarte", "Soltarlo", { moral: 2, rel_vestuario: 1 }, "Se lo cuentas al lateral mientras os cambiáis. Él se ríe: «Nadie va a quitarte nada, tranquilo». Pero la frase que se te queda es otra: «Aunque, cuidado»."),
    ]),
  S("rv-peer-titular", "rival", { after: [after("rv-peer-llega", undefined, 4, 24)], roles: ["suplente", "rotacion"], clubTurns: [3, 30] }, "partido",
    "{peer1} te quita el puesto",
    "Sales a calentar y ves la alineación en el vestuario: ese once sin tu nombre y con el de {peer1} en tu hueco. Él se hace el distraído atándose las botas, pero tiene las orejas rojas. Lo peor es que no hay malicia en su cara: solo la ilusión de un chaval de tu edad que acaba de cumplir un sueño.",
    [
      o("a", "Felicitarlo de corazón antes del partido", "Primero el equipo", { rel_vestuario: 4, reputacion: 3, moral: -2, flags: { rv_peer_titular: "elegante" } }, "Le das un abrazo corto y le dices al oído: «Rómpela». {peer1} se queda sin palabras. En el banquillo, durante los primeros veinte minutos, te sorprendes aplaudiendo más fuerte que nadie."),
      o("b", "Tragarte la rabia y esperar tu oportunidad", "Paciencia", { forma: 1, moral: -3, flags: { rv_peer_titular: "rabia" } }, "No dices nada. Te sientas en el banquillo con los codos en las rodillas y la mirada fija en el campo. Cada pase suyo es una cuenta que apuntas en un cuaderno invisible."),
      o("c", "Pedirle explicaciones al míster después", "Dar la cara", { rel_entrenador: -2, moral: 1, flags: { rv_peer_titular: "queja" } }, "Esperas a que acabe el entrenamiento. El míster te escucha con paciencia y dice: «Entiendo lo que sientes. Y no, hoy no me vas a convencer». Te da una palmada en el hombro. «Pero gracias por decírmelo a la cara»."),
    ]),
  S("rv-peer-tu-puesto", "rival", { after: [after("rv-peer-llega", undefined, 4, 24)], roles: ["titular"], clubTurns: [3, 30], notFlags: ["rv_peer_tu_puesto"] }, "vestuario",
    "{peer1} se queda en el banquillo y tú juegas",
    "El míster te mantiene en el once. {peer1} calienta junto a la banda con el peto puesto y la mirada fija en el césped. Cuando pasas a su lado, ni se gira. En el descanso, un compañero te susurra: «Cuidado con ése, que tiene hambre». Y tú, que tienes la misma edad y la misma hambre, entiendes perfectamente lo que siente.",
    [
      o("a", "Acercarte a él al final y decirle que su momento llegará", "Empatía", { rel_vestuario: 3, moral: 2, flags: { rv_peer_tu_puesto: "empatia" } }, "Esperas a que se quede solo y le dices: «A mí me pasó antes. Aguanta». {peer1} traga saliva y asiente. No contesta, pero esa semana te pasa un balón con más cuidado de lo normal."),
      o("b", "Dejarlo estar: cada uno tiene su camino", "Respetar su espacio", { moral: 1, flags: { rv_peer_tu_puesto: "frio" } }, "Pasas de largo y te duchas. Pero en el autobús notas que no se sienta cerca. Hay silencios que dicen más que una discusión."),
      o("c", "Alardear un poco de tu titularidad en el vestuario", "Marcar el territorio", { moral: 3, rel_vestuario: -3, flags: { rv_peer_tu_puesto: "alarde" } }, "Haces una broma sobre «los que calientan la banda». Algunos ríen. {peer1}, no. Se levanta, coge la toalla y sale. Sientes que has ganado una batalla y has perdido algo más importante."),
    ]),
  S("rv-peer-cena", "rival", { after: [after("rv-peer-llega", "a", 4, 20)], clubTurns: [3, 40] }, "vida",
    "Una cena con {peer1} que se alarga",
    "Acabáis cenando los dos solos después de un entrenamiento largo: una hamburguesería de barrio, patatas para compartir y mil historias de cuando erais críos. {peer1} cuenta cómo su padre le llevaba al campo en una furgoneta sin calefacción; tú cuentas lo de tu primer balón. A los postres, la competencia ya se ha convertido en algo más parecido a una amistad rara.",
    [
      o("a", "Proponerle un pacto: pase lo que pase, os lo diréis a la cara", "Una amistad con reglas", { rel_vestuario: 3, moral: 6, flags: { rv_peer: "amigo" } }, "Os dais la mano por encima de las patatas. «Pase lo que pase», dice {peer1}. Seguiréis peleando por el mismo puesto, pero ahora hay una frontera que los dos conocéis."),
      o("b", "Dejarlo en una cena bonita y volver cada uno a lo suyo", "Mantener la distancia", { moral: 3, flags: { rv_peer: "cordial" } }, "Pagas tú. Os despedís en la puerta con un abrazo breve. No habéis hablado de fútbol ni una vez, y ambos lo notáis al día siguiente cuando el míster dice vuestros nombres a la vez."),
    ]),
  S("rv-peer-bronca", "rival", { after: [after("rv-peer-llega", "b", 3, 14)], clubTurns: [2, 30] }, "entrenamiento",
    "Una entrada de más con {peer1}",
    "Fue en un rondo de los de media hora: un balón dividido, dos pies que llegan a la vez y {peer1} en el suelo agarrándose el tobillo. Se levanta con la cara roja y te empuja con las dos manos. En medio segundo, medio vestuario os ha rodeado. El míster llega corriendo con el silbato en la boca. «¡¡Los dos, fuera!!».",
    [
      o("a", "Disculparte y ofrecerle la mano", "Rebajar la tensión", { rel_vestuario: 3, reputacion: 2, moral: -1, flags: { rv_peer: "tregua" } }, "Le tiendes la mano delante de todos. {peer1} duda un segundo y la estrecha con fuerza de más. «Si me vuelves a entrar así, te la devuelvo», dice. «Trato hecho», respondes. El míster, mirando, suspira de alivio."),
      o("b", "Defenderte: «La pelota era mía»", "No dar el brazo a torcer", { forma: 1, rel_entrenador: -3, rel_vestuario: -2, moral: 1, flags: { rv_peer: "guerra" } }, "Mantienes tu versión sin pestañear. El míster os manda a los dos a correr alrededor del campo, sin mirar. Cuando acabáis, sin decir nada, cada uno se va a un lado del vestuario."),
      o("c", "Reírte y quitarle hierro con una broma", "Humor", { rel_vestuario: 2, moral: 2, rel_entrenador: -1, flags: { rv_peer: "tregua" } }, "Dices: «Para ser un chaval de tu edad, empujas como un portero». El vestuario estalla. {peer1} intenta mantenerse serio, pero se le escapa una sonrisa. La bronca se queda en anécdota."),
    ]),
  S("rv-peer-lesion", "rival", { after: [after("rv-peer-llega", undefined, 6, 40)], clubTurns: [4, 40] }, "vestuario",
    "{peer1} se rompe",
    "Una caída sin aparente importancia en el entrenamiento y un grito que lo para todo. {peer1} se agarra la rodilla en el suelo, con la cara llena de lágrimas que intenta esconder. Los médicos tardan lo que tardan; tú te has quedado de pie, a cinco metros, con la sensación incómoda de que parte de ti había deseado, alguna vez, ese hueco.",
    [
      o("a", "Acompañarlo a la ambulancia y esperar noticias", "Estar a su lado", { rel_vestuario: 4, reputacion: 3, moral: 3, flags: { rv_peer: "amigo" } }, "Vas con él hasta la puerta de urgencias. «No me dejes solo», murmura. No lo haces. A la una de la madrugada, cuando le dicen que serán meses, es tu mano la que aprieta."),
      o("b", "Escribirle un mensaje cuando ya esté en casa", "Un gesto desde lejos", { rel_vestuario: 1, moral: 1 }, "Le escribes tres líneas que reescribes cuatro veces. «Vuelve más fuerte», dices. La respuesta tarda tres días: un simple «gracias» y un pulgar. Ya es algo."),
      o("c", "Seguir con tu rutina: es parte del juego", "Profesional frío", { forma: 1, moral: -2, rel_vestuario: -2 }, "Entrenas con la cabeza baja. Dos compañeros te miran y se callan. Hay frases que se piensan y no se dicen, y la de «qué dureza» es una de ellas."),
    ]),
  // ───── Los megacracks de tu generación ─────
  S("rv-mega-nombre", "rival", { minAge: 17, maxAge: 26, fama: [20, 100], notFlags: ["rv_mega_nombre"] }, "prensa",
    "Todo el mundo habla de {mega1}",
    "Una tertulia de televisión se pasa media hora comparándoos: tú, de {club}, y {mega1}, de {mega1_club}, ese {mega1_pos} de tu quinta que juega como si el campo fuera suyo. «No hay color», dice uno. «Todavía», contesta otro. Tu agente te manda el vídeo con un solo mensaje: «Mira esto antes de dormir».",
    [
      o("a", "Tomártelo como combustible: ver sus partidos para aprender", "Competir con cabeza", { forma: 2, moral: 2, media: 1, flags: { rv_mega_nombre: "combustible" } }, "Esa noche te pones tres partidos suyos con la libreta. Anotas qué hace cuando recibe de espaldas. Al final de la tercera, tienes ocho líneas y una conclusión: «Yo también puedo»."),
      o("b", "Quitarle importancia: «Cada uno hace su camino»", "Pasar de la comparación", { reputacion: 2, moral: 1, flags: { rv_mega_nombre: "calma" } }, "En la siguiente rueda de prensa lo dices en una frase corta. Funciona: los titulares ya no son «el duelo de la generación», sino «el que no entra al trapo»."),
      o("c", "Responder en redes con un guiño competitivo", "Entrar al juego", { fama: 3, rel_aficion: 2, reputacion: -1, flags: { rv_mega_nombre: "pique" } }, "Subes una foto entrenando con la frase: «Los comparadores no marcan goles». Cien mil likes en una hora. Alguien de {mega1_club} lo ha visto, seguro."),
    ], { weight: 1.5 }),
  S("rv-mega-declaracion", "rival", { after: [after("rv-mega-nombre", undefined, 3, 16)], fama: [20, 100] }, "prensa",
    "{mega1} habla de ti en una entrevista",
    "Un diario publica una entrevista con {mega1}. A la pregunta de qué piensa de ti, responde con una media sonrisa que se nota hasta en el papel: «Es un buen jugador. De los que tienen que demostrar muchas cosas todavía». Tres redes distintas lo han puesto a todo volumen. Tu móvil no para.",
    [
      o("a", "Contestar con elegancia: «Le deseo lo mejor»", "Subir el nivel", { reputacion: 4, rel_aficion: 2, moral: 1, flags: { rv_mega: "elegante" } }, "Lo dices en la zona mixta, sin mirar a cámara, con una media sonrisa que ensayaste en el espejo. La frase es la más repetida del día. En {mega1_club}, alguien le enseña la noticia a {mega1}. Nadie se ríe."),
      o("b", "Devolverle el golpe con ironía", "Responder con filo", { fama: 4, rel_aficion: 3, reputacion: -2, moral: 2, flags: { rv_mega: "pique" }, }, "«Tengo mucho que demostrar, sí. Y él, mucho que defender», dices. La frase se hace tendencia. Y el pique, ya, es oficial: la prensa lo bautiza «la rivalidad de la generación».", { thread: th("rencor", "{mega1}", "Os habéis lanzado puyas en público; os debéis un partido de los que se recuerdan.") }),
      o("c", "No decir nada y que hable el campo", "Silencio", { forma: 2, moral: -1, flags: { rv_mega: "silencio" } }, "Te quedas callado. Pero en el siguiente partido sales con una intensidad que el míster nota desde el banquillo. «¿Qué te ha pasado?», pregunta. «Nada», contestas. Mentira."),
    ]),
  S("rv-mega-tuit", "rival", { fama: [35, 100], minAge: 17, maxAge: 26, notFlags: ["rv_mega_tuit"] }, "prensa",
    "{mega2} le da «me gusta» a un tuit que se burla de ti",
    "No lo ha escrito él: lo ha escrito un anónimo con una foto tuya mal recortada y una frase cruel sobre tu último partido. Pero {mega2}, el {mega2_pos} de {mega2_club}, le ha dado al corazoncito. Lo borra a los diez minutos. Ya da igual: alguien ha hecho una captura y la está compartiendo con la etiqueta de su nombre.",
    [
      o("a", "Escribirle un mensaje privado y preguntarle por qué", "Dar la cara en privado", { reputacion: 2, moral: 2, flags: { rv_mega_tuit: "privado" } }, "Le escribes tres líneas educadas. {mega2} tarda dos horas en contestar: «Fue sin querer. Perdona». No sabes si creértelo, pero te basta para dejarlo ahí."),
      o("b", "Ignorarlo y no darle más cuerda", "Madurez", { reputacion: 3, moral: -1, flags: { rv_mega_tuit: "ignorado" } }, "No contestas. Tu agente te mira sorprendido: «¿Seguro?». «Seguro». En dos días, el tema se ahoga solo y tú te quedas con un punto más de respeto en el vestuario."),
      o("c", "Subir una historia con una indirecta", "Responder al estilo de la casa", { fama: 3, rel_aficion: 2, reputacion: -2, flags: { rv_mega_tuit: "indirecta" } }, "Subes una foto de tu último gol con la frase: «Los likes no se meten». Medio mundo se ríe. En {mega2_club} ahora saben que vas en serio."),
    ]),
  S("rv-mega-noche", "rival", { minAge: 17, maxAge: 28, notFlags: ["rv_mega_noche"], turn: [4, 10] }, "vida",
    "{mega3} firma una noche de las que se recuerdan",
    "Desde el sofá, con el móvil en una mano y el mando en la otra, ves cómo {mega3}, de {mega3_club}, marca tres goles en veinte minutos en un partido que todo el continente está mirando. Tu madre, desde la cocina, dice sin querer: «Qué bien juega ese chico». Por una vez, no sabes si quieres tirar el mando o aprender.",
    [
      o("a", "Apuntar tres cosas que hace y entrenarlas mañana", "Aprender de él", { forma: 2, media: 1, moral: 2, flags: { rv_mega_noche: "aprende" } }, "Anotas: el control orientado, el desmarque de ruptura y cómo pide el balón antes de recibir. Al día siguiente, en el entrenamiento, los tres se notan. El míster levanta la vista: «¿Y esto?». Sonríes."),
      o("b", "Apagar la tele y salir a correr de noche", "Quemar la rabia", { forma: 3, moral: -1, flags: { rv_mega_noche: "rabia" } }, "Te pones las zapatillas y corres por el parque con los auriculares puestos y la rabia por dentro. A los cuarenta minutos, ya no es rabia: es una promesa."),
      o("c", "Escribirle un mensaje de enhorabuena sincero", "Respeto", { reputacion: 4, rel_aficion: 1, moral: 2, flags: { rv_mega_noche: "respeto", rv_mega_amigo: true } }, "«Enorme. Algún día jugamos en el mismo sitio», escribes. {mega3} responde a los diez minutos con un emoji y un «ojalá». No sabéis aún lo que significa, pero algo empieza ahí."),
    ]),
  S("rv-mega-respeto", "rival", { after: [after("rv-mega-declaracion", undefined, 8, 40)], fama: [30, 100] }, "vida",
    "Coincidir con {mega1} en el túnel",
    "Es un partido de esos de dos equipos que no se miran: {mega1_club} y el tuyo. En el túnel, a falta de dos minutos para salir, os encontráis uno al lado del otro, en silencio, mirando al frente. Los dos sabéis lo que hay: todo lo dicho en la prensa, todo lo que no se ha dicho. Hay veintidós jugadores pendientes de lo que pase ahora.",
    [
      o("a", "Tenderle la mano con una sonrisa", "Caballerosidad", { reputacion: 5, rel_aficion: 3, moral: 3, flags: { rv_mega: "respeto" } }, "{mega1} se queda un segundo parado, mira tu mano, la estrecha. «Que gane el mejor», dice. «Ya te lo haré saber», respondes. El árbitro, a tu lado, intenta no sonreír."),
      o("b", "Mantenerle la mirada sin decir nada", "Mensaje claro", { forma: 2, moral: 2, rel_vestuario: 1, flags: { rv_mega: "pique" } }, "No hay una palabra. Os miráis. Los dos salís al campo con la mandíbula tensa y los puños a medio cerrar. Esa noche, el partido va a ser distinto."),
      o("c", "Decirle una broma sobre su declaración", "Humor con filo", { fama: 2, moral: 3, flags: { rv_mega: "humor" } }, "«Todavía tengo muchas cosas que demostrar, ¿no?», le dices al oído. {mega1} aguanta la risa y te da un codazo suave. Ya no sois solo rivales: sois algo más raro."),
    ]),
  S("rv-mega-fichaje", "rival", { fama: [30, 100], market: "abierta", minAge: 17, maxAge: 28, notFlags: ["rv_mega_fichaje"] }, "prensa",
    "{mega2} se va a {mega3_club}… y suena tu nombre para sustituirle",
    "Los titulares de la mañana lo dan por hecho: {mega2} cambia de camiseta y {mega2_club} busca un recambio de nivel. Tres periodistas apuntan a ti, uno a un rival de tu edad y otro a un nombre que no conoces. Tu agente llama a las nueve y diez con una sola palabra: «Interesante».",
    [
      o("a", "Dejarle claro a tu agente que escuche, pero sin prisa", "Abrir la puerta", { rel_representante: 3, fama: 2, moral: 1, flags: { rv_mega_fichaje: "abierta" } }, "«Escucha todo, no firmes nada», le dices. Dos horas después, tu agente ya tiene una cita pendiente con alguien de {mega2_club}. No sabes cómo ha sido tan rápido."),
      o("b", "Cortar el rumor: «Estoy centrado en mi club»", "Lealtad", { rel_aficion: 4, rel_entrenador: 3, rel_representante: -2, flags: { rv_mega_fichaje: "leal" } }, "Lo dices ante todas las cámaras. En tu grada, ese día, te aplauden por primera vez con ganas. Tu agente suspira pero asiente."),
      o("c", "No decir nada y ver qué pasa", "Esperar", { moral: 0, flags: { rv_mega_fichaje: "espera" } }, "Prefieres que el rumor se cueza solo. Tarda cuatro días en apagarse. Pero esa semana, cada pase tuyo se miró con un ojo extra en la grada."),
    ]),
  S("rv-mega-seleccion", "rival", { flags: ["sel_debut"], notFlags: ["rv_mega_seleccion"], fama: [35, 100], media: [70, 99] }, "vestuario",
    "El seleccionador te sienta junto a {mega1}",
    "El primer día de la concentración, el seleccionador reparte las habitaciones y te toca compartir con {mega1}, el mejor de tu generación. Se hace un silencio de los que se oyen. En el pasillo, los veteranos se miran y se aguantan la risa. {mega1} deja la maleta sobre su cama y dice: «Yo ronco. Aviso».",
    [
      o("a", "Responder con humor y romper el hielo", "Buen rollo", { rel_vestuario: 3, moral: 5, flags: { rv_mega_seleccion: "amigos", rv_mega_amigo: true } }, "«Yo hablo dormido. Aviso también», dices. Os reís. Esa noche os quedáis hablando hasta las dos, en la oscuridad, de lo que más teméis. Os desconocíais, hasta hoy."),
      o("b", "Mantener las distancias: sois rivales, no amigos", "Profesionalidad", { moral: 0, flags: { rv_mega_seleccion: "frios" } }, "Os dais las buenas noches con un asentimiento. En el entrenamiento os pasáis el balón con la educación de dos desconocidos que cumplen. El seleccionador no dice nada, pero toma nota."),
      o("c", "Pedir cambiar de habitación con alguien", "Evitar el roce", { rel_vestuario: -2, moral: -2, flags: { rv_mega_seleccion: "cambio" } }, "Lo pides con discreción. El utillero te mira como si hubieras suspendido un examen. Al final, cambias con un compañero que ronca todavía más. Nadie dice nada, pero todos lo saben."),
    ]),
  S("rv-mega-lesion", "rival", { after: [after("rv-mega-declaracion", undefined, 10, 60)], fama: [30, 100] }, "prensa",
    "{mega1} se lesiona de gravedad",
    "Un parte médico de tres líneas y una foto de {mega1} saliendo del estadio con muletas. Tu móvil explota: periodistas, aficionados, un grupo de whatsapp del vestuario que ya está haciendo bromas de mal gusto. Tú, con la pantalla en la mano, recuerdas todo lo que os habéis dicho. Y notas, en el fondo, que ni una gota de ello te alegra.",
    [
      o("a", "Mandarle un mensaje sincero deseándole una buena recuperación", "Estar a la altura", { reputacion: 5, rel_aficion: 3, moral: 3, flags: { rv_mega: "respeto", rv_mega_amigo: true } }, "«Vuelve pronto. Sin ti el campo está más aburrido», escribes. {mega1} contesta a las seis horas: «Te debo una. Y un pique, para cuando vuelva». Sonríes."),
      o("b", "No decir nada: tu mensaje no cambia nada", "Frialdad", { moral: -1, reputacion: -1, flags: { rv_mega: "frio" } }, "Dejas pasar la semana. Cuando se te pasa por la cabeza escribirle, ya es tarde. Hay mensajes que, si no se mandan el primer día, no se mandan nunca."),
      o("c", "Callarte en público, pero ofrecerte a hablar con su club", "Un gesto discreto", { reputacion: 3, moral: 2, flags: { rv_mega: "respeto" } }, "Hablas con un directivo de {mega1_club} a quien conoces: «Si necesita algo, aquí estoy». Nadie lo cuenta en prensa. Pero {mega1} lo sabe, y eso vale más que un titular."),
    ]),
];
