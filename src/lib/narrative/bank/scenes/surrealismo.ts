/**
 * Surrealismo y cosas que solo pasan en un club de fútbol: un loro con opiniones, un pulpo
 * adivino, un doble tuyo en un centro comercial. Casi todo arranca como una broma y casi todo
 * deja huella: algunas marcas vuelven a las pocas semanas y otras, años después, cuando ya
 * nadie se acuerda de por qué hay un loro en tu homenaje.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const SURREALISMO: BankScene[] = [
  // ───── El loro del utillero (corto: bronca · largo: homenaje) ─────
  S("sr-loro", "surreal", { minAge: 16, clubTurns: [2, 200], notFlags: ["loro"] }, "vestuario",
    "El utillero ha traído un loro",
    "Nadie sabe de dónde ha salido. Está posado en la percha de los petos, con una pata en cada lado del escudo, y repite con una voz idéntica a la del míster: «¡Esto no es un hotel!». El utillero se encoge de hombros: «Lo encontré en el aparcamiento. Se llama Evaristo». El loro te mira directamente a ti y dice, muy despacio: «¡Esto no es un hotel!».",
    [
      o("a", "Adoptarlo oficialmente como mascota del vestuario", "Que se quede", { rel_vestuario: 4, moral: 3, flags: { loro: "mascota" } }, "Le haces un cartelito de cartón: «Evaristo, fichaje de invierno». El vestuario lo aplaude. Evaristo se come tres pipas y suelta, con un acento perfecto: «¡Todos a correr!»."),
      o("b", "Enseñarle a decir tu nombre", "Que sepa quién eres", { moral: 2, fama: 1, flags: { loro: "tuyo" } }, "Tres semanas de entrenamientos paralelos y el loro ya dice tu apellido con la entonación del speaker del estadio. Te sientes un poco ridículo y muy orgulloso."),
      o("c", "Esconderlo antes de que lo vea el míster", "Salvar al pájaro", { rel_entrenador: 1, moral: -1, flags: { loro: "escondido" } }, "Lo metes en una bolsa de deporte vacía, con la cremallera medio abierta. El míster pasa a tu lado, olfatea el aire y dice: «Huele a pipas». Sigue andando. Lo sabe."),
    ], { weight: 1.5 }),
  S("sr-loro-prensa", "surreal", { after: [after("sr-loro", undefined, 3, 14)], clubTurns: [3, 200] }, "prensa",
    "El loro se cuela en la rueda de prensa",
    "El míster está respondiendo a una pregunta sobre su futuro cuando, desde el fondo de la sala, una voz idéntica a la suya dice: «¡Esto no es un hotel!». Medio silencio. Una periodista levanta la mano: «¿Ha sido usted?». El míster, rojo como un tomate, busca con la mirada al utillero. Evaristo, en el hombro del jefe de prensa, hace una reverencia.",
    [
      o("a", "Intervenir y desviar la atención con una broma", "Salvar al míster", { rel_entrenador: 4, reputacion: 2, moral: 2 }, "Dices en voz alta: «Es que el míster tiene doble». La sala se ríe, el míster respira y, al acabar, te da un abrazo que no se lo habías visto dar a nadie. El vídeo, por supuesto, es viral."),
      o("b", "Aplaudir al loro desde tu silla", "Pasárselo bien", { fama: 2, rel_vestuario: 3, rel_entrenador: -2 }, "Aplaudes muy fuerte. El míster te fulmina con la mirada, pero el vestuario, que lo ve en directo, te lo agradece durante semanas. Evaristo gana más seguidores que tú."),
      o("c", "Quedarte quieto y no mirar a nadie", "Que pase la tormenta", { moral: -1, flags: { loro_culpa: true } }, "Te concentras en tus zapatos. Al final de la rueda, el míster te pregunta: «¿Has sido tú?». «No», dices. «Pues ya sabes lo que va a pasar», contesta. No sabes qué va a pasar, pero te da miedo."),
    ]),
  S("sr-loro-homenaje", "surreal", { after: [after("sr-loro", undefined, 40, 200)], minAge: 26, clubTurns: [1, 400] }, "vida",
    "Evaristo cumple treinta años",
    "Los loros viven una barbaridad y el del utillero, que ya es un hombre mayor, ha vuelto a aparecer por el vestuario. Tiene la misma voz de aquel míster que ya no está, y dice la misma frase: «¡Esto no es un hotel!». Los chavales jóvenes no entienden por qué se ríen los veteranos, y los veteranos, por qué se les saltan las lágrimas.",
    [
      o("a", "Organizar una pequeña fiesta con tarta de pipas", "Un homenaje", { rel_vestuario: 5, moral: 6, reputacion: 2 }, "Una tarta con velas en forma de pipa y todo el vestuario cantando «cumpleaños feliz». El loro, desde su percha, remata: «¡Todos a correr!». Alguien llora. Alguien graba. Es el mejor día del mes."),
      o("b", "Contarles a los jóvenes la historia de cuando llegó", "Pasar el testigo", { rel_vestuario: 3, moral: 4, reputacion: 3, flags: { loro_leyenda: true } }, "Les cuentas lo del aparcamiento, la rueda de prensa, el míster rojo como un tomate. Los chavales se parten. Esa noche, uno de ellos escribe «Evaristo» en su taquilla con rotulador."),
    ]),
  // ───── El pulpo adivino ─────
  S("sr-pulpo", "surreal", { minAge: 17, clubLevels: ["grande", "europeo"], notFlags: ["pulpo"] }, "prensa",
    "Un pulpo del acuario predice tus partidos",
    "Se llama Paco, vive en el acuario municipal y dos semanas seguidas ha acertado el resultado de tu equipo eligiendo entre dos cajas con mejillones. Los medios locales ya hacen guiños, y la afición tiene una nueva superstición: «Si Paco dice que ganamos, se gana». Esta mañana, alguien ha colgado en la puerta del estadio una foto suya con la frase: «Paco, titular».",
    [
      o("a", "Seguirle el juego y visitarlo con unos compañeros", "Hacerte la foto con el pulpo", { fama: 3, rel_aficion: 4, rel_vestuario: 2, flags: { pulpo: "fe" } }, "Te haces una foto con el cristal del acuario de fondo, y Paco te dedica un tentáculo que sale perfecto en la imagen. La afición se vuelve loca. El míster, no tanto."),
      o("b", "Retarlo públicamente: «Que prediga mi gol»", "Plantarle cara al cefalópodo", { fama: 4, rel_aficion: 2, reputacion: -1, flags: { pulpo: "reto" } }, "Dices ante un micro que un pulpo no puede saber más que tú. Al día siguiente, la portada: «El delantero que se atrevió con Paco». Tu agente se frota las manos."),
      o("c", "Ignorarlo: «Un pulpo no juega a fútbol»", "Mantener la seriedad", { reputacion: 2, rel_entrenador: 1, flags: { pulpo: "serio" } }, "Respondes con tres frases serias y aburridas. Nadie te hace ni caso. Esa semana, Paco acierta otra vez, y empiezas a notar que se te nota la mala cara en el campo."),
    ], { weight: 1.4 }),
  S("sr-pulpo-fallo", "surreal", { after: [after("sr-pulpo", undefined, 3, 12)] }, "prensa",
    "Paco se equivoca justo en tu partido",
    "El pulpo había elegido la caja de la victoria y el equipo perdió 0-2. En redes, la mitad de la afición culpa a Paco; la otra mitad, a ti. Alguien ha puesto la foto del cefalópodo con una gorra de «despedido». En la puerta del acuario, un grupo de aficionados pide la cabeza del animal (en broma, aparentemente).",
    [
      o("a", "Defender a Paco: «Un pulpo no tiene la culpa»", "Salir en su defensa", { rel_aficion: 3, fama: 2, moral: 1 }, "Tu defensa pública del pulpo se hace tendencia: «Hay que quererle más y exigirle menos». En el acuario te dedican un cartel. Paco, al verte, pone cara de agradecimiento (según el cuidador)."),
      o("b", "Cargar la culpa en broma sobre él", "Echar la culpa al pulpo", { fama: 3, rel_aficion: -1, moral: 2 }, "Dices que Paco se ha hecho un lío con los mejillones. La frase se hace meme. Los del acuario te escriben una carta educadísima pidiéndote que pares."),
      o("c", "Pedir perdón a la afición por el resultado", "Dar la cara", { reputacion: 3, rel_aficion: 2, moral: -1 }, "Sales a hablar: «La culpa es nuestra, no del pulpo». La grada aplaude. Hay una pancarta que dice: «Paco, vuelve». Nadie sabe adónde se había ido."),
    ]),
  S("sr-pulpo-adios", "surreal", { after: [after("sr-pulpo", undefined, 30, 140)], minAge: 22 }, "vida",
    "El acuario cierra y Paco se jubila",
    "Después de tantos años, el acuario municipal anuncia que cierra por reforma y que Paco, que ya es abuelo en años de pulpo, se retira a un tanque privado. Te llaman para la despedida: hay una caja con dos mejillones y una última predicción. Todo el mundo quiere saber qué va a elegir el cefalópodo. Una cámara de televisión te apunta a ti.",
    [
      r("a", "Acudir y poner los mejillones tú mismo", "Estar en su última", 0.5, "Paco elige la caja de tu equipo, con una lentitud dramática. La ciudad entera lo celebra y tú recibes una placa por «Mejor jugador de pulpo de la historia». La cuelgas en el pasillo de casa.", { rel_aficion: 5, fama: 3, moral: 6 }, "Paco duda, mira a la cámara y elige la caja del rival. Todo el mundo se queda en silencio. «Es un pulpo viejo», dices, quitándole hierro. Aun así, te lo apuntan para toda la vida.", { rel_aficion: 1, fama: 2, moral: 1 }, "fama"),
      o("b", "Mandarle un regalo y no ir", "Cariño a distancia", { rel_aficion: 1, moral: 2 }, "Mandas una caja enorme de mejillones con una nota: «Gracias por las alegrías». El cuidador te escribe: «Dice Paco que de nada». Se te saltan las lágrimas, aunque no tengas claro por qué."),
    ]),
  // ───── Tu doble ─────
  S("sr-doble", "surreal", { fama: [35, 100], minAge: 17, notFlags: ["doble"] }, "vida",
    "Un doble tuyo inaugura un centro comercial",
    "Te llega un vídeo: un chaval clavado a ti, con tu peinado y tu sonrisa de portada, corta la cinta de un centro comercial rodeado de fans que le piden fotos. Le han contratado por mil quinientos euros. Tu agente te llama por teléfono muy serio: «No sé si denunciar o ficharle».",
    [
      o("a", "Aprovechar el caso y hablar con él", "Conocer a tu doble", { fama: 2, moral: 4, flags: { doble: "amigo" } }, "Quedáis en un bar. Se llama Rubén y es tan simpático como tú, pero con peores botas. Os sacáis una foto juntos, y alguien comenta: «¿Cuál es el de verdad?»."),
      o("b", "Dejar que tu agente le ponga una denuncia amistosa", "Hacerlo legal", { rel_representante: 2, reputacion: -1, flags: { doble: "denuncia" } }, "Llega una carta de abogados con membrete y tres sellos. Rubén contesta con otra carta, firmada con tu letra, que dice: «Sin rencores». Tu agente se ríe a carcajadas."),
      o("c", "No hacer nada y esperar a ver qué pasa", "Que corra el tiempo", { moral: 1, flags: { doble: "ignorado" } }, "Dejas pasar el asunto. A los dos meses, el doble cobra más que tú por un anuncio de cuchillas de afeitar. Empiezas a replantearte la situación."),
    ]),
  S("sr-doble-famoso", "surreal", { after: [after("sr-doble", undefined, 4, 20)], fama: [35, 100] }, "prensa",
    "Tu doble es más famoso que tú en un pueblo",
    "En un pueblo de la sierra donde nunca has estado, hay una calle con tu cara pintada en un mural. Pero la cara es la de tu doble: él es quien posa todos los domingos en la plaza y quien firma autógrafos con tu nombre. Los vecinos creen que eres un tipo majísimo que viene mucho a tomar vermú.",
    [
      o("a", "Presentarte en el pueblo y dar la sorpresa", "Una visita inesperada", { fama: 4, rel_aficion: 3, moral: 5 }, "Llegas a la plaza justo cuando tu doble firma una camiseta. Se hace un silencio de película. «Pues yo soy el otro», dices. El pueblo entero os hace una paella gigante y os sentáis a comer juntos."),
      o("b", "Enviar un vídeo desde casa saludando al pueblo", "Una explicación a distancia", { fama: 2, rel_aficion: 1 }, "Grabas un vídeo de saludo, el alcalde lo pone en el ayuntamiento y la foto de tu doble se retira con honores. Alguien dice que eres «más serio de lo que parece»."),
      o("c", "Pedirle al doble que deje de usar tu nombre", "Marcar el territorio", { reputacion: 1, moral: -2, rel_aficion: -1 }, "Se lo pides con educación. Él obedece, pero esa semana el pueblo se pone triste y alguien pinta en el mural «volvemos pronto». Te sientes como un villano de una película del domingo."),
    ]),
  S("sr-doble-anuncio", "surreal", { after: [after("sr-doble-famoso", undefined, 10, 80)], fama: [40, 100], minAge: 20 }, "representante",
    "Una marca quiere a los dos en un anuncio",
    "Una marca de cuchillas de afeitar tiene una idea que, según tu agente, «va a salir en todos los resúmenes de fin de año»: un anuncio con dos hombres idénticos, uno de ellos tú, que se miran al espejo y se afeitan con el mismo gesto. El doble ya ha dicho que sí. Falta tu firma.",
    [
      o("a", "Aceptar y rodar con él", "Hacerlo en serio", { patrimonio: 6000, fama: 4, moral: 4, flags: { doble_anuncio: true } }, "El rodaje es una locura: dos tipos idénticos, cinco horas de maquillaje y una frase repetida cuarenta veces. El anuncio gana un premio de publicidad y a ti te llaman «el hombre de las dos caras»."),
      o("b", "Aceptar si cobras el triple", "Negociar", { patrimonio: 12000, rel_representante: 2, reputacion: -1 }, "Tu agente pide el triple. La marca duda tres días y acepta. Lo que ganas lo gastas, en parte, invitando a Rubén a una cena enorme para compensarle por haberse quedado en lo básico."),
      o("c", "Rechazar: eres futbolista, no cómico", "Mantener la imagen", { reputacion: 3, patrimonio: -300, moral: 0 }, "Dices que no. Tu doble hace el anuncio con otro doble. En la calle, un chaval te dice: «Cómo has cambiado en el anuncio». Te cuesta no contestar «ese no soy yo»."),
    ]),
  // ───── Sueltas surrealistas ─────
  S("sr-taquilla13", "surreal", { minAge: 16, clubTurns: [2, 200], notFlags: ["sr_taquilla13"] }, "vestuario",
    "Te asignan la taquilla 13, la maldita",
    "El vestuario tiene su propia leyenda: quien ocupa la taquilla 13 se lesiona, o descubre que su novia se ha ido, o le roban el coche. Hace diez años que nadie la usaba, y el utillero te la ha dado «porque no hay otra». Lleva grabada una frase a cuchillo: «No abrir en martes».",
    [
      o("a", "Aceptarla y reírte de la maldición", "Retar a la mala suerte", { rel_vestuario: 3, moral: 3, flags: { sr_taquilla13: "retador" } }, "Cuelgas tu camiseta con el 13 en la puerta y lo celebras con un selfi. Esa semana juegas mejor que nunca. Los compañeros se pelean por hacerse una foto con tu taquilla."),
      o("b", "Pedirle al utillero que te cambie", "No tentar a la suerte", { rel_vestuario: -1, moral: 1, flags: { sr_taquilla13: "cambio" } }, "El utillero te mira como si hubieras pedido un coche nuevo. «Nadie la ha pedido en diez años», murmura. Al final, te dan otra. A la 13 la visita un veterano que no cree en estas cosas. Se tuerce el tobillo en dos días."),
      o("c", "Exorcizarla con una ceremonia del vestuario", "Hacer una fiesta", { rel_vestuario: 5, moral: 4, patrimonio: -80, flags: { sr_taquilla13: "exorcismo" } }, "Con una vela, un paquete de sal gruesa y un cántico inventado, todo el vestuario «limpia» la taquilla. El míster entra, mira y dice: «No he visto nada». Pero sonríe por dentro."),
    ]),
  S("sr-gallina", "surreal", { minAge: 16, clubLevels: ["modesto", "europeo"], turn: [3, 9] }, "entrenamiento",
    "Una gallina invade el campo de entrenamiento",
    "A mitad de un rondo, una gallina blanca cruza la banda, entra al centro del círculo y se pone a picotear el balón con la dignidad de quien ha llegado antes. Nadie sabe de qué granja escapó. El míster, que ha visto de todo, saca el silbato y pita: «¡Fuera de juego!». La gallina no se inmuta.",
    [
      o("a", "Intentar regatear a la gallina", "Hacerle un caño", { moral: 4, rel_vestuario: 3, forma: 1 }, "Intentas el túnel. La gallina, con una agilidad impropia de su especie, se echa a un lado y te deja con el balón enredado en sus alas. El vestuario se desmorona de risa. Alguien lo graba."),
      o("b", "Cogerla en brazos y buscarle dueño", "Rescatarla", { reputacion: 3, rel_aficion: 2, moral: 3 }, "La llevas en brazos hasta la entrada. Una señora mayor aparece corriendo: «¡Tomasa!». Te da dos huevos de regalo y te invita a almorzar el domingo. Aceptas, claro."),
      o("c", "Pedir calma y seguir entrenando", "Profesionalidad", { forma: 2, rel_entrenador: 2, moral: -1 }, "Ignoras al ave y sigues con el rondo. La gallina se queda, a lo suyo, y gana en posesión. El míster, al final, dice: «Mañana la quiero otra vez. Parece que sabe jugar»."),
    ]),
  S("sr-abuelo-vidente", "surreal", { minAge: 17, clubTurns: [1, 400], notFlags: ["abuelo_vidente"] }, "vida",
    "Tu abuelo predice el resultado del domingo",
    "Tu abuelo, que lleva sesenta años yendo al campo, te llama el sábado: «Mañana ganáis 2-1. Marca el del dorsal 7 y a ti te pitan una falta tonta». Lo dice con una seguridad pasmosa, como quien anuncia la lluvia. Tú no sueles hacer caso de estas cosas, pero tu abuelo tiene un historial dudoso de acierto.",
    [
      o("a", "Creerle y contárselo al vestuario", "Compartir la profecía", { rel_vestuario: 3, moral: 2, flags: { abuelo_vidente: "creyente" } }, "Lo cuentas en el vestuario y todos se ríen. Pero al acabar el partido, 2-1, con gol del siete… y con tu falta tonta, la risa se convierte en un respeto casi religioso. Alguien dice: «Que venga el abuelo a la charla»."),
      o("b", "Reírte con cariño y darle las gracias", "Quererle", { moral: 4, reputacion: 1, flags: { abuelo_vidente: "cariño" } }, "Le dices que es el mejor abuelo del mundo y que no se meta con el míster. El partido sale 1-1 y tu abuelo, por teléfono, lo explica: «Es que han cambiado al árbitro». Lo adoras."),
      o("c", "Pedirle que te diga la lotería también", "Aprovechar el don", { moral: 2, patrimonio: -10, flags: { abuelo_vidente: "bromista" } }, "«Tu abuelo no ve más allá del domingo», contesta tu abuela, que está al lado. Os reís los tres por teléfono hasta que se corta la llamada. Es de esos recuerdos que no se compran."),
    ]),
  S("sr-fantasma", "surreal", { minAge: 17, clubTurns: [3, 200], turn: [2, 9], notFlags: ["sr_fantasma"] }, "vida",
    "El estadio tiene un fantasma (según el vigilante)",
    "El vigilante nocturno jura haber visto una figura con camiseta antigua cruzando el césped a las tres de la madrugada, driblando a nadie. «Es el extremo del 62, que murió sin ver el estadio nuevo», dice muy serio. Hay quien se ha traído un crucifijo, y tres compañeros se han negado a ducharse solos.",
    [
      o("a", "Pasar una noche en el estadio para comprobarlo", "Cazafantasmas", { rel_vestuario: 4, moral: 4, forma: -1, flags: { sr_fantasma: "noche" } }, "Te quedas con dos compañeros, un termo de café y una linterna. A las tres, se enciende sola una luz del túnel. Salís corriendo los tres. A la mañana siguiente, el vigilante sonríe: «Es el temporizador»."),
      o("b", "Tomártelo como un homenaje y dejar una camiseta en el césped", "Un gesto bonito", { rel_aficion: 4, reputacion: 3, moral: 3, flags: { sr_fantasma: "homenaje" } }, "Dejas una camiseta retro en el centro del campo con una nota: «Para el extremo del 62». Los periodistas lo cuentan. Una mujer mayor llora en la grada: es su sobrina."),
      o("c", "Decir que son tonterías y hacer chistes", "Escéptico", { rel_vestuario: 1, moral: 1, flags: { sr_fantasma: "escéptico" } }, "Dices que el fantasma «se ha retirado por falta de minutos». Tres compañeros te lo recordarán el día que se apague una luz en el túnel."),
    ]),
  S("sr-dron", "surreal", { minAge: 17, patrimonio: [100, 100000000], clubTurns: [1, 400] }, "vida",
    "Un dron te entrega una pizza en pleno entrenamiento",
    "Un dron de reparto se posa en el centro del campo con una caja de pizza cuatro quesos y una nota: «Para el 9, de parte de un admirador». Todo el vestuario te mira. El míster te mira. El dron te mira, con su luz roja, como esperando una propina.",
    [
      o("a", "Compartir la pizza con todo el vestuario", "Ser generoso", { rel_vestuario: 5, moral: 4, forma: -1 }, "Reparte porciones a todos, incluido el míster, que acepta una «para quitar el susto». El dron se va con un gesto de dignidad, y no vuelve a verse. Dicen que lo mandó el hermano del utillero."),
      o("b", "Devolver el dron con una nota de agradecimiento", "Profesional", { rel_entrenador: 3, reputacion: 2, moral: 0 }, "Le pones al dron una notita: «Gracias, pero ahora entreno». El míster te mira con ojos de respeto. «Cuando seas capitán, serás un buen capitán», dice. Te quedas con hambre."),
      o("c", "Comértela entera cuando nadie mire", "No compartir", { forma: -2, moral: 3, rel_vestuario: -2 }, "La pizza desaparece en cinco minutos y tú con ella. Pero en el vestuario hay testigos: dos compañeros te vieron. «El de la pizza», te llamarán durante meses."),
    ]),
  S("sr-infusion", "surreal", { minAge: 18, clubTurns: [1, 400], notFlags: ["sr_infusion"] }, "vida",
    "El fisio te receta una infusión milagrosa",
    "Es un té de cuarenta hierbas, preparado según una receta de su abuela, que «cura cualquier cosa, desde el tobillo hasta las penas». Huele a establo y sabe a calcetín mojado. El fisio te mira a los ojos: «Dos tazas al día. Y nada de preguntar qué lleva». Hay un sobre con tu nombre, y un compañero que jura haber ganado diez minutos de carrera.",
    [
      o("a", "Beberla religiosamente durante una semana", "Confiar en el fisio", { forma: 3, moral: 2, rel_vestuario: 1, flags: { sr_infusion: "creyente" } }, "A los tres días duermes como un niño, a los cinco corres como un galgo y al séptimo te ríes sin motivo en medio de una charla táctica. El míster te manda a cambiarte de camiseta: huele a hierbas."),
      o("b", "Tirarla por el fregadero y fingir que la bebiste", "Ser prudente", { moral: 0, flags: { sr_infusion: "tramposo" } }, "La tiras con cuidado y dices que «funciona». El fisio sonríe: «Lo sé, porque le he puesto colorante». El vestuario se ríe de ti durante días. Aprendes algo importante: nunca mientas a un fisio."),
      o("c", "Pedirle la receta para comercializarla", "Hacer negocio", { patrimonio: -200, fama: 1, flags: { sr_infusion: "negocio" } }, "El fisio te mira con horror, se santigua y te dice que la receta es sagrada. Te regala una bolsita. Cuando la pruebas en casa, entiendes por qué tiene tanto miedo."),
    ]),
  S("sr-camara-oculta", "surreal", { fama: [40, 100], minAge: 18, clubTurns: [1, 400], notFlags: ["sr_camara"] }, "prensa",
    "Te gastan una cámara oculta",
    "Vas a un restaurante a cenar tranquilo y el camarero te trae la cuenta con una cifra imposible: tres mil euros por un plato de lentejas. Cuando protestas, el cocinero sale con un delantal manchado, llora y suplica que no le denuncies. Todo parece real hasta que, detrás de una planta, ves una cámara con luz roja y a tu agente aguantándose la risa.",
    [
      o("a", "Seguir el juego hasta el final", "Entrar en el sketch", { fama: 4, rel_aficion: 3, moral: 4, flags: { sr_camara: "bien" } }, "Haces de actor de reparto durante veinte minutos y el programa lo emite íntegro. Te llaman «el mejor invitado de la temporada». Tu agente se queda con una parte del cachet, que tampoco lo vio venir."),
      o("b", "Salir indignado antes de que acabe", "Perder los papeles", { fama: 2, reputacion: -2, moral: -1, flags: { sr_camara: "mal" } }, "Das un portazo que se oye en toda la calle. Al descubrir la cámara, pides perdón, pero el vídeo ya circula. «El día que el delantero se enfadó con unas lentejas», titulan."),
      o("c", "Descubrir la cámara y devolver la broma", "Más listo que ellos", { fama: 5, reputacion: 3, moral: 5, flags: { sr_camara: "listo" } }, "Te quedas muy serio, les das un abrazo y dices: «Gracias por la oportunidad». Y desapareces con la cámara en la mano. El programa tarda dos días en recuperarla."),
    ]),
  S("sr-mister-youtuber", "surreal", { minAge: 17, clubTurns: [4, 400], notFlags: ["sr_youtuber"] }, "entrenamiento",
    "El míster se ha abierto un canal de YouTube",
    "Lo ha anunciado en la charla como quien comunica una alineación: «Desde hoy grabo contenido. Táctica en cinco minutos». Lleva un trípode, un micrófono de corbata y una iluminación en forma de aro. Los primeros vídeos no van bien, pero él insiste: «El algoritmo es como un delantero: hay que insistirle». Te pide que salgas en el siguiente.",
    [
      o("a", "Salir en el vídeo con entusiasmo", "Ser su cómplice", { rel_entrenador: 5, fama: 2, rel_vestuario: -1, flags: { sr_youtuber: "cómplice" } }, "Grabas un vídeo de «Cómo pedir el balón» con una claqueta casera. El míster te da un abrazo emocionado. Tiene catorce visitas y todas son del vestuario."),
      o("b", "Declinar con educación y mucha mano izquierda", "Salvarte", { rel_entrenador: -1, moral: 1, flags: { sr_youtuber: "esquivo" } }, "Dices que prefieres concentrarte en el campo. El míster asiente, un poco decepcionado: «Lo entiendo». Pero la semana siguiente, en el vídeo, te nombra tres veces como «ejemplo de lo que no hay que hacer»."),
      o("c", "Ofrecerte a editarle los vídeos", "Ayudarle de verdad", { rel_entrenador: 6, moral: 2, forma: -1, flags: { sr_youtuber: "editor" } }, "Pasas las noches con un programa de edición que no entiendes. Tras tres semanas, el canal tiene mil seguidores y el míster te dedica un «gracias» que vale más que un fichaje."),
    ]),
  S("sr-gato", "surreal", { minAge: 16, clubTurns: [2, 400], notFlags: ["gato"] }, "vida",
    "Un gato se instala en la grada y no se va",
    "Ha elegido el asiento 14 de la fila 3, preferente. Se tumba al sol, se lame las patas y, de vez en cuando, levanta la cabeza cuando el equipo ataca. Los socios lo han bautizado «Gol». Ya hay una camiseta con su cara. El club está dividido entre echarlo y nombrarlo socio de honor.",
    [
      o("a", "Proponer que el club le dé carné de socio", "Defender al gato", { rel_aficion: 5, fama: 2, moral: 3, flags: { gato: "socio" } }, "Dices ante un micrófono que «Gol es más del club que muchos directivos». La frase se hace pancarta. El presidente firma un carné con el nombre «Gol, G.». Tu agente te llama: «¿Estás bien?»."),
      o("b", "Llevártelo a casa para que no moleste", "Adoptarlo", { moral: 4, rel_aficion: 2, patrimonio: -150, flags: { gato: "tuyo" } }, "Lo metes en un trasportín en pleno entrenamiento. Se deja. En casa se instala en el sofá, te mira, y esa noche te quita el sitio de la cama. Eres, oficialmente, el dueño de un gato famoso."),
      o("c", "No meterte en el asunto", "Dejar que decida el club", { moral: 0, flags: { gato: "ignorado" } }, "El gato sigue en su asiento hasta que el club, tras mucha polémica, lo mantiene. Tú no dices nada, pero un compañero te lo recordará: «Tú tampoco te mojaste con el gato»."),
    ]),
  S("sr-gato-gol", "surreal", { after: [after("sr-gato", undefined, 4, 24)], minAge: 17 }, "vida",
    "El gato de la grada y el gol de tu vida",
    "El día que marcas tu mejor gol del mes, las cámaras captan algo extraño: en el asiento 14 de la fila 3, el gato se levanta, estira las patas y bosteza justo cuando el balón entra. En redes se ha hecho viral con la frase «Gol da la señal». Los socios ya quieren que el gato esté presente en todos los partidos importantes.",
    [
      o("a", "Dedicarle el gol al gato", "Un guiño", { fama: 4, rel_aficion: 5, moral: 4 }, "En la rueda de prensa dices: «Este gol es para Gol, el que mejor sabe de fútbol aquí». El estadio se pone a maullar en el siguiente partido. Es el espectáculo más raro y bonito que has visto."),
      o("b", "Quitar importancia: «Los gatos no marcan»", "Mantenerte serio", { reputacion: 2, moral: 1 }, "Dices que los méritos son del equipo. Pero un periodista te pregunta: «¿Y el gato?». Contestas: «Hizo su trabajo». El titular del día siguiente es esa frase."),
    ]),
  S("sr-estatua", "surreal", { minAge: 18, fama: [40, 100], clubTurns: [3, 400], notFlags: ["sr_estatua"] }, "vida",
    "Alguien le pone tu camiseta a la estatua de la plaza",
    "Una mañana, la estatua de bronce del fundador del club amanece con tu camiseta puesta, a la talla correcta, con tu número y tu apellido. Hay una nota: «El futuro del club». La prensa lo cuenta; el ayuntamiento lo investiga; y la afición, mientras tanto, hace cola para fotografiarse con el fundador y su nuevo look.",
    [
      o("a", "Acercarte a la plaza y hacerte una foto con la estatua", "Seguir la broma", { fama: 3, rel_aficion: 5, moral: 4, flags: { sr_estatua: "foto" } }, "Te haces un selfi con la estatua, un pulgar hacia arriba y la cara de «yo no he sido». Subes la foto con el pie: «Gracias por el préstamo de la camiseta». Un millón de likes."),
      o("b", "Pedir disculpas al club por el lío", "Ser prudente", { reputacion: 2, rel_entrenador: 1, flags: { sr_estatua: "disculpas" } }, "Mandas un comunicado a la directiva. Te contestan, divertidos: «No es culpa tuya, pero la estatua te queda mejor que a nosotros». Te dejan una taza con su cara."),
      o("c", "Ofrecerte a comprar una camiseta para la estatua", "Regalar una oficial", { patrimonio: -250, rel_aficion: 3, reputacion: 2, flags: { sr_estatua: "regalo" } }, "Le compras una camiseta oficial, de bronce, a medida. El club la coloca el día del aniversario. Un periodista escribe: «El día que un jugador vistió al fundador»."),
    ]),
  S("sr-sueno", "surreal", { minAge: 16, clubTurns: [2, 400], turn: [2, 9] }, "vida",
    "Sueñas con el partido de mañana, con detalles absurdos",
    "En el sueño, el balón habla con acento andaluz, el árbitro es tu profesor de matemáticas de cuarto de la ESO y el portero rival lleva un traje de pingüino. Marcas de chilena en el minuto 88 y la grada, en lugar de gritar, se pone a aplaudir en silencio con guantes. Te despiertas a las seis. No consigues volver a dormirte.",
    [
      o("a", "Contárselo al entrenador por si es una señal", "Compartir el sueño", { rel_entrenador: 2, moral: 2, flags: { sueno_chilena: true } }, "El míster escucha con paciencia y concluye: «Lo de la chilena, déjalo. Lo del pingüino, apúntalo». Esa noche, entrenas centros laterales como si fueras a rematarlos de espaldas."),
      o("b", "Tomártelo con humor y escribírselo a tus amigos", "Reírte", { moral: 4, rel_vestuario: 1 }, "Mandas el sueño al grupo de amigos y en cinco minutos tienes veinte audios. Uno dice: «Si marcas de chilena, me debes una cena». Te ríes solo en la cama."),
      o("c", "Ir a correr para despejarte", "Quemar la energía", { forma: 2, moral: 1 }, "Corres por un parque vacío, con el amanecer pintando el cielo de naranja. Al final, un pingüino en un puesto de helados te saluda. Dejas de correr, pestañeas, y era una pegatina."),
    ]),
];
