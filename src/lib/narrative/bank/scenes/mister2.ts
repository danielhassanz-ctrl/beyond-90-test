/**
 * El míster y el club desde dentro: una pizarra incomprensible, un día libre en karts, una idea
 * tuya que acaba siendo suya (o al revés), la camiseta más fea de la historia. Con humor y con
 * consecuencias en cómo te mira quien decide quién juega.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const MISTER2: BankScene[] = [
  S("mi-pizarra", "mister", { minAge: 16, clubTurns: [2, 400], notFlags: ["mi_pizarra"] }, "entrenamiento",
    "La pizarra del míster, un jeroglífico",
    "Dibuja flechas, círculos, triángulos y una línea ondulada que dice que es «el movimiento del extremo». Los suplentes, al fondo, intercambian miradas de pánico. Hay diecinueve colores y una leyenda que no se entiende. El míster, con una pasión que ablanda, pregunta: «¿Alguna duda?». Todos callan. Tú levantas la mano sin saber por qué.",
    [
      o("a", "Preguntar con seriedad por la línea ondulada", "Ir al fondo", { rel_entrenador: 5, reputacion: 2, moral: 2, flags: { mi_pizarra: "pregunto" } }, "El míster se ilumina. Te explica durante diez minutos qué es la línea ondulada: «Es el desmarque que nadie ve». Sales con una carpeta y una idea nueva. El vestuario, aliviado, te agradece haber preguntado."),
      o("b", "Hacer una broma sobre los diecinueve colores", "Quitar hierro", { rel_vestuario: 5, moral: 3, rel_entrenador: -1, flags: { mi_pizarra: "broma" } }, "«Es como un arcoíris con complejos», dices. El vestuario revienta de risa. El míster te mira un segundo y, para sorpresa de todos, se ríe también. «Os lo explico en dos colores», concede."),
      o("c", "Asentir y fingir que lo entiendes todo", "Disimular", { moral: 0, flags: { mi_pizarra: "finjo" } }, "Asientes con convicción. Esa tarde, en el entrenamiento, haces exactamente lo contrario de lo que se pedía. El míster, desde la banda, se frota las sienes. «Mañana, otra pizarra», anuncia, resignado."),
    ]),
  S("mi-karting", "mister", { minAge: 17, clubTurns: [3, 400], turn: [3, 9], notFlags: ["mi_karting"] }, "entrenamiento",
    "Día libre sorpresa: el míster os lleva a hacer karting",
    "Llega al entrenamiento con una sonrisa de las que dan miedo y anuncia: «Hoy toca moral de equipo». Veinte minutos después, todo el vestuario va en autobús hacia un circuito de karts en medio de un polígono. Hay cascos, guantes y un empleado con chaleco que explica las normas con aburrimiento. El míster, con casco, parece un niño de ocho años.",
    [
      r("a", "Salir a ganar a cualquier precio", "Competir en serio", 0.45, "Ganas la carrera, rozando con la rueda a dos compañeros y a un neumático. Te dan un trofeo de plástico y una botella de cava. El míster te estrecha la mano con la cara roja de risa: «Eres un salvaje». Es el mejor elogio que te ha dedicado.", { moral: 8, rel_vestuario: 6, rel_entrenador: 3, flags: { mi_karting: "gano" } }, "Te sales en la tercera curva y te estampas contra una pila de neumáticos. El vestuario te ovaciona, el míster se desternilla y tú sales con un moratón en la nalga y la dignidad intacta.", { moral: 4, rel_vestuario: 7, flags: { mi_karting: "choque" } }, "forma"),
      o("b", "Dejar que gane el míster y hacerle un homenaje", "Con diplomacia", { rel_entrenador: 6, moral: 4, flags: { mi_karting: "diplomatico" } }, "Dejas pasar al míster en la última vuelta. Gana, se baja del kart con los brazos en alto y te abraza: «Lo sabía». Sabes que se ha dado cuenta. Pero esa noche, en el aparcamiento, te guiña el ojo."),
      o("c", "No participar y mirar desde la valla", "Ser el fotógrafo", { rel_vestuario: 1, moral: 1, flags: { mi_karting: "foto" } }, "Haces fotos a todo el mundo. Esa tarde, al revisarlas en casa, descubres que es la mejor galería de la temporada. Subes tres al grupo de WhatsApp del equipo. Son su fondo de pantalla durante meses."),
    ]),
  S("mi-idea", "mister", { minAge: 18, clubTurns: [6, 400], media: [66, 99], notFlags: ["mi_idea"] }, "entrenamiento",
    "Se te ocurre algo táctico que el míster no ha probado",
    "Llevas semanas dándole vueltas: un movimiento en la salida de balón que desbloquearía el juego por la izquierda. Lo has dibujado en una servilleta, lo has probado en la cabeza cien veces. Esta mañana, tras el entrenamiento, te acercas al míster con la servilleta en la mano. Él te mira con una ceja levantada. Tienes veinte segundos para convencerle.",
    [
      r("a", "Presentarle la idea con confianza", "Convencerle", 0.55, "El míster estudia la servilleta, la dobla en cuatro y se la guarda. «Mañana lo probamos», dice. En el partido del domingo, la jugada sale tres veces y acaba en dos goles. En rueda de prensa, el míster dice: «Esto lo trabajamos toda la semana». Y no menciona la servilleta.", { rel_entrenador: 5, moral: 6, reputacion: 3, flags: { mi_idea: "acepta" } }, "El míster te escucha en silencio y dice: «Está bien pensado, pero ahora no». Te devuelve la servilleta con una sonrisa amable. Te quedas con una espina pequeña y con el consuelo de haberlo intentado.", { rel_entrenador: 1, moral: -1, flags: { mi_idea: "rechaza" } }, "reputacion"),
      o("b", "Contárselo al capitán para que lo plantee él", "Usar el filtro", { rel_vestuario: 3, rel_entrenador: 1, flags: { mi_idea: "capitan" } }, "El capitán lo escucha, lo pule y se lo cuenta al míster como idea suya. Funciona. Cuando te enteras, no dices nada. Pero esa noche, el capitán te envía un mensaje: «Gracias por la idea. Te debo una»."),
      o("c", "Guardártela para ti y esperar mejor momento", "Esperar", { moral: -1, flags: { mi_idea: "guardo" } }, "La servilleta se queda en el bolsillo de una chaqueta. Meses después, el míster, desesperado, prueba un movimiento muy parecido. Funciona. Sientes que podrías haberlo dicho antes."),
    ]),
  S("mi-idea-credito", "mister", { after: [after("mi-idea", "a", 4, 40)], minAge: 19 }, "prensa",
    "El míster te reconoce el mérito en rueda de prensa",
    "Pasan las semanas, la jugada de la servilleta se repite en los partidos, y una periodista, tras un triunfo, pregunta: «¿De dónde sale esa salida de balón tan fluida?». Hay un silencio. El míster, sin mirarte, se coloca el micrófono y dice: «La idea es de un jugador que no tiene miedo a hablar. Y se llama como el que está sentado ahí». Hay un murmullo.",
    [
      o("a", "Sonreír con modestia y agradecérselo", "Con humildad", { reputacion: 6, rel_entrenador: 6, moral: 7, flags: { mi_credito: true } }, "Te levantas, le das la mano y dices: «Es del equipo». El míster te mira con un afecto que no esperabas. A la salida, un compañero te grita: «¡El cerebro del equipo!». No sabes dónde meterte, y te encanta."),
      o("b", "Hacer una broma sobre la servilleta", "Contar el origen", { fama: 3, rel_aficion: 3, moral: 5, reputacion: 3, flags: { mi_credito: true } }, "Cuentas lo de la servilleta, y la sala se ríe. A las pocas horas, la servilleta aparece en un museo del club, enmarcada, con una nota: «Origen de una jugada»."),
    ]),
  S("mi-botas", "mister", { minAge: 17, clubTurns: [3, 400], notFlags: ["mi_botas"] }, "vestuario",
    "El míster lanza una bota contra la pared",
    "Ocurre tras una derrota ridícula: dos goles encajados en los últimos cinco minutos. El míster entra en el vestuario, mira a todos uno por uno, y, sin decir una palabra, coge una bota del suelo y la lanza contra la pared. Rebota, vuelve, y le da en la espinilla. Se agacha, con la cara contraída, y murmura: «Esto me ha dolido más a mí». El vestuario, sin saber si reír o llorar, aguanta la respiración.",
    [
      o("a", "Contener la risa y mostrarle apoyo", "Con respeto", { rel_entrenador: 4, reputacion: 2, moral: -1, flags: { mi_botas: "respeto" } }, "Te acercas y le ofreces una bolsa de hielo del botiquín. El míster te mira, cojea, y la acepta. «Esto no sale de aquí», dice. Cada vez que lo recuerdas, tienes que morderte el labio."),
      o("b", "Soltar una carcajada y que se contagie", "Reírte con ganas", { rel_vestuario: 6, moral: 4, rel_entrenador: -3, flags: { mi_botas: "risa" } }, "La risa corre por el vestuario como el fuego. El míster, rojo, se niega a sonreír durante diez segundos. Luego, sin remedio, se echa a reír. «Mañana entrenamos a las ocho», dice. Todos entienden que ha sido un perdón."),
      o("c", "Callarte y concentrarte en tu taquilla", "Pasar desapercibido", { moral: -1, flags: { mi_botas: "callo" } }, "Te agachas, te atas los cordones, y esperas a que pase. Cuando el míster sale del vestuario, un compañero susurra: «Vaya espectáculo». La sala, ya liberada, estalla en comentarios en voz baja."),
    ]),
  S("mi-confesion", "mister", { minAge: 19, clubTurns: [10, 400], rel: { entrenador: [60, 100] }, notFlags: ["mi_confesion"] }, "entrenamiento",
    "El míster te cuenta por qué se hizo entrenador",
    "Es una tarde de otoño, con el campo vacío y el silencio de los días en que hasta los focos parecen cansados. El míster se sienta contigo en el banquillo y, sin mirarte, empieza: «Yo no fui buen jugador. Tuve una lesión a los veintitrés y me retiré con una libreta en el bolsillo. Esa libreta es lo que soy hoy». Hace una pausa. «Te lo cuento porque tú sí lo eres. Y no quiero que lo desperdicies».",
    [
      o("a", "Escucharle y agradecérselo", "Un momento sagrado", { rel_entrenador: 8, moral: 7, reputacion: 3, flags: { mi_confesion: "escucho", mister_confidente: true } }, "Os quedáis una hora más. Te cuenta lo que le dolió, lo que aprendió, lo que le habría gustado oír de joven. «Ahora lo sabes», dice. Tú sientes que has crecido cinco años en una tarde."),
      o("b", "Contarle tus miedos de vuelta", "Abrirte", { rel_entrenador: 6, moral: 6, flags: { mi_confesion: "abro", mister_confidente: true } }, "Sin pensarlo, le cuentas lo que te asusta: no estar a la altura, defraudar a quien confía. El míster guarda un silencio largo. «Eso es lo que me gusta de ti», dice. «Que te importa»."),
    ]),
  S("mi-campamento", "mister", { minAge: 17, clubTurns: [3, 400], turn: [1, 2], notFlags: ["mi_campamento"] }, "entrenamiento",
    "La pretemporada en un pueblo sin cobertura, con el míster de cocinero",
    "El club ha alquilado un albergue rural a mil metros de altura, sin wifi, sin cobertura y con una cocina que solo funciona si le pegas un golpe. El míster, empeñado en «crear familia», ha decidido ser el cocinero. Hay lentejas a todas horas, un sistema de turnos para fregar y una chimenea donde, por las noches, se cuentan historias de miedo. El primer día, tres jugadores intentan huir.",
    [
      o("a", "Ofrecerte para ayudar en la cocina", "Mojarte", { rel_entrenador: 5, rel_vestuario: 4, forma: 1, flags: { mi_campamento: "cocina" } }, "Pasas la semana pelando patatas con el míster, que resulta ser un cocinero sorprendente. A la tercera noche, hace una paella que arranca aplausos. «Yo también tengo mis secretos», admite, con una sonrisa."),
      o("b", "Organizar un concurso de historias de miedo", "Animar las noches", { rel_vestuario: 7, moral: 5, flags: { mi_campamento: "historias" } }, "Tu historia, sobre un portero fantasma que atrapa balones desde el más allá, hace chillar al utillero. Al día siguiente, nadie quiere ir al baño solo. La leyenda del portero sigue contándose años después."),
      o("c", "Escaparte con dos compañeros al pueblo más cercano a por pan y cobertura", "Salirte del guion", { rel_vestuario: 4, rel_entrenador: -2, moral: 3, flags: { mi_campamento: "fuga" } }, "Camináis cuatro kilómetros cuesta abajo, compráis tres barras de pan y un tarro de mermelada, y volvéis con cara de héroes. El míster os recibe en la puerta: «Con razón». Y se come una rebanada a escondidas."),
    ]),
  S("mi-cumple-mister", "mister", { minAge: 17, clubTurns: [6, 400], notFlags: ["mi_cumple"] }, "vestuario",
    "El cumpleaños del míster, con una tarta gigante y un baile",
    "Se lo había prometido a sí mismo: no iba a decir nada. Pero el utillero se acordó de la fecha y, con ayuda del capitán, organizaron una sorpresa. A la hora del entrenamiento, todo el vestuario formó una fila con una tarta enorme en las manos y una pancarta que decía «Feliz cumple, jefe». El míster entró, vio la escena, se puso rojo y soltó: «Os mato».",
    [
      o("a", "Cantar con todos y hacerle un coro", "Participar", { rel_entrenador: 5, rel_vestuario: 5, moral: 5, flags: { mi_cumple: "canto" } }, "Cantáis tan mal que un vecino llama a la policía. El míster, con los ojos húmedos, aguanta la tarta de pie. «Gracias, de verdad», dice. Y esa semana, el entrenamiento es un cuarto de hora más corto."),
      o("b", "Hacerle un regalo personal en privado", "Un detalle íntimo", { rel_entrenador: 7, patrimonio: -60, moral: 3, flags: { mi_cumple: "regalo" } }, "Le regalas una libreta de tapa dura con una frase en la primera hoja: «Para las ideas». El míster la abre, la lee y la cierra despacio. Al día siguiente, la lleva en el bolsillo del chándal. No dice nada. No hace falta."),
      o("c", "Pasar del acto y llegar tarde al entrenamiento", "No ser sentimental", { rel_entrenador: -2, moral: 0, flags: { mi_cumple: "paso" } }, "Llegas tarde, con la tarta ya troceada. El míster te mira, no dice nada, y te guarda un pedazo en un tupper. Cuando te lo entrega, lo recibes con las orejas rojas."),
    ]),
  // ───── El club ─────
  S("cl-tercera-camiseta", "club", { minAge: 17, clubTurns: [3, 400], notFlags: ["cl_tercera"] }, "prensa",
    "El club presenta una tercera equipación horrorosa",
    "Es de un color que no existe en la naturaleza, mezcla de verde mostaza y rosa chicle, con un diseño de rayas que recuerda a una alfombra de abuela. El diseñador, con un moño enorme, la presenta como «una oda al espíritu del club». En el vestuario, el silencio es total. El utillero, que sabe que hay que lavarla, tiene lágrimas en los ojos.",
    [
      o("a", "Defenderla públicamente con valentía", "Ser el imagen", { fama: 3, rel_aficion: 3, reputacion: 2, moral: 2, flags: { cl_tercera: "defiendo" } }, "Posas con ella en la presentación, con una sonrisa que parece costarte la vida. En redes te llaman «el hombre que da la cara por un jersey». El diseñador te regala un cuadro enmarcado con el boceto."),
      o("b", "Hacer una broma sobre ella en redes", "Reírte de la situación", { fama: 5, rel_aficion: 4, moral: 4, reputacion: -1, flags: { cl_tercera: "broma" } }, "Subes una foto con la leyenda: «Me han vestido mi abuela y un estanque». Se hace viral. El club responde con un comunicado divertido. La camiseta, curiosamente, vende más que cualquier otra."),
      o("c", "Negarte a ponértela en el partido", "Plantarte", { rel_entrenador: -3, rel_aficion: 1, moral: 2, flags: { cl_tercera: "rechazo" } }, "El míster, con cara de funeral, te dice que no hay alternativa. Te la pones. Marcas ese día. En el festejo, un compañero te susurra: «Hasta los goles quedan peor». Y tiene razón."),
    ]),
  S("cl-presidente-cena", "club", { minAge: 18, fama: [40, 100], clubTurns: [6, 400], notFlags: ["cl_cena_pres"] }, "vida",
    "El presidente te invita a una cena «sin compromiso»",
    "Es en un reservado de un restaurante con mantel de lino y camareros que andan de puntillas. El presidente, con una servilleta atada al cuello, te pregunta por tu familia, por tu infancia y por tu opinión sobre el club. Cada pregunta parece la antesala de otra. Al llegar el postre, saca un papel doblado: «Es solo una idea, no hace falta que decidas hoy».",
    [
      o("a", "Escuchar y pedir tiempo para pensarlo", "Con calma", { rel_representante: 2, reputacion: 3, moral: 1, flags: { cl_cena_pres: "tiempo" } }, "El papel es una propuesta de renovación con una cláusula especial: «El club te construirá una estatua si ganas tres títulos». Tu agente, al verla, no sabe si reír. «Vamos a negociar la estatua», dice."),
      o("b", "Aceptar sin leer: «Con ustedes, lo que haga falta»", "Un acto de fe", { rel_aficion: 5, rel_representante: -3, moral: 4, flags: { cl_cena_pres: "fe" } }, "Firmas sin mirar. Tu agente, al enterarse, se pone blanco. El contrato es bueno, pero no tanto como podría haber sido. Lo aprendes: a veces el cariño es caro."),
      o("c", "Declinar con elegancia y hablar con tu agente primero", "Con cabeza", { rel_representante: 4, reputacion: 3, flags: { cl_cena_pres: "agente" } }, "El presidente te mira con una sonrisa que no llega a los ojos. «Un jugador prudente —dice—. Me gusta». A los dos días, tu agente negocia una mejora del 20 %. El presidente aguanta con deportividad."),
    ]),
  S("cl-estadio-obras", "club", { minAge: 17, clubTurns: [4, 400], clubLevels: ["grande", "europeo", "modesto"], notFlags: ["cl_obras"] }, "vida",
    "Las obras del estadio te dejan sin vestuario de local",
    "Una reforma que iba a durar tres meses se ha convertido en un laberinto de grúas, polvo y pasillos clausurados. Esta semana, el club os ha reubicado en un contenedor prefabricado detrás de la grada, con calefacción dudosa y una ducha que solo funciona si tocas la pared. El capitán, con una gorra y botas de agua, resume la situación: «Esto es el paraíso». Hay una gotera sobre tu taquilla.",
    [
      o("a", "Tomártelo como una aventura y animar al grupo", "Con humor", { rel_vestuario: 6, moral: 5, flags: { cl_obras: "humor" } }, "Cuelgas un cartel en la puerta del contenedor: «Hotel Cinco Estrellas (casi)». El vestuario lo adopta como seña de identidad. Ese año, jugáis mejor en casa que nunca: «Es por el contenedor», dice el utillero."),
      o("b", "Quejarte en voz alta ante el club", "Reclamar", { rel_entrenador: 1, rel_vestuario: 2, rel_aficion: -1, flags: { cl_obras: "quejo" } }, "Tu queja llega al departamento de obras. Aparecen dos operarios con una escalera y una cara de resignación. La gotera se arregla; la ducha, no. «Cosas del progreso», murmuran."),
      o("c", "Llevarte unas botas de agua y una bolsa para la ducha", "Adaptarte", { moral: 3, forma: 1, flags: { cl_obras: "adapto" } }, "Vas preparado: botas, gorro, toalla extra. A la semana, todo el equipo copia tu equipo. «El genio de la adaptación», te llaman. Tu taquilla, con paraguas, es la mejor del contenedor."),
    ]),
];
