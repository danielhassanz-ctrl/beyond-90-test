/**
 * Más risa: situaciones cotidianas llevadas al absurdo, con pocas condiciones para que salgan en
 * muchas carreras. Algunas dejan un hilo pequeño que vuelve (el tatuaje, la apuesta, el chiste).
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const HUMOR3: BankScene[] = [
  S("h3-tatuaje", "humor", { minAge: 18, fama: [35, 100], clubTurns: [3, 400], notFlags: ["h3_tatuaje"] }, "vida",
    "Un aficionado se tatúa tu cara en el brazo… y no se parece nada",
    "Te lo enseña a la salida del entrenamiento, con orgullo, remangándose la camisa: tu rostro, en tinta negra, con una expresión que mezcla el asombro con un cierto estreñimiento. «Es que el tatuador no tenía fotos buenas», explica. Te mira con ojos de cachorro. Tú intentas decir algo amable. Se te escapa un: «Se parece… a mi tío».",
    [
      o("a", "Firmarle el tatuaje con un rotulador y hacerte una foto con él", "Un gesto de ídolo", { fama: 3, rel_aficion: 6, moral: 5, flags: { h3_tatuaje: "firmo" } }, "Firmas sobre la tinta. El hombre se hace una foto con el brazo en alto, como un trofeo. La imagen se hace viral con el título «El día que el tatuaje conoció al original». Os reís los dos."),
      o("b", "Ofrecerte a pagarle un retoque con un buen tatuador", "Un detalle práctico", { patrimonio: -350, rel_aficion: 4, reputacion: 3, flags: { h3_tatuaje: "retoque" } }, "Le pagas una sesión con un artista de verdad. El nuevo tatuaje se parece sospechosamente a ti. «Ahora sí», dice el hombre, con lágrimas. «Antes eras tú, pero de lejos»."),
      o("c", "Disimular tu espanto y marcharte rápido", "Escapar con elegancia", { moral: -1, flags: { h3_tatuaje: "escapo" } }, "Le das la mano, le sonríes y desapareces. En el coche, te echas a reír sin poder parar. Una semana después, lo ves en una foto en redes con el tatuaje y una frase: «El mejor». Se te encoge el corazón."),
    ]),
  S("h3-tatuaje-vuelve", "humor", { after: [after("h3-tatuaje", undefined, 10, 80)], minAge: 20 }, "vida",
    "El aficionado del tatuaje te pide que seas padrino de su hija",
    "Años después, aparece de nuevo con una niña en brazos, un traje que le queda corto y una carta escrita a mano. «Quiero pedirte algo —dice—. Mi hija nació el día que marcaste aquel gol. Y me gustaría que fueras su padrino». Le miras. Detrás del puño de su camisa, asoma tu cara tatuada, un poco más difuminada por los años. La niña te agarra el dedo.",
    [
      o("a", "Aceptar con una sonrisa inmensa", "Ser su padrino", { moral: 9, rel_aficion: 7, reputacion: 4, flags: { h3_ahijada: true } }, "El bautizo es una fiesta de barrio con paella, orquesta y un montón de camisetas tuyas. La niña llora cuando la sostienes y se calla al ver tu cara en el brazo de su padre. «Es que lo reconoce», dice él."),
      o("b", "Aceptar pero con una condición: que se borre el tatuaje", "Con humor", { moral: 6, rel_aficion: 4, flags: { h3_ahijada: true } }, "El hombre se ríe, se levanta la manga y dice: «Antes muerto». Os abrazáis. El tatuaje se queda. La niña, años más tarde, lo muestra en el colegio con orgullo: «Es mi padrino»."),
    ]),
  S("h3-camarero", "humor", { minAge: 18, clubTurns: [2, 400], notFlags: ["h3_camarero"] }, "vida",
    "El camarero de tu bar de siempre te apuesta que no marcas el domingo",
    "Lleva ocho años sirviéndote el mismo café, mirándote con una mezcla de cariño y desafío. Esta mañana, mientras te pone la tostada, dice sin levantar la vista: «Te apuesto un desayuno a que no marcas el domingo». Hay otro cliente, el del periódico, que levanta una ceja. El camarero, con una sonrisa calculada, espera tu respuesta.",
    [
      r("a", "Aceptar la apuesta y salir a por todas", "Jugártela", 0.5, "Marcas en el 63, de cabeza. El lunes, el camarero te sirve el desayuno más grande de tu vida: dos tostadas, un zumo, un bollo y una tortilla. «Hoy invita la casa —dice—. Y una foto contigo para el bar».", { moral: 6, rel_aficion: 3, flags: { h3_camarero: "gano" } }, "No marcas, y el camarero lo celebra como si hubiera ganado un Mundial. Te sirve el café más lento de la historia, mirándote con mala idea. «Qué rico sabe cuando uno gana», murmura.", { moral: 2, rel_aficion: 2, flags: { h3_camarero: "pierdo" } }, "forma"),
      o("b", "Subir la apuesta: un año de desayunos", "Doble o nada", { moral: 3, fama: 1, flags: { h3_camarero: "doble" } }, "El camarero se queda mudo. Acepta. A la semana, estáis todos pendientes del partido: tú, él, el del periódico y media barra. Marcas de penalti. Se pone a llorar de risa. Esa noche, cuelga en la pared: «Este año, el desayuno es del crack»."),
      o("c", "Decirle que no apuestas con quien te sirve el café", "Ser prudente", { moral: 0, flags: { h3_camarero: "no" } }, "El camarero asiente, resignado. «Entonces, nada». Ese domingo, marcas. Cuando lo ves el lunes, hay una nota en la barra: «Te debía un desayuno. Está pagado»."),
    ]),
  S("h3-cunado", "humor", { minAge: 18, clubTurns: [1, 400], notFlags: ["h3_cunado"] }, "vida",
    "Tu cuñado se convierte en tu entrenador personal… sin que se lo pidas",
    "Aparece en cada comida familiar con una libreta y un silbato. «Te he visto jugar y creo que te falta explosividad en el primer paso», dice, con una seriedad pasmosa. Es contable. Nunca ha jugado más allá de la pachanga de los domingos. Sin embargo, tiene teorías sobre tu posición, tu alimentación y tu postura. Tu madre le sirve más croquetas. Tu hermana te mira con cara de «aguanta».",
    [
      o("a", "Escucharle con paciencia y darle las gracias", "Ser educado", { moral: 3, reputacion: 2, flags: { h3_cunado: "educado" } }, "Le dejas hablar durante toda la sobremesa. Al acabar, tu cuñado, orgulloso, se guarda la libreta en el bolsillo. «De nada, hombre. Para eso está la familia». Y te sientes un poco mejor, sin saber por qué."),
      o("b", "Retarle a un partido de pachanga para demostrar quién sabe más", "Resolverlo en el campo", { moral: 5, rel_vestuario: 1, flags: { h3_cunado: "reto" } }, "Le dejas ganar por 5-4, con un gol suyo de rebote que celebra durante todo el año. «Veis cómo sí sé», dice a cada pariente. Tú sonríes. Tu hermana te manda un emoji de aplauso."),
      o("c", "Pedirle que te mande un plan de entrenamiento por escrito", "Pasarle la pelota", { forma: 1, moral: 4, flags: { h3_cunado: "plan" } }, "Te llega un PDF de cuarenta páginas, con tablas, gráficos y un anexo de recetas. Lo lees en un avión. Una de las recetas, curiosamente, es buenísima. Tu madre la hace el domingo siguiente."),
    ]),
  S("h3-peluqueria", "humor", { minAge: 18, fama: [30, 100], clubTurns: [2, 400], notFlags: ["h3_peluqueria"] }, "vida",
    "Todo el mundo en la peluquería te da consejos tácticos",
    "Es una de esas peluquerías de barrio con revistas atrasadas, un secador gigantesco y cuatro señoras mayores con rulos. Entras a cortarte el pelo y sales con una clase magistral de fútbol. «Tú tienes que tirar más con la izquierda, hijo». «Y el entrenador, muy mal. Muy mal». «Mi marido dice que eres un fichaje fenomenal». Nadie te pregunta qué opinas.",
    [
      o("a", "Escuchar y asentir como si fuera la mejor táctica del mundo", "Hacer caso", { rel_aficion: 5, moral: 4, flags: { h3_peluqueria: "escucho" } }, "Te corta el pelo una señora que te canta una copla mientras te sermonea. Sales con un corte un poco irregular y la cabeza llena de ideas. Esa semana, tiras con la izquierda. Marcas. Le mandas flores."),
      o("b", "Contarles lo que de verdad pasa dentro del vestuario", "Sincerarte", { rel_aficion: 4, reputacion: -1, moral: 3, flags: { h3_peluqueria: "cuento" } }, "Les cuentas anécdotas sin importancia. A la mañana siguiente, medio barrio sabe qué comió el portero. Tu agente te llama: «No cuentes nada en la peluquería». «Era solo una anécdota», dices."),
      o("c", "Poner los auriculares y fingir que estás dormido", "Desconectar", { moral: 1, flags: { h3_peluqueria: "auriculares" } }, "Escuchas música mientras te cortan. Cuando sales, hay un cartel nuevo en la puerta: «Aquí se ha cortado el pelo el 9 (y no habló con nadie)»."),
    ]),
  S("h3-corbata", "humor", { minAge: 18, clubTurns: [3, 400], notFlags: ["h3_corbata"] }, "vestuario",
    "El club impone corbata para viajar y nadie sabe anudársela",
    "Es la nueva norma del presidente: traje y corbata en los desplazamientos. El vestuario, que está más acostumbrado a los chándales, entra en pánico. Se forman filas de jugadores delante de un tutorial de móvil. El portero tiene una corbata que le cuelga por debajo del cinturón. Un central se la ha puesto del revés. El utillero, con una sonrisa, saca una caja con corbatas de repuesto.",
    [
      o("a", "Organizar una clase de nudos para todo el vestuario", "Hacerte el experto", { rel_vestuario: 6, moral: 4, reputacion: 2, flags: { h3_corbata: "clase" } }, "Aprendiste el nudo Windsor en el colegio, y es hora de rentabilizarlo. Durante veinte minutos, enseñas a los compañeros con una paciencia de maestro. El presidente, al verlos, comenta: «Esto sí que es trabajo en equipo»."),
      o("b", "Hacerte tú el nudo mal y que se rían", "Humor tonto", { rel_vestuario: 5, moral: 4, flags: { h3_corbata: "mal" } }, "Te la pones como un pañuelo de pirata. El vestuario lo celebra: la corbata pirata se convierte en moda. El presidente, por única vez en su vida, se ríe en público."),
      o("c", "Protestar contra la norma y proponer un chándal de gala", "Plantear una alternativa", { rel_entrenador: -1, rel_vestuario: 4, moral: 2, flags: { h3_corbata: "chandal" } }, "El presidente lo estudia durante diez segundos. «Vale. Un chándal de gala». A los dos meses, todo el equipo viaja con un chándal azul marino con ribetes dorados. Parece un traje, sin parecerlo."),
    ]),
  S("h3-pegatinas", "humor", { minAge: 16, clubTurns: [2, 400], notFlags: ["h3_pegatinas"] }, "vestuario",
    "Alguien llena tu taquilla de pegatinas de dibujos animados",
    "Llegas al vestuario y tu taquilla parece el cuaderno de un niño de seis años: pegatinas de unicornios, de dinosaurios, de gatitos con sombrero. Hay una que dice «Estoy aprendiendo» y otra con una estrella de purpurina. El vestuario, silencioso, finge atarse las botas. Una risa ahogada delata a un lateral. El capitán, con cara de póker, murmura: «Esto es inexplicable».",
    [
      o("a", "Respetar el arte y dejar las pegatinas como están", "Orgullo infantil", { rel_vestuario: 6, moral: 4, flags: { h3_pegatinas: "dejo" } }, "Te quedas las pegatinas y las luces durante toda la temporada. Con el tiempo, otros compañeros añaden las suyas. Tu taquilla se convierte en un mural. «Es el museo del vestuario», dice el utillero."),
      o("b", "Investigar hasta descubrir al culpable y vengarte", "Ser detective", { rel_vestuario: 4, moral: 3, flags: { h3_pegatinas: "venganza" } }, "Descubres que fue el portero. Esa noche, su taquilla amanece forrada de papel de regalo con lazos. Lo que sigue es una guerra de bromas que dura toda la temporada."),
      o("c", "Quitarlas con paciencia y no decir nada", "Mantener la calma", { moral: 0, flags: { h3_pegatinas: "quito" } }, "Tardas veinte minutos y te quedan restos de pegamento. Al día siguiente, la taquilla vuelve a estar llena. Resignado, empiezas a pensar si no te gusta un poco."),
    ]),
  S("h3-silbato", "humor", { minAge: 16, clubTurns: [2, 400], notFlags: ["h3_silbato"] }, "entrenamiento",
    "Un compañero imita el silbato del árbitro tan bien que todo el mundo se para",
    "Es un talento escondido: el suplente de la banda izquierda, con la boca y las manos, reproduce un silbato idéntico al del árbitro. En pleno entrenamiento, suena un pitido seco y todos los jugadores se detienen, creyendo que ha pitado el míster. El míster, en la otra punta, se gira, desconcertado. «¿Quién ha pitado?». Nadie contesta. Todos miran al suplente, que silba una melodía.",
    [
      o("a", "Proponerle usarlo en un partido para despistar al rival", "Una idea malvada", { rel_vestuario: 6, moral: 4, flags: { h3_silbato: "plan" } }, "En un córner, desde la banda, el suplente silba. El rival se detiene. Tú aprovechas y remachas el balón. El árbitro, atónito, anula el gol. «Esto no puede ser», murmura. La anécdota recorre el país."),
      o("b", "Pedirle que te enseñe a hacerlo", "Aprender el truco", { moral: 5, rel_vestuario: 4, flags: { h3_silbato: "aprendo" } }, "Pasas una tarde entera practicando. Lo consigues a medias. En el vestuario, silbas a todos. El míster, en la puerta, te mira: «Ese silbato lo conozco». Tú, con cara de ángel, pones el dedo en los labios."),
      o("c", "Pedirle que lo deje antes de que el míster se enfade de verdad", "Poner orden", { rel_entrenador: 2, moral: 0, flags: { h3_silbato: "orden" } }, "El suplente se disculpa. El míster, después, le pide que silbe una última vez para la despedida de un veterano. Así se hace. Es la despedida más rara y más bonita que ha visto el club."),
    ]),
  S("h3-balones", "humor", { minAge: 16, clubTurns: [2, 400], notFlags: ["h3_balones"] }, "entrenamiento",
    "Se acaban los balones y hay que entrenar con uno solo",
    "Algún desalmado se ha dejado el saco de balones en el autobús, y ahora, en medio del campo, hay veintidós jugadores, un míster y un único balón, desgastado y con una mancha de barro. «Con uno hacemos el trabajo», dice el míster, con una calma que da miedo. Al cuarto minuto, el balón sale al camino de los coches. Al sexto, lo recoge un transeúnte.",
    [
      o("a", "Correr tras el balón y hacer de recogepelotas", "Mojarte", { forma: 2, rel_vestuario: 4, rel_entrenador: 2, flags: { h3_balones: "corro" } }, "Te conviertes en el recogepelotas oficial. Corres tres kilómetros cada mañana. El míster, orgulloso, anota: «El que más corre es el que más sabe». Tu forma física nunca estuvo mejor."),
      o("b", "Proponer un rondo con una piedra de por medio", "Una idea absurda", { rel_vestuario: 6, moral: 4, flags: { h3_balones: "piedra" } }, "Inventáis un juego con una piedra redonda. Dura diez minutos. Al final, alguien se hace daño en el dedo del pie. El rondo se declara «deporte de riesgo». El míster ordena: «Mañana, balones nuevos»."),
      o("c", "Ir a comprarlos tú mismo a la tienda más cercana", "Resolver el problema", { patrimonio: -150, rel_entrenador: 3, reputacion: 3, flags: { h3_balones: "compro" } }, "Compras seis balones de reglamento en media hora. Los vendedores te reconocen y te hacen un descuento. El míster, al verlos, dice: «Esto es iniciativa». Y apunta tu nombre en la libreta."),
    ]),
  S("h3-pelo-capitan", "humor", { minAge: 17, clubTurns: [3, 400], notFlags: ["h3_pelo_cap"] }, "vestuario",
    "El capitán se tiñe el pelo de rubio platino por una apuesta",
    "Perdió una apuesta contra un compañero joven y ahora debe llevar el pelo rubio durante todo el mes. El resultado es espectacular: parece un jugador de los noventa con un punto de profesionalidad perdido. Sale al campo con la cinta de capitán sobre una melena platino. El árbitro, al sorteo, le mira dos veces. En la grada, los hinchas se parten.",
    [
      o("a", "Teñirte tú también de rubio solidario", "Un gesto de equipo", { rel_vestuario: 8, moral: 5, fama: 2, flags: { h3_pelo_cap: "rubio" } }, "A los dos días, medio vestuario es rubio platino. El capitán, emocionado, dice: «Esto es lealtad». La foto del equipo, con todos rubios, se convierte en un póster. El utillero se tiñe también. Es horrible, y es perfecto."),
      o("b", "Hacer una broma pesada con un tinte permanente", "Aprovechar la ocasión", { rel_vestuario: 4, moral: 3, rel_entrenador: -1, flags: { h3_pelo_cap: "broma" } }, "Sustituyes el champú de un compañero por uno que tiñe de verde. Al día siguiente, tiene el pelo de color lechuga. El míster, que lo ve, respira hondo y declara: «Se acabaron las bromas»."),
      o("c", "Mantenerte al margen y reírte desde la banda", "Disfrutar de la función", { moral: 3, flags: { h3_pelo_cap: "banda" } }, "Te limitas a mirar y a hacer fotos. Un mes después, el capitán se corta el pelo con solemnidad y lo guarda en una bolsa. «Para la historia», dice."),
    ]),
  S("h3-cena-mal", "humor", { minAge: 18, patrimonio: [1000, 100000000], clubTurns: [2, 400], notFlags: ["h3_cena_mal"] }, "vida",
    "Una cena romántica sale desastrosamente mal por culpa de una fan",
    "Reservaste en un restaurante discreto, con velas y una carta en francés. Pero la camarera te ha reconocido, y desde la mesa de al lado una fan te hace fotos con el flash. A tu lado, tu acompañante intenta mantener la sonrisa. La camarera, entusiasmada, te pide un autógrafo en el menú mientras sirve la sopa. Sin darse cuenta, te la vierte sobre el regazo.",
    [
      o("a", "Reírte de la situación y firmar el menú con el pantalón manchado", "Quitar hierro", { moral: 4, fama: 2, rel_aficion: 3, flags: { h3_cena_mal: "rio" } }, "Firmas «Con cariño, el de la sopa». La camarera se pone roja de vergüenza y de risa. El restaurante te invita a la cena y te regala un pantalón nuevo. Tu acompañante, entre carcajadas, dice: «Esta es la mejor cita de mi vida»."),
      o("b", "Pedir educadamente que te dejen cenar tranquilo", "Poner un límite", { moral: -1, reputacion: 1, flags: { h3_cena_mal: "limite" } }, "La camarera se disculpa. La fan baja el móvil. El resto de la cena transcurre en un silencio algo incómodo. Pagas la cuenta con una propina enorme. Al salir, descubres que la camarera ha dejado una nota: «Gracias por entender»."),
      o("c", "Cambiar de restaurante y cenar en la calle de un puesto de kebab", "Improvisar", { moral: 5, patrimonio: -20, flags: { h3_cena_mal: "kebab" } }, "Termináis cenando un kebab en un banco, con las luces de la ciudad de fondo, y es, probablemente, la cena más feliz del año. Alguien os saca una foto: «El crack, de kebab». La foto es tierna."),
    ]),
  S("h3-sorteo-camisetas", "humor", { minAge: 17, clubTurns: [3, 400], notFlags: ["h3_sorteo_cam"] }, "vestuario",
    "Una apuesta del vestuario deja a un compañero sin camiseta delante de todos",
    "Fue por una apuesta: el último en colocarse la camiseta del club con el número invertido debía quitársela delante del grupo. Resultó ser el delantero suplente, un chico tímido que se queda, de pronto, en el centro del vestuario con la camiseta a medio quitar y la cara color tomate. Todos aplauden. Alguien silba. El míster, en la puerta, tose con una discreción nula.",
    [
      o("a", "Quitarte tú también la camiseta para solidarizarte", "Un gesto de grupo", { rel_vestuario: 8, moral: 5, flags: { h3_sorteo_cam: "solidario" } }, "En un minuto, todo el vestuario está sin camiseta, haciendo el ridículo con orgullo. El míster entra y suelta: «Qué manera tan rara de preparar un partido». Aquel día, jugáis con una confianza inusitada."),
      o("b", "Tirarle una toalla para taparle y cortar el apuro", "Un gesto amable", { rel_vestuario: 5, reputacion: 3, moral: 2, flags: { h3_sorteo_cam: "toalla" } }, "El chico te mira con gratitud. «Gracias», murmura. Años después, en su despedida, te dirá que ese día supo que podía confiar en alguien. Y tú, que fue solo una toalla."),
      o("c", "Reírte tanto que te falta el aire", "Perder el control", { moral: 4, rel_vestuario: 3, flags: { h3_sorteo_cam: "risa" } }, "Te caes al suelo de risa. El vestuario entero te imita. El míster, al verlo, resopla: «Estáis todos locos». Al final, él también se ríe, aunque lo disimule con una tos."),
    ]),
];
