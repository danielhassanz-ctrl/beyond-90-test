/**
 * Marcas y patrocinios: las botas con tu nombre, el rodaje que sale mal, el anuncio que te
 * persigue, la cláusula de exclusividad que te impide un contrato mejor. Aquí el dinero llega a
 * cambio de algo, y casi siempre se paga en reputación, tiempo o libertad.
 */
import { S, o, after } from "../dsl";
import type { BankScene } from "../types";

export const MARCAS: BankScene[] = [
  S("mc-botas-firma", "marcas", { minAge: 19, fama: [55, 100], media: [76, 99], clubTurns: [4, 400], notFlags: ["mc_botas"] }, "representante",
    "Una marca de calzado quiere sacar unas botas con tu nombre",
    "El diseñador, un hombre con gorra y tatuajes de colores, despliega un boceto sobre la mesa. Son unas botas de suela estrecha, con una franja dorada y una frase grabada en el talón. Hay un nombre provisional: «Edición Crack». Tu agente, con la calculadora en la mano, sonríe: «Tres años, un porcentaje por venta y una prima de lanzamiento». Tú miras el boceto con un cosquilleo en el estómago. Es tu nombre, sobre algo que otros llevarán en los pies.",
    [
      o("a", "Aceptar y participar en el diseño con tus propias ideas", "Implicarte a fondo", { patrimonio: 9000, fama: 5, rel_aficion: 3, moral: 6, flags: { mc_botas: "diseño" } }, "Pasas semanas ajustando la plantilla, la amortiguación, el diseño. Cuando salen las botas, venden cuarenta mil pares en un mes. Un niño te las enseña en la calle con una sonrisa enorme. Ver tu nombre en los pies de un crío es el mejor pago."),
      o("b", "Aceptar pero poner límites: sin campañas agresivas ni exclusividad total", "Con cabeza", { patrimonio: 5500, fama: 3, reputacion: 3, moral: 3, flags: { mc_botas: "limites" } }, "Tu agente negocia. La marca cede en dos puntos y mantiene uno. El resultado es discreto pero digno. Cuando, años después, una marca rival te ofrece más, podrás aceptarla sin pleito."),
      o("c", "Rechazar: no quieres que tu nombre se use para vender productos", "Mantener la pureza", { reputacion: 4, moral: 1, patrimonio: -300, flags: { mc_botas: "no" } }, "Dices que prefieres no comercializar tu imagen. La marca lo respeta. Un compañero, que sí aceptó un contrato parecido, gana en un año lo que tú en cuatro. Aun así, duermes tranquilo."),
    ]),
  S("mc-botas-defecto", "marcas", { after: [after("mc-botas-firma", "a", 3, 20)], minAge: 20 }, "prensa",
    "Un lote de tus botas sale con un defecto y los niños se quejan de ampollas",
    "El correo llega a las ocho de la mañana, con un asunto en mayúsculas: «URGENTE». Un fallo en el proceso de fabricación ha dejado unas costuras demasiado duras en el talón. En redes, hay fotos de pies con ampollas y una etiqueta con tu apellido. Tu agente, con voz de funeral: «La marca va a pedir una rueda de prensa. Te piden que estés». Hay veinte periodistas esperando.",
    [
      o("a", "Dar la cara, disculparte y ofrecer devoluciones y un cambio a tu cargo", "Hacerte responsable", { patrimonio: -2500, reputacion: 7, rel_aficion: 5, moral: 1, flags: { mc_botas_defecto: "responsable" } }, "Dices: «Estas botas llevan mi nombre. Si fallan, fallo yo». La frase, repetida en todas las emisoras, convierte el desastre en una lección. Muchos clientes, al enterarse, compran un segundo par."),
      o("b", "Dejar que la marca lo gestione y no pronunciarte", "Mantener las distancias", { reputacion: -2, rel_aficion: -2, moral: -1, flags: { mc_botas_defecto: "silencio" } }, "La marca emite un comunicado corto. Los niños siguen con ampollas. En redes, alguien escribe: «¿Y el crack, qué dice?». Tu silencio se interpreta como indiferencia. Tardarás meses en reparar la imagen."),
      o("c", "Visitar a los niños afectados con unas botas nuevas y un abrazo", "Un gesto cercano", { patrimonio: -1200, reputacion: 8, rel_aficion: 7, moral: 4, flags: { mc_botas_defecto: "visita" } }, "Llegas a un colegio con una caja de botas. Los niños gritan. Una niña te dice: «No me dolió». «Vaya mentirosa», dices. Os reís. Las cámaras captan el momento. La crisis se convierte en una noticia bonita."),
    ]),
  S("mc-rodaje", "marcas", { minAge: 19, fama: [45, 100], clubTurns: [3, 400], notFlags: ["mc_rodaje"] }, "vida",
    "El rodaje de un anuncio dura catorce horas y tienes que fingir que te gusta un yogur",
    "El plató es una nave fría, con un fondo blanco, siete focos y un director con un sombrero de paja. Te dan un yogur de fresa, una cuchara y una frase para repetir: «Me da energía para marcar». La repites cuarenta y dos veces. Al octavo intento, te entra la risa. Al decimoquinto, odias la fresa. A la hora catorce, el director, con ojos vidriosos, dice: «Una más. Con sentimiento». Es la décima «una más».",
    [
      o("a", "Mantener la profesionalidad y dar la toma perfecta", "Aguantar con elegancia", { reputacion: 4, rel_representante: 3, moral: -1, patrimonio: 4000, flags: { mc_rodaje: "profesional" } }, "La última toma es la buena: sonrisa natural, voz serena, mirada limpia. El director, emocionado, murmura: «Eres un profesional». El anuncio es un éxito. Tu agente cierra otro contrato con la misma marca."),
      o("b", "Hacer una broma con el yogur y arriesgar con una toma divertida", "Soltarte", { fama: 4, rel_aficion: 3, moral: 4, patrimonio: 4000, flags: { mc_rodaje: "broma" } }, "Pones cara de asco y gritas: «¡Es de fresa!». El director se muere de risa. La toma se convierte en el anuncio oficial, con tu error incluido. El público lo adora. Una de esas veces en que la espontaneidad vale oro."),
      o("c", "Plantarte a la hora doce y pedir que lo dejéis para otro día", "Poner un límite", { moral: 2, rel_representante: -2, patrimonio: 2500, flags: { mc_rodaje: "planto" } }, "El director protesta. Tu agente, a lo lejos, hace una mueca. Pero acabáis el rodaje otro día, con más calma. La marca, algo molesta, te cobra una pequeña penalización. Aprendes que tu tiempo también vale."),
    ]),
  S("mc-exclusividad", "marcas", { minAge: 20, fama: [55, 100], clubTurns: [6, 400], notFlags: ["mc_exclusividad"] }, "representante",
    "Una marca te ofrece mucho dinero a cambio de no hablar bien de la competencia durante cinco años",
    "El contrato es magnífico: un salario fijo anual, primas por goles y una cláusula especial, el artículo 14: «El jugador se abstendrá de manifestar públicamente preferencias por marcas de la competencia». En la práctica, no puedes ni dar las gracias a otra firma. Tu agente, que lo ha leído tres veces, murmura: «Es un contrato de silencio. Pero paga». En la mesa, hay una pluma dorada.",
    [
      o("a", "Firmar el contrato completo: el dinero es el dinero", "Aceptar las condiciones", { patrimonio: 12000, moral: 3, reputacion: -2, flags: { mc_exclusividad: "firmo" } }, "El dinero es abundante. A los dos años, una marca rival te ofrece una colaboración preciosa que no puedes aceptar. Miras tu cuenta y piensas que nada es gratis."),
      o("b", "Negociar que quiten el artículo 14", "Pedir libertad", { patrimonio: 8000, rel_representante: 3, reputacion: 2, flags: { mc_exclusividad: "negociado" } }, "La marca, tras dos semanas de tira y afloja, cede. El contrato es menor, pero no te ata. Cuando la rival llama, puedes contestar: «Hablemos»."),
      o("c", "Rechazar y buscar una marca más flexible", "Priorizar la libertad", { patrimonio: -300, reputacion: 4, moral: 2, flags: { mc_exclusividad: "no" } }, "Pasan dos meses sin patrocinio. Luego, una marca más pequeña, con valores que te gustan, te ofrece un contrato modesto sin cláusulas. Es poco dinero y mucha paz."),
    ]),
  S("mc-exclusividad-golpe", "marcas", { after: [after("mc-exclusividad", "a", 15, 100)], minAge: 22 }, "representante",
    "Una oferta enorme te llega justo cuando estás atado a una marca rival",
    "Es un mensaje de tu agente, escrito con letras mayúsculas: «Una marca nueva quiere ficharte. Multiplican por tres lo que cobras ahora». Se te seca la garganta. Pero lo recuerdas: el artículo 14, la cláusula de exclusividad, la pluma dorada. «¿Puedo romper?», preguntas. «Sí —contesta—. Pero te costará el equivalente a dos años de sueldo». El silencio dura un buen rato.",
    [
      o("a", "Pagar la penalización y firmar con la nueva marca", "Romper y avanzar", { patrimonio: -8000, moral: 4, reputacion: -2, flags: { mc_exclusividad_rotura: true } }, "El pago te duele, pero la oferta lo compensa a los dos años. La marca antigua, por su parte, emite un comunicado seco. Tu reputación de «mercenario» te acompañará una temporada. Después, se pasará."),
      o("b", "Respetar el contrato y esperar a que termine", "Cumplir tu palabra", { reputacion: 5, rel_representante: -1, moral: 1, flags: { mc_exclusividad_rotura: "no" } }, "Dejas pasar la oferta. La marca nueva, impresionada por tu lealtad, te dice: «Cuando acabes, aquí estaremos». Es una promesa. Pasa el tiempo, y cuando acaba el contrato, la oferta sigue en pie."),
      o("c", "Intentar que las dos marcas negocien entre sí", "Jugar a dos bandas", { rel_representante: 2, moral: -1, patrimonio: 2500, flags: { mc_exclusividad_rotura: "mediacion" } }, "Tu agente, con habilidad, logra un acuerdo curioso: ambas marcas te ficharán a medias. El resultado es incómodo, pero rentable. Los comunicados de prensa son un poema de diplomacia."),
    ]),
  S("mc-causa-marca", "marcas", { minAge: 21, fama: [60, 100], clubTurns: [6, 400], notFlags: ["mc_causa"] }, "representante",
    "Una marca te propone una campaña solidaria y sospechas que lo hacen por imagen",
    "Es un anuncio con un niño, un balón y una frase que te eriza: «Cada gol, una sonrisa». La marca dona un euro por cada gol que marques. Hasta ahí, perfecto. Pero un periodista te susurra: «Es lavado de imagen. Los mismos están acusados de explotar fábricas». Tu agente, nervioso, murmura: «Verifica antes de firmar». Hay un cheque, una causa y una duda enorme.",
    [
      o("a", "Investigar a fondo la empresa y pedir garantías antes de firmar", "Pedir pruebas", { rel_representante: 3, reputacion: 6, moral: 2, flags: { mc_causa: "investigo" } }, "Descubres que las acusaciones, en parte, son ciertas. Propones que la marca se comprometa a auditorías externas. Se negocia durante tres meses. Si aceptan, firmarás. Si no, no. La marca, tras meditarlo, accede. Es una victoria discreta."),
      o("b", "Firmar con la condición de que parte del dinero vaya a una ONG de tu elección", "Hacerlo a tu manera", { patrimonio: 2500, reputacion: 4, rel_aficion: 4, moral: 4, flags: { mc_causa: "ong" } }, "La ONG, pequeña y fiable, recibe una cantidad que cambia su año. Tú, a cambio, haces la campaña con dignidad. Algún crítico murmura: «Qué casualidad». Pero el gesto resiste el escrutinio."),
      o("c", "Rechazar la campaña y explicar públicamente por qué", "Dar un golpe de timón", { reputacion: 7, rel_aficion: 6, fama: 3, patrimonio: -500, moral: 3, flags: { mc_causa: "no" } }, "Tu mensaje, claro y educado, se hace viral. La marca, avergonzada, anuncia una revisión interna. Meses después, cambia sus prácticas. No sabrás nunca si fue por ti. Pero nadie podrá decir que callaste."),
    ]),
  S("mc-camiseta-edicion", "marcas", { minAge: 21, fama: [60, 100], clubTurns: [6, 400], notFlags: ["mc_edicion"] }, "vida",
    "Sale una camiseta de edición limitada con tu frase favorita y se agota en una hora",
    "Fue una idea de tu agente y del departamento de marketing: una camiseta con la frase que dijiste en una entrevista, «Hay que creer», bordada en la espalda en letras doradas. Sólo mil unidades. Se pone a la venta a las diez de la mañana. A las once, no queda ninguna. En el mercado de reventa, un par de ejemplares se ofrece por quinientos euros. Tu madre, desde el pueblo, llama: «¡Me han dicho que vendéis más que un cantante!».",
    [
      o("a", "Anunciar una segunda edición con beneficios para una causa", "Aprovechar el tirón", { patrimonio: 4500, rel_aficion: 6, reputacion: 4, moral: 4, flags: { mc_edicion: "segunda" } }, "La segunda edición, de dos mil unidades, se vende en tres días. Un diez por ciento va a un comedor social. El diario local publica: «La camiseta que ayudó a comer». Tu madre, entre lágrimas, repite la frase."),
      o("b", "Dejarlo como una pieza de coleccionista y no repetirla", "Mantener la exclusividad", { patrimonio: 1500, rel_aficion: 3, fama: 3, moral: 3, flags: { mc_edicion: "unica" } }, "La camiseta se convierte en un objeto de culto. Dos años después, se subasta por cinco mil euros. Tu agente, al verlo, murmura: «Qué buen ojo». «Fue suerte», respondes. «Eso también cuenta»."),
      o("c", "Pedir a la marca que baje los precios y venda más unidades", "Priorizar al aficionado", { patrimonio: 800, rel_aficion: 8, reputacion: 5, moral: 5, flags: { mc_edicion: "popular" } }, "La marca, tras mucho resistirse, cede. La segunda tirada, a precio ajustado, llega a diez mil unidades. Muchos niños la lucen. Tú, al verlas por la calle, sientes que has hecho algo bien."),
    ]),
];
