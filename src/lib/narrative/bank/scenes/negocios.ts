/**
 * Dinero, negocios y gente que te pide cosas. Aquí las decisiones se pagan a plazos: lo que
 * firmas hoy se nota en tres meses (la inauguración desastrosa), en un año (si el restaurante
 * funciona o no) y en diez (si el campo de tu barrio lleva tu nombre).
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene } from "../types";

export const NEGOCIOS: BankScene[] = [
  // ───── El restaurante de tu primo ─────
  S("dn-restaurante", "negocios", { minAge: 19, patrimonio: [9000, 100000000], clubTurns: [3, 400], notFlags: ["restaurante"] }, "representante",
    "Tu primo quiere abrir un restaurante contigo",
    "Se llama Quique, tiene una receta de croquetas de su abuela que según él «cambia vidas» y un local en el centro que se queda pequeño solo con mirarlo. Te enseña un plan de negocio escrito a mano en una servilleta. Tu agente, a tu lado, tose. Quique añade: «El nombre ya lo tengo: Bar el Crack. Con tu cara en la puerta».",
    [
      o("a", "Entrar con una inversión grande y tu nombre en la puerta", "Ir a por todas", { patrimonio: -7000, fama: 2, moral: 3, flags: { restaurante: "dueño" } }, "Firmas con una mano temblorosa. Quique llora de emoción y te da un abrazo que huele a freidora. En la puerta ya pone «Bar el Crack, de Quique y [tu apellido]». Tu madre te manda un audio de siete minutos."),
      o("b", "Entrar como socio minoritario, sin tu nombre", "Con prudencia", { patrimonio: -2500, moral: 1, flags: { restaurante: "socio" } }, "Pones lo justo y le dices a Quique que el nombre del local no lo toque. Quique asiente y, por la noche, te manda una foto del cartel: «Bar el Crack (sin cara). Reservado el 12 de cada mes»."),
      o("c", "Decirle que no, con mucho cariño", "Evitar riesgos", { moral: -1, rel_vestuario: 0, flags: { restaurante_no: true } }, "Le explicas que ahora no es el momento. Quique asiente, doblando la servilleta con cuidado. «Cuando seas leyenda, volveré», dice. Se te queda clavado un poco la mirada que pone."),
    ]),
  S("dn-restaurante-apertura", "negocios", { after: [after("dn-restaurante", "a", 3, 10)] }, "vida",
    "La inauguración del Bar el Crack",
    "Hay cola hasta la esquina, tres cámaras de televisión local y un cocinero que ha olvidado encender la plancha. Quique, sudando, te hace una seña desde la barra: se acaban las croquetas a los quince minutos. En la mesa de al lado, un crítico gastronómico finge no mirar su móvil. Tú te has puesto un delantal que te queda pequeño.",
    [
      o("a", "Remangarte y ayudar en la cocina", "Mojarte", { moral: 5, rel_aficion: 3, fama: 2, flags: { restaurante_cocina: true } }, "Pasas dos horas friendo croquetas con el pelo cubierto por una redecilla. El crítico escribe que «la mejor croqueta es la del delantero». Esa frase está ya, enmarcada, en la pared del local."),
      o("b", "Salir a la calle a firmar autógrafos y atraer clientes", "Poner la cara", { fama: 4, patrimonio: 800, rel_aficion: 2 }, "La cola se triplica. Firmas servilletas, camisetas y hasta el brazo de un chaval. Quique saca más dinero en una noche que en un mes. Está a punto de llorar. Se calma con una croqueta."),
      o("c", "Dejarlo en manos de Quique y marcharte a las diez", "Delegar", { moral: 0, flags: { restaurante_ausente: true } }, "Te vas con una disculpa. A las doce, Quique te manda un audio con el fondo de platos rotos: «Se me ha quemado el cocinero». No sabes si hablar de un incendio o de un despido."),
    ]),
  S("dn-restaurante-balance", "negocios", { after: [after("dn-restaurante", "a", 14, 60)] }, "representante",
    "El primer balance del Bar el Crack",
    "Tu agente te cita con un contable con cara de pocos amigos, una carpeta y tres hojas de cálculo. «El Bar el Crack ha cumplido un año. Hay dos noticias: una buena y otra mala». Él, por supuesto, no dice cuál es cuál. Quique, al fondo, comprueba sus propios números con una calculadora de los años noventa.",
    [
      r("a", "Pedir seguir como socio mayoritario y reinvertir", "Duplicar la apuesta", 0.55, "El restaurante despega: abre un segundo local, tiene lista de espera y Quique sale en una revista de cocina. Tu parte vuelve duplicada y te ofrecen ser imagen de una marca de aceite.", { patrimonio: 12000, moral: 8, fama: 3, flags: { restaurante_exito: true } }, "Al año siguiente, la inversión se come los beneficios. La croqueta es buena, pero el alquiler no. Tienes que poner dinero para salvar el local, y Quique te da un abrazo de disculpa.", { patrimonio: -6000, moral: -4, flags: { restaurante_apuros: true } }, "reputacion"),
      o("b", "Retirar tu parte y quedarte solo como cliente", "Salir con dignidad", { patrimonio: 2500, moral: 1, flags: { restaurante_salida: true } }, "Cobras lo que te corresponde, le das la mano a Quique y prometes comer allí todos los domingos. Cumples dos de cada tres. El local sigue, con más o menos éxito, sin ti."),
    ]),
  S("dn-restaurante-plato", "negocios", { after: [after("dn-restaurante-balance", "a", 25, 140)], flags: ["restaurante_exito"], minAge: 24 }, "vida",
    "Un plato lleva tu nombre en la carta",
    "Quique te llama con la voz rota: han creado un plato en tu honor, «Croquetas a lo Crack», y ya es el más pedido de los tres locales. Hay turistas que preguntan por él en inglés. El día del cumpleaños del bar, Quique te hace ir a cocinar delante de todos para «el reportaje». Tú no tienes ni idea de freír, pero dices que sí.",
    [
      o("a", "Cocinar el plato tú mismo en directo", "Ponerte el delantal", { fama: 4, rel_aficion: 4, moral: 6, flags: { plato_crack: true } }, "Lo haces mal, pero con tanto cariño que la gente aplaude como si hubieras marcado de bicicleta. Una croqueta se te cae al suelo. Quique la recoge, la muerde y dice: «Mejor que la mía»."),
      o("b", "Dejar que cocine el chef y limitarte a probar", "Con elegancia", { reputacion: 3, moral: 4, flags: { plato_crack: true } }, "Pruebas con cara de crítico, haces una pausa teatral y dices: «Nada mal». Todos se ríen. El reportaje termina con una foto vuestra, y esa foto es la que más recortará la prensa en diez años."),
    ]),
  // ───── Criptos del vestuario ─────
  S("dn-cripto", "negocios", { minAge: 19, patrimonio: [2500, 100000000], clubTurns: [2, 400], notFlags: ["cripto"] }, "vestuario",
    "Un compañero te vende una moneda que «va a la luna»",
    "Se llama MoneyMessi, o DogeGol, o algo así. Tu compañero de la taquilla de al lado te enseña su móvil con los ojos brillantes: «He puesto mi paga extra y mira cómo sube». Hay una gráfica que baja, pero él la mira al revés. Tres compañeros más lo escuchan embobados. Alguien ya ha pedido un préstamo.",
    [
      r("a", "Invertir una cantidad pequeña, por si acaso", "Jugártela un poco", 0.4, "La moneda sube un 300 % el primer mes y la sacas justo a tiempo. Te sale una paga extra y te llamarán «el listo del vestuario» una temporada.", { patrimonio: 2200, moral: 3, rel_vestuario: 2, flags: { cripto: "gano" } }, "La moneda se hunde en tres semanas. Alguien dice que el creador ha desaparecido en un yate. Pierdes lo que pusiste, y dos compañeros pierden mucho más y te miran con cara de funeral.", { patrimonio: -1200, moral: -3, flags: { cripto: "pierdo" } }, "fama"),
      o("b", "Escuchar con una sonrisa y no poner ni un euro", "Mantener la cabeza fría", { reputacion: 2, rel_vestuario: 0, flags: { cripto: "paso" } }, "Dices que prefieres ladrillos. Se ríen de ti durante un mes… hasta que la moneda se desploma y los mismos que se burlaban te piden consejo con la cara pálida."),
      o("c", "Advertir al vestuario con un discurso", "Hacer de hermano mayor", { rel_vestuario: 3, reputacion: 3, moral: 2, flags: { cripto: "aviso" } }, "Les cuentas lo que sabes del tema. Algunos te escuchan, otros no. Cuando la moneda cae, el capitán te da la mano en silencio, y eso vale más que cualquier gráfica."),
    ]),
  S("dn-cripto-caida", "negocios", { after: [after("dn-cripto", undefined, 3, 10)] }, "vestuario",
    "El día que cae la moneda del vestuario",
    "Esta mañana, el vestuario huele a duelo. Hay seis móviles en el suelo, un lateral zurdo que mira al techo y un delantero suplente que hace cuentas en voz baja: «Si vendo el coche… ». El míster, que lo ha notado, entra con el semblante serio y se sienta en el banco de en medio. Nadie se atreve a hablar.",
    [
      o("a", "Proponer una caja común para ayudar a los que más han perdido", "Solidaridad", { patrimonio: -500, rel_vestuario: 7, reputacion: 4, moral: 3, flags: { vestuario_unido: true } }, "Dejas quinientos euros en una gorra y lo cuentas sin darle importancia. En media hora la gorra tiene seis mil. El míster, sin decir nada, deja otros doscientos. Ese día el equipo se vuelve una familia."),
      o("b", "Quitar hierro con humor negro", "Bromear", { rel_vestuario: 2, moral: 2, reputacion: -1 }, "Dices que «por lo menos ahora sabemos quién es el Warren Buffett del vestuario: nadie». Una carcajada mezclada con lágrimas atraviesa la sala. El lateral zurdo te dice «gracias» sin mirarte."),
      o("c", "No decir nada y concentrarte en entrenar", "Callar", { forma: 1, moral: -1 }, "Entrenas con la cabeza baja y te ducha en silencio. Al salir, dos compañeros te evitan en el aparcamiento. A veces, no decir nada también dice algo."),
    ]),
  // ───── Préstamos a amigos ─────
  S("dn-prestamo-amigo", "negocios", { minAge: 19, patrimonio: [4000, 100000000], notFlags: ["prestamo_amigo"] }, "vida",
    "Un amigo del barrio te pide un préstamo",
    "Es Nacho, el de la pachanga de los domingos, el que te dejó su balón cuando no tenías ninguno. Te escribe un mensaje largo y vergonzoso: se ha quedado sin trabajo, el alquiler vence, hay un crío en camino. No dice la cifra; dice «lo que puedas». Tú sabes que, si lo ayudas, no vas a poder preguntar nunca cuándo te lo devolverá.",
    [
      o("a", "Darle una cantidad generosa y no pedirle nada", "Ayudarle de verdad", { patrimonio: -2500, moral: 4, reputacion: 3, flags: { prestamo_amigo: "regalo" } }, "Le haces una transferencia y le escribes: «Es de parte del barrio». Nacho tarda una hora en contestar. Cuando lo hace, solo pone: «Voy a llamar a mi hijo como tú». Lloras en el coche, solo.", { thread: th("favor", "Nacho", "Te debe el alquiler de dos meses y, sobre todo, el balón de la infancia.") }),
      o("b", "Prestárselo con un plan de devolución claro", "Con cabeza", { patrimonio: -1200, moral: 2, flags: { prestamo_amigo: "prestamo" } }, "Os sentáis a hacer un plan de pagos en una servilleta. Nacho firma con la letra temblorosa. Por dentro, sabes que quizá no te devuelva ni un euro, pero también que se lo toma en serio."),
      o("c", "Decirle que no puedes, aunque sí puedas", "Proteger tu dinero", { moral: -3, reputacion: -2, flags: { prestamo_amigo: "no" } }, "Le mientes con un «ahora mismo estoy justo». Nacho dice «lo entiendo» y no vuelve a escribir. Dos semanas después, ves una foto suya en el campo de siempre, sin ti, sin tu balón. Te duele más de lo que pensabas."),
    ]),
  S("dn-prestamo-nacho", "negocios", { after: [after("dn-prestamo-amigo", undefined, 12, 80)], notFlags: ["nacho_cerrado"] }, "vida",
    "Nacho te invita a algo muy pequeño y muy grande",
    "Años después, Nacho te manda una invitación: ha abierto un pequeño taller de bicicletas en el barrio. Hay unas cuantas sillas plegables, un cartel pintado a mano y una cerveza fría. «Vente cuando puedas, no hace falta que traigas nada». Tú sabes lo que cuesta, para alguien como él, hacer esa invitación. Y sabes lo que pasó en su día entre vosotros.",
    [
      o("a", "Ir a la inauguración y llevar una bici para que la arregle", "Estar presente", { moral: 6, reputacion: 3, rel_aficion: 2, flags: { nacho_cerrado: true } }, "Llevas tu bici, rota a propósito. Nacho la arregla con una sonrisa y no te deja pagar. «Estamos en paz», dice. «Nunca lo hemos estado», contestas. Os abrazáis delante de dos clientes que no entienden nada."),
      o("b", "Mandar flores y una nota y no ir", "Ausente pero cariñoso", { moral: 1, reputacion: 1, flags: { nacho_cerrado: true } }, "Las flores llegan a las diez de la mañana con una nota que reescribiste cuatro veces. Nacho te manda una foto del ramo en el escaparate. «Aquí siempre tienes sitio», escribe. Y tú sabes que no eres capaz de ir."),
    ]),
  // ───── Subastas, fundaciones y campos con tu nombre ─────
  S("dn-subasta", "negocios", { minAge: 18, fama: [30, 100], clubTurns: [2, 400], notFlags: ["subasta"] }, "vida",
    "Subastan tu camiseta para una causa",
    "El club organiza una subasta benéfica para un hospital infantil y tu camiseta del último partido es la pieza estrella. El presentador la levanta con las dos manos, como un trofeo. Alguien en la sala grita: «¡Mil euros!». Alguien más: «¡Mil quinientos!». Te miran desde la mesa del presidente. Esperan que digas algo.",
    [
      o("a", "Pujar tú mismo por tu propia camiseta y donar el doble", "Un gesto enorme", { patrimonio: -3000, rel_aficion: 6, reputacion: 5, moral: 5, flags: { subasta: "dono" } }, "Levantas la mano al final, pagas lo que haga falta y le regalas la camiseta a un niño del hospital. En la sala, nadie habla. Una enfermera llora. Es la mejor noticia del día en la prensa local."),
      o("b", "Firmar la camiseta con una dedicatoria y ya", "Algo sencillo", { reputacion: 2, rel_aficion: 2, moral: 2, flags: { subasta: "firma" } }, "Escribes en la camiseta: «Para quien más lo necesite, de alguien que aún está aprendiendo». La suben a cuatro mil euros. Te llega un dibujo de una niña con tu cara de monigote."),
      o("c", "Pedir un puesto discreto y evitar el protagonismo", "Aportar sin ruido", { patrimonio: -400, reputacion: 3, moral: 2, flags: { subasta: "silencio" } }, "Haces una transferencia anónima que, claro, alguien descubre. Una periodista te llama: «¿Por qué no lo contaste?». «Porque no era para contarlo», respondes."),
    ]),
  S("dn-mecenas-cantera", "negocios", { minAge: 21, patrimonio: [12000, 100000000], clubTurns: [4, 400], notFlags: ["campo_barrio"] }, "vida",
    "El campo de tierra de tu barrio necesita césped",
    "Vuelves al barrio para una cena y pasas por el campo donde empezaste. La tierra está levantada, las porterías, sin redes, y los chavales juegan descalzos para no romperse las zapatillas. El entrenador de la escuela, que sigue siendo el mismo, te saluda con un abrazo: «Si pudieras echar una mano, no te pediría ni un céntimo más». No hace falta que lo diga: ya lo sabes.",
    [
      o("a", "Financiar el césped, las redes y los balones", "Ser el mecenas", { patrimonio: -9000, moral: 8, reputacion: 5, rel_aficion: 4, flags: { campo_barrio: "mecenas" } }, "Firmas el cheque con la mano de tu padre en el hombro. Seis meses después, el campo tiene césped, redes nuevas y un cartel pintado a mano: «Campo (tu apellido)». Lloras de verdad delante de los críos."),
      o("b", "Aportar una cantidad modesta y organizar un partido benéfico", "Ayudar con ingenio", { patrimonio: -2500, fama: 3, rel_aficion: 4, moral: 4, flags: { campo_barrio: "benefico" } }, "Organizas un partido con tus compañeros y los de la escuela. Venden entradas, bocatas y camisetas. Con lo recaudado, ponen redes y balones. El césped llegará… dentro de unos años."),
      o("c", "Prometer ayudar «cuando puedas»", "Dejarlo para luego", { moral: -2, reputacion: -1, flags: { campo_barrio: "promesa" } }, "Le das un abrazo y te vas con la promesa. En el coche te quedas mirando la tierra levantada por el retrovisor. Piensas: «Cuando tenga más…». Siempre hay un «cuando»."),
    ]),
  S("dn-campo-inaugura", "negocios", { after: [after("dn-mecenas-cantera", "a", 8, 60)], minAge: 22 }, "vida",
    "Inauguran el campo con tu nombre",
    "Una banda de música infantil, una cinta que corta un alcalde sudoroso y una placa con tu apellido grabado en letras doradas. En el césped, treinta críos con la camiseta de la escuela esperan el pitido. El entrenador de siempre, con ochenta años, lleva una corbata que no le pega y llora en silencio. Tu familia entera está en primera fila.",
    [
      o("a", "Dar el saque inicial y quedarte a jugar con ellos", "Jugar un rato", { moral: 10, rel_aficion: 5, reputacion: 5, fama: 3, flags: { campo_inaugurado: true } }, "Te pones las botas en el banquillo y juegas diez minutos con los pequeños. Un chaval te hace un túnel. «Esto me lo apunto», dices. Un fotógrafo capta el momento: la imagen más compartida de tu año."),
      o("b", "Dar un discurso corto y emocionado", "Hablar desde el corazón", { moral: 8, reputacion: 6, rel_aficion: 3, flags: { campo_inaugurado: true } }, "Dices tres frases: «Aquí aprendí a perder. Aquí aprendí a levantarme. Y quiero que todos los que jueguen aquí aprendan eso antes que a ganar». Se hace un silencio y luego estalla un aplauso."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a footballer cutting the ribbon at a renovated neighbourhood football pitch surrounded by children in kits, golden evening light, emotional smile, no logos or readable text" }),
  S("dn-fundacion", "negocios", { minAge: 26, patrimonio: [40000, 100000000], fama: [60, 100], notFlags: ["fundacion"] }, "representante",
    "Tu agente te propone crear una fundación",
    "Es una idea que lleva meses rondándote la cabeza: poner tu nombre a algo que no sea solo una camiseta. Tu agente te enseña un esquema con tres áreas: educación, deporte base y salud. Tiene un contable, un abogado y, al fondo, una cafetera. «Si lo haces bien, será lo que quede de ti cuando cuelgues las botas», dice. Y no bromea.",
    [
      o("a", "Crearla y dedicar parte de tu tiempo a ella", "Ir en serio", { patrimonio: -12000, reputacion: 8, moral: 6, rel_aficion: 4, flags: { fundacion: "propia" } }, "Montas la fundación con una oficina diminuta y mucha ilusión. En el primer año, abre tres aulas de refuerzo y un torneo para niños sin recursos. En una entrevista, dices: «Esto es lo que más me importa»."),
      o("b", "Unirte a una fundación ya existente como embajador", "Sumar sin cargar", { patrimonio: -1500, reputacion: 4, moral: 3, flags: { fundacion: "embajador" } }, "Acompañas a la fundación en tres actos al año y pones tu cara en la campaña. No es tuya, pero la sientes. Te llegan cartas de niños que nunca olvidarás."),
      o("c", "Posponerlo hasta que te retires", "Más adelante", { moral: 0, flags: { fundacion: "luego" } }, "«Cuando cuelgue las botas», dices. Tu agente asiente, con una sonrisa que dice: «Eso mismo me dijeron los otros». La idea se queda en un cajón, con una nota de color amarillo."),
    ]),
  // ───── Dinero con humor ─────
  S("dn-coche-prestado", "negocios", { minAge: 19, patrimonio: [5000, 100000000], clubTurns: [2, 400] }, "vestuario",
    "Un compañero te pide el coche «solo para ir al súper»",
    "Es el nuevo, el que acaba de llegar del filial, y te mira con unos ojos de cachorro. «Mi coche está en el taller y necesito comprar papel higiénico». Tú tienes un deportivo que no es barato y que nunca has dejado a nadie. Hay un vestuario entero que esperaba tu respuesta. Dices que sí.",
    [
      r("a", "Dejarle las llaves con una sonrisa", "Confiar", 0.5, "Vuelve en veinte minutos con papel higiénico, una bolsa de patatas para ti y las llaves limpias. «Gracias, jefe», dice. Desde ese día es tu sombra, para bien: te ayuda con las maletas y te saluda antes que a nadie.", { rel_vestuario: 4, moral: 3, flags: { amigo_coche: true } }, "Vuelve sin llaves, sin papel higiénico y con una historia que empieza por «No te lo vas a creer». El coche aparece en el parking de un centro comercial, con un rasguño enorme. Te toca reírte para no llorar.", { rel_vestuario: 2, patrimonio: -900, moral: -2 }, "moral"),
      o("b", "Acompañarle tú mismo al súper", "Ser el chófer", { rel_vestuario: 5, moral: 4 }, "Vais los dos a comprar con el coche, entre bromas. El nuevo no para de dar las gracias. En el pasillo del papel higiénico, un hincha os pide una foto. «Qué dúo más raro», dice. «Y qué bien», contestas."),
      o("c", "Decirle que no, pero invitarle a una cerveza", "Poner un límite", { rel_vestuario: 1, reputacion: 1 }, "Le dices que el coche es sagrado. Él se ríe y acepta la cerveza. Esa noche te cuenta su vida: es hijo de un camionero y duerme con la ventana abierta. Entiendes que no era el coche lo que necesitaba."),
    ]),
  S("dn-patrocinio-raro", "negocios", { minAge: 19, fama: [40, 100], clubTurns: [2, 400], notFlags: ["patrocinio_raro"] }, "representante",
    "Una marca de comida para perros quiere que seas su cara",
    "Tu agente te lo cuenta con la cara de quien comunica un fichaje de última hora: «Una marca de pienso premium para perros quiere que seas su imagen. Lo mejor es la cifra». Te pasa el contrato. La cifra, efectivamente, es muy buena. La foto del anuncio, en cambio, te muestra comiendo del cuenco, de rodillas, con una sonrisa forzada.",
    [
      o("a", "Aceptar con una condición: salir con tu perro, sin comer del cuenco", "Negociar con humor", { patrimonio: 8000, fama: 3, moral: 3, flags: { patrocinio_raro: "perro" } }, "Rodáis el anuncio con tu perro, en un parque, sin cuenco. Al final, un cachorro te lame la cara. La marca estalla en ventas y tú recibes, durante meses, mensajes de desconocidos con fotos de sus perros."),
      o("b", "Aceptar tal cual", "Por el dinero", { patrimonio: 14000, fama: 2, reputacion: -3, moral: -1, flags: { patrocinio_raro: "cuenco" } }, "Haces el anuncio de rodillas, con el cuenco. En redes te llaman «el delantero que come pienso». Cuando cobras, lo piensas dos veces. Cuando cobras la segunda mensualidad, ya no."),
      o("c", "Rechazarlo: tienes una imagen que cuidar", "Decir que no", { reputacion: 3, patrimonio: -300, moral: 1, flags: { patrocinio_raro: "no" } }, "Tu agente lo lamenta con un suspiro. Dos meses después, un compañero hace el anuncio y gana más en un día de lo que tú ganas con tres. Te alegras por él. A medias."),
    ]),
  S("dn-banco-bloqueo", "negocios", { minAge: 19, patrimonio: [3000, 100000000], clubTurns: [1, 400], market: "abierta" }, "vida",
    "El banco te bloquea la tarjeta justo en pleno traspaso",
    "Estás en el hotel donde te alojas para firmar con un club nuevo y vas a pagar una cena de bienvenida cuando la tarjeta suena a «fallo». Después de tres intentos, el banco manda un mensaje: «Hemos detectado un movimiento sospechoso: una compra de 40 000 € en una ciudad extranjera». Eres tú, claro, firmando un traspaso. Detrás de ti, tu agente intenta no reírse.",
    [
      o("a", "Llamar al banco con calma y explicarlo", "Resolverlo", { rel_representante: 2, moral: 2, reputacion: 1 }, "Un operador amable te pide cuatro datos, tres preguntas de seguridad y que le firmes una camiseta por correo. Te desbloquea la tarjeta tras veinte minutos. La cena se retrasa; la anécdota, no."),
      o("b", "Dejar que pague tu agente y reírte", "Salir del paso", { rel_representante: 3, moral: 3, patrimonio: -100 }, "Tu agente paga y te recuerda, con mucha educación, que «la próxima cena la pagas tú». En el brindis, el nuevo presidente cuenta la anécdota y todos se ríen. Es un buen principio."),
      o("c", "Quejarte públicamente del banco", "Perder la paciencia", { fama: 2, reputacion: -2, moral: -2 }, "Subes un tuit enfadado. El banco responde con un vídeo de disculpas y un regalo. Tu agente te mira con los ojos entornados: «Eso no se hace sin consultarme»."),
    ]),
  S("dn-consejo-ahorro", "negocios", { minAge: 22, patrimonio: [8000, 100000000], clubTurns: [2, 400], notFlags: ["ahorrador"] }, "vestuario",
    "Un veterano te enseña a ahorrar, con cuentas en una servilleta",
    "Es el lateral de 36 años, con las rodillas tan hechas polvo como su fama. «Nadie te habla de esto —dice—, pero la carrera dura quince años y la vida, sesenta». Saca una servilleta y apunta tres cifras: lo que ganas, lo que gastas, lo que te queda. «Dentro de diez años, esa tercera cifra será tu sueldo». Se queda mirándote.",
    [
      o("a", "Hacerle caso y ahorrar una parte fija cada mes", "Planificar", { patrimonio: 2000, moral: 2, reputacion: 2, flags: { ahorrador: true } }, "Abres una cuenta aparte, con una transferencia mensual y nombre propio: «El colchón del Crack». Cada vez que la ves, te sientes un poco más tranquilo. Dentro de años, ese colchón te salvará de más de un susto."),
      o("b", "Darle las gracias y seguir como estás", "Disfrutar del presente", { moral: 3, flags: { gastador: true } }, "Le agradeces el consejo y pagas la cena. «Cuando lo necesites, ya me lo dirás», responde, sin enfadarse. Hay conversaciones que se recuerdan años después con una sonrisa triste."),
      o("c", "Pedirle que te presente a su asesor", "Profesionalizarlo", { patrimonio: -300, rel_representante: -1, reputacion: 2, flags: { ahorrador: true, asesor: true } }, "El asesor de tu compañero es un tipo serio, con gafas redondas y un humor muy seco. En una hora te ordena las cuentas y te dice: «Vives como si fueras a ser joven siempre». Te lo tomas muy a pecho."),
    ]),
];
