/**
 * La ciudad nueva: el vecino que te da un manual de supervivencia, el restaurante donde ya te
 * conocen, el taxista de confianza, la panadería que abre a las seis. Escenas de arraigo: las que
 * convierten un sitio extraño en tu casa, o te lo hacen sentir ajeno si decides no mirarlo.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const CIUDAD: BankScene[] = [
  S("cd-vecino-manual", "ciudad", { minAge: 17, clubTurns: [1, 6], notFlags: ["cd_vecino"] }, "vida",
    "Tu vecino te deja un «manual de supervivencia del barrio» bajo la puerta",
    "Son cuatro folios escritos a máquina, con una tipografía de cuando existían las máquinas. «Panadería de Aurora: abre a las 6, el pan es mejor a las 6:40. Bar de Paco: no pida café, pida cortado. Farmacia de guardia: la de la esquina, pero no la de enfrente. Y por favor, no suba la música después de las 11». Al final, una firma: «Don Ramiro, 3.º B».",
    [
      o("a", "Tocarle el timbre y darle las gracias con una caja de dulces", "Presentarte en serio", { moral: 5, reputacion: 3, flags: { cd_vecino: "dulces" } }, "Don Ramiro abre con un batín de cuadros y una sonrisa de sorpresa. Te invita a pasar. En media hora, te ha contado la historia de media calle y te ha prometido enseñarte los mejores atajos. Ese hombre será, durante años, tu mejor guía y tu mejor vecino."),
      o("b", "Seguir el manual al pie de la letra durante una semana", "Hacerle caso", { moral: 4, forma: 1, flags: { cd_vecino: "manual" } }, "Pruebas el pan a las 6:40, el cortado de Paco, el atajo de la plaza. Todo funciona. Al final de la semana, dejas una nota debajo de su puerta: «Tiene usted razón en todo». Una semana después, recibes una cesta de membrillo."),
      o("c", "Guardar el folio sin hacer caso y descubrir el barrio a tu aire", "Ir por libre", { moral: 1, flags: { cd_vecino: "libre" } }, "Descubres el barrio solo, con algún error divertido: el café del bar, la farmacia equivocada, el pan frío. A los dos meses, te cruzas con don Ramiro. «¿Qué tal el manual?». Respondes: «Prefiero equivocarme». Él sonríe: «Es lo que decía yo»."),
    ]),
  S("cd-vecino-despide", "ciudad", { after: [after("cd-vecino-manual", "a", 15, 140)], minAge: 20 }, "vida",
    "Don Ramiro se muda a una residencia y te pide que cuides su plan de membrillo",
    "Pasan los años y un día, en el rellano, te encuentras a don Ramiro con una maleta. «Mi hija se empeña en que me vaya con ella. Ya no puedo con las escaleras». Te entrega una caja con un trozo de membrillo envuelto en papel y una llave: «Es del trastero. Hay una cosa para ti. Y no me la rechaces». Se te forma un nudo en la garganta.",
    [
      o("a", "Abrazarle y prometerle que le visitarás cada mes", "Mantener el vínculo", { moral: 8, reputacion: 4, flags: { cd_ramiro_visitas: true } }, "Le visitas el primer domingo de cada mes, con una caja de dulces. Don Ramiro te cuenta historias de la ciudad y te pregunta por tus partidos. En el trastero, encuentras una bicicleta de otra época con una nota: «Para pasear, no para correr»."),
      o("b", "Regalarle un balón firmado y pedirle que lo guarde", "Un detalle de despedida", { moral: 6, rel_aficion: 2, flags: { cd_ramiro_visitas: "balon" } }, "Lo coloca en una estantería de la residencia, entre fotos de familia. Los demás residentes, al verlo, se hacen fotos con él. Don Ramiro, con orgullo, dice: «Es mi nieto»."),
    ]),
  S("cd-bar-fijo", "ciudad", { minAge: 17, clubTurns: [2, 400], notFlags: ["cd_bar"] }, "vida",
    "El camarero de tu bar de siempre empieza a preparar tu pedido antes de que llegues",
    "Un martes cualquiera, a las 8:30, entras en el bar de la esquina. Antes de que digas nada, el camarero, un hombre calvo con una libreta, ya tiene el cortado sobre la barra, la tostada con tomate cortada en cuatro y el periódico abierto por la sección de deportes. «Lo de siempre, jefe», dice. Un cliente, al fondo, levanta la cabeza: «Es un poco escalofriante lo bien que le conoce».",
    [
      o("a", "Dejar una propina generosa y charlar con él cinco minutos", "Ser un cliente de verdad", { moral: 5, reputacion: 2, patrimonio: -10, flags: { cd_bar: "charla" } }, "Se llama Fermín y tiene tres hijos, un perro y un tío en el Madrid. Le preguntas por todos. A partir de ese día, sales con una sonrisa. En el barrio ya te llaman «el de Fermín»."),
      o("b", "Pedir algo distinto para romper la rutina", "Probar algo nuevo", { moral: 3, flags: { cd_bar: "distinto" } }, "Pides un zumo de naranja y una napolitana. Fermín te mira como si hubieras renegado de tu religión. Te lo sirve con una ceja levantada. Al día siguiente, vuelves al cortado: ese hombre sabe lo que hace."),
      o("c", "Tomar el desayuno rápido y marcharte sin mirar atrás", "Prisa", { moral: 0, flags: { cd_bar: "prisa" } }, "Cada mañana, el mismo ritual: el cortado, la tostada, el reloj. Pasan dos años. Un día, Fermín se jubila sin que lo sepas. Cuando entras, hay un camarero nuevo. «¿Qué desea?». No sabes qué contestar."),
    ]),
  S("cd-bar-fermin", "ciudad", { after: [after("cd-bar-fijo", "a", 12, 120)], minAge: 20 }, "vida",
    "Fermín te cuenta que su hija quiere ser futbolista y no se atreve a decirlo",
    "Es un lunes tranquilo. El bar está casi vacío, con el suelo recién fregado y la radio bajita. Fermín seca un vaso y, sin mirarte, dice: «Mi niña, la mayor, quiere ser futbolista. No me lo dice por miedo a que me enfade. Pero la he visto jugar en la plaza. Tiene algo. Y yo, claro, no sé qué hacer». Hay un silencio. «Tú eres de los pocos que han salido de un barrio como el nuestro».",
    [
      o("a", "Invitar a la niña a un entrenamiento y presentarle a la entrenadora de la cantera", "Abrirle una puerta", { moral: 8, reputacion: 6, rel_aficion: 3, flags: { cd_hija_fermin: "puerta" } }, "La entrenadora, tras verla jugar quince minutos, asiente despacio. «Hay madera», dice. La niña, sin palabras, abraza a su padre. Fermín, desde detrás de la barra, se seca los ojos con un trapo."),
      o("b", "Regalarle a la niña unas botas de su talla y una camiseta firmada", "Un gesto cariñoso", { patrimonio: -120, moral: 6, reputacion: 3, flags: { cd_hija_fermin: "regalo" } }, "Las botas le quedan perfectas. Se las pone para dormir. A la mañana siguiente, ensaya regates en la cocina, para desesperación de su madre. Fermín te lo cuenta con una sonrisa."),
      o("c", "Decirle a Fermín que apoye a su hija pero que sea paciente", "Un consejo sincero", { moral: 4, reputacion: 2, flags: { cd_hija_fermin: "consejo" } }, "Le explicas lo difícil que es el camino y lo bonito que puede ser. Fermín asiente en silencio. A los dos días, le dice a su hija que la apuntará a un equipo. «Sé que no será fácil. Pero no será sola», le promete."),
    ]),
  S("cd-panaderia", "ciudad", { minAge: 17, clubTurns: [2, 400], notFlags: ["cd_panaderia"] }, "vida",
    "La panadera guarda para ti el último pan, siempre, aunque haya cola",
    "Se llama Aurora, tiene unas manos fuertes de amasar a las cuatro de la madrugada y una paciencia de santa. Cada sábado, a las nueve, te espera con la barra reservada bajo el mostrador. Los clientes, con la cola hasta la acera, se quedan mirando. «¿Y el de ese señor?», pregunta alguien. «Es que él tiene entrenamiento», contesta ella. Una vez, un cliente hizo una protesta. Aurora lo despachó con un solo gesto.",
    [
      o("a", "Invitarla a un partido para agradecerle el detalle", "Una entrada para ella", { moral: 6, rel_aficion: 4, patrimonio: -40, flags: { cd_panaderia: "entrada" } }, "Aurora, con un vestido de domingo y un bolso enorme, ocupa una butaca de la tercera fila. Al acabar el partido, te trae un pan envuelto en tela: «Lo hice para ti, no para los demás». Se lo comes a escondidas en el autobús."),
      o("b", "Insistir en pagarle más por el pan reservado", "Ser justo", { moral: 3, reputacion: 2, patrimonio: -30, flags: { cd_panaderia: "pago" } }, "Aurora se ofende un poco. «El pan vale lo que vale —dice—. La amistad, no tiene precio». Te lo devuelve en forma de una torta de aceite que huele a infancia. Aprendes a no insultar con dinero un gesto de cariño."),
      o("c", "Dejar que siga sin darle más importancia", "Aceptar el gesto", { moral: 2, flags: { cd_panaderia: "acepto" } }, "La rutina continúa. Con el tiempo, descubres que la barra reservada es lo primero que miras al entrar en el barrio. Y que ese pequeño detalle te hace sentir que perteneces."),
    ]),
  S("cd-taxista-amigo", "ciudad", { minAge: 17, clubTurns: [2, 400], notFlags: ["cd_taxi"] }, "vida",
    "El taxista que te lleva siempre al aeropuerto resulta ser un exfutbolista de segunda",
    "Se llama Julián, tiene cincuenta y un años, una sonrisa torcida y una gorra de visera. Durante meses, habéis charlado de todo menos de fútbol. Un día, en un semáforo, te pregunta con aire distraído: «¿Sabes que jugué dos años en Segunda?». Te quedas atónito. «Una lesión de rodilla», explica. «Pero me fue bien: aquí, entre pasajeros, también se juega». Detiene el taxi, se gira, y con una sonrisa dice: «Si quieres, te cuento cómo era».",
    [
      o("a", "Pedirle que te lo cuente todo en el próximo trayecto", "Escucharle", { moral: 5, reputacion: 3, flags: { cd_taxi: "escucho" } }, "Te cuenta que no fue la rodilla: fue la cabeza. Que dejó de creerse bueno. Que el fútbol, sin fe, se acaba. Esa conversación te cambia una tarde y te acompaña toda la semana."),
      o("b", "Invitarle a un partido y presentarle a algunos compañeros", "Un homenaje a un compañero de oficio", { moral: 7, rel_vestuario: 3, reputacion: 3, flags: { cd_taxi: "partido" } }, "Julián, emocionado, se sienta en un asiento que nunca había pisado. Al acabar, el capitán le estrecha la mano: «Los de segunda sois los que sostenéis el fútbol». Julián, con la voz rota, murmura: «Gracias»."),
      o("c", "Dar las gracias por la anécdota y seguir con tu móvil", "Pasar", { moral: 0, flags: { cd_taxi: "paso" } }, "Sigues con tu móvil. Julián, discreto, no dice más. Años después, descubrirás su nombre en una lista de exjugadores homenajeados. Y recordarás que fue tu taxista."),
    ]),
  S("cd-museo", "ciudad", { minAge: 18, clubTurns: [3, 400], notFlags: ["cd_museo"] }, "vida",
    "Un domingo sin partido descubres un museo y te quedas hasta que cierran",
    "Es un edificio pequeño, con un cartel en la fachada que nunca habías leído. Entras por casualidad, huyendo de la lluvia. Dentro, hay salas con cuadros antiguos, un guardia con aspecto de estatua y un silencio que te cae encima como una manta. Te detienes ante un cuadro enorme: un grupo de jugadores de pelota, siglos atrás, sobre un prado verde. Los miras. Te miran. Notas algo que no sabes nombrar.",
    [
      o("a", "Quedarte horas, leer cada cartel y volver el domingo siguiente", "Hacerte aficionado al arte", { moral: 7, reputacion: 3, flags: { cd_museo: "aficion" } }, "Descubres que el fútbol es una forma de arte, pero que hay otras. Cada domingo sin partido, vas al museo. Con el tiempo, el guardia te saluda por tu nombre. Un día, te enseña una sala que no está abierta al público."),
      o("b", "Hacerte una foto delante del cuadro y subirla con una frase", "Compartirlo", { fama: 3, rel_aficion: 3, moral: 4, flags: { cd_museo: "foto" } }, "Subes la foto con la frase: «El fútbol es muy antiguo». El museo, agradecido, te nombra «visitante ilustre». Las visitas aumentan un cuarenta por ciento. El director te manda un abono de por vida."),
      o("c", "Echar un vistazo rápido y salir a seguir con tu día", "Visita breve", { moral: 2, flags: { cd_museo: "breve" } }, "Treinta minutos y fuera. Te queda una imagen del cuadro, y una sensación pequeña de haberte perdido algo. Dos años después, recordarás aquel prado verde. Y volverás."),
    ]),
  S("cd-concierto", "ciudad", { minAge: 18, patrimonio: [1500, 100000000], clubTurns: [2, 400], notFlags: ["cd_concierto"] }, "vida",
    "Te invitan a un concierto de tu cantante favorito y te piden que subas al escenario",
    "Es en un pabellón cubierto, con diez mil personas, luces moradas y una cortina de humo. Tu cantante favorito, el que escuchas antes de cada partido, mira al público y dice: «Hoy hay alguien muy especial entre nosotros». Los focos te encuentran en la tercera fila. Se oye un rugido. «¿Subes a cantar un estribillo?», pregunta. Tu agente, a tu lado, te hace un gesto de ánimo. O de pánico.",
    [
      o("a", "Subir y cantar con todo el corazón, aunque desafines", "Lanzarte", { fama: 6, rel_aficion: 4, moral: 8, flags: { cd_concierto: "canto" } }, "Cantas el estribillo con una voz que ni tú reconoces. Diez mil personas te acompañan. El cantante, al final, te abraza. El vídeo, naturalmente, tiene siete millones de visualizaciones. Tu madre, en casa, lo repite durante tres días."),
      o("b", "Subir pero limitarte a saludar y dejar que cante él", "Con prudencia", { fama: 3, moral: 5, flags: { cd_concierto: "saludo" } }, "Saludas con las dos manos. El cantante, con una sonrisa, te regala su púa. Vuelves a tu asiento con la tela de la camisa empapada de sudor. Tu agente dice: «Has hecho lo justo». Y sonríe."),
      o("c", "Rechazar con una sonrisa y disfrutar desde tu sitio", "Evitar el foco", { moral: 3, reputacion: 1, flags: { cd_concierto: "no" } }, "El cantante asiente y sigue con otro tema. Disfrutas del concierto con los ojos cerrados. A la salida, un chico te dice: «Podrías haber subido». «Lo sé —respondes—. Pero así lo disfruto mejor»."),
    ]),
  S("cd-obra-vecino", "ciudad", { minAge: 17, clubTurns: [2, 400], notFlags: ["cd_obra"] }, "vida",
    "Las obras del vecino de arriba te despiertan cada mañana a las siete",
    "Es un taladro que no distingue sábados ni domingos, una radio que repite jingles y un hombre con voz de trueno que da órdenes a un equipo de albañiles. Llevas tres semanas durmiendo a trompicones. En el entrenamiento, el fisio nota tus ojeras. El míster, con una ceja levantada, sentencia: «Tienes que descansar». Tú le explicas lo del taladro. Él sonríe con una mezcla de simpatía y diversión.",
    [
      o("a", "Subir a hablar con el vecino con una caja de bollos", "Negociar con dulces", { moral: 4, reputacion: 3, flags: { cd_obra: "bollos" } }, "El vecino, un tipo enorme con bigote, te abre con un taladro en la mano. Pero al ver los bollos se ablanda: «Mi hijo es hincha tuyo». A partir de ese día, las obras empiezan a las nueve y se detienen en tus días de partido. Te hace un favor con una sonrisa."),
      o("b", "Mudarte unos días a un hotel hasta que acaben", "Evitar el ruido", { patrimonio: -500, forma: 2, moral: 2, flags: { cd_obra: "hotel" } }, "Duermes doce horas seguidas el primer día. Cuando vuelves, la obra ha terminado y el vecino te recibe con una caja de alfajores. «Perdona las molestias». Ya no te quejas. Pero guardas la factura del hotel como recuerdo."),
      o("c", "Denunciar al vecino por exceso de ruido", "Ir por la vía oficial", { reputacion: -2, rel_aficion: -1, moral: -1, flags: { cd_obra: "denuncia" } }, "La policía levanta acta. El vecino, furioso, te saluda con un gruñido durante meses. Cuando por fin acaba la obra, te deja una nota en el buzón: «Que te vaya bien. Y que los goles te hagan menos ruido que mi taladro»."),
    ]),
];
