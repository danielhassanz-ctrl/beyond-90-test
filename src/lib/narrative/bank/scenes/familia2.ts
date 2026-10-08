/**
 * Familia, segunda parte: la hermana que quiere que seas el padrino de su hija, el primo que te
 * pide dinero, la abuela que te regala su anillo, el hermano que se lesiona y te necesita. Casi
 * todas piden una decisión de las que se recuerdan, y varias vuelven años después.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const FAMILIA2: BankScene[] = [
  S("f2-abuela-anillo", "familia", { minAge: 18, clubTurns: [3, 400], notFlags: ["f2_anillo"] }, "vida",
    "Tu abuela te regala su anillo de bodas y no sabes qué decir",
    "Es un aro fino de oro, desgastado por sesenta años de fregar, amasar y rezar. Te lo pone en la palma de la mano con las dos suyas, arrugadas, y te cierra los dedos. «Era de tu abuelo —dice—. Quiero que lo tengas tú. Cuando te cases, o cuando tengas hijos, o cuando te haga falta recordar de dónde vienes». Te mira con una ternura que no admite réplicas. Tu madre, desde la puerta, se seca los ojos.",
    [
      o("a", "Ponértelo en una cadena al cuello y llevarlo siempre contigo", "Llevarlo cerca", { moral: 9, reputacion: 3, flags: { f2_anillo: "cadena", abuela_anillo: true } }, "Cada vez que sales al campo, lo tocas con dos dedos. Los compañeros, intrigados, preguntan. «Es de mi abuelo». Nadie bromea. Años después, cuando nazca tu primer hijo, se lo enseñarás con la misma ternura."),
      o("b", "Guardarlo en una caja especial y sacarlo en ocasiones señaladas", "Cuidarlo", { moral: 7, flags: { f2_anillo: "caja", abuela_anillo: true } }, "La caja es de madera, con un terciopelo rojo por dentro. La guardas en el cajón de la cómoda. Cada Navidad, la abres, miras el anillo y piensas en tu abuelo. Es tu forma de mantenerlo cerca."),
      o("c", "Devolvérselo con cariño: quieres que lo lleve ella hasta el final", "Que lo conserve ella", { moral: 5, reputacion: 2, flags: { f2_anillo: "devuelvo" } }, "Tu abuela te regaña con ternura. «Es tuyo. Lo decidí yo». Finalmente, te lo guardas, pero con una nota: «Hasta que me lo pidas, es tuyo y mío». Murmuras: «Hasta siempre»."),
    ]),
  S("f2-abuela-adios", "familia", { after: [after("f2-abuela-anillo", undefined, 15, 140)], minAge: 22 }, "vida",
    "Tu abuela se va en silencio una madrugada y el anillo ya es solo tuyo",
    "Te llama tu madre a las cinco de la mañana. No dice nada: solo respira. Tú sabes lo que es. Sales del piso con una chaqueta sobre el pijama. En el coche, el volante tiembla. Cuando llegas, tu abuela está en su cama, con el rosario en las manos y una sonrisa en la cara. Tu madre, a su lado, te toma la mano. «No sufrió», murmura. Los dos os quedáis un rato en silencio.",
    [
      o("a", "Quedarte en el funeral y despedirte con unas palabras", "Despedir a tu abuela", { moral: -6, reputacion: 5, rel_aficion: 3, flags: { abuela_adios: "palabras" } }, "Dices tres frases, con la voz entrecortada: «Me enseñaste a levantarme. Me enseñaste a callarme. Y me enseñaste a quererte». La iglesia entera llora. Al salir, sientes el anillo en el pecho, y sientes que está contigo."),
      o("b", "Pedir unos días al club y quedarte con tu familia", "Estar con los tuyos", { moral: -3, rel_entrenador: 3, reputacion: 3, flags: { abuela_adios: "familia" } }, "El míster te concede una semana sin preguntas. Pasas los días en la casa de tu abuela, repartiendo recuerdos con tus primos. Cuando vuelves, el vestuario te recibe con un silencio respetuoso. Alguien deja en tu taquilla un ramo de flores."),
      o("c", "Dedicarle un gol el domingo y mirar al cielo", "Un homenaje en el campo", { moral: 4, rel_aficion: 6, fama: 3, flags: { abuela_adios: "gol" } }, "Marcas en el minuto 60 y te quitas la camiseta para mostrar una frase escrita en la de abajo: «Para ti, abuela». El estadio entero se pone en pie. Es uno de esos goles que no necesitan celebración."),
    ], { weight: 1.3 }),
  S("f2-hermana-padrino", "familia", { minAge: 20, clubTurns: [4, 400], notFlags: ["f2_padrino"] }, "vida",
    "Tu hermana te pide que seas el padrino de su hija",
    "Te lo dice en la cocina de casa, con el bebé en brazos y una sonrisa tímida. «No es por el fútbol, ni por el dinero. Es porque eres el hombre que quiero que cuide de ella si algún día yo no puedo». Hay un silencio. Tu cuñado, apoyado en la puerta, asiente. «Es una decisión de la familia». Tú miras a la niña. Ella te agarra el dedo. Es la primera vez que te sientes así de pequeño.",
    [
      o("a", "Aceptar con los ojos llenos de lágrimas", "Ser su padrino", { moral: 11, reputacion: 4, flags: { f2_padrino: "si", ahijada: true } }, "El bautizo es en la iglesia del barrio, con tu madre llorando y tu padre tomando fotos con una cámara de los noventa. Cuando el cura pregunta si prometes cuidar a la niña, dices «Sí» con una voz que no reconoces. Lo cumplirás toda la vida."),
      o("b", "Aceptar pero pedir que lo comparta con tu pareja o tu mejor amigo", "Compartir la responsabilidad", { moral: 8, reputacion: 2, flags: { f2_padrino: "compartido", ahijada: true } }, "Tu hermana lo piensa. «Vale. Pero tú serás el de la sangre». Os abrazáis. El bautizo es una fiesta. Con el tiempo, la niña os llamará «mis padrinos» sin distinguir."),
      o("c", "Pedir tiempo por miedo a no estar a la altura", "Dudar", { moral: -2, flags: { f2_padrino: "dudo" } }, "Tu hermana lo acepta con una sonrisa dolida. Una semana después, vuelves a casa con un regalo para la niña y dices: «Sí». Ella ya había encontrado a otra persona. Pero te dice: «Siempre habrá sitio»."),
    ]),
  S("f2-primo-dinero", "familia", { minAge: 20, patrimonio: [5000, 100000000], clubTurns: [4, 400], notFlags: ["f2_primo"] }, "vida",
    "Tu primo te pide dinero para «un negocio seguro» que huele a humo",
    "Aparece en tu casa con una carpeta llena de folios y una camisa recién planchada. Habla con una soltura de vendedor de coches: «Es una cafetería con piscina, junto al mar. Solo necesito cinco mil euros. En seis meses, te los devuelvo con intereses». Tu madre, al otro lado, se retuerce las manos. Tu agente, por mensaje: «No firmes nada». Tu primo, con una sonrisa blanca, espera.",
    [
      o("a", "Prestarle una cantidad pequeña y dejar claro que es un regalo", "Con realismo", { patrimonio: -1500, moral: 2, flags: { f2_primo: "pequeno" } }, "Le das mil quinientos «para empezar». El primo, algo decepcionado, lo acepta. A los seis meses, la cafetería no existe. Él te escribe: «No salió». Tú contestas: «Ya lo sabía. Pero ahora, a seguir»."),
      o("b", "Negarte con cariño y ofrecerle trabajo en tu entorno", "Una alternativa mejor", { moral: 3, reputacion: 3, patrimonio: -400, flags: { f2_primo: "trabajo" } }, "Le consigues un puesto en el servicio de logística del club. Al principio, resopla. A los seis meses, es el más puntual del turno y te da las gracias con un abrazo. A veces, el mejor préstamo no es de dinero."),
      o("c", "Darle los cinco mil y esperar que salga bien", "Fiarte de él", { patrimonio: -5000, moral: -2, flags: { f2_primo: "grande" } }, "La cafetería abre. A los tres meses, cierra. El primo desaparece con una disculpa vaga. Tu madre, al enterarse, murmura: «Ya te lo dije». Tienes una lección cara y una pregunta: ¿le querrías igual?"),
    ]),
  S("f2-hermano-lesion", "familia", { minAge: 19, clubTurns: [4, 400], notFlags: ["f2_hermano_lesion"] }, "vida",
    "Tu hermano pequeño se lesiona en un partido de cantera y te llama llorando",
    "Es una llamada a las nueve de la noche. Tu hermano, que juega en un club de barrio, se ha roto el ligamento en un choque absurdo. «Dicen que serán ocho meses —solloza—. Y que quizá no vuelva a ser el mismo». Tú lo escuchas de pie, con el móvil pegado a la oreja y las llaves del coche en la mano. En otro punto de la casa, suena una alarma. Tienes entrenamiento a las ocho.",
    [
      o("a", "Coger el primer tren y quedarte con él el fin de semana", "Estar a su lado", { moral: 4, rel_entrenador: -1, reputacion: 4, flags: { f2_hermano_lesion: "voy" } }, "Pasas el sábado con él en el sofá, jugando a la consola, viendo partidos antiguos. Le dices lo que no dice nadie: «Te vas a recuperar. Y yo voy a estar». Al domingo, su sonrisa es la del niño de siempre."),
      o("b", "Hablar con tu fisio y mandarle un plan de recuperación a medida", "Ayudarle con tus medios", { moral: 5, reputacion: 3, patrimonio: -300, flags: { f2_hermano_lesion: "plan" } }, "Tu fisio diseña un programa detallado y te lo da con una tableta. Tu hermano lo sigue con una disciplina que te sorprende. A los siete meses, vuelve a los entrenamientos. Y marca, en su primer partido, un gol que te dedica."),
      o("c", "Consolarle por teléfono y mandarle un regalo", "A distancia", { moral: 2, patrimonio: -150, flags: { f2_hermano_lesion: "regalo" } }, "Hablas con él una hora. Al día siguiente, le llega un paquete con una camiseta firmada y una nota. Tu hermano agradece, pero algo en su voz te dice que esperaba más. Te prometes visitarle pronto."),
    ]),
  S("f2-hermano-vuelve", "familia", { after: [after("f2-hermano-lesion", undefined, 8, 60)], minAge: 20 }, "vida",
    "Tu hermano vuelve a jugar y te invita a verle",
    "Es un campo de césped natural, con una grada de dos filas y un speaker con una voz tímida. Tu hermano, con su camiseta de siempre, sale al campo con el pelo mojado y la rodilla vendada. Te mira desde la banda y levanta un pulgar. Tus padres, a tu lado, se agarran de las manos. En el minuto 12, recibe un balón, controla y mira a la grada. Es el niño que fue. Es el hombre que será.",
    [
      o("a", "Levantarte a aplaudir cada jugada, como el que más", "Ser su mayor hincha", { moral: 9, reputacion: 3, flags: { f2_hermano_juega: true } }, "Gritas, silbas, aplaudes. Un chaval, a tu lado, te pregunta: «¿Eres su hermano?». «Y su fan número uno», respondes. Cuando marca, se gira, te busca y levanta el brazo. El partido, sin importancia, es el mejor de la temporada."),
      o("b", "Quedarte sentado, con los ojos húmedos, sin hablar", "Disfrutar en silencio", { moral: 8, flags: { f2_hermano_juega: "silencio" } }, "Todo el partido lo ves con la sensación de estar mirando a través de un cristal. Al acabar, bajas, le abrazas y no dices nada. Él, con las manos temblorosas, murmura: «Lo logré». «Sí», dices."),
    ]),
  S("f2-cena-padres", "familia", { minAge: 18, clubTurns: [3, 400], notFlags: ["f2_cena_padres"] }, "vida",
    "Llevas a tus padres a cenar a un restaurante de lujo y no saben qué pedir",
    "Es un sitio con camareros con guantes, mantel blanco y una carta en francés. Tu madre, con su bolso en el regazo, lee la primera hoja con una concentración de oposición. Tu padre, con una corbata que le queda estrecha, se queda mirando una cuchara de postre como si fuera un artefacto. «Hijo, ¿esto cuánto cuesta?», susurra. El camarero espera con una sonrisa perfecta. Tú, por primera vez, sientes vergüenza de tu éxito.",
    [
      o("a", "Pedirles lo que más les gusta, aunque no esté en la carta", "Hacerles sentir en casa", { moral: 8, reputacion: 3, flags: { f2_cena_padres: "casa" } }, "Le dices al camarero: «Tortilla de patatas y croquetas. Con mucho cariño». Hay un momento de silencio. El chef sale de la cocina con las manos a la espalda: «Para el señor Fulano, lo que quiera». Tus padres se ríen por primera vez en toda la noche."),
      o("b", "Dejarles elegir y pagar sin mirar la cuenta", "Con generosidad", { patrimonio: -250, moral: 4, flags: { f2_cena_padres: "generoso" } }, "Piden una sopa, un pescado y un postre. Tu padre, al acabar, murmura: «Esto sí que estaba bien». Al salir, tu madre, orgullosa, comenta: «Parecemos señores». Os reís de camino a casa."),
      o("c", "Cambiar de restaurante a uno sencillo de barrio", "Elegir lo suyo", { moral: 6, reputacion: 4, flags: { f2_cena_padres: "sencillo" } }, "Tu padre respira aliviado en cuanto pisa la acera. En el bar de Paco, con un pincho de tortilla, comenta: «Ahora sí». Vuestra cena, con vino de la casa, es una de las mejores de la vida."),
    ]),
  S("f2-cocina-madre", "familia", { minAge: 18, clubTurns: [3, 400], notFlags: ["f2_cocina"] }, "vida",
    "Te enseña tu madre a cocinar un plato a distancia, por videollamada",
    "Es domingo, estás en tu cocina con un delantal que no sabes ponerte y un montón de ingredientes. Tu madre, desde la pantalla, dirige: «Primero el sofrito, hijo. No, más pequeño. Más. Ahora, el ajo». Tú cortas con una torpeza que le provoca risa. A los veinte minutos, hay humo, una sartén quemada y una cena que huele a aceite recalentado. «Es que me faltan tus manos», dice ella.",
    [
      o("a", "Seguir intentándolo cada domingo hasta que te salga", "Perseverar", { moral: 6, reputacion: 2, flags: { f2_cocina: "perseveras" } }, "A los dos meses, haces un guiso que se parece al suyo. Se lo enseñas por pantalla. Tu madre, con una lágrima, dice: «Casi». «Casi es muchísimo», respondes. Una semana después, invitas al vestuario a cenar."),
      o("b", "Pedirle que te mande una receta por escrito y probarla solo", "A tu ritmo", { moral: 3, flags: { f2_cocina: "receta" } }, "La receta llega con tres faltas de ortografía y un «no te olvides de ponerle cariño». La pegas en la nevera. Cada vez que cocinas, la lees. La cena sigue siendo un desastre. Pero la nevera tiene alma."),
      o("c", "Rendirte y pedir comida a domicilio con una disculpa", "La opción cómoda", { moral: 1, patrimonio: -30, flags: { f2_cocina: "domicilio" } }, "Le cuentas que pediste una pizza. «Es lo que te mereces», dice, riéndose. Y te manda una caja de tuppers por mensajero. En ellos, la comida de toda la semana."),
    ]),
  S("f2-herencia-silla", "familia", { minAge: 19, clubTurns: [3, 400], notFlags: ["f2_silla"] }, "vida",
    "Tu padre te regala una silla vieja y no entiendes por qué",
    "Es una silla de madera oscura, con un asiento de rejilla y un respaldo roto. Tu padre la trae en el maletero, la deja en el salón y te mira. «Era del taller de tu abuelo. Se sentaba ahí a leer el periódico cuando no había trabajo». Hay un silencio. «Quiero que tú te sientes algún día. Cuando todo esto pase». Se marcha sin darte tiempo a responder.",
    [
      o("a", "Colocarla junto a la ventana y sentarte cada domingo a pensar", "Convertirla en un ritual", { moral: 8, reputacion: 2, flags: { f2_silla: "ritual" } }, "Cada domingo, con un café, te sientas en la silla y miras por la ventana. Piensas en tu abuelo, en tu padre, en el niño que fuiste. No es melancolía: es una forma de paz."),
      o("b", "Llevarla al vestuario como talismán", "Compartirla", { moral: 5, rel_vestuario: 4, flags: { f2_silla: "vestuario" } }, "La silla se queda junto a tu taquilla. Un día, el capitán se sienta en ella antes de un partido grande, cierra los ojos y dice: «Es verdad». No dice qué. Tú tampoco preguntas."),
      o("c", "Guardarla en el trastero porque no sabes qué hacer con ella", "Aplazar", { moral: 1, flags: { f2_silla: "trastero" } }, "Pasa un año. Una tarde, bajas a buscar otra cosa y la ves. La subes, la limpias y te sientas. Es incómoda y preciosa. Llamas a tu padre. «Ya me senté», le dices. Él no dice nada, pero lo oyes sonreír."),
    ]),
  S("f2-reunion-familiar", "familia", { minAge: 19, clubTurns: [3, 400], turn: [9, 10], notFlags: ["f2_reunion"] }, "vida",
    "La reunión familiar de verano acaba en una paella gigante y una pelea por el fuego",
    "Son cuarenta primos, tíos, abuelos y vecinos, en una finca con olivos y un horno de leña. Alguien ha traído una paellera de metro y medio. Las discusiones sobre el fuego, el arroz y el caldo se prolongan durante dos horas. Tu tío, con delantal, defiende que «la paella no lleva chorizo». Tu abuela, desde una silla, defiende que sí. Un primo pequeño, con una pelota, te pide un partido en el jardín.",
    [
      o("a", "Jugar con los críos y dejar que se pelee el resto", "Escapar al jardín", { moral: 8, rel_aficion: 2, flags: { f2_reunion: "juego" } }, "Pasas la tarde corriendo con diez críos, entre cánticos y rodillas arañadas. Cuando acabas, el arroz ya está a punto. Los mayores te miran con aprobación: «El único sensato»."),
      o("b", "Mediar con humor entre el tío y la abuela", "Ser el pacificador", { moral: 4, reputacion: 3, rel_vestuario: 0, flags: { f2_reunion: "pacifico" } }, "Propones una paella con chorizo en una mitad y sin chorizo en la otra. El silencio es absoluto. Luego, una carcajada generalizada. Se hace la tregua. «El árbitro de la familia», te llaman."),
      o("c", "Encargarte tú de la paella y demostrar que sabes", "Meterte en harina", { moral: 5, reputacion: 2, forma: -1, flags: { f2_reunion: "cocino" } }, "Pasas dos horas bajo el sol, con un cucharón. Sale decente. El tío admite: «No está mal». La abuela, con una sonrisa, añade: «Pero le falta chorizo». Te das cuenta de que has ganado una batalla de décadas."),
    ]),
];
