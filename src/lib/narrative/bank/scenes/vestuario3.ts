/**
 * Vestuario, tercera parte: lo que no se cuenta fuera. Rutinas absurdas, apuestas que se cobran,
 * un idioma inventado, la tertulia de las duchas. Más risa, algo de ternura y varias marcas que
 * vuelven (la caja común, el idioma, la liga de fantasía).
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const VESTUARIO3: BankScene[] = [
  S("v3-idioma", "vestuario", { minAge: 17, clubTurns: [3, 400], notFlags: ["v3_idioma"] }, "vestuario",
    "El vestuario inventa un idioma propio que nadie entiende fuera",
    "Empezó con una broma: llamar «pelusa» al balón y «tostada» al córner. A las dos semanas, los veinte jugadores hablan una jerga que incluye «aceituna» por falta, «bufanda» por contra y «abuela» por el míster. Un periodista, escuchando una entrevista, no entiende nada. El míster, desconcertado, pide una traducción. Tú, que has ayudado a inventar tres palabras, sientes un orgullo extraño.",
    [
      o("a", "Escribir un diccionario del vestuario y repartirlo", "Ser el cronista", { rel_vestuario: 7, moral: 5, flags: { v3_idioma: "diccionario" } }, "El diccionario tiene veintitrés entradas y un prólogo en verso. Lo pegas en el corcho. Un fisio lo fotografía para enseñárselo a sus sobrinos. Años después, la palabra «tostada» sigue en uso en el club."),
      o("b", "Utilizar el idioma en una rueda de prensa para despistar", "Una travesura", { fama: 3, rel_vestuario: 5, moral: 4, flags: { v3_idioma: "prensa" } }, "Contestas «Hoy hemos jugado con mucha aceituna y poca bufanda». El periodista te mira, sin entender. El vídeo se hace viral: «El delantero que habla en clave». El míster, desde la puerta, aguanta la risa."),
      o("c", "Resistirte y seguir hablando normal", "Mantener la normalidad", { moral: 0, rel_vestuario: -1, flags: { v3_idioma: "no" } }, "Tus compañeros te llaman «el de la lengua oficial». Al mes, sin darte cuenta, dices «tostada» en pleno partido. Un rival te mira, desconcertado. Ya eres uno de los suyos."),
    ]),
  S("v3-liga-fantasia", "vestuario", { minAge: 17, clubTurns: [3, 400], notFlags: ["v3_fantasia"] }, "vestuario",
    "El vestuario monta una liga de fantasía y todos se vuelven locos por los puntos",
    "Alguien ha creado un grupo con una hoja de cálculo, una tabla con colores y una norma: cada uno elige a once jugadores de la liga. Los puntos se cuentan los lunes y el último paga una cena. Pronto, el vestuario se divide en entrenadores de salón: el portero revisa estadísticas en la ducha, el capitán anota un traspaso a escondidas y tú descubres, con horror, que tu propio nombre aparece en el equipo de tres compañeros.",
    [
      o("a", "Entrar en la liga y armar un equipo imbatible", "Competir", { rel_vestuario: 5, moral: 4, flags: { v3_fantasia: "juego" } }, "Estudias estadísticas, observas lesiones y fichas a un desconocido de un equipo de mitad de tabla. Ganas tres jornadas seguidas. El capitán, derrotado, te mira: «Eres un traidor al sistema». Te regala un cartel que dice «Entrenador de salón»."),
      o("b", "Negarte a participar con la excusa de que ya tienes bastante con tu equipo real", "Mantener la cabeza", { moral: 0, flags: { v3_fantasia: "paso" } }, "Les dices que tienes que entrenar. Los compañeros se ríen. A los dos meses, la liga se ha convertido en una obsesión. Todos fichan y se quejan. Tú, que no juegas, observas con cierta superioridad."),
      o("c", "Ponerte tú mismo en tu equipo y tirarte el pegote", "Hacerte el egocéntrico", { rel_vestuario: 3, moral: 3, reputacion: -1, flags: { v3_fantasia: "ego" } }, "Te eliges como capitán, con puntos dobles. Los compañeros te llaman «el narcisista». Pero cuando marcas, la hoja se actualiza y ganas puntos. Te recompensan con una camiseta que dice «MVP de mí mismo»."),
    ]),
  S("v3-ducha-tertulia", "vestuario", { minAge: 17, clubTurns: [3, 400], notFlags: ["v3_ducha"] }, "vestuario",
    "Las duchas se convierten en una tertulia filosófica",
    "Ocurre después de una derrota: tres jugadores, bajo el agua, hablan sobre el sentido de la vida, el destino y si un pase atrás es una renuncia o una estrategia. El utillero, con una toalla al hombro, escucha con los brazos cruzados. El portero, con espuma en el pelo, concluye: «Entonces, ¿somos libres o jugamos al fútbol?». Se hace un silencio solemne. Alguien tose.",
    [
      o("a", "Unirte a la tertulia y aportar tu teoría", "Participar", { rel_vestuario: 6, moral: 5, flags: { v3_ducha: "participo" } }, "Dices que un pase atrás es como pedir perdón a tiempo. El vestuario se queda callado. Alguien aplaude. «Frase del año», dice el capitán. La frase acaba bordada en una camiseta del utillero."),
      o("b", "Interrumpirles con un chiste malo para romper el hielo", "Quitar solemnidad", { rel_vestuario: 4, moral: 3, flags: { v3_ducha: "chiste" } }, "Dices un chiste sobre un portero y un existencialista. Hay un silencio. Luego, una carcajada. «Tienes un don», murmura el utillero. Y la tertulia, felizmente, termina con un «¡Y cenamos!»."),
      o("c", "Escucharlo todo desde tu rincón y callarte", "Observador", { moral: 2, flags: { v3_ducha: "escucho" } }, "Te vistes en silencio, con una sonrisa interior. Esa noche, en casa, sigues dándole vueltas a lo del pase atrás. Al día siguiente, en el entrenamiento, haces uno. Y funciona."),
    ]),
  S("v3-caja-comun", "vestuario", { minAge: 17, clubTurns: [4, 400], notFlags: ["v3_caja"] }, "vestuario",
    "Se crea una caja común para las multas del vestuario y acaba en una causa solidaria",
    "La norma es sencilla: cada impuntualidad, cada móvil en la comida, cada tarjeta tonta, un euro. Al principio, las multas se gastan en cervezas. Pero a mitad de temporada, la caja tiene setecientos euros y un utillero con una idea: «¿Y si lo damos a algo?». El vestuario, con un sentido de la justicia repentino, se reúne. Hay cinco propuestas: un albergue, una escuela, un animal abandonado, una bici para el utillero y una fiesta.",
    [
      o("a", "Proponer un albergue de menores que conoces", "Elegir una causa de verdad", { rel_vestuario: 6, reputacion: 5, moral: 6, flags: { v3_caja: "albergue" } }, "Votáis a mano alzada. El albergue gana por ocho votos de diferencia. El día de la entrega, los chavales os reciben con un cartel hecho a mano. El portero, que sale llorando, jura que es «por la alergia»."),
      o("b", "Votar por la bici para el utillero", "Un gesto de cariño", { rel_vestuario: 7, moral: 6, flags: { v3_caja: "bici" } }, "El utillero, que lleva cuarenta años caminando al trabajo, recibe la bici con un lazo. «No me lo merezco», dice. «Sí», responden veinte voces. Esa tarde, da una vuelta al campo montado en ella, entre aplausos."),
      o("c", "Apostar por una gran fiesta de fin de temporada", "Una celebración", { rel_vestuario: 8, moral: 7, patrimonio: -100, flags: { v3_caja: "fiesta" } }, "La fiesta es una noche inolvidable, con música, comida y un karaoke que acaba con el míster cantando una balada. Nadie se acordará de quién pagó, pero todos recordarán el estribillo."),
    ]),
  S("v3-caja-fin", "vestuario", { after: [after("v3-caja-comun", "a", 10, 80)], minAge: 20 }, "vida",
    "Los chavales del albergue te invitan a un partido, con camisetas hechas por ellos",
    "Pasa un año y recibes una carta con letras de colores. Es una invitación para jugar un partido en el patio del albergue, con porterías de cartón y balones que llevan nombres dibujados. Los chavales, al verte, se ponen firmes y gritan a coro: «¡Gracias, caja común!». Detrás, una cuidadora, con lágrimas en los ojos, tiende una bandeja con tortilla.",
    [
      o("a", "Jugar con ellos hasta que anochezca", "Quedarte a jugar", { moral: 11, reputacion: 6, rel_aficion: 4, flags: { v3_albergue_visita: true } }, "Te pasan balones, te regatean, se ríen de tu cara de esfuerzo. Un niño te hace un gol de rabona. «¡Mira, {apellido}!», grita. Te vas con los zapatos llenos de barro y el corazón limpio."),
      o("b", "Llevarles a ver un partido del equipo y presentarles al vestuario", "Abrir las puertas", { moral: 10, rel_vestuario: 5, reputacion: 6, flags: { v3_albergue_visita: true } }, "Treinta chavales, con bufandas del club, entran al vestuario. Los jugadores les firman camisetas, balones, cuadernos. Un niño de nueve años, mirando al capitán, murmura: «Pareces más alto en la tele». «Y tú, más listo», responde el capitán."),
    ]),
  S("v3-apuesta-penalti", "vestuario", { minAge: 17, clubTurns: [3, 400], notFlags: ["v3_penalti"] }, "entrenamiento",
    "Apuestas con el portero que no encajará un penalti tuyo en todo el mes",
    "Fue tras un entrenamiento, con las botas sin quitar y la mirada desafiante. «Un mes sin que me marques un penalti —dice el portero—. Y te invito a cenar si lo consigues». Tú aceptas con una sonrisa. Los compañeros, expectantes, forman un círculo. Hay veinte euros en el aire. Y una cena.",
    [
      r("a", "Entrenar penaltis cada día y no darle tregua", "Ir a por él", 0.55, "A los veinte días, le metes tres seguidos, uno por la escuadra. El portero, derrotado, se tira al suelo y te regala una cena. «Eres un monstruo», dice. Tú sonríes y pides la carta de vinos.", { moral: 6, rel_vestuario: 4, forma: 1, flags: { v3_penalti: "gano" } }, "El portero se vuelve de goma. Te los para todos. Al cabo del mes, tienes que pagar tú la cena, y se lleva el aplauso del vestuario. «Un portero nunca olvida», dice, con una sonrisa que da miedo.", { moral: 2, rel_vestuario: 5, patrimonio: -80, flags: { v3_penalti: "pierdo" } }, "forma"),
      o("b", "Renunciar y tirar de simpatía", "Negociar", { rel_vestuario: 3, moral: 1, flags: { v3_penalti: "negocio" } }, "Le propones una cena a medias. El portero, con orgullo herido, acepta. La cena acaba convertida en una charla sobre porteros míticos. «Esto es mejor que ganar», admite."),
    ]),
  S("v3-novato-bautizo", "vestuario", { minAge: 17, clubTurns: [4, 400], notFlags: ["v3_bautizo_nov"] }, "vestuario",
    "Un novato llega con un traje de tres piezas y se convierte en el alma del vestuario",
    "Es un chaval de diecinueve años, con un bigote ridículo, un traje de tres piezas y una sonrisa que no se le quita. Llega por primera vez al club con un pañuelo en el bolsillo y una caja de bombones. «Para los mayores», dice. Los veteranos, desarmados, lo aceptan. A la semana, el novato ya es el que conoce los secretos de todos, los cumpleaños, los miedos, los gustos.",
    [
      o("a", "Adoptarlo como protegido y llevarlo a todas partes", "Ser su guía", { rel_vestuario: 6, moral: 5, reputacion: 3, flags: { v3_bautizo_nov: "guia" } }, "Le enseñas dónde están las duchas buenas, cómo reservar las pistas de pádel, quién se enfada si le tocan la taquilla. El chaval, agradecido, te escribe una nota. Te acompañará en cada viaje durante tres años."),
      o("b", "Hacerle una novatada simpática con humor", "Dar la bienvenida", { rel_vestuario: 5, moral: 4, flags: { v3_bautizo_nov: "novatada" } }, "Le haces cantar «cumpleaños feliz» al revés. Lo hace con tal gracia que el vestuario le dedica una ovación. Una semana después, es él quien organiza el amigo invisible."),
      o("c", "Mantener las distancias y observarle", "Ser prudente", { moral: 0, flags: { v3_bautizo_nov: "distancia" } }, "Esperas a ver qué hace. A los dos meses, es el más querido del vestuario. Descubres que, a veces, observar es perder el tiempo de ser amigo."),
    ]),
  S("v3-amuleto-capitan", "vestuario", { minAge: 18, clubTurns: [5, 400], notFlags: ["v3_amuleto_cap"] }, "vestuario",
    "El capitán te regala su amuleto, una piedra de la playa de su pueblo",
    "Es una piedra lisa, gris, del tamaño de una nuez. La lleva en el bolsillo desde su debut, hace dieciocho años. Después de un entrenamiento, se acerca, abre la mano y te la pone en la palma. «Ya no la necesito —dice—. Es tuya». No sabes si reír o llorar. «Pero…», empiezas. «Lleva dentro todas las veces que pensé que no podría», añade, y se aleja.",
    [
      o("a", "Guardarla con cariño y llevarla siempre contigo", "Aceptar el relevo", { moral: 8, reputacion: 4, rel_vestuario: 4, flags: { v3_amuleto_cap: "guardo" } }, "La metes en el bolsillo del pantalón. Cada vez que dudas, la aprietas. No sabes si funciona, pero te recuerda lo que significa. Años después, se la darás a otro."),
      o("b", "Devolvérsela con una nota: «Tuya hasta el final»", "No aceptar", { moral: 4, rel_vestuario: 3, flags: { v3_amuleto_cap: "devuelvo" } }, "Se la devuelves por correo interno. El capitán la acepta con una sonrisa triste. «Eres terco», dice. Meses después, en su despedida, te la vuelve a entregar. Esta vez, la aceptas."),
    ]),
  S("v3-juego-mesa", "vestuario", { minAge: 17, clubTurns: [3, 400], notFlags: ["v3_juego"] }, "vestuario",
    "Un torneo de juegos de mesa en el hotel acaba con lágrimas y reconciliaciones",
    "Fue por una lluvia torrencial que obligó a cancelar un entrenamiento: tres compañeros, un tablero de Monopoly y una caja de cartas. A la segunda hora, hay una discusión sobre una propiedad. A la tercera, un portazo. A la cuarta, el capitán, con un cartel en la frente, anuncia: «¡A partir de ahora, mediación!». El utillero reparte el dinero.",
    [
      o("a", "Mediar con humor y repartir paz entre los jugadores", "Hacer de árbitro", { rel_vestuario: 6, reputacion: 4, moral: 4, flags: { v3_juego: "arbitro" } }, "Llevas una libreta con las reglas, las quejas y los acuerdos. Al final, todos firman un tratado de paz. El capitán lo enmarca. «El Tratado del Monopoly», se llamará durante años."),
      o("b", "Aprovechar la confusión para quedarte con todas las propiedades", "Jugar sucio", { rel_vestuario: 3, moral: 4, reputacion: -1, flags: { v3_juego: "sucio" } }, "Compras Paseo del Prado, la estación y una casa en Gran Vía. Cuando el vestuario descubre tu estrategia, estalla en indignación y risas. «¡Traidor!», grita el portero. Y te nombran, con ironía, «magnate del club»."),
      o("c", "Salir a pasear bajo la lluvia mientras discuten", "Escapar del ruido", { moral: 2, flags: { v3_juego: "paseo" } }, "Te mojas, respiras, piensas. Cuando vuelves, el Monopoly ha terminado y hay una pizza gigante en la mesa. Te guardan un trozo y un chiste que no entiendes. Es suficiente."),
    ]),
];
