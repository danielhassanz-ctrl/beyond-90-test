/**
 * Veteranía, segunda parte: las rodillas que ya no perdonan, el hijo que te pregunta cuándo vas a
 * jugar con él, el primer rival que podría ser tu hijo, la oferta de dejar el campo por el
 * banquillo. Escenas de balance, con una dulzura que solo da el tiempo.
 */
import { S, o } from "../dsl";
import type { BankScene } from "../types";

export const VETERANO2: BankScene[] = [
  S("v2v-rival-joven", "veterano", { minAge: 30, clubTurns: [3, 400], notFlags: ["v2v_rival_joven"] }, "partido",
    "Te marca un rival de diecinueve años que llevaba tu póster en la habitación",
    "El chaval, flaco y rápido, se te escapa por la banda en el minuto 54, recorta a un central y te bate con un tiro cruzado. Mientras celebra, te mira con una mezcla de culpa y orgullo. Al acabar el partido, en el túnel, se acerca con la cabeza gacha. «Perdone —dice—. Tenía un póster suyo en mi habitación». Se ruboriza. Tú le miras, sin saber si reír o llorar.",
    [
      o("a", "Felicitarle con un abrazo y decirle que lo ha hecho de maravilla", "Pasar el testigo", { moral: 2, reputacion: 6, rel_aficion: 3, flags: { v2v_rival_joven: "abrazo" } }, "Le abrazas, le firmas una camiseta y le dices: «Que no se te suba a la cabeza». El chaval, con los ojos húmedos, asiente. Años después, cuando sea figura, te contará en una entrevista que ese abrazo le salvó de una mala racha."),
      o("b", "Hacerle una broma sobre el póster y contarle que tú también tuviste uno", "Humor de veterano", { moral: 4, reputacion: 3, flags: { v2v_rival_joven: "broma" } }, "«Yo tenía el de uno que se pasó de moda», dices. El chaval se ríe a carcajadas. Os hacéis una foto juntos: una con la camiseta de un equipo, otra con la de otro. Se hace viral con la leyenda: «Del póster al campo»."),
      o("c", "Responder con frialdad: «El campo es el campo»", "Marcar distancia", { moral: -1, reputacion: -1, flags: { v2v_rival_joven: "frio" } }, "El chaval se aparta, avergonzado. En el vestuario, te quedas pensando. Años después, cuando leas una entrevista suya, descubrirás que no habló de ti. Y entenderás que fue por aquella frialdad."),
    ]),
  S("v2v-hijo-pregunta", "veterano", { minAge: 29, flags: ["hijos"], clubTurns: [3, 400], notFlags: ["v2v_hijo_pregunta"] }, "vida",
    "Tu hijo te pregunta cuándo vas a dejar de jugar para jugar con él",
    "Es en la hora del baño, con espuma en el pelo y un patito de goma. Tu hijo, con voz muy seria, dice: «Papá, ¿tú cuándo vas a dejar de jugar a los partidos para jugar conmigo?». Te quedas inmóvil con la toalla en la mano. {pareja}, desde la puerta, aguanta la respiración. El niño te mira con una paciencia infinita. Tienes que contestar. Y todo lo que digas, será verdad.",
    [
      o("a", "Prometerle que un día lo harás y empezar a jugar con él cada domingo", "Hacerle un hueco ya", { moral: 8, rel_entrenador: -1, reputacion: 3, flags: { v2v_hijo_pregunta: "domingos" } }, "Los domingos por la mañana, antes de entrenar, hacéis una hora de balón en el jardín. El niño, con una camiseta enorme, se convierte en tu mejor entrenador. Dentro de unos años, será él quien te diga cuándo parar."),
      o("b", "Explicarle con sencillez que esto es lo que te hace feliz y también lo que le da de comer", "Ser sincero", { moral: 4, reputacion: 2, flags: { v2v_hijo_pregunta: "sincero" } }, "El niño te escucha serio. «Vale —dice—. Pero cuando termines, me lo cuentas». «Todos los días», prometes. Esa noche, en la cama, repasas lo que has dicho. Y te alegras de no haber mentido."),
      o("c", "Cambiar de tema con una broma y distraerle", "Evadir", { moral: -1, flags: { v2v_hijo_pregunta: "evado" } }, "Le haces cosquillas, salpicas agua, se olvida. Pero {pareja}, desde la puerta, te mira con una expresión que no sabes leer. Esa noche, en la cama, os quedáis hablando del tema en voz baja."),
    ]),
  S("v2v-banquillo-oferta", "veterano", { minAge: 33, clubTurns: [4, 400], notFlags: ["v2v_banquillo"] }, "representante",
    "El club te ofrece un puesto de ayudante del entrenador si dejas de jugar a final de curso",
    "Es una reunión en el despacho del presidente, con un café servido en porcelana y una carpeta con tu nombre. «Queremos que te quedes con nosotros —dice—. Pero no en el campo. En el banquillo». Te ofrece un contrato de tres años, un puesto de ayudante y una oficina con vistas. Es una oferta bonita. Y una puerta cerrada. Tu agente, a tu lado, mira el suelo.",
    [
      o("a", "Aceptar con ilusión y empezar a preparar la transición", "Dar el paso", { moral: 4, reputacion: 5, rel_entrenador: 4, flags: { v2v_banquillo: "acepto", ayudante_futuro: true } }, "Firmas. Esa noche, en casa, abres el cajón de las botas, las miras, las cierras. Al día siguiente, empiezas a estudiar vídeos. Un año después, entrarás en el banquillo con una pizarra y una voz distinta."),
      o("b", "Pedir un año más como jugador y dejar la oferta abierta", "Negociar tiempo", { moral: 3, reputacion: 2, flags: { v2v_banquillo: "tiempo" } }, "El presidente asiente: «Un año. Pero la puerta sigue abierta». Juegas esa temporada con una conciencia nueva de cada partido, de cada balón. Es, sin que lo sepas, la más bonita de tu carrera."),
      o("c", "Rechazarla con respeto: quieres jugar hasta que el cuerpo diga basta", "Seguir en el campo", { moral: 5, forma: 1, rel_entrenador: -2, flags: { v2v_banquillo: "no" } }, "El presidente lo entiende. Pero cuando, dos años más tarde, la rodilla te falla, la oferta ya no está. Aprendes que hay puertas que se cierran solas."),
    ]),
  S("v2v-ultimo-estadio", "veterano", { minAge: 34, clubTurns: [4, 400], notFlags: ["v2v_ultimo_est"] }, "especial",
    "Juegas por última vez en el estadio donde debutaste, sabiéndolo solo tú",
    "Nadie lo sabe. Ni tu agente, ni tu familia. Has decidido en secreto que este será tu último partido aquí. Entras por el túnel que pisaste con diecisiete años, con las mismas losas, la misma luz cruda. Miras la grada, el césped, el banquillo. En el pasillo, hay una foto tuya, con la camiseta de aquel día. Sonríes. Por dentro, algo se encoge. Sales al campo con la cabeza alta.",
    [
      o("a", "Jugar con todo lo que tienes y dedicar el gol al niño que fuiste", "Despedirte del campo", { moral: 10, rel_aficion: 7, reputacion: 5, flags: { v2v_ultimo_est: "gol" } }, "Marcas en el minuto 78. Corres hacia la esquina, te arrodillas y besas el césped. El estadio, que no sabe, se pone en pie. Tú, por dentro, sabes que es un adiós. Al acabar, saludas a todos los rincones con una mano levantada."),
      o("b", "Guardar el secreto y pasar el partido memorizando cada detalle", "Absorberlo en silencio", { moral: 7, reputacion: 3, flags: { v2v_ultimo_est: "silencio" } }, "Cada balón, cada ruido, cada olor. Cuando acaba el partido, te quedas un rato en el vestuario vacío. El utillero, que lo intuye, te pone una mano en el hombro: «Un día más». Y sale sin decir nada."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a veteran footballer kneeling and kissing the grass of an old stadium pitch at dusk, emotional, golden light, empty stands in background, no logos or readable text" }),
  S("v2v-carta-aficionado", "veterano", { minAge: 31, clubTurns: [6, 400], notFlags: ["v2v_carta"] }, "vida",
    "Una carta de un aficionado de ochenta años que te ha visto desde que debutaste",
    "Llega a la oficina del club, escrita con letra pequeña y mucho cuidado. «Soy socio desde 1964. Te vi debutar con diecisiete años y no pensé que llegarías. Me equivoqué. Te he visto crecer, caer, volver. Gracias por hacerme sentir joven cada domingo». Al final, un dibujo de un balón con una mancha de té. Te quedas leyéndola tres veces. En el pasillo, un compañero te mira: «¿Estás bien?».",
    [
      o("a", "Llamarle por teléfono y proponerle una cena", "Responder en persona", { moral: 8, rel_aficion: 6, reputacion: 5, flags: { v2v_carta: "cena" } }, "Cenáis un martes en una taberna, con una botella de vino del tiempo de tu debut. Él te cuenta historias que no sabías. Al despedirse, te regala un abono antiguo. «Este era el mío. Quiero que lo tengas tú»."),
      o("b", "Invitarle a un partido y dedicarle un gol", "Un homenaje en el campo", { moral: 7, rel_aficion: 7, fama: 2, flags: { v2v_carta: "gol" } }, "Le sientas en el palco con una bufanda nueva. Marcas en el 30 y señalas hacia él. El estadio, enterado por megafonía, le aplaude. El anciano, con los ojos húmedos, levanta el bastón."),
      o("c", "Escribirle una carta de vuelta y mandársela con una camiseta", "Una respuesta cálida", { moral: 5, reputacion: 3, flags: { v2v_carta: "carta" } }, "Le escribes cuatro líneas. Mandas la camiseta con tu firma. Meses después, su hija te llama: «Murió con ella puesta. Quería que lo supieras». Te quedas sin palabras."),
    ]),
  S("v2v-rodilla-vuelta", "veterano", { minAge: 31, injured: true, clubTurns: [3, 400], notFlags: ["v2v_rodilla"] }, "vida",
    "Una lesión de rodilla te hace plantearte si tiene sentido volver",
    "El médico lo dice con sinceridad: «Puedes volver. Pero cada partido tendrá un riesgo mayor». Miras tu pierna vendada, la pared del salón con tus camisetas, las muletas apoyadas en el sofá. En el cajón, el contrato firmado de un año más. En tu cabeza, una voz pequeña: «¿Y si lo dejas ahora?». Tu pareja o tu mejor amigo, en la cocina, prepara un caldo. No te presiona. Solo espera.",
    [
      o("a", "Seguir con la rehabilitación y fijarte un partido de regreso", "Luchar", { forma: 3, moral: 4, reputacion: 3, flags: { v2v_rodilla: "lucho" } }, "Cada día, dos horas de gimnasio, dos de piscina. A los cinco meses, vuelves. El primer partido, solo diez minutos. Cuando suena el pitido, te llega un aplauso largo. «Aquí sigues», murmura el capitán."),
      o("b", "Hablar con tu familia y decidir juntos si es hora de parar", "Decidir en compañía", { moral: 3, reputacion: 2, flags: { v2v_rodilla: "familia" } }, "Se sientan los tres en la mesa. Nadie levanta la voz. Al final, decidís intentarlo una vez más, con un plazo y una promesa: si algo falla, lo dejáis. Es la primera vez que decides sin miedo a perderlo todo."),
      o("c", "Pedir al club rescindir el contrato y retirarte en silencio", "Cortar por lo sano", { moral: -4, reputacion: 2, flags: { v2v_rodilla: "retiro", quiere_retirarse: true } }, "El club lo acepta con pesar. Te despides sin ceremonia, con una caja de recuerdos. En el coche, miras el retrovisor un buen rato. Te da la sensación de haber cerrado una puerta que ya no sabes cómo volver a abrir."),
    ]),
  S("v2v-mentor-final", "veterano", { minAge: 31, clubTurns: [6, 400], flags: ["vt_novato_marca"], notFlags: ["v2v_mentor"] }, "vestuario",
    "El chaval al que ayudaste te pide que seas su padrino de camiseta el día de su debut en Europa",
    "Es un honor extraño y precioso: en el túnel, antes de salir, se acerca con una camiseta nueva en las manos. «¿Me la firmas? Y… ¿me la pones tú?». Te quedas mirándole. Es un acto antiguo, casi olvidado: el veterano que viste al debutante. Alrededor, el vestuario hace silencio. Tú, con las manos algo temblorosas, le colocas la camiseta sobre los hombros.",
    [
      o("a", "Ponérsela con solemnidad y decirle una frase al oído", "Un gesto de leyenda", { moral: 9, reputacion: 7, rel_vestuario: 5, flags: { v2v_mentor: "frase" } }, "«Disfruta, que dura menos de lo que piensas», le dices. Él asiente, con los ojos brillantes. Sale al campo con un temblor que se convierte en seguridad. Esa noche, juega como un veterano. Y marca. Y te señala."),
      o("b", "Hacerle una broma para quitarle tensión y ponérsela con un guiño", "Humor y cariño", { moral: 7, rel_vestuario: 4, reputacion: 3, flags: { v2v_mentor: "broma" } }, "«No me manches la camiseta con nervios», dices. El chaval se ríe. El vestuario, también. Sale al campo con una sonrisa. En el descanso, te escribe: «Gracias por lo del guiño»."),
    ]),
  S("v2v-medio-siglo", "veterano", { minAge: 35, clubTurns: [10, 400], notFlags: ["v2v_cuarentena"] }, "vida",
    "Cumples treinta y cinco y el club te hace una tarta con una camiseta que pesa más que tú",
    "Es una tarta de tres pisos, con velas en forma de balón y una camiseta de azúcar con tu apellido. El vestuario, los de verdad, canta el «cumpleaños feliz» con una afinación de funeral. Un canterano de dieciocho años, con una voz de pito, grita: «¡Vivan los viejos!». El capitán, con una sonrisa maliciosa, añade: «Y que cumplas muchos más… en el banquillo». Sopláis las velas entre risas.",
    [
      o("a", "Brindar con un discurso de agradecimiento y humor", "Disfrutar de la edad", { moral: 7, rel_vestuario: 5, reputacion: 3, flags: { v2v_cuarentena: "brindis" } }, "«Cuando era joven, pensaba que los de treinta y cinco eran el pasado —dices—. Me alegra comprobar que son el cemento». Una ovación. El canterano, avergonzado, te regala una bolsa de gominolas. «Para tu dentadura», murmura."),
      o("b", "Pedir que no haya fiesta: te hace sentir viejo", "Disimular", { moral: -1, rel_vestuario: -1, flags: { v2v_cuarentena: "no" } }, "El vestuario se queda con la tarta en la mano. «Qué soso», murmura uno. Esa noche, solo en casa, descubres que no querías una fiesta: querías que te insistieran. Lo piensas durante tres días."),
    ]),
];
