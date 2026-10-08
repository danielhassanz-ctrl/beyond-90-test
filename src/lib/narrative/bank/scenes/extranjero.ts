/**
 * Jugar fuera de casa: un idioma que no entiendes, una comida que no reconoces, una nostalgia que
 * llega de golpe un domingo. Solo salen si juegas en un club fuera de España. Las escenas de
 * adaptación se encadenan: aprender el idioma hoy se nota en una rueda de prensa meses después.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const EXTRANJERO: BankScene[] = [
  S("ex-idioma", "extranjero", { exterior: true, minAge: 17, clubTurns: [1, 12], notFlags: ["ex_idioma"] }, "vida",
    "Tu primer mes sin entender casi nada de lo que dicen en el vestuario",
    "Todo el mundo habla deprisa, con un idioma que parece compuesto de consonantes. Sonríes y asientes a todo. En un rondo, el entrenador te grita una instrucción y tú, por si acaso, corres hacia el córner. Silencio absoluto. El capitán, con un inglés pausado, traduce: «Decía que pasaras a la derecha». Todos se ríen, con cariño. El masajista te regala un diccionario de bolsillo con las puntas dobladas.",
    [
      o("a", "Apuntarte a clases dos tardes por semana con una profesora particular", "Ir en serio", { patrimonio: -400, moral: 4, rel_vestuario: 3, reputacion: 2, flags: { ex_idioma: "clases" } }, "La profesora, una mujer paciente con gafas de pasta, te enseña los verbos con ejemplos de fútbol. A las seis semanas, entiendes las órdenes en el campo. A las diez, las bromas. A los cuatro meses, te ríes de ellas antes que el resto."),
      o("b", "Aprender «por ósmosis» con tus compañeros y mucha mímica", "A lo loco", { moral: 3, rel_vestuario: 5, flags: { ex_idioma: "osmosis" } }, "Aprendes primero las palabrotas, luego los nombres de las jugadas, al final las frases normales. Tu acento provoca ataques de risa. Pero cuando el capitán te dice «ya hablas como uno de los nuestros», se te encoge el corazón de orgullo."),
      o("c", "Seguir con el inglés y esperar a que los demás se adapten", "Resistirte", { moral: -2, rel_vestuario: -3, flags: { ex_idioma: "no" } }, "Pasa medio año. En el vestuario, los mejores chistes se cuentan en otro idioma. Te los traducen siempre con retraso, y la risa llega cuando ya ha pasado el momento. Empiezas a sentirte un huésped."),
    ]),
  S("ex-idioma-rueda", "extranjero", { exterior: true, after: [after("ex-idioma", "a", 15, 80)], minAge: 18 }, "prensa",
    "Das tu primera rueda de prensa en el idioma local y te aplauden",
    "Es tras una victoria. Hay veinte periodistas, tres cámaras y la costumbre de que el extranjero responda en inglés. Esta vez, antes de que lo hagas, levantas la mano: «Si me permiten, lo haré en su idioma». Hay un silencio. Empiezas con tu mejor acento, tropezando en dos palabras. Un periodista veterano, en la primera fila, sonríe. Al final, la sala te aplaude. «Un detalle que no se olvida», comenta alguien.",
    [
      o("a", "Terminar con una frase emocionada: «Gracias por acogerme»", "Cerrar con el corazón", { rel_aficion: 8, reputacion: 6, fama: 3, moral: 6, flags: { ex_idioma_rueda: true } }, "La frase sale en todos los telediarios. La afición, al día siguiente, te canta una canción que acaba con esas palabras. Es tu bautizo definitivo en el club."),
      o("b", "Hacer una broma sobre tu acento y seguir", "Quitar solemnidad", { rel_aficion: 6, fama: 4, moral: 5, flags: { ex_idioma_rueda: "broma" } }, "«Perdonen mi español, quiero decir mi idioma», dices. La sala se ríe. A partir de ese día, tu acento es marca de la casa: un humorista local te imita con cariño."),
    ]),
  S("ex-comida", "extranjero", { exterior: true, minAge: 17, clubTurns: [1, 20], notFlags: ["ex_comida"] }, "vida",
    "Un compañero te invita a cenar «lo típico» y no sabes qué estás comiendo",
    "Es una mesa grande, con muchos platos pequeños y una salsa de color indefinible. Tu compañero, orgulloso, señala cada uno: «Esto es de pescado. Esto, de pescado también. Esto… mejor no lo preguntes». Tu estómago hace una pausa dramática. Todo el vestuario te mira, esperando tu reacción. El portero, con una ceja levantada, apuesta en voz baja a que no te lo terminas.",
    [
      o("a", "Probarlo todo con una sonrisa y pedir repetir del que no sabes qué es", "Entrega total", { moral: 5, rel_vestuario: 6, forma: -1, flags: { ex_comida: "todo" } }, "Resulta que el plato misterioso era el favorito del capitán. Te sirve el segundo con una solemnidad de ceremonia. A partir de ese día, en cada cena de equipo, te guardan «el plato de los valientes»."),
      o("b", "Elegir lo reconocible y probar el resto de a poco", "Con prudencia", { moral: 2, rel_vestuario: 2, flags: { ex_comida: "poco" } }, "Comes cuatro cosas y dejas el resto con un «está buenísimo, pero estoy lleno». Nadie te lo reprocha. A la semana, descubres que uno de los platos misteriosos te encanta, y vuelves."),
      o("c", "Disculparte y pedir una pizza en la sobremesa", "Plan B", { moral: 1, rel_vestuario: -1, flags: { ex_comida: "pizza" } }, "Llega una pizza. Medio vestuario se une, con sonrisas de traición. Te llaman «el turista», pero te aceptan igual. Y tú, mientras tanto, empiezas a echar de menos las croquetas de tu madre."),
    ]),
  S("ex-nostalgia", "extranjero", { exterior: true, minAge: 17, clubTurns: [3, 30], notFlags: ["ex_nostalgia"] }, "vida",
    "Una tarde de domingo, sin partido, te asalta una nostalgia que no esperabas",
    "Es una tarde gris, de esas con la lluvia pegada a los cristales. Tu piso está limpio y vacío. En el móvil, una foto de tu familia comiendo sin ti. Lo ves un rato, sin llorar, con una mano en la boca. En la calle, alguien pasa con un paraguas rojo. Piensas en la plaza donde jugabas de niño. En su olor a barro. «¿Qué hago aquí?», te preguntas, sin rabia, solo con cansancio.",
    [
      o("a", "Llamar a tus padres por videollamada y quedarte en línea una hora", "Acercarte por pantalla", { moral: 7, flags: { ex_nostalgia: "llamo" } }, "Tu madre te enseña la comida, tu padre te cuenta cosas del barrio, tu hermano te enseña el balón nuevo. Cuando cuelgas, la casa sigue vacía, pero tú no. Prometes volver en las próximas vacaciones."),
      o("b", "Salir a pasear bajo la lluvia y entrar en el primer bar que te dé buena espina", "Explorar", { moral: 5, rel_aficion: 2, flags: { ex_nostalgia: "bar" } }, "El primer bar tiene doce mesas, un viejo con un acordeón y una camarera que te sirve un té sin preguntar. Te reconocen, pero no te dicen nada. Es lo que necesitabas. Vuelves cada domingo."),
      o("c", "Reunir a otros compañeros extranjeros y organizar una cena del «exilio»", "Hacer comunidad", { moral: 8, rel_vestuario: 6, patrimonio: -100, flags: { ex_nostalgia: "exilio" } }, "Os juntáis seis, de cinco países distintos, en un piso con una olla enorme. Cada uno trae un plato de su casa. Las risas se oyen desde la calle. A partir de entonces, la «cena del exilio» es una tradición mensual del club."),
    ]),
  S("ex-derbi-local", "extranjero", { exterior: true, minAge: 17, clubTurns: [4, 400], notFlags: ["ex_derbi"] }, "vestuario",
    "Te explican que el derbi local «no es un partido, es una guerra civil con árbitro»",
    "Es lo que te dice el utillero, con una cara tan seria que no sabes si bromea. En el vestuario, hay un cartel: «Perder este partido es perder la ciudad». Los veteranos hablan con voz baja. Los jóvenes, con las orejas rojas. En la comida, el capitán te mira a los ojos: «Lo sientes o te vas». Fuera, la ciudad entera ha cambiado de color. Hay bufandas en cada balcón.",
    [
      o("a", "Sumergirte en la rivalidad y aprender los cánticos con los hinchas", "Entrar de lleno", { rel_aficion: 8, moral: 5, fama: 3, flags: { ex_derbi: "lleno" } }, "Te pasas la semana en un bar con los ultras, aprendiendo los cánticos con una cerveza en la mano. El día del partido, los cantas desde el campo. El estadio, al oírte, se viene abajo. Esa ciudad te adopta."),
      o("b", "Mantener la calma profesional y respetar la tradición desde la distancia", "Cuidar la cabeza", { forma: 2, moral: 3, rel_entrenador: 3, flags: { ex_derbi: "calma" } }, "Entrenas, descansas, no salgas. Esa tarde, juegas sereno. Los ultras, que esperaban más ruido, lo respetan con un aplauso cauto. No te adoran todavía. Pero ya te miran con respeto."),
      o("c", "Preguntarle al capitán qué espera exactamente de ti en ese partido", "Pedir una guía", { rel_vestuario: 5, reputacion: 3, moral: 2, flags: { ex_derbi: "guia" } }, "«Solo que corras por los que no pueden estar en el campo», responde. Es una frase sencilla. La repites mentalmente durante el partido. Al acabar, el capitán te abraza: «Ya eres de los nuestros»."),
    ]),
  S("ex-impuestos", "extranjero", { exterior: true, minAge: 19, patrimonio: [6000, 100000000], clubTurns: [4, 400], notFlags: ["ex_impuestos"] }, "representante",
    "Descubres que, en este país, los impuestos son otra historia y tu nómina cambia",
    "Tu agente te envía una hoja de cálculo con tres columnas: «bruto», «retenciones» y «lo que te llega». La última cifra es un treinta por ciento menor de lo que pensabas. «Es un sistema diferente», explica. Tú, con la hoja en las manos, haces cuentas de cabeza. Un compañero, que lleva años en el club, te da una palmada: «Bienvenido al mundo adulto». Tu agente, aliviado, añade: «Pero hay maneras legales de mejorar esto».",
    [
      o("a", "Contratar a un gestor local de confianza y declarar todo con claridad", "Con transparencia", { patrimonio: -900, reputacion: 4, moral: 2, flags: { ex_impuestos: "gestor" } }, "El gestor, un hombre afable con una carpeta azul, te explica deducciones, residencias y convenios. En dos semanas, tu nómina mejora un diez por ciento. Y nadie, jamás, te llamará la atención."),
      o("b", "Dejarlo todo en manos de tu agente y no mirar", "Confiar", { patrimonio: -300, moral: 0, flags: { ex_impuestos: "agente" } }, "Tu agente lo gestiona con corrección. Te llega un resumen cada trimestre. No entiendes la mitad, pero te sientes protegido. A veces, delegar es una forma de paz."),
      o("c", "Quejarte en voz alta ante el vestuario del sistema fiscal", "Desahogarte", { moral: 1, rel_vestuario: 2, reputacion: -1, flags: { ex_impuestos: "queja" } }, "Los veteranos te escuchan con paciencia. «Todos hemos pasado por ahí», dice uno. Luego te invitan a un café y te cuentan lo que hicieron. Aprendes más en media hora que en un mes."),
    ]),
  S("ex-vecino-amigo", "extranjero", { exterior: true, minAge: 17, clubTurns: [2, 400], notFlags: ["ex_vecino"] }, "vida",
    "Un vecino del edificio te adopta como si fueras su nieto",
    "Es un hombre de unos setenta años, con un sombrero de paja y un abrigo con botones desparejados. Te topa cada mañana en la escalera y te dice una frase en su idioma, que tú contestas con otra. Una tarde, te invita a pasar. Su casa huele a pan y a café. Hay una foto de un equipo de los años sesenta. «Ese soy yo», dice, señalando a un joven de pelo oscuro. «Medio centro. Como tú».",
    [
      o("a", "Aceptar el café y escuchar las historias del equipo", "Ser su compañero de charlas", { moral: 6, reputacion: 3, flags: { ex_vecino: "cafe" } }, "Te cuenta cómo ganaron una Copa con un balón de cuero que pesaba como un ladrillo. Te regala una bufanda desteñida. «Para que no tengas frío en las gradas». Cada martes, vuelves."),
      o("b", "Invitarle a un partido en una butaca especial", "Ofrecerle un sitio", { moral: 7, rel_aficion: 3, reputacion: 3, patrimonio: -60, flags: { ex_vecino: "partido" } }, "El viejo, con su sombrero, ocupa una butaca de palco. Cuando marcas, se levanta y grita algo en un idioma que no entiendes, pero que entiendes perfectamente. Al acabar, te abraza como a un hijo."),
      o("c", "Darle las gracias y volver pronto a tu piso", "Con respeto", { moral: 1, flags: { ex_vecino: "gracias" } }, "Le dices que otro día. Pasa el tiempo. Un invierno, ya no está en la escalera. Un vecino te explica: «Se fue a casa de su hija». Te quedas mirando su puerta durante un buen rato."),
    ]),
  S("ex-hogar", "extranjero", { exterior: true, minAge: 19, clubTurns: [8, 400], notFlags: ["ex_hogar"] }, "vida",
    "Un día te das cuenta de que has empezado a soñar en el idioma de aquí",
    "Fue una mañana, al despertarte. Recuerdas un sueño: una conversación con un compañero, en el vestuario, en ese idioma que antes te parecía una pared. No te traducías nada. Todo fluía. Te sientas en la cama, atónito. En la cocina, tu pareja, tu amigo de piso o tu agente te saluda en tu lengua materna, y por un segundo te cuesta contestar. Te ríes. Algo ha cambiado.",
    [
      o("a", "Celebrarlo en voz alta y contárselo a tu madre por teléfono", "Compartir el logro", { moral: 8, reputacion: 2, flags: { ex_hogar: "celebro" } }, "Tu madre, al oírte, se echa a llorar. «Mi niño habla otros idiomas», dice. Tu padre, al fondo, murmura: «Ya sabía yo». Esa noche, se te llenan los ojos de lágrimas. Hay quien se hace del lugar sin darse cuenta."),
      o("b", "Anotarlo en tu cuaderno y seguir con tu día", "Guardarlo para ti", { moral: 5, flags: { ex_hogar: "cuaderno" } }, "Escribes: «Hoy soñé en otro idioma». Cuando, años después, relees esa frase, descubres que fue el día en que dejaste de ser extranjero. Algo más grande de lo que pensabas."),
    ]),
  S("ex-clima", "extranjero", { exterior: true, minAge: 17, clubTurns: [2, 30], turn: [4, 8], notFlags: ["ex_clima"] }, "vida",
    "Nieva por primera vez en tu vida y te quedas mirando el balcón con cara de niño",
    "Es una nevada silenciosa, de las que cubren todo en una hora. Estás en tu piso, con una taza de té y la mirada fija en la ventana. Los copos caen despacio. Los coches, cubiertos de blanco. Los niños, abajo, hacen un muñeco. Tienes veintiún años y nunca habías visto nevar. Un mensaje de tu madre: «¿Cómo es?». Respondes: «Es como si el mundo se hubiera quedado callado».",
    [
      o("a", "Bajar a la calle y hacer un muñeco de nieve con los niños", "Jugar como un crío", { moral: 8, rel_aficion: 3, fama: 2, flags: { ex_clima: "muneco" } }, "Los niños, al reconocerte, gritan. Hacéis un muñeco con tu camiseta. Alguien lo fotografía y la imagen recorre el mundo: «El delantero y su muñeco». Acabas con los dedos helados y el alma caliente."),
      o("b", "Hacer una foto, mandársela a tus padres y quedarte dentro", "Disfrutar en silencio", { moral: 5, flags: { ex_clima: "foto" } }, "La foto es un rectángulo blanco con una luz amarilla en una esquina. Tu madre la imprime. Años después, la enmarcará: «La primera nieve de mi hijo». Y tú, cada vez que la ves, sientes el mismo silencio."),
      o("c", "Preguntarte si podrás entrenar con este frío y pedir ropa extra", "Pensar en el trabajo", { forma: 1, moral: 1, flags: { ex_clima: "trabajo" } }, "El utillero te trae unos guantes, un gorro y unas mallas térmicas. Entrenas con el aliento flotando en el aire. «Aquí no se entrena por gusto», dice el capitán. «Se entrena por amor»."),
    ]),
  S("ex-prensa-local", "extranjero", { exterior: true, minAge: 18, fama: [35, 100], clubTurns: [3, 400], notFlags: ["ex_prensa"] }, "prensa",
    "La prensa local te llama «el español» en cada titular y no sabes si es un cumplido",
    "Los periódicos lo repiten sin pudor: «El español marcó», «El español falló», «El español, el favorito de la grada». Al principio te hace gracia; luego, algo menos. Un periodista te lo explica con simpatía: «Es una forma de cariño. Aquí a los que queremos, les ponemos un apodo por país». En el vestuario, un compañero se parte de risa: «A mí, desde hace tres años, me llaman “el brasileño”. Y soy de Segovia».",
    [
      o("a", "Adoptar el apodo con orgullo y ponerlo en tu perfil", "Hacerlo tuyo", { fama: 4, rel_aficion: 6, moral: 4, flags: { ex_prensa: "adopto" } }, "Subes una foto con la leyenda: «El español, para servirles». La afición, encantada, te lo grita en cada partido. Un mes después, hay una camiseta con la frase. Te hace sentir, por fin, parte de algo."),
      o("b", "Pedir con amabilidad que usen tu nombre", "Con educación", { reputacion: 3, moral: 1, rel_aficion: -1, flags: { ex_prensa: "nombre" } }, "Los periodistas, avergonzados, se disculpan. Durante unas semanas, te llaman por tu apellido. Luego, poco a poco, vuelve «el español». Lo dejas pasar con una sonrisa."),
      o("c", "Responder con una frase en el idioma local que hace reír a todos", "Ganarte a la prensa", { fama: 5, rel_aficion: 5, moral: 5, flags: { ex_prensa: "frase" } }, "«Aquí, el español es el que mejor paga las cañas», dices en su idioma. La frase, que suena a refrán, se hace popular. Un bar de la ciudad la pone en su fachada con tu firma."),
    ]),
];
