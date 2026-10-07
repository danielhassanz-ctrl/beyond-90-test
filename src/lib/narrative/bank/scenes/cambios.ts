/**
 * El mundo se mueve: entrenadores que llegan y se van, capitanes que se
 * despiden, un fichaje estrella en tu posición, el amigo del vestuario que se
 * marcha. Estas escenas CAMBIAN de verdad a los personajes del entorno: tras
 * ellas, el míster o el capitán del club pasan a ser otra persona (otro
 * nombre, y la relación empieza de nuevo), no el mismo para siempre.
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene } from "../types";

export const CAMBIOS: BankScene[] = [
  // ───── El banquillo cambia de manos ─────
  S("cb-mister-dudas", "cambios", { clubTurns: [10, 400], rel: { entrenador: [0, 62] }, notFlags: ["coach_en_duda", "coach_nuevo_pendiente"], minAge: 17 }, "vestuario",
    "Se habla de la cabeza del míster",
    "Los resultados no acompañan y las radios llevan dos jornadas dando la misma noticia con distintas voces: «El banquillo, en el alero». El míster viene a entrenar con una calma extraña. El masajista te susurra que el presidente ha cenado con alguien que no es su mujer ni su abogado. En el vestuario nadie dice nada, pero todos miran de reojo la puerta del despacho.",
    [
      o("a", "Dar la cara por el míster delante del grupo", "Apostar por él", { rel_entrenador: 5, rel_vestuario: 2, reputacion: 2, flags: { coach_en_duda: true } }, "Dices en voz alta que el míster tiene al vestuario con él. Algunos asienten. Otros miran al suelo. El míster, desde lejos, levanta la mano un segundo, como quien agradece sin querer que se note."),
      o("b", "Mantenerte al margen y concentrarte en lo tuyo", "Sin mojarte", { forma: 1, flags: { coach_en_duda: true } }, "Entrenas con la cabeza baja. No es un día para frases, y lo sabes. Cuando terminas, el utillero te mira de reojo y dice solo: «Sabio»."),
      o("c", "Hablar con la directiva sobre el proyecto", "Mover ficha por tu lado", { rel_entrenador: -3, reputacion: 1, rel_representante: 1, flags: { coach_en_duda: true } }, "Pides cinco minutos al director deportivo. Te escucha, te sonríe y te promete «cuidar de ti pase lo que pase». Sales con la sospecha de que acabas de decirle algo importante sin querer."),
    ]),
  S("cb-mister-despedido-dudas", "cambios", { after: [after("cb-mister-dudas", undefined, 2, 16)] }, "especial",
    "El club destituye al entrenador",
    "A las nueve de la mañana, un comunicado de tres líneas lo confirma: el club y el entrenador «han decidido de mutuo acuerdo» separar sus caminos. Nadie cree lo del mutuo acuerdo. En el vestuario hay un silencio de funeral. El míster se despide uno por uno en el aparcamiento, con las gafas de sol puestas, aunque está nublado.",
    [
      o("a", "Despedirte de él con un abrazo sincero", "Agradecer lo vivido", { moral: 3, reputacion: 3, rel_vestuario: 2, flags: { gen_entrenador: "@+1", "@set_rel_entrenador": "50", coach_nuevo_pendiente: true, coach_bench: "0" } }, "Le abrazas a la salida y le dices lo que sientes. Él asiente sin hablar, mira el campo por última vez y se sube al coche. Te llegará, meses después, un mensaje suyo: «Gracias por aquella vez»."),
      o("b", "Despedirte con un apretón de manos y mirar al futuro", "Profesionalidad", { moral: 1, flags: { gen_entrenador: "@+1", "@set_rel_entrenador": "50", coach_nuevo_pendiente: true, coach_bench: "0" } }, "Le das la mano con educación. Él te responde con un «cuídate» seco. A los quince minutos ya hay un nuevo nombre en la radio."),
      o("c", "No decir nada: es el negocio", "Distancia", { moral: -1, flags: { gen_entrenador: "@+1", "@set_rel_entrenador": "50", coach_nuevo_pendiente: true, coach_bench: "0" } }, "Te quedas en el vestuario con los auriculares puestos. Por dentro sientes una punzada que no sabes ponerle nombre."),
    ], { weight: 1.5 }),
  S("cb-mister-despedido-sorpresa", "cambios", { clubTurns: [20, 400], notFlags: ["coach_en_duda", "coach_nuevo_pendiente"], minAge: 17 }, "especial",
    "Sin avisar: nuevo entrenador",
    "Es un martes cualquiera y, a las diez, el director deportivo pide silencio en el vestuario. Detrás de él hay un hombre de traje oscuro, de unos cincuenta años, con una carpeta bajo el brazo. «Os presento al nuevo entrenador», dice. Nadie ha visto salir al anterior. En la puerta, los de la prensa ya se frotan las manos.",
    [
      o("a", "Estrecharle la mano con una sonrisa y presentarte", "Entrar con buen pie", { rel_entrenador: 3, moral: 2, flags: { gen_entrenador: "@+1", "@set_rel_entrenador": "55", coach_nuevo_pendiente: true, coach_bench: "0" } }, "Te acercas el primero y te presentas con nombre y apellidos. El nuevo entrenador te mira dos segundos de más: «He oído hablar de ti». No sabes si es bueno o malo."),
      o("b", "Esperar a ver cómo trata al grupo", "Con cautela", { moral: 0, flags: { gen_entrenador: "@+1", "@set_rel_entrenador": "50", coach_nuevo_pendiente: true, coach_bench: "0" } }, "Te quedas atrás, con los brazos cruzados. Observas. Lo que ves: un hombre que da la mano con firmeza, mira a los ojos y apunta cada nombre en una libreta. Quizá sea buena señal."),
      o("c", "Echar de menos al anterior y no disimularlo", "Nostalgia", { moral: -2, rel_entrenador: -2, flags: { gen_entrenador: "@+1", "@set_rel_entrenador": "45", coach_nuevo_pendiente: true, coach_bench: "0" } }, "Dices que el anterior «era más de la casa». El nuevo lo oye, no dice nada y lo anota con calma. Aquí empieza una relación con una pequeña grieta."),
    ]),
  S("cb-mister-nuevo-exigente", "cambios", { flags: ["coach_nuevo_pendiente"], clubTurns: [0, 400] }, "entrenamiento",
    "El nuevo míster llega con una libreta y cero amigos",
    "El primer entrenamiento dura dos horas y cuarenta minutos. El nuevo míster no grita: pone una sola regla y la repite como un mantra. «Quien llegue tarde, corre. Quien se queje, corre más. Y quien intente hacerme reír, corre el doble». Los veteranos sonríen con una mezcla de miedo y alivio. En la pizarra hay un dibujo táctico que nadie entiende todavía.",
    [
      o("a", "Entrenar a tope y demostrarle quién eres", "Ganarte su respeto", { forma: 3, rel_entrenador: 4, moral: 2, flags: { coach_nuevo_pendiente: "", coach_estilo: "exigente" } }, "Terminas el último entrenamiento de la semana con el pecho ardiendo. El míster pasa a tu lado sin decir nada. Pero esa noche, en su libreta, hay una marca al lado de tu nombre."),
      o("b", "Preguntarle por el plan y escuchar con atención", "Mostrar interés", { rel_entrenador: 5, moral: 3, flags: { coach_nuevo_pendiente: "", coach_estilo: "exigente" } }, "Te quedas después del entrenamiento y le pides diez minutos. Te enseña la pizarra con la paciencia de un profesor que no ha tenido muchos alumnos que pregunten."),
      o("c", "Hacerle una broma para romper el hielo", "Un riesgo", { rel_vestuario: 3, rel_entrenador: -4, moral: 2, flags: { coach_nuevo_pendiente: "", coach_estilo: "exigente" } }, "Haces un chiste sobre la libreta. El silencio dura tres segundos. «Corre», dice el míster, sin mirarte. Tú corres, con una sonrisa de oreja a oreja y las risas de fondo de todo el vestuario."),
    ]),
  S("cb-mister-nuevo-joven", "cambios", { flags: ["coach_nuevo_pendiente"], clubTurns: [0, 400] }, "entrenamiento",
    "El nuevo míster tiene treinta y seis años y mil ideas",
    "Llega en bicicleta, con una mochila al hombro, una camiseta del club de hace veinte años y una sonrisa que no sabe disimular los nervios. Es el entrenador más joven de la liga. Habla de «principios», de «automatismos» y de «ser la mejor versión de ti mismo». Los veteranos intercambian miradas. Tú, con veinte años menos, ya has hecho tres amigos en su equipo técnico.",
    [
      o("a", "Entregarte a sus ideas y probar lo que proponga", "Abrirte a lo nuevo", { rel_entrenador: 5, moral: 4, media: 1, flags: { coach_nuevo_pendiente: "", coach_estilo: "joven" } }, "Pruebas todo lo que propone, incluido un ejercicio de respiración que a los veteranos les parece un chiste. En dos semanas, juegas de una forma que no habías jugado nunca."),
      o("b", "Seguir con lo de siempre y ver cómo evoluciona", "Esperar", { rel_entrenador: 0, moral: 0, flags: { coach_nuevo_pendiente: "", coach_estilo: "joven" } }, "No te opones ni te entregas. El míster te lo nota y lo respeta, con una mirada de quien toma nota para dentro de un mes."),
      o("c", "Proponerle una idea tuya sobre cómo jugar", "Ser parte del proceso", { rel_entrenador: 6, reputacion: 2, moral: 3, flags: { coach_nuevo_pendiente: "", coach_estilo: "joven" } }, "Le cuentas una idea sobre el pivote. El míster la apunta en una libreta con un entusiasmo casi infantil: «Eso lo probamos mañana». Y la prueba, y funciona."),
    ]),
  S("cb-mister-nuevo-amigo", "cambios", { flags: ["coach_nuevo_pendiente"], clubTurns: [0, 400] }, "vestuario",
    "El nuevo míster es de los que se toman un café contigo",
    "Se acerca a ti en la primera mañana con un café en cada mano y te dice: «No sé si te gusta con leche. Te traigo uno solo y uno con leche, y te quedas con el que quieras». Se llama Tomás, tiene cuarenta y ocho años, ha jugado en cuatro países y habla de fútbol como quien habla de su familia. Lo del café, descubres luego, lo hace con todos los jugadores del plantel.",
    [
      o("a", "Quedarte con el café con leche y charlar un rato", "Conectar con él", { rel_entrenador: 6, moral: 4, rel_vestuario: 1, flags: { coach_nuevo_pendiente: "", coach_estilo: "amigo" } }, "Hablas con él veinte minutos de nada y de todo. Cuando te levantas, sientes que has entrado a una casa en la que todavía no sabías que cabías."),
      o("b", "Agradecérselo con cortesía y volver a lo tuyo", "Mantener las distancias", { rel_entrenador: 2, flags: { coach_nuevo_pendiente: "", coach_estilo: "amigo" } }, "Le das las gracias con una sonrisa y te vas. Él lo entiende: «Con calma», dice, y le da el otro café al masajista."),
      o("c", "Desconfiar: los amigos en el banquillo tienen un precio", "Cautela máxima", { rel_entrenador: -1, reputacion: 1, flags: { coach_nuevo_pendiente: "", coach_estilo: "amigo" } }, "Aceptas el café con una cortesía de hielo. El míster lo nota y, por no incomodarte, no insiste. Pero sabe que hay una puerta que deberá abrir despacio."),
    ]),
  // ───── El capitán se despide ─────
  S("cb-capitan-adios", "cambios", { clubTurns: [20, 400], turn: [8, 10], rel: { vestuario: [28, 100] }, notFlags: ["capitan_pendiente"], minAge: 18 }, "vestuario",
    "El capitán anuncia que se va",
    "Reúne al vestuario después del último entrenamiento y habla de pie, con la toalla al cuello. Ha firmado con otro club, uno de otro país, con un contrato que «no se puede rechazar a mi edad». Se le quiebra la voz en la tercera frase. Se calla. Alguien empieza a aplaudir. Después, todos. El capitán se tapa la cara con la toalla y se queda ahí, un rato largo.",
    [
      o("a", "Organizar una despedida con todo el vestuario", "Un adiós a la altura", { rel_vestuario: 6, moral: 5, patrimonio: -250, flags: { gen_capitan: "@+1", capitan_pendiente: true } }, "Reservas un restaurante, avisas a su familia y mandas un vídeo-montaje con todos los goles que celebró. Cuando lo ve, llora de verdad. «Esto no me lo merezco», dice. Todos le dicen que sí."),
      o("b", "Escribirle una carta a mano y dársela en privado", "Algo más íntimo", { moral: 5, rel_vestuario: 2, flags: { gen_capitan: "@+1", capitan_pendiente: true } }, "La carta ocupa dos folios. Se la das en el parking, y él la guarda en el bolsillo del abrigo sin leerla. «Después», dice. Semanas más tarde, te contesta con una foto de la carta, ya amarilleando, en su nueva taquilla."),
      o("c", "Darle la mano y desearle suerte, sin más", "Algo breve", { moral: 1, flags: { gen_capitan: "@+1", capitan_pendiente: true } }, "Un apretón de manos y un «suerte, capi». Él te devuelve el gesto con más fuerza de la que esperabas. Es, probablemente, lo mejor que le podrías haber dicho."),
    ]),
  S("cb-capitan-nuevo", "cambios", { flags: ["capitan_pendiente"], clubTurns: [0, 400] }, "vestuario",
    "El vestuario elige nuevo capitán",
    "Se hace por votación y a mano alzada, en una sala del hotel de la concentración. El míster, de pie, dice: «Tenéis cinco minutos». Se levantan tres manos para un delantero, cuatro para el portero y dos para un lateral que bromeó diciendo que se votaba a sí mismo. Y por primera vez en mucho tiempo, todo el mundo calla: están esperando a ver a quién vas a votar tú.",
    [
      o("a", "Votar por el más veterano, el que siempre da la cara", "Sentido común", { rel_vestuario: 4, moral: 2, flags: { capitan_pendiente: "" } }, "Alzas la mano por el veterano. El portero te sonríe: «Buen voto». Y la votación termina con una mayoría clara. Hay cosas que se saben antes de contar."),
      o("b", "Votar por el más joven, para empujar un relevo", "Apostar por el futuro", { rel_vestuario: 2, reputacion: 2, flags: { capitan_pendiente: "" } }, "Votas al joven. El vestuario se queda un segundo en silencio y luego lo aplaude. Él se pone colorado hasta las orejas y dice «no sé si estoy a la altura». «Ya la tienes», le responden varios."),
      o("c", "Votarte a ti mismo en broma", "Un poco de show", { rel_vestuario: 3, moral: 3, flags: { capitan_pendiente: "" } }, "Levantas la mano con una sonrisa traviesa. Todos se ríen, incluso el míster. Eso sí, tres compañeros, solo por pincharte, te votan de verdad. Acabas segundo, con la peor cara de orgullo de tu vida."),
    ]),
  // ───── Cambios en el vestuario ─────
  S("cb-fichaje-estrella", "cambios", { roles: ["titular"], media: [70, 99], clubLevels: ["grande"], clubTurns: [8, 400], turn: [1, 4], minAge: 20 }, "vestuario",
    "Llega un fichaje de los que hacen ruido a tu posición",
    "Lo presentan en el estadio con humo, música y cuarenta mil personas. Es un jugador joven, caro, con un contrato que te hace levantar una ceja y un sueldo que haría llorar a tu padre. Juega en tu posición. En el vestuario, la mitad aplaude y la otra mitad te mira de reojo. Él, muy cortés, te estrecha la mano y te dice: «Un honor».",
    [
      o("a", "Darle la bienvenida y ofrecerte a ayudarle", "Ser generoso", { rel_vestuario: 5, reputacion: 3, moral: 2, flags: { fichaje_estrella: "bienvenida" } }, "Le enseñas el club, le muestras los mejores sitios para comer y le presentas a tu familia. Dos semanas después, uno de los dos jugará de falso nueve. No sabes cuál."),
      o("b", "Ser cordial pero marcar territorio", "Elegancia y orgullo", { rel_vestuario: 1, moral: 2, forma: 1, flags: { fichaje_estrella: "competencia" } }, "Le saludas con educación y le dejas claro con una frase que «el sitio hay que ganárselo». Él sonríe con una media sonrisa cómplice: «Por eso he venido»."),
      o("c", "Preguntarle al míster qué plan tiene contigo", "Pedir certezas", { rel_entrenador: 2, moral: -1, flags: { fichaje_estrella: "certezas" } }, "Pides cinco minutos. El míster te mira, resopla y dice: «Os voy a necesitar a los dos, pero no a la vez»."),
    ], { weight: 1.2 }),
  S("cb-amigo-llega", "cambios", { clubTurns: [1, 40], minAge: 17, maxAge: 27, notFlags: ["amigo_ruben"] }, "vestuario",
    "Con Rubén conectas a la primera",
    "Rubén Aguirre llegó a la plantilla hace un mes y es el único del vestuario que se ríe de tus chistes antes de que termines de decirlos. Es zurdo, ha perdido dos maletas en su vida y dice «a ver, a ver» antes de cualquier cosa. Hoy te propone ir a cenar con la tarjeta de un restaurante de ramen que descubrió hace una semana. «Te va a cambiar la vida», dice sin una gota de ironía.",
    [
      o("a", "Ir a cenar con él y empezar una buena amistad", "Dejarte llevar", { rel_vestuario: 4, moral: 5, flags: { amigo_ruben: true } }, "El ramen es regular. La conversación, de las mejores de tu año. Cuando salís, hay tres bolsas de papel con restos y dos amigos nuevos con ganas de repetir."),
      o("b", "Aceptar, pero quedaros solo a cenar", "Ir despacio", { rel_vestuario: 2, moral: 2, flags: { amigo_ruben: true } }, "Cenáis tranquilos. Os contáis cosas pequeñas. Al despediros, Rubén dice: «Tenemos que repetir esto». Sabes que sí."),
      o("c", "Posponerlo: tienes otros planes", "Prioridades", { moral: -1 }, "Le dices que otro día. Rubén asiente sin dramas y se va a cenar con el lateral. Esa noche, en el chat del grupo, hay una foto de los dos con un plato enorme y el pie «los ausentes lo lamentarán»."),
    ]),
  S("cb-amigo-vendido", "cambios", { after: [after("cb-amigo-llega", "a", 14, 70)], flags: ["amigo_ruben"] }, "vestuario",
    "Rubén se va a otro equipo",
    "Te lo dice en voz baja, apoyado en tu taquilla, con la mirada en el suelo: el club lo ha vendido. Otro país, otra liga, un sueldo que no puede rechazar. «Me han dicho que mañana me voy», dice. Tú intentas sonreír y te sale una mueca. En los pasillos, el utillero ya está empaquetando sus cosas con una dedicación que da pena.",
    [
      o("a", "Despedirlo con una cena en el restaurante de ramen", "Un cierre con sabor", { moral: 4, rel_vestuario: 3, flags: { amigo_ruben_se_fue: true } }, "Cenáis en el ramen de siempre, con el pelo mojado de lluvia. Al final, Rubén coge la última ración con los palillos y te dice: «Prométeme que vendrás a verme»."),
      o("b", "Prometerle que mantendréis el contacto cada semana", "Un compromiso", { moral: 3, flags: { amigo_ruben_se_fue: true } }, "Se lo prometes con la mano en el corazón. Os mandáis un mensaje esa noche, otro al día siguiente, otro al otro. Después, el ritmo baja. La promesa, no.", { thread: th("promesa", "Rubén Aguirre", "Le prometiste que iríais a verlo cuando se instalara en su nuevo club") }),
      o("c", "Darle la mano y desearle suerte con la tristeza por dentro", "Contener las emociones", { moral: -2, flags: { amigo_ruben_se_fue: true } }, "Cierras la puerta con una sonrisa. Por la noche, te das cuenta de que tu móvil ha dejado de vibrar con un nombre que ya no está."),
    ]),
  S("cb-amigo-gol", "cambios", { after: [after("cb-amigo-vendido", undefined, 18, 140)], flags: ["amigo_ruben_se_fue"] }, "partido",
    "Rubén te marca un gol con su nuevo equipo",
    "Os cruzáis en una competición europea y el destino hace lo de siempre: te pone delante a tu amigo. A los cuarenta minutos, Rubén gira, saca la zurda y la mete por la escuadra. Te mira mientras celebra. No sabe si pedirte perdón o echarte una risa. Al final, la risa gana. Mientras recoges el balón de la red, se te escapa una sonrisa tonta.",
    [
      o("a", "Felicitarle al terminar el partido con un abrazo", "Aplaudir al rival que es amigo", { moral: 4, reputacion: 3, rel_aficion: -1 }, "Le abrazas en el túnel y le dices «qué golazo». Él, rojo como un tomate, responde: «Pero ganaste tú». Y tiene razón: has ganado tú, aunque en tu corazón hayan ganado los dos."),
      o("b", "Hacerle un mensaje gracioso al acabar", "Humor entre amigos", { moral: 5, fama: 1 }, "Le mandas un vídeo de ti cayéndote de un tobogán con el pie «así me quedé yo al verlo». Él lo comparte en su historia con cuatro emojis de risa. Algo de aquel ramen sigue vivo."),
    ]),
  S("cb-veterano-retira", "cambios", { clubTurns: [10, 400], turn: [9, 10], rel: { vestuario: [30, 100] }, minAge: 18 }, "vestuario",
    "El veterano más querido cuelga las botas",
    "Tiene treinta y nueve años, el pelo blanco en las sienes y una rodilla que cruje al bajar las escaleras del autobús. Lo anuncia en una rueda de prensa sin corbata, con un papel que empieza «Gracias» y termina «Gracias otra vez». Un periodista le pregunta qué consejo daría a los jóvenes. Él contesta: «Que no se pierdan los desayunos de después del entrenamiento».",
    [
      o("a", "Organizarle una despedida en el vestuario con el equipo entero", "Un adiós a lo grande", { rel_vestuario: 6, moral: 5, patrimonio: -150 }, "Le regaláis una chaqueta con su nombre, una cena y un vídeo de los mejores momentos. El veterano lo mira con los ojos brillantes y, cuando termina, dice: «Qué suerte he tenido»."),
      o("b", "Pedirle un consejo para los años que te quedan", "Escuchar al maestro", { moral: 4, reputacion: 2, rel_vestuario: 3 }, "Os sentáis juntos en el banco del vestuario. Te cuenta lo que haría distinto: «No lo tomaría tan en serio. Ni tan a la ligera». Es la mejor frase que oirás en un mes."),
      o("c", "Darle un abrazo largo y sin palabras", "Algo simple", { moral: 3, rel_vestuario: 2 }, "Os abrazáis un rato largo. No hace falta decir nada. Al terminar, él te da una palmada en la mejilla y dice: «Cuídate, chaval»."),
    ]),
  S("cb-presidente-nuevo", "cambios", { clubTurns: [30, 400], turn: [1, 2], minAge: 18 }, "especial",
    "Hay nuevo presidente en el club",
    "Las elecciones han traído sorpresas: el candidato del traje gris ha ganado por trescientos votos y el viejo presidente se ha despedido con un discurso de dieciocho minutos y una lágrima. El nuevo habla de «un proyecto ilusionante, con identidad y cantera». En su primer día, entra en el vestuario con una caja de bombones y pregunta por tu nombre.",
    [
      o("a", "Presentarte con educación y expresarle tu apoyo", "Buen pie desde el principio", { rel_entrenador: 1, reputacion: 2, rel_aficion: 1, flags: { gen_presidente: "@+1" } }, "Le das la mano con firmeza y le dices lo contento que estás de seguir en el club. Él sonríe y dice «Hablaremos pronto». No sabes si es promesa o amenaza."),
      o("b", "Mantener la distancia y esperar a ver sus decisiones", "Prudencia", { flags: { gen_presidente: "@+1" } }, "Aplaudes con el resto, sin más. Cuando se acerca, le estrechas la mano con la cortesía justa. Él lo nota y toma nota."),
      o("c", "Pedirle un compromiso con el proyecto deportivo", "Mover ficha", { rel_entrenador: -1, reputacion: 3, rel_representante: 1, flags: { gen_presidente: "@+1" } }, "Le preguntas con tacto cuál es el plan. El presidente sonríe: «Me encanta esa pregunta», y se pasa quince minutos hablando de futuro. Sales del vestuario con la sensación de haber hecho algo útil, y de haber dado trabajo."),
    ]),
  S("cb-director-nuevo", "cambios", { clubTurns: [24, 400], turn: [1, 3], minAge: 18 }, "representante",
    "El director deportivo se marcha y llega otro",
    "Lo ves cargando cajas en el aparcamiento, con una camiseta del club de hace seis años por encima de la camisa. El director deportivo que te fichó se va a un proyecto en otro país. Al nuevo ya lo ves en el despacho, con una libreta nueva y un café que huele a desconfianza. «Quiero conocer a todos», dice. Y, por supuesto, empieza por los que más cobran.",
    [
      o("a", "Ir a hablar con el nuevo y presentarte con claridad", "Marcar el territorio", { rel_representante: 2, reputacion: 2, moral: 2, flags: { gen_director_deportivo: "@+1" } }, "Le cuentas qué quieres del club y qué puede esperar de ti. Él apunta cosas en su libreta. Al despedirse, asiente: «Contaremos contigo»."),
      o("b", "Despedirte del anterior y agradecerle todo", "Un gesto de lealtad", { rel_representante: -1, moral: 3, reputacion: 2, flags: { gen_director_deportivo: "@+1" } }, "Le abrazas junto a una caja de trofeos y le agradeces lo vivido. Él te dice: «Cuídate de los que sonríen demasiado». Y no sabes si habla del nuevo o de todos."),
      o("c", "Dejar que tu agente lo gestione", "Delegar", { rel_representante: 2, flags: { gen_director_deportivo: "@+1" } }, "Tu agente lo toma como un reto personal: «Ya verás cómo en un mes le caigo en gracia». Y lo consigue, para tu sorpresa, en dos semanas."),
    ]),
];
