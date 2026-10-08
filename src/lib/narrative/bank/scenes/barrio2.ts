/**
 * La vuelta a casa: la pachanga de los domingos, la casa donde creciste, la reunión de clase, el
 * amigo al que le dolió que triunfaras, la calle con tu nombre. Cada escena tiene su efecto en el
 * momento y, casi siempre, una marca que otra escena recoge meses o años después.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const BARRIO2: BankScene[] = [
  S("b2-pachanga", "barrio", { minAge: 18, clubTurns: [3, 400], turn: [1, 3], notFlags: ["b2_pachanga"] }, "vida",
    "Vuelves a la pachanga del domingo donde empezaste",
    "Es el mismo campo de tierra, con las mismas porterías de hierro y los mismos de siempre: Rafa, el del bigote, Santi, que sigue sin correr, y Pablo, que sigue contando el mismo chiste. Cuando llegas, se hace un silencio de dos segundos. Luego, todos a la vez: «¡Mirad quién ha venido!». Alguien te lanza una camiseta sin escudo. El árbitro, el de siempre, pita antes de que te cambies.",
    [
      o("a", "Jugar como uno más, sin trato especial", "Volver a ser el de siempre", { moral: 8, rel_aficion: 3, forma: 1, flags: { b2_pachanga: "uno_mas" } }, "Te caes dos veces, marcas un gol de rebote y discutes una falta con Rafa. Al acabar, os tomáis una cerveza en el bar. Nadie te trata de usted. «Por fin hueles a barro», dice Santi. Es el mejor elogio posible."),
      o("b", "Aparecer con una caja de balones nuevos y camisetas para todos", "Un detalle para el equipo", { patrimonio: -450, moral: 6, reputacion: 4, rel_aficion: 3, flags: { b2_pachanga: "regalo" } }, "Los de la pachanga se quedan boquiabiertos. «¿Y esto?». «Para que se acabe la tierra y empiece el fútbol», dices. A la semana, el equipo tiene nombre, escudo y un entrenador de verdad: Rafa, con el bigote."),
      o("c", "Pasar a saludar un rato y volver a tus obligaciones", "Una visita breve", { moral: 1, flags: { b2_pachanga: "visita" } }, "Te quedas veinte minutos. Os hacéis fotos, os reís, te despides. Camino del coche, oyes a Pablo contarle a un chaval: «Ese era de los nuestros». Se te queda la frase. Prometes volver. No sabes cuándo."),
    ]),
  S("b2-pachanga-leyenda", "barrio", { after: [after("b2-pachanga", "a", 20, 160)], minAge: 26 }, "vida",
    "Años después, la pachanga de tu barrio sale en un reportaje",
    "Un canal de televisión rueda un especial sobre «los campos donde nacieron los cracks» y llega al de tierra. Rafa, ya con el pelo blanco, cuenta ante la cámara que «aquí vino siempre, hasta cuando ya era famoso». Santi, sin aliento, jura que le dio un caño. Pablo repite el chiste. Alguien saca una foto antigua: tú con diez años, un balón y un diente roto.",
    [
      o("a", "Acercarte al reportaje y hacerte una foto con todos", "Volver a posar", { fama: 3, rel_aficion: 5, moral: 7, reputacion: 3, flags: { b2_pachanga_tv: true } }, "Llegas con la camiseta sin escudo. La cámara os graba a todos abrazados en el centro del campo. El reportaje se titula «El campo donde todo empezó» y se repite cada verano. Rafa lo ve cuarenta veces."),
      o("b", "Mandar un vídeo de apoyo desde donde estés", "Un saludo a distancia", { moral: 5, rel_aficion: 3, flags: { b2_pachanga_tv: true } }, "Grabas un mensaje de treinta segundos. En el reportaje, aparece en una pantalla enorme, y los de la pachanga lo ovacionan. Santi, emocionado, le dice al reportero: «Es que es muy suyo»."),
    ]),
  S("b2-instituto", "barrio", { minAge: 20, fama: [35, 100], clubTurns: [4, 400], notFlags: ["b2_instituto"] }, "vida",
    "Tu antiguo instituto te invita a dar una charla a los de cuarto",
    "Es el mismo salón de actos de sillas plegables, con la misma bandera descolorida. El director, el que te suspendió en Física, te presenta como «un ejemplo para todos». Treinta chavales te miran con una mezcla de curiosidad y aburrimiento. Un chico del fondo, con la capucha puesta, levanta la mano antes de que empieces: «¿Es verdad que repetiste?». El salón contiene la respiración.",
    [
      o("a", "Contestar con total sinceridad y contarles que repetiste curso", "La verdad por delante", { reputacion: 6, moral: 5, rel_aficion: 3, flags: { b2_instituto: "sinceridad" } }, "Dices que sí, que repetiste y que lloraste. Cuentas lo que aprendiste. El salón, atento, escucha como nunca. Al acabar, el chico de la capucha te estrecha la mano: «Gracias». Esa tarde, el director te regala una nota: «Aprobado»."),
      o("b", "Quitarle hierro con una broma y pasar a la charla", "Capear con humor", { moral: 3, rel_aficion: 2, flags: { b2_instituto: "humor" } }, "«Repetí para que el instituto no me echara de menos», dices. Hay risas. La charla sale fluida, pero la pregunta se queda flotando. En el pasillo, una profesora murmura: «Pudiste haberles dicho más»."),
      o("c", "Pedirles que lo olviden y hablar solo de fútbol", "Evitar la herida", { moral: -1, flags: { b2_instituto: "evito" } }, "Hablas de goles y fichajes. Los chavales, entretenidos, aplauden. El del fondo no. Se va antes de que acabes. Te quedas con un regusto amargo: has hablado mucho y dicho poco."),
    ]),
  S("b2-instituto-carta", "barrio", { after: [after("b2-instituto", "a", 6, 60)], minAge: 22 }, "vida",
    "El chico de la capucha te escribe una carta tres años después",
    "Llega a la oficina del club, escrita a mano, con letra apretada. «Soy el de la pregunta de si repetiste. Repetí yo también, dos veces. Después de oírte, me puse a estudiar. Ahora estoy en la universidad, haciendo Magisterio. Quería que lo supieras». Al final, una frase subrayada: «Algún día daré clase en ese mismo salón».",
    [
      o("a", "Contestarle con una carta larga y ofrecerle ayuda con la matrícula", "Apoyarle de verdad", { patrimonio: -700, moral: 9, reputacion: 6, flags: { b2_becado: true } }, "Pagas su matrícula del siguiente curso, sin hacer ruido. Él te lo agradece con otra carta, más larga. Años después, te invita a un acto: su primera clase. En la pizarra, hay una frase tuya."),
      o("b", "Enviarle un libro y una nota de ánimo", "Un gesto modesto", { patrimonio: -30, moral: 6, reputacion: 3, flags: { b2_becado: "libro" } }, "Le mandas el libro que más te marcó, con una dedicatoria. «Para el que repitió y no se rindió», escribes. En su carta de agradecimiento, dice que lo tiene en la mesilla y que se lo ha leído tres veces."),
    ]),
  S("b2-casa-infancia", "barrio", { minAge: 22, patrimonio: [20000, 100000000], clubTurns: [4, 400], notFlags: ["b2_casa"] }, "vida",
    "La casa donde creciste sale a la venta",
    "Te lo dice tu madre por teléfono, intentando que no se note: «La vecina dice que van a vender la de abajo, la de siempre. Los nuevos dueños la quieren tirar para hacer pisos». Cierras los ojos y ves el pasillo estrecho, la cocina con olor a sofrito, la ventana por la que te asomabas para ver si venía tu padre. Notas un nudo. Tu madre, sin añadir nada, guarda silencio.",
    [
      o("a", "Comprarla y dejarla tal como estaba", "Salvar la casa", { patrimonio: -9000, moral: 10, reputacion: 4, flags: { b2_casa: "comprada" } }, "Firmas con la mano de tu madre en el hombro. Dejas el sofá, el mantel, el calendario del veintitrés. Cada vez que vas, abres la ventana. Un día, un niño del barrio te pregunta si puede jugar en la calle de enfrente. «Claro», dices."),
      o("b", "Pagar solo la reforma para que tus padres puedan comprarla", "Que sea de ellos", { patrimonio: -4500, moral: 9, reputacion: 5, flags: { b2_casa: "padres" } }, "Tus padres firman con una pluma vieja, con lágrimas contenidas. Es la primera vez que tienen algo suyo. Tu padre, al salir, abre la puerta y, por primera vez, dice en voz alta: «Esta es mi casa»."),
      o("c", "Despedirte de ella con una foto y dejar que se la lleve el tiempo", "Aceptar el cambio", { moral: -3, flags: { b2_casa: "perdida" } }, "Pasas por delante la víspera del derribo y haces una foto. Esa noche, en el hotel, la miras largo rato. Dos meses después, donde estaba tu ventana hay una valla de obra. Te prometes recordar cada detalle."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a footballer standing in front of his modest childhood family home in a working-class neighbourhood, hand on the door, mother beside him, warm late afternoon light, nostalgic emotion, no logos or readable text" }),
  S("b2-casa-visita", "barrio", { after: [after("b2-casa-infancia", "a", 12, 100)], minAge: 25 }, "vida",
    "Un domingo abres la puerta de la casa de tu infancia con tus hijos o sobrinos",
    "Tienes la llave desde hace años. Hoy, al abrir, el olor te golpea: madera, humedad, un fondo de sofrito que no existe. Detrás de ti, los niños corren por el pasillo, cuentan las puertas, se asoman a la ventana de la cocina. Uno de ellos señala una marca en el marco: «¿Quién ha hecho esto?». Es tu altura, a los siete años, grabada con un lápiz.",
    [
      o("a", "Contarles la historia del lápiz y de tu padre midiéndote", "Compartir el recuerdo", { moral: 10, reputacion: 3, flags: { b2_marca_lapiz: true } }, "Les cuentas cómo tu padre, cada cumpleaños, te ponía de espaldas a la pared y apuntaba. Los niños, serios, piden que los midas a ellos. Esa tarde, el marco tiene seis marcas nuevas. Y tú, por dentro, una más."),
      o("b", "Dejar que corran y hagan lo que quieran", "Ceder la casa a los niños", { moral: 8, flags: { b2_marca_lapiz: "juego" } }, "La casa se llena de gritos, persecuciones y una guerra de almohadas. Un jarrón no sobrevive. Tu madre, al enterarse por teléfono, ríe: «Por fin vuelve a sonar». Es el mejor homenaje."),
    ]),
  S("b2-amigo-envidia", "barrio", { minAge: 20, fama: [40, 100], clubTurns: [4, 400], notFlags: ["b2_envidia"] }, "vida",
    "Un amigo de la infancia deja de contestarte los mensajes",
    "Se llama Dani y fue tu mejor amigo durante diez años. Jugabais juntos en la pachanga, compartíais cromos, os escondíais de vuestros padres. Desde que firmaste con el club, sus respuestas son cada vez más breves: «Bien», «Ya», «Ok». Hace dos meses que no contesta. Una vecina te cuenta, de pasada, que Dani se enfadó cuando se enteró de tu último contrato. «Dice que has cambiado», murmura.",
    [
      o("a", "Ir a verle a su casa, sin avisar, y hablar cara a cara", "Dar el paso", { moral: 4, reputacion: 4, flags: { b2_envidia: "voy" } }, "Llamas al timbre. Dani abre y se queda inmóvil. Pasa un minuto interminable. «Tenemos que hablar», dices. Se aparta de la puerta. Tres horas y dos cafés después, ya no hay rencor, solo cosas que se dijeron tarde."),
      o("b", "Mandarle un mensaje largo y sincero", "Escribir lo que sientes", { moral: 3, reputacion: 2, flags: { b2_envidia: "mensaje" } }, "Escribes: «Te echo de menos. Todo lo que tengo empezó contigo». Tardas un día en recibir respuesta. Es una sola línea: «Yo también». Y a partir de ahí, vuelve a haber conversación."),
      o("c", "Darle espacio y dejar que pase el tiempo", "Esperar", { moral: -3, flags: { b2_envidia: "espera" } }, "Pasan los meses. A veces, ves una foto suya en redes, con otros amigos. Piensas en llamarle. No lo haces. Se cierra una puerta sin que nadie la haya empujado."),
    ]),
  S("b2-amigo-paz", "barrio", { after: [after("b2-amigo-envidia", undefined, 6, 80)], minAge: 22 }, "vida",
    "Dani aparece en tu boda, en tu bautizo o en tu retirada, sin avisar",
    "Estás en un acto importante de tu vida y, entre la gente, ves una cara. Es Dani, con una chaqueta que le queda grande y un regalo envuelto en papel de periódico. Se acerca despacio, como quien cruza un puente de cuerda. «Perdona por la tardanza», dice. «Es que me costó decidir si venía». Se le humedecen los ojos. «Pero no podía faltar».",
    [
      o("a", "Abrazarle fuerte y presentarle a tu familia como tu mejor amigo", "Reconciliarte del todo", { moral: 11, reputacion: 5, rel_vestuario: 1, flags: { b2_amigo_vuelve: true } }, "Lo abrazas hasta que se queja de que le aprietas. «Este es Dani», le dices a tu madre. «Ya lo sé —responde ella—. El de los cromos». Dani abre el regalo: un balón con una frase: «Para el que siempre jugó conmigo»."),
      o("b", "Agradecerle con una sonrisa y seguir con el acto, hablando luego", "Dejarlo para después", { moral: 6, reputacion: 2, flags: { b2_amigo_vuelve: "luego" } }, "Le dices que hablaréis esta noche. Lo hacéis, con una botella y una luz tenue. Es la conversación más larga de vuestras vidas. A las cuatro de la madrugada, aún os quedan cosas por decir."),
    ]),
  S("b2-calle-nombre", "barrio", { minAge: 28, fama: [75, 100], clubTurns: [10, 400], notFlags: ["b2_calle"] }, "especial",
    "El ayuntamiento propone ponerle tu nombre a una calle",
    "Te enteras por el periódico local: un pleno municipal debate, con muchos aplausos y alguna ceja levantada, bautizar con tu apellido la calle donde está el campo de tierra. Hay un sector que lo apoya con entusiasmo y otro que prefiere «un poeta, un científico, alguien que no corra detrás de una pelota». Tu madre, desconcertada, te llama: «Dicen que van a poner tu nombre en una placa».",
    [
      o("a", "Aceptar el homenaje y asistir a la inauguración", "Dejarte querer", { rel_aficion: 8, moral: 9, reputacion: 4, flags: { b2_calle: "acepto" } }, "Descorres la tela con tus padres a los lados. La placa es sencilla, azul, con letras blancas. Un niño pregunta quién eres. «Alguien que jugaba aquí», contestas. El alcalde, emocionado, sonríe. Tu padre se hace una foto bajo la placa durante una hora."),
      o("b", "Pedir que la calle lleve el nombre del entrenador de tu infancia", "Ceder el honor", { rel_aficion: 6, reputacion: 8, moral: 8, flags: { b2_calle: "entrenador" } }, "El ayuntamiento, sorprendido, lo estudia. A los tres meses, la calle se llama «Entrenador Anselmo». Él, ya muy mayor, llora de agradecimiento. «No te lo mereces tú, me lo merezco yo», bromea. Sabéis los dos que es mentira."),
      o("c", "Declinar con educación: aún no es el momento", "Con humildad", { reputacion: 5, moral: 2, flags: { b2_calle: "no" } }, "Escribes una carta al alcalde pidiendo que lo dejen para «cuando ya no juegue». El pleno lo aplaza. Años después, al retirarte, la propuesta vuelve. Y esta vez dices que sí."),
    ]),
  S("b2-reunion-clase", "barrio", { minAge: 25, fama: [35, 100], clubTurns: [4, 400], notFlags: ["b2_reunion"] }, "vida",
    "La reunión de antiguos compañeros de clase, con un par de sorpresas",
    "Es en un salón de bodas de un pueblo vecino, con una pancarta en la puerta: «Promoción del 2018, ¿quién eres tú?». Hay cuarenta personas, veinte vasos de sangría y una exposición de fotos de la ESO. Al entrar, todo el mundo se gira. Alguien dice: «¡El famoso!». Una compañera, en el fondo, murmura: «Ni siquiera me saludaba». Un hombre calvo te abraza: «¡Soy yo, el que te copiaba!».",
    [
      o("a", "Pasar la noche charlando con todos y recordando anécdotas", "Mojarte", { moral: 8, rel_aficion: 3, reputacion: 4, flags: { b2_reunion: "charla" } }, "Te quedas hasta que apagan las luces. Cuentas historias que habías olvidado, escuchas las de los demás. Descubres que el calvo es ahora ingeniero y que la que no te saludaba se hizo pediatra. Todos han crecido. Tú también."),
      o("b", "Firmar camisetas y hacerte fotos con quien las pida", "Hacer de famoso", { fama: 3, rel_aficion: 4, moral: 3, flags: { b2_reunion: "firmas" } }, "Pasas dos horas firmando. Al final, una compañera te dice, sin acritud: «Nadie ha venido a verte, vinieron a verse». Es una frase tonta que te acompaña meses. Quizá tenga razón."),
      o("c", "Contar a todos que, en realidad, te sentías muy solo en el instituto", "Una confesión inesperada", { moral: 4, reputacion: 6, flags: { b2_reunion: "confieso" } }, "Hay un silencio. Luego, una voz: «Yo también». Y otra. Y otra. Se forma un corro de gente que habla de lo que nunca dijo. El organizador, emocionado, acabará organizando una reunión cada año."),
    ]),
  S("b2-bici", "barrio", { minAge: 19, clubTurns: [2, 400], notFlags: ["b2_bici"] }, "vida",
    "Encuentras tu primera bicicleta en un trastero y se te escapa una lágrima",
    "Estaba cubierta de polvo, con las ruedas deshinchadas y el sillín roto. Tu madre la guardaba «por si acaso». Es azul, con un timbre que ya no suena y una pegatina de un equipo que ya no existe. Cuando la sacas al patio, te acuerdas de la caída que te rompió un diente, del día que fuiste solo por primera vez a por el pan, de la voz de tu padre: «¡Pedalea, no mires!».",
    [
      o("a", "Arreglarla y dársela a un niño del barrio que no tiene", "Que siga rodando", { patrimonio: -80, moral: 8, reputacion: 4, rel_aficion: 3, flags: { b2_bici: "regalo" } }, "Le cambias las ruedas, engrasas la cadena y la pintas de azul. El niño, al ver la bici, no puede hablar. Pedalea hasta el final de la calle. Y vuelve a toda velocidad. «¡Está viva!», grita."),
      o("b", "Quedártela como adorno en el salón de tu casa", "Conservarla", { moral: 5, flags: { b2_bici: "salon" } }, "La cuelgas en una pared, bajo una luz cálida. Cada visita pregunta por ella. Cuentas la historia, y cada vez te sale más bonita."),
      o("c", "Usarla para dar una vuelta por tu barrio, solo, de noche", "Una última vuelta", { moral: 6, forma: 1, flags: { b2_bici: "vuelta" } }, "Pedaleas despacio por calles que conoces con los ojos cerrados. Pasas por delante del campo, del colegio, del bar. Las farolas son más viejas, el barrio también. Pero tú sigues sabiendo el camino."),
    ]),
  S("b2-tienda-abuelo", "barrio", { minAge: 21, patrimonio: [8000, 100000000], clubTurns: [4, 400], notFlags: ["b2_tienda"] }, "vida",
    "La tienda de ultramarinos de tu abuelo está a punto de cerrar",
    "Es un local diminuto, con el mostrador de madera oscura, la báscula de platillos y un cartel descolorido: «Ultramarinos Aurelio». Tu abuelo la abrió hace cincuenta años y ahora, con ochenta y cuatro, ya no puede con las cajas. Los clientes se han ido con los supermercados. Lo cuenta con una sonrisa que no engaña a nadie: «Hay que saber retirarse». Tú ves el estante donde guardaba tus chicles.",
    [
      o("a", "Reformar el local, contratar a alguien y mantenerlo abierto", "Salvar la tienda", { patrimonio: -6000, moral: 9, reputacion: 6, rel_aficion: 3, flags: { b2_tienda: "salvada" } }, "Pintas, pones estanterías nuevas, contratas a una vecina del barrio. Tu abuelo, de pie en la puerta, se hace una foto con el cartel recién repintado. «Aurelio, desde 1975», dice. Cada domingo, vuelve a servir una barra de pan."),
      o("b", "Hacer un homenaje al cierre con todo el barrio", "Una despedida a lo grande", { patrimonio: -800, moral: 7, reputacion: 5, rel_aficion: 4, flags: { b2_tienda: "homenaje" } }, "El último día, la tienda se llena de vecinos con sus bolsas de tela. Tu abuelo, entre lágrimas, despacha por última vez. Alguien le regala un cartel: «Gracias por cincuenta años». La persiana baja con aplausos."),
      o("c", "Respetar su decisión y no meterte", "Dejar que decida él", { moral: -2, flags: { b2_tienda: "cierra" } }, "La tienda cierra sin ruido. Un año después, pasas por delante y ves un local de telefonía. Te quedas un rato mirando el escaparate. Echas de menos algo que nunca valoraste del todo: el olor a pan."),
    ]),
  S("b2-tienda-nieto", "barrio", { after: [after("b2-tienda-abuelo", "a", 15, 120)], minAge: 26 }, "vida",
    "Tu hijo o tu sobrino despacha por primera vez en la tienda de tu abuelo",
    "Es sábado y hay cola. Detrás del mostrador, un niño de doce años, subido a un cajón de madera, atiende con la seriedad de un cirujano. Pesa un cuarto de queso, cobra, da el cambio. Tu abuelo, desde la silla, le dicta los precios. Una clienta, divertida, pregunta: «¿Y usted cuándo se hace con el negocio?». El niño, solemne: «Cuando acabe el colegio y jugar al fútbol».",
    [
      o("a", "Quedarte detrás del mostrador ayudando en el reparto", "Dedicar la tarde", { moral: 9, reputacion: 3, flags: { b2_tienda_nieto: true } }, "Pesas, envuelves, cobras. Te equivocas con el cambio y tu abuelo te corrige con un «tú sigue chutando». La cola se parte de risa. Cuando cierras, el niño te mira: «¿Esto es más difícil que el fútbol?». «Bastante», respondes."),
      o("b", "Hacerte una foto de los cuatro, el abuelo, el niño, tú y el mostrador", "Guardar el momento", { moral: 7, flags: { b2_tienda_nieto: "foto" } }, "La foto queda en el escaparate durante años. En ella, tu abuelo sonríe con una dentadura que no es suya, el niño con las manos llenas de harina y tú, con una expresión de pura paz."),
    ]),
];
