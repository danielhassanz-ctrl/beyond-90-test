/**
 * El cuerpo del futbolista: el suplemento que no deberías tomar, el control antidopaje que llega
 * dos semanas después, la crioterapia, el sueño, la alergia que te arruina un partido. La
 * cadena del suplemento es la más seria: lo que decides un día se cobra en un control.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const SALUD: BankScene[] = [
  S("sl-suplemento", "salud", { minAge: 17, clubTurns: [3, 400], notFlags: ["sl_suplemento"] }, "vestuario",
    "Un compañero te ofrece un suplemento «milagroso» sin etiqueta",
    "Lo guarda en un bote de plástico blanco, sin marca ni lote, en el fondo de la mochila. «Me lo ha pasado un primo que sabe de esto —dice, bajando la voz—. Son diez minutos más de piernas. Lo toman en tres equipos». Te lo enseña con el gesto de quien comparte un secreto de Estado. En la puerta del vestuario, el fisio habla por teléfono.",
    [
      o("a", "Rechazarlo y avisar discretamente al fisio", "Hacer lo correcto", { reputacion: 6, rel_entrenador: 3, rel_vestuario: -2, moral: 2, flags: { sl_suplemento: "aviso" } }, "El fisio lo analiza esa misma tarde: lleva una sustancia prohibida. Tu compañero se libra con un aviso gracias a que lo detectaron antes de usarlo. Semanas después, te lo agradece en voz baja: «Me salvaste la carrera»."),
      o("b", "Decirle que no, sin más, y olvidarte del asunto", "Mantenerte al margen", { moral: 1, flags: { sl_suplemento: "no" } }, "Le dices que prefieres lo de siempre. Se encoge de hombros y guarda el bote. Durante un tiempo, no sabrás si lo tomó o no. Prefieres no saberlo."),
      o("c", "Probarlo «una sola vez» para ver qué tal", "Dejarte tentar", { forma: 3, moral: 2, rel_vestuario: 2, flags: { sl_suplemento: "tomo" } }, "Te sientes ligero, eléctrico, con las piernas de un chaval de veinte. Dos semanas después, la sensación se ha ido. Y empieza un runrún en la cabeza que no sabes callar: ¿y si hay un control?"),
    ]),
  S("sl-control", "salud", { after: [after("sl-suplemento", "c", 3, 12)], minAge: 17 }, "especial",
    "Un control antidopaje sorpresa a la salida del entrenamiento",
    "Llegan dos personas con maletín y bata blanca. «Control sorpresa», dicen, con una cortesía impecable. El fisio te mira un segundo de más. Te llevan a una sala con una mesa, un vaso y un acta con tu nombre. Mientras esperas, repasas cada cosa que has tomado en las últimas semanas. En tu cabeza, un bote sin etiqueta brilla como un faro.",
    [
      r("a", "Declarar todo lo que has tomado, incluido el suplemento", "Ser completamente sincero", 0.55, "El laboratorio analiza la muestra: no hay rastro de nada prohibido. La sustancia del bote era, en realidad, azúcar con vitamina. Un susto enorme, una lección más grande. Vuelves a casa con las piernas flojas y la conciencia tranquila.", { moral: -2, reputacion: 4, flags: { sl_control: "limpio" } }, "El laboratorio detecta trazas de una sustancia no permitida. Se abre un expediente. Te toca declarar, colaborar y esperar. Tu honestidad ayuda, pero la sanción llega: unas semanas fuera.", { moral: -10, reputacion: -5, fama: -3, forma: -3, flags: { sl_sancion: true, coach_bench: "3" } }, "reputacion"),
      r("b", "Omitir lo del suplemento y rezar", "Callar", 0.35, "El análisis sale limpio, pero el acta con la casilla vacía te persigue: el club te llama a su despacho y te pide explicaciones. Sales con un aviso y la sensación de que has rozado el desastre.", { moral: -4, reputacion: -2, flags: { sl_control: "omito" } }, "Salen trazas de una sustancia prohibida y, además, constará que mentiste en el acta. La sanción es mayor y el vestuario, que lo sabía, te mira distinto.", { moral: -14, reputacion: -9, fama: -5, forma: -4, rel_vestuario: -4, flags: { sl_sancion: true, coach_bench: "5", sl_control: "omito" } }, "reputacion"),
    ], { weight: 1.5 }),
  S("sl-sancion", "salud", { after: [after("sl-control", undefined, 2, 14)], flags: ["sl_sancion"], minAge: 17 }, "prensa",
    "La sanción se hace pública y la prensa te señala",
    "El club emite un comunicado de seis líneas que todo el mundo lee como si fuera una novela. Hay titulares que mezclan tu nombre con la palabra «dopaje», análisis de tertulianos que apenas te conocen y una pancarta en el estadio con una frase que no quieres leer. Tu madre te llama llorando. Tu agente, en voz baja, te pregunta: «¿Qué quieres que digamos?».",
    [
      o("a", "Dar la cara en rueda de prensa y asumir tu error", "Responsabilidad", { reputacion: 5, moral: -3, rel_aficion: -2, rel_entrenador: 2, flags: { sl_asumido: true } }, "Dices con la voz firme: «Me equivoqué. No volverá a pasar». No buscas excusas. La prensa, algo desarmada, titula: «Un error asumido». La afición, dividida, te da una segunda oportunidad."),
      o("b", "Culpar al compañero que te dio el suplemento", "Delatar", { reputacion: -6, rel_vestuario: -8, moral: -4, flags: { sl_asumido: false } }, "Lo señalas con nombre. El vestuario te da la espalda. El compañero, que hasta entonces te quería, se encierra en sí mismo. Aunque tengas razón en parte, pierdes algo que no recuperarás pronto."),
      o("c", "No decir nada y dejar que el club hable", "Silencio", { moral: -5, reputacion: -3, flags: { sl_asumido: "silencio" } }, "El club habla por ti, con frases frías. Pasan las semanas y la afición no sabe qué pensar. Tu silencio se interpreta de mil maneras. Ninguna a tu favor."),
    ]),
  S("sl-vuelta", "salud", { after: [after("sl-sancion", "a", 4, 30)], minAge: 17 }, "especial",
    "Vuelves tras la sanción y la grada decide cómo recibirte",
    "Sales al calentamiento con el corazón en la garganta. Hay quienes silban, quienes aplauden y quienes miran sin saber qué hacer. Un niño, en primera fila, tiene un cartel: «Los errores no definen a las personas». La señora de la fila 2, la que siempre te regañaba, se levanta, junta las manos y grita: «¡Dale, que te hemos echado de menos!».",
    [
      o("a", "Mirar a la grada, llevarte una mano al pecho y agradecer", "Con humildad", { moral: 9, rel_aficion: 7, reputacion: 5, flags: { sl_redencion: true } }, "Se hace un silencio. Luego, el aplauso crece como una ola. Juegas ese partido con una entrega que no se olvida. Marcas, y no celebras: señalas el escudo. «Aquí estoy», dices con el gesto. La grada lo entiende."),
      o("b", "Concentrarte en el balón y dejar que hable el campo", "Bajar la cabeza y trabajar", { moral: 5, rel_aficion: 4, forma: 2, reputacion: 3, flags: { sl_redencion: "trabajo" } }, "Juegas sin adornos, corriendo por dos, entregándote sin pedir nada. Al final, el capitán te abraza. La grada, poco a poco, vuelve a corear tu nombre."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a footballer walking onto the pitch alone with his head slightly bowed, hand over his heart, stadium crowd rising to applaud, emotional, dusk light, no logos or readable text" }),
  S("sl-sueno", "salud", { minAge: 17, clubTurns: [3, 400], notFlags: ["sl_sueno"] }, "vida",
    "El club contrata a una experta en sueño y te cambia la vida con una persiana",
    "Se llama Marta, tiene una voz suave y un maletín lleno de termómetros, antifaces y gráficos. Visita tu casa, mide la luz, el ruido y la temperatura de tu habitación. Descubre que duermes con el móvil en la almohada, con una luz azul parpadeando y con una cortina que deja pasar la farola. «Con esto, duermes como un hombre de cuarenta», sentencia, apuntando en su cuaderno.",
    [
      o("a", "Seguir todas sus recomendaciones al pie de la letra", "Cambiar la rutina", { forma: 3, moral: 4, flags: { sl_sueno: "sigo" } }, "Cambias la persiana, apagas el móvil a las diez y te acuestas siempre a la misma hora. En dos semanas, te despiertas descansado. El míster lo nota: «¿Qué has hecho?». «Dormir», dices. Ese es todo el secreto."),
      o("b", "Cambiar solo lo más fácil: la cortina y el antifaz", "Adaptar lo justo", { forma: 2, moral: 2, flags: { sl_sueno: "parcial" } }, "Duermes mejor, aunque no tanto como podrías. Marta, en su siguiente visita, sonríe con indulgencia: «El móvil sigue en la almohada». Lo miras. Lo guardas en el cajón."),
      o("c", "Declinar y seguir como siempre: tu ritmo es tu ritmo", "Resistirte", { forma: -1, moral: 0, flags: { sl_sueno: "no" } }, "Sigues igual. En un par de meses, una racha de partidos con las piernas pesadas te hace recordar la conversación. Esa noche, por fin, apagas el móvil."),
    ]),
  S("sl-vegano", "salud", { minAge: 17, clubTurns: [3, 400], notFlags: ["sl_vegano"] }, "vestuario",
    "Un compañero se vuelve vegano y quiere convertir al vestuario",
    "Lo anuncia en el comedor, de pie sobre una silla: «Desde hoy, mi cuerpo es un templo». Hay un silencio. El cocinero, con un cucharón en la mano, lo mira como quien ve un eclipse. A la semana, el compañero reparte folletos, regala frutos secos y lee, en voz alta, estudios con nombres impronunciables. El portero, con un trozo de chorizo a medio camino de la boca, lo observa con desafío.",
    [
      o("a", "Probar un menú vegano una semana con él, por curiosidad", "Entrar al juego", { forma: 1, moral: 3, rel_vestuario: 5, flags: { sl_vegano: "pruebo" } }, "Los primeros dos días, te sientes pesado. Al tercero, sorprendentemente, ligero. Al sexto, echas de menos un filete como quien echa de menos a un ex. El vestuario te hace una ovación de bienvenida al chorizo."),
      o("b", "Defender el chorizo con un discurso sobre la tradición", "Plantar cara con humor", { rel_vestuario: 6, moral: 4, flags: { sl_vegano: "chorizo" } }, "Tu discurso, con tintes de himno, acaba con un brindis de jamón por todo el vestuario. El compañero, sin perder la compostura, responde con un tuper de hummus. Hay paz, pero se negocia una mesa para cada bando."),
      o("c", "Pedirle que te cuente qué ha cambiado y escucharle de verdad", "Curiosidad sana", { moral: 4, reputacion: 3, rel_vestuario: 3, flags: { sl_vegano: "escucho" } }, "Te cuenta sus razones con una calma sorprendente: la energía, el medio ambiente, un perro que perdió. Cambias dos cosas de tu dieta. No cambias de bando. Pero ya no te ríes del hummus."),
    ]),
  S("sl-diente", "salud", { minAge: 16, clubTurns: [2, 400], notFlags: ["sl_diente"] }, "partido",
    "Te rompes un diente en un choque y juegas con una sonrisa de pirata",
    "Fue en una pelea por un balón aéreo, con un codo sin culpa y un sonido seco que todo el estadio pudo oír. Escupes un trocito de esmalte, te pasas la lengua por el hueco y descubres un hueco nuevo. El fisio, corriendo, te revisa. «Es el incisivo», dice. «Y no puedo hacer nada hasta el domingo». Tú, con la sonrisa mellada, levantas el pulgar al estadio. La grada, que lo ve en las pantallas gigantes, ruge.",
    [
      o("a", "Seguir jugando con orgullo y sin quejarte", "Ser un guerrero", { moral: 4, rel_aficion: 5, rel_entrenador: 3, fama: 2, flags: { sl_diente: "guerrero" } }, "Terminas el partido con una sangre seca en el labio y cara de héroe. En redes, tu sonrisa mellada se hace viral con la etiqueta #DienteDeLeyenda. Un dentista, aprovechando el tirón, te ofrece el arreglo gratis."),
      o("b", "Salir del campo a que te lo miren con calma", "Cuidarte", { forma: 1, moral: 0, rel_entrenador: -1, flags: { sl_diente: "cuido" } }, "Entras en el túnel, con la mano en la boca. En el hospital, te dicen que, si lo hubieras ignorado, habrías perdido la raíz. Tu agradecimiento al fisio es infinito. El míster, al verte, asiente con comprensión."),
      o("c", "Aprovechar para hacerte un chiste sobre tu aspecto", "Reírte de ti mismo", { fama: 4, rel_aficion: 4, moral: 5, flags: { sl_diente: "chiste" } }, "Subes una foto con la leyenda: «Me han fichado para un anuncio de mondadientes». Un patrocinador de dentífricos te hace un guiño y te paga una campaña. Medio vestuario se hace un hueco falso con pegatinas."),
    ]),
  S("sl-polen", "salud", { minAge: 16, clubTurns: [2, 400], turn: [8, 10], notFlags: ["sl_polen"] }, "vida",
    "La primavera te declara la guerra con una alergia que te hace estornudar en el peor momento",
    "Es una alergia al polen de un árbol que no sabes ni nombrar. Empieza en abril y te deja con los ojos como tomates y la nariz como una fuente. El peor momento llega en un penalti: justo antes de tirar, un estornudo gigantesco te hace perder el equilibrio. El portero, atónito, se queda quieto. El balón sale despacito, rodando, hacia la esquina. Marcas, entre carcajadas.",
    [
      o("a", "Contarlo con humor en redes y hacerlo viral", "Reírte con ganas", { fama: 4, rel_aficion: 5, moral: 5, flags: { sl_polen: "viral" } }, "Subes el vídeo con la leyenda: «A veces el mejor tirador es la alergia». Cuatro millones de visualizaciones. Una farmacéutica te ofrece ser imagen de su antihistamínico. Aceptas con una condición: que salga un estornudo."),
      o("b", "Ir al especialista y pedir un tratamiento serio", "Cuidarte", { forma: 3, moral: 2, flags: { sl_polen: "trato" } }, "El especialista te receta unas gotas, una vacuna y una máscara. En tres semanas, respiras como un campeón. Al estornudar, ahora, lo haces sin que el estadio lo note."),
      o("c", "Aguantar sin hacer nada y cruzar los dedos", "Resistir", { forma: -2, moral: -1, flags: { sl_polen: "aguanto" } }, "Los dos meses siguientes son un suplicio. Marcas menos y estornudas más. Tu fisio, con una caja de pañuelos, te mira con paciencia: «La próxima primavera, vas a hacerme caso»."),
    ]),
  S("sl-masajista", "salud", { minAge: 19, clubTurns: [6, 400], notFlags: ["sl_masajista"] }, "vestuario",
    "El masajista de toda la vida te confiesa que se jubila a final de temporada",
    "Es mientras te masajea los gemelos, con las manos grandes y cálidas de siempre. Habla sin mirarte, con la voz baja de quien lleva años sabiendo secretos. «Me retiro, chaval. Mi espalda ya no puede con tanta tela». Hay un silencio. En el fondo, una radio vieja suena con un bolero. «Lo sabe el club, pero no se lo he dicho a nadie más. Quería que lo supieras tú, el primero».",
    [
      o("a", "Organizar una despedida sorpresa con todo el vestuario", "Hacerle un homenaje", { moral: 8, rel_vestuario: 7, reputacion: 4, patrimonio: -120, flags: { sl_masajista: "homenaje" } }, "El último día, el vestuario se junta con una tarta, un cartel y un discurso del capitán. Le regalan unas manoplas de oro de cartón. El masajista, emocionado, deja la camilla con un último estiramiento: «Esto, para la historia»."),
      o("b", "Hablar con él unos minutos más y pedirle un consejo para toda la vida", "Escucharle de verdad", { moral: 6, reputacion: 3, flags: { sl_masajista: "consejo" } }, "Su consejo es sencillo: «Haz caso a tu cuerpo. Te lo dice todo, si le escuchas». Lo escribes en una nota que pegas en tu taquilla. Cuando te retires, será lo primero que mires."),
      o("c", "Darle las gracias con un abrazo y seguir con el entrenamiento", "Contención", { moral: 3, flags: { sl_masajista: "abrazo" } }, "Le das un abrazo corto, fuerte. Luego, a entrenar. A final de temporada, descubres que no sabes dónde vive, ni cómo se llama su mujer. Te dolerá por mucho tiempo."),
    ]),
  S("sl-reloj", "salud", { minAge: 17, clubTurns: [3, 400], notFlags: ["sl_reloj"] }, "entrenamiento",
    "El club os da relojes que miden todo y el míster los lee como un oráculo",
    "Son relojes ligeros, con luces azules y una aplicación que muestra tu frecuencia cardíaca, tus sprints y, para tu horror, tus horas de sueño. El míster, con una tableta bajo el brazo, comenta datos con una voz de narrador de documental: «Fulano ha corrido once kilómetros. Mengano, cuatro, y dormido seis horas». El vestuario traga saliva. Hay quien piensa en tirar el reloj al río.",
    [
      o("a", "Tomártelo en serio y mejorar tus números", "Competir contra tus datos", { forma: 3, moral: 3, rel_entrenador: 3, flags: { sl_reloj: "datos" } }, "A las dos semanas, subes de media un diez por ciento. El míster, a solas, te muestra la tableta: «Eres el que más ha progresado». No sabes si sentirte orgulloso o vigilado. Eliges lo primero."),
      o("b", "Hacerle trampas: dejar el reloj en un compañero que corre mucho", "Una travesura de ingenio", { rel_vestuario: 6, moral: 4, rel_entrenador: -2, flags: { sl_reloj: "trampa" } }, "Le pones el reloj al lateral, que no para ni en el descanso. Tus datos, de la noche a la mañana, son magníficos. El míster te felicita por tu «explosión». El lateral, con una sonrisa traviesa, cobra con cena. El engaño dura tres semanas."),
      o("c", "Preguntar quién tiene acceso a tu información", "Pensar en tu privacidad", { reputacion: 3, rel_entrenador: -1, moral: 1, flags: { sl_reloj: "privacidad" } }, "Tu pregunta abre un debate en el club. Al final, se firma un protocolo de protección de datos. El míster, impresionado, comenta: «Eres el primero en preguntarlo». Un abogado del club te manda una caja de bombones."),
    ]),
  S("sl-gafas", "salud", { minAge: 18, clubTurns: [3, 400], notFlags: ["sl_gafas"] }, "vida",
    "Descubres que llevas años jugando con una miopía que no sabías que tenías",
    "Fue por casualidad, en una revisión rutinaria: el oculista te pidió leer unas letras que a ti te parecían manchas. «¿Cuánto tiempo llevas sin ver bien?», preguntó. «No sabía que no veía bien», respondiste. Te pone unas gafas de prueba y, por primera vez en años, ves las hojas de un árbol a lo lejos. Quedas boquiabierto. «Así que esto es lo que veía el resto del mundo».",
    [
      o("a", "Operarte con láser para quitarte la miopía", "Una solución definitiva", { patrimonio: -1800, forma: 2, moral: 4, flags: { sl_gafas: "laser" } }, "La operación dura diez minutos. Al día siguiente, ves cada brizna de césped. En el siguiente partido, tus pases largos tienen una precisión nueva. «Pareces otro», comenta el míster. Eres el mismo, pero con ojos nuevos."),
      o("b", "Usar lentillas deportivas y adaptarte poco a poco", "Una opción prudente", { patrimonio: -150, forma: 1, moral: 3, flags: { sl_gafas: "lentillas" } }, "Las lentillas te hacen ver el campo de otra forma. Lo notas en los controles y los pases. Al principio se te mueven en medio de un partido. Luego, ya no lo notas. Tu madre te dice: «Se te ve más guapo»."),
      o("c", "Hacer como si nada y seguir sin corregir", "Ignorarlo", { moral: -1, forma: -1, flags: { sl_gafas: "no" } }, "No lo corriges. Siete meses después, un balón largo que no ves venir te golpea en la cara. Es la gota que colma el vaso. Vas, por fin, a la óptica."),
    ]),
  S("sl-crio", "salud", { minAge: 18, clubTurns: [4, 400], clubLevels: ["grande", "europeo"], notFlags: ["sl_crio"] }, "entrenamiento",
    "El club estrena una cámara de crioterapia a menos ciento diez grados",
    "Es una cápsula blanca, con una puerta de cristal y un técnico con guantes gruesos. «Tres minutos de frío extremo, y sales como nuevo», explica. Os ponéis en fila, en calzoncillos, con calcetines de lana y un gorro. El portero, el primero, entra con cara de condenado. A los treinta segundos, grita con una voz que no es la suya. A los dos minutos, sale rojo como un cangrejo. «¡Es una gozada!», miente.",
    [
      o("a", "Entrar con valentía y aguantar los tres minutos", "Plantar cara al frío", { forma: 3, moral: 4, rel_vestuario: 3, flags: { sl_crio: "aguanto" } }, "Cuentas hacia atrás. A los dos minutos, no sientes las piernas. A los tres, sales como un muñeco de nieve. En el túnel, sientes una energía que no esperabas. El vestuario te recibe aplaudiendo. «El más duro», te bautizan."),
      o("b", "Entrar un minuto y huir con dignidad", "Una retirada táctica", { forma: 1, moral: 2, rel_vestuario: 2, flags: { sl_crio: "huyo" } }, "A los sesenta segundos, sales corriendo con una toalla en la cabeza. «Esto no es para mí», dices. Te quedas con una sensación de fracaso, que se te pasa con un café caliente."),
      o("c", "Declinar y mantener tus baños de hielo de siempre", "Fiel a lo tuyo", { forma: 2, moral: 1, flags: { sl_crio: "no" } }, "Seguiste con tus baños de siempre, sin cambios. El técnico, resignado, anota «escéptico» en su ficha. A final de temporada, sin lesiones graves, nadie puede discutírtelo."),
    ]),
  S("sl-resaca", "salud", { minAge: 19, clubTurns: [3, 400], turn: [3, 9], notFlags: ["sl_resaca"] }, "vida",
    "Celebras una victoria hasta las cinco de la madrugada y el entrenamiento es a las diez",
    "Habíais ganado un derbi, el estadio rugía, el vestuario cantaba y alguien propuso «una cervecita». A las tres, estabais en un bar con las bufandas anudadas a la cabeza. A las cinco, en una discoteca. A las seis, dormías en un sofá. Ahora, a las nueve y media, con unas gafas de sol enormes, entras en el campo. El míster, con los brazos cruzados, te observa: «Buenos días».",
    [
      o("a", "Confesar con humor que fue una noche de celebración", "Dar la cara", { rel_entrenador: -2, rel_vestuario: 4, moral: 2, reputacion: 1, flags: { sl_resaca: "confieso" } }, "«Se nos fue de las manos, míster», dices. Él te mira, serio. «Cuatro vueltas más que los demás». Corres. Al acabar, el míster te da una botella de agua: «La próxima, que sea después de un título»."),
      o("b", "Fingir que has dormido perfectamente", "Disimular", { rel_entrenador: -3, moral: -1, forma: -2, flags: { sl_resaca: "finjo" } }, "Entrenas con las pupilas dilatadas. En el primer rondo, fallas tres pases. El míster te mira con una ceja levantada. «Llevas ropa de ayer», dice. Te quedas helado."),
      o("c", "Pedirle al fisio un suero y un masaje antes de empezar", "Recuperarte con ayuda", { forma: 1, moral: 1, rel_entrenador: 0, flags: { sl_resaca: "fisio" } }, "El fisio, con una sonrisa cómplice, te pone un suero en el vestuario. «No se lo diré al míster —murmura—. Pero tampoco lo vuelvas a hacer». Sales casi como nuevo, con la promesa de portarte bien."),
    ]),
];
