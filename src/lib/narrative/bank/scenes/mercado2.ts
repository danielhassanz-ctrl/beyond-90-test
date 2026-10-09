/**
 * Mercado de fichajes con más sabor: el último día con el fax, la maleta de tu vida, la pancarta
 * de «quédate», la oferta imposible de un club con nombre inventado. Todo ocurre con la ventana
 * abierta y sin comprometer ningún traspaso: son escenas de vida alrededor del mercado.
 */
import { S, o, r } from "../dsl";
import type { BankScene } from "../types";

export const MERCADO2: BankScene[] = [
  S("mk-pancarta", "mercado", { minAge: 17, fama: [30, 100], market: "abierta", clubTurns: [3, 400], notFlags: ["mk_pancarta"] }, "vida",
    "Una pancarta enorme dice «No te vayas»",
    "Aparece una mañana en la fachada del estadio: cuarenta metros de tela con tu nombre y una frase que no admite dobles lecturas. Alguien ha organizado una recogida de firmas, una vigilia y una canción con letra de mal gusto. Una anciana te dice: «Si te vas, me muero». Es una exageración, pero te la crees. Tu agente, a lo lejos, sonríe con malicia.",
    [
      o("a", "Ir a darles las gracias y asegurar que lo estás pensando", "Con cariño", { rel_aficion: 7, moral: 5, reputacion: 2, flags: { mk_pancarta: "gracias" } }, "Sales a la puerta, hablas con ellos y te fotografían con la pancarta. «Hoy me quedo», dices en broma. En el móvil, tu agente te escribe: «No digas cosas así». Pero la grada ya te ama un poco más."),
      o("b", "Mantener el misterio y no decir nada", "Ni sí ni no", { moral: 1, flags: { mk_pancarta: "misterio" } }, "Pasas por delante sin detenerte. La afición se hace mil preguntas. Un periodista escribe: «Su silencio dice mucho». Tú no sabes qué dices, y eso es lo que más te asusta."),
      o("c", "Pedir que quiten la pancarta: te presiona", "Poner límites", { moral: -2, rel_aficion: -3, flags: { mk_pancarta: "quitar" } }, "La retiran con tristeza. Esa noche, la afición silba tu nombre. Al día siguiente, otra pancarta, más pequeña, dice: «Es tu decisión». Duele más."),
    ]),
  S("mk-maleta", "mercado", { minAge: 17, market: "abierta", flags: ["quiere_salir"], notFlags: ["mk_maleta"] }, "vida",
    "Haces la maleta para un traspaso y te lleva horas",
    "Es una maleta vieja, la que tu padre te regaló a los dieciséis años. Hay una camiseta de la infancia, una foto con tu primer entrenador, unas botas que ya no usas y una taza con una grieta que no sabes si tirar. Cada objeto te cuenta algo. Son las dos de la madrugada y todavía no has metido ni un calcetín. Tu madre, en la puerta, mira en silencio.",
    [
      o("a", "Llevarte solo lo esencial y dejar el resto con tus padres", "Viajar ligero", { moral: 3, reputacion: 1, flags: { mk_maleta: "ligero" } }, "Metes tres camisetas, el cargador y la foto. Tu madre te devuelve las botas: «Estas se quedan aquí, para cuando vuelvas». Te abrazas a ella con la maleta a medio cerrar."),
      o("b", "Llevarte todo, hasta la taza rota", "Cargar con la historia", { moral: 5, flags: { mk_maleta: "todo" } }, "La maleta pesa treinta kilos. En el aeropuerto, te cobran un suplemento absurdo. Pero cuando abres la taza en tu nueva casa, te sientes a gusto. El sitio huele a hogar."),
      o("c", "Pedir ayuda a tu madre y dejar que decida qué te llevas", "Confiar en ella", { moral: 6, rel_representante: 0, flags: { mk_maleta: "madre" } }, "Tu madre elige con una precisión de cirujana. Cuando abres la maleta en tu nuevo piso, descubres, bajo una camiseta, un sobre con una nota: «Aquí tienes tu casa». Lloras durante diez minutos."),
    ]),
  S("mk-ultimo-dia", "mercado", { minAge: 17, market: "abierta", clubTurns: [2, 400], turn: [2, 2], notFlags: ["mk_ultimo_dia"] }, "representante",
    "El último día del mercado: fax, nervios y una impresora rota",
    "Es la una de la madrugada en la oficina de tu agente. Hay tres teléfonos sonando, una impresora que no imprime, un fax del siglo pasado que nadie sabe encender y una pizza fría. Falta una hora para el cierre y tu futuro depende de una firma que no llega. El abogado, con la corbata aflojada, murmura: «Si no la mandan, nos quedamos».",
    [
      r("a", "Quedarte con tu agente hasta el final, sin separarte del teléfono", "Aguantar el tipo", 0.5, "A las 23:58 llega el fax con la firma. Tu agente grita de alegría, el abogado llora y tú te desplomas en una silla. Cuando miras el reloj, el mercado ya ha cerrado y vosotros habéis ganado por dos minutos. La pizza fría está riquísima.", { rel_representante: 6, moral: 8, flags: { mk_ultimo_dia: "llega" } }, "La firma no llega. A las 00:01 suena la alarma del móvil de tu agente: el mercado ha cerrado. Se miran todos en silencio. Alguien dice: «Lo intentamos». Ese «lo intentamos» se te queda grabado.", { rel_representante: 3, moral: -4, flags: { mk_ultimo_dia: "no" } }, "reputacion"),
      o("b", "Irte a dormir y confiar en lo que decida tu agente", "Delegar", { rel_representante: -1, moral: 0, flags: { mk_ultimo_dia: "duermo" } }, "Te despiertas con diez llamadas perdidas. Tu agente te cuenta todo lo que pasó por teléfono, con la voz rota por la falta de sueño. «La próxima, quédate», murmura. No sabes si lo dice de broma."),
    ]),
  S("mk-club-extrano", "mercado", { minAge: 17, market: "abierta", fama: [30, 100], notFlags: ["mk_extrano"] }, "representante",
    "Te ofrece fichar un club con un nombre que nadie conoce",
    "Tu agente llega con una sonrisa nerviosa y una carpeta que huele a fotocopiadora. «Hay un equipo, el Real Rincón Atlético, de una liga muy interesante, que te ofrece un contrato de cuatro años y un sueldo digno de un banquero». Te enseña la hoja: hay un escudo con un loro, una foto de un estadio de césped dudoso y una cláusula curiosa: «Derecho a una barbacoa mensual».",
    [
      o("a", "Tomártelo con humor y pedir ver el estadio", "Seguir la broma", { fama: 3, moral: 4, rel_representante: 2, flags: { mk_extrano: "humor" } }, "Tu agente viaja con una cámara. El estadio tiene dos gradas, tres cabras y un delegado con camisa hawaiana. «El césped se riega con cariño», asegura. Lo cuentas en redes y el club se hace viral. Ofrecen invitarte a una barbacoa."),
      o("b", "Rechazarlo con educación pero con una sonrisa", "Declinar", { moral: 2, reputacion: 1, flags: { mk_extrano: "no" } }, "Les mandas una camiseta firmada con una nota: «Hoy no puedo, pero me encantaría venir a verles». El presidente del Rincón responde con una barbacoa en vídeo. Es el mejor rechazo de tu vida."),
      o("c", "Pedir que no vuelvan a ofrecerte nada así", "Cortar de raíz", { rel_representante: -2, moral: -1, flags: { mk_extrano: "corto" } }, "Tu agente guarda la carpeta con cara de decepción. «Era una broma de un amigo», admite. «Bueno, al menos tienes un contrato en la manga». Tú no te ríes. Él, sí."),
    ]),
  S("mk-presidente-casa", "mercado", { minAge: 18, market: "abierta", fama: [45, 100], notFlags: ["mk_pres_casa"] }, "vida",
    "El presidente de un club interesado se presenta en casa de tus padres",
    "Llega con una camisa de lino, un maletín de piel y un ramo de flores. Tu madre, sin entender nada, le abre la puerta con el delantal. El presidente le dice, con un acento exquisito: «Vengo a hablar de su hijo». Tu madre, tras un segundo de silencio, responde: «Pues pase, pero se quita los zapatos». Treinta minutos después, ya hay tortilla y café en la mesa.",
    [
      o("a", "Presentarte y escuchar la propuesta con tus padres delante", "En familia", { moral: 5, reputacion: 3, flags: { mk_pres_casa: "familia" } }, "El presidente habla de proyectos, de estadios, de cifras. Tu madre pregunta: «¿Y tienen un hospital cerca?». Es la mejor pregunta de la tarde. El presidente anota algo en su libreta y, antes de irse, deja un sobre. Dentro, solo una nota: «Gracias por la tortilla»."),
      o("b", "Pedir que se vaya: son temas de agente", "Poner orden", { rel_representante: 3, moral: -2, flags: { mk_pres_casa: "fuera" } }, "El presidente, con la dignidad de un diplomático, se marcha tras tomar un último bocado. Tu madre te mira: «Tan educado y lo has echado». Te quedas pensando si tiene razón."),
      o("c", "Aprovechar y negociar tú mismo con el presidente", "Tomar las riendas", { rel_representante: -3, patrimonio: 1500, moral: 3, flags: { mk_pres_casa: "negocio" } }, "Le sacas un extra de prima de firma en una conversación de diez minutos. Tu agente, al enterarse, entra en un silencio prolongado. «Eso lo habría conseguido yo», dice. «Con más tiempo». Pero sonríe, aunque a regañadientes."),
    ]),
  S("mk-reporteros-hotel", "mercado", { minAge: 18, market: "abierta", fama: [50, 100], notFlags: ["mk_reporteros"] }, "prensa",
    "Veinte reporteros acampan frente a tu portal",
    "Es un asedio educado pero constante: furgonetas con antenas, cámaras en trípode y tres periodistas haciendo guardia con un termo. Un vecino te cuenta que han estado preguntando a todos. Te asomas tras la cortina y ves a un reportero comiendo un bocadillo apoyado en tu coche. La noticia: «El crack podría fichar por el rival». Tú aún no has decidido nada.",
    [
      o("a", "Salir con tus gafas de sol y no decir nada", "Misterio total", { fama: 3, rel_aficion: 0, moral: 0, flags: { mk_reporteros: "misterio" } }, "Pasas entre ellos a paso firme, con una sonrisa enigmática. Esa foto ocupa todas las portadas con el titular: «Su silencio, su estrategia». No tienes ni idea de qué estrategia es."),
      o("b", "Sacarles café y charlar con ellos un minuto", "Sorprender", { reputacion: 5, fama: 3, rel_aficion: 2, moral: 3, flags: { mk_reporteros: "cafe" } }, "Les llevas una bandeja con cafés. «No tengo nada que decir, pero hace frío», comentas. Los periodistas aplauden, sorprendidos. Al día siguiente, la noticia es sobre tu amabilidad, no sobre tu futuro."),
      o("c", "Escabullirte por el garaje con gorra y bufanda", "Evitar el asedio", { moral: 1, fama: 1, flags: { mk_reporteros: "garaje" } }, "Sales por la puerta de atrás con un disfraz torpe. Un reportero te ve, te saluda con la mano y dice: «Que te vaya bien, chaval». Empiezas a pensar que tu disfraz es peor de lo que creías."),
    ]),
  S("mk-presentacion-fallida", "mercado", { minAge: 18, market: "abierta", clubTurns: [1, 400], notFlags: ["mk_presentacion"] }, "prensa",
    "Tu presentación como nuevo fichaje sale fatal",
    "Hay un estadio medio lleno, una alfombra roja, una bufanda que te ponen al cuello y un speaker que anuncia tu nombre… mal. «¡Con ustedes, el nuevo fichaje: Gonzalo… eh… Hernández… Peláez!». Nadie se llama así. Un niño, en la primera fila, ríe a carcajadas. Te acercas al micrófono, con la bufanda mal colocada y todo el estadio mirándote. El speaker, rojo, se esconde.",
    [
      o("a", "Corregir al speaker con humor y arrancar el aplauso", "Salir con ingenio", { fama: 4, rel_aficion: 6, moral: 5, flags: { mk_presentacion: "humor" } }, "«Gracias, pero por si acaso, soy otro», dices. El estadio estalla. El speaker te abraza en el túnel, pidiendo perdón. Se te queda un amigo."),
      o("b", "Aguantar el chaparrón con una sonrisa y seguir", "Profesional", { reputacion: 3, moral: 1, flags: { mk_presentacion: "profesional" } }, "Sonríes con paciencia. Al final, un directivo se te acerca: «Lo has llevado como un señor». El speaker, esa semana, pierde la voz del disgusto."),
      o("c", "Mirar al presidente con desaprobación", "Reprochar el fallo", { moral: -3, rel_aficion: -1, rel_entrenador: -1, flags: { mk_presentacion: "reproche" } }, "El presidente, que sabe de protocolos, te devuelve la mirada. Algo queda tenso en el palco. El speaker, tras la presentación, te escribe: «Perdón, de verdad». No contestas. Quizá sea tarde."),
    ]),
  S("mk-despedida-cena", "mercado", { minAge: 18, flags: ["quiere_salir"], market: "abierta", clubTurns: [4, 400], notFlags: ["mk_despedida"] }, "vestuario",
    "Tus compañeros te organizan una cena de despedida con regalos absurdos",
    "Lo han hecho en secreto, en un restaurante de las afueras, con una mesa larga y una pancarta que dice: «Que te vaya bien, traidor». Hay regalos: un reloj de cocina con tu cara, una bolsa de patatas con tu apellido, un balón firmado por todos con una frase sentida y otra insultante. El capitán, con una copa de vino, se levanta: «Todo gran hombre merece un buen adiós».",
    [
      o("a", "Devolver el cariño con un discurso emocionado", "Dejar el corazón", { moral: 8, rel_vestuario: 8, reputacion: 3, flags: { mk_despedida: "discurso" } }, "Hablas de lo que has aprendido, de las bromas, de los viajes. Se hace un silencio cálido. El portero llora. Al acabar, brindáis y nadie quiere irse. Sales de allí con una maleta de recuerdos."),
      o("b", "Contestar con humor y repartir regalos a todos", "Hacer reír", { moral: 6, rel_vestuario: 6, patrimonio: -300, flags: { mk_despedida: "humor" } }, "Sacas veinte pequeños paquetes, uno para cada compañero, con un mensaje irónico. El vestuario se desmorona de risa. Dos horas después, os da la una de la madrugada, y la cena sigue."),
      o("c", "Disculparte y marcharte pronto: es muy emotivo", "Esquivar la emoción", { moral: -2, rel_vestuario: -2, flags: { mk_despedida: "pronto" } }, "A los treinta minutos, dices que te duele la cabeza. Os despedís con un abrazo corto. En el coche, te quedas parado diez minutos con las manos en el volante. No arrancas. Hay despedidas que no se aguantan."),
    ]),
  S("mk-clausula-camiseta", "mercado", { minAge: 18, fama: [40, 100], market: "abierta", notFlags: ["mk_camiseta"] }, "prensa",
    "Aparecen camisetas piratas con tu cláusula de rescisión escrita",
    "Un vendedor ambulante, en la puerta del estadio, tiene un montón de camisetas con tu número y, en el pecho, una cifra enorme: «Tu cláusula: 120 millones». Los aficionados, entre risas, se las ponen. Alguien le pregunta al vendedor: «¿Y si te vas?». Él responde: «Entonces cambiamos la cifra». Te las envían a casa, como regalo. Tu agente, pálido, murmura: «Esto es un delito».",
    [
      o("a", "Reírte y ponerte una en el siguiente entrenamiento", "Tomártelo bien", { fama: 4, rel_aficion: 5, moral: 4, flags: { mk_camiseta: "humor" } }, "La llevas puesta bajo el peto. En un rondo, un compañero la ve y se echa a reír. La noticia llega al presidente, que, con un suspiro, dice: «Esto, desde luego, no lo teníamos planeado»."),
      o("b", "Pedir al club que tome medidas legales", "Defender tu imagen", { reputacion: 2, moral: -1, rel_representante: 2, flags: { mk_camiseta: "legal" } }, "El club emite un comunicado y manda a seguridad. El vendedor desaparece. Al día siguiente, hay otro en otra esquina. «Es la naturaleza», sentencia el capitán."),
      o("c", "Comprarle todas las camisetas al vendedor y regalarlas a niños", "Gesto solidario", { patrimonio: -300, reputacion: 4, rel_aficion: 5, moral: 5, flags: { mk_camiseta: "regalo" } }, "Le compras todo el lote. Repartes las camisetas en un colegio del barrio. Los niños las usan de pijama. La cifra «120 millones» se convierte en un chiste local."),
    ]),
  S("mk-nuevo-piso", "mercado", { minAge: 18, market: "abierta", clubTurns: [1, 3], notFlags: ["mk_piso"] }, "vida",
    "Tu primer piso en la nueva ciudad: sin muebles y con un vecino de lo más raro",
    "Llegas con una maleta, un balón y la llave en la mano. El piso es luminoso, con vistas a un patio y cero muebles. Hay una nevera enorme que huele a pescado, una cama sin colchón y un vecino de enfrente que, desde su puerta, te saluda con un cuchillo de cocina en la mano: «¡Bienvenido! Estoy cortando cebolla». Te quedas inmóvil.",
    [
      o("a", "Presentarte con una sonrisa y pedirle recomendaciones del barrio", "Ser el vecino simpático", { moral: 5, reputacion: 2, flags: { mk_piso: "amigo" } }, "Se llama Doroteo, es jubilado y sabe todo del barrio. En media hora, te ha contado dónde comprar el pan, dónde está la mejor tortilla y quién es el mejor fontanero. «Un fichaje excelente», murmura."),
      o("b", "Llamar a tu agente para que te busque un piso más tranquilo", "Evitar el riesgo", { rel_representante: -1, moral: 1, flags: { mk_piso: "agente" } }, "Tu agente te escucha, suspira y te dice: «Cuéntame cómo es el vecino». Al final, decide dejar el piso. Pero no sin antes pedirle una receta de tortilla."),
      o("c", "Montar la cama y dormirte en el acto", "Cansancio puro", { forma: 2, moral: 2, flags: { mk_piso: "duermo" } }, "Duermes doce horas seguidas. Al despertarte, hay un plato de tortilla en la puerta con una nota: «De Doroteo, para el chaval que no sabía cocinar». Se te hace un nudo bueno."),
    ]),
];
