/**
 * El vestuario, otra vez: veinte tíos, mil manías. Aquí van las bromas pesadas, el amigo invisible
 * que acaba mal, el compañero que se queda solo, el capitán que se enfada. Con consecuencias:
 * lo que pasa en el vestuario no se queda en el vestuario, se queda en la memoria de todos.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const VESTUARIO2: BankScene[] = [
  S("v2-amigo-invisible", "vestuario", { minAge: 17, clubTurns: [2, 400], turn: [4, 6], notFlags: ["v2_amigo_inv"] }, "vestuario",
    "El amigo invisible del vestuario sale mal",
    "Hay un sombrero con veinticinco papelitos y una norma: regalo de menos de veinte euros. Te toca el portero suplente, el más callado del equipo, el que nunca cuenta nada. Alguien, desde el fondo, grita: «¡Que no le toque algo soso!». Te sudan las manos. Los demás ya han empezado a envolver, con papel de periódico, con papel de regalo y hasta con papel higiénico.",
    [
      o("a", "Regalarle algo personal: un libro que le gustaría de verdad", "Acertar de verdad", { rel_vestuario: 6, moral: 4, reputacion: 2, flags: { v2_amigo_inv: "personal" } }, "Averiguas, por una conversación de pasillo, que le encanta la novela negra. Le regalas una edición vieja con una dedicatoria. El portero se queda mudo. Esa noche, te manda un mensaje: «Nadie me había regalado algo pensando en mí»."),
      o("b", "Hacer una broma pesada con un regalo gracioso", "Reírte con él", { rel_vestuario: 3, moral: 3, flags: { v2_amigo_inv: "broma" } }, "Le regalas un par de guantes de portero de tres tallas más grandes, con una nota: «Para que no se te escape ninguna». Se ríe tanto que llora. Dos semanas después, los usa en un entrenamiento. Y le quedan bien."),
      o("c", "Comprar lo primero que veas y envolverlo con prisa", "Salir del paso", { rel_vestuario: -1, moral: -1, flags: { v2_amigo_inv: "prisa" } }, "Le regalas una taza de souvenir de una gasolinera. El portero la mira, la gira, y dice con cortesía: «Gracias». Esa tarde, la veis en la basura. Nadie lo comenta, pero todos lo vieron."),
    ]),
  S("v2-silencio", "vestuario", { minAge: 17, clubTurns: [3, 400], notFlags: ["v2_silencio"] }, "vestuario",
    "Un compañero se ha quedado muy callado",
    "Lo notas en el rondo, en las comidas y en el autobús: Joaquín, el lateral de siempre, ya no hace chistes. Llega con ojeras, entrena sin chispa, y cuando alguien le habla, contesta con monosílabos. Nadie dice nada, todos lo ven. En la ducha, escuchas cómo habla por teléfono, en voz muy baja, con alguien que parece decirle que no.",
    [
      o("a", "Acercarte a él y proponerle tomar algo", "Preguntar", { rel_vestuario: 5, moral: 3, reputacion: 3, flags: { v2_silencio: "ayuda" } }, "Os sentáis en un bar de la esquina. Tarda diez minutos en hablar. Lo que dice es duro: su madre está enferma y él no se atreve a pedir días. Le acompañas a hablar con el míster. El permiso llega en una hora."),
      o("b", "Dejar que sea él quien venga a ti", "Respetar su espacio", { moral: 0, flags: { v2_silencio: "espera" } }, "Pasa una semana. Una tarde, Joaquín se acerca y dice: «Gracias por no preguntar». Te cuenta lo que le pasa con una voz muy pequeña. No hace falta que hables: solo que escuches."),
      o("c", "Ignorarlo: cada uno tiene sus problemas", "Evitar el tema", { moral: -2, reputacion: -2, flags: { v2_silencio: "ignoro" } }, "Pasa un mes. Un día, Joaquín no viene a entrenar. Se sabe que ha pedido la baja. En la taquilla vacía alguien deja un post-it: «Perdón por no estar atentos». Es el tuyo."),
    ]),
  S("v2-silencio-vuelve", "vestuario", { after: [after("v2-silencio", "a", 10, 80)], minAge: 20 }, "vestuario",
    "Joaquín te devuelve el favor",
    "Meses después, te lo encuentras en el pasillo con una sonrisa que no le veías hacía tiempo. Su madre está mejor, le han renovado y ha vuelto a jugar como antes. Te pasa una bolsa de papel con un jamón entero: «Es del pueblo. Es un jamón de los que no se regalan». Y añade, bajito: «Esta temporada, lo que necesites, aquí me tienes».",
    [
      o("a", "Aceptar el jamón y compartirlo con todo el vestuario", "Compartir", { rel_vestuario: 7, moral: 6, reputacion: 3, flags: { joaquin_amigo: true } }, "Lo cortáis en el vestuario con un cuchillo de cocina y una navaja del utillero. Joaquín, de pie, mira cómo todos devoran el jamón. «Lo que más me gusta —dice— es esto»."),
      o("b", "Rechazarlo con cariño: «Cuídate tú»", "No hacía falta", { rel_vestuario: 3, reputacion: 2, moral: 3, flags: { joaquin_amigo: true } }, "Insistes en que no. Él insiste más. Acabáis cediendo los dos: te quedas con media pata y le regalas un abrazo. «El mejor del vestuario», murmura. Se lo has oído decir a otros, pero a ti te suena distinto."),
    ]),
  S("v2-capitan-bronca", "vestuario", { minAge: 19, clubTurns: [4, 400], roles: ["titular", "rotacion"], notFlags: ["v2_bronca_cap"] }, "vestuario",
    "El capitán te echa una bronca delante de todos",
    "Ha sido después de una derrota amarga, con el vestuario callado y el ambiente espeso. Se ha levantado, te ha señalado y ha dicho, con una voz que se ha oído en el pasillo: «Estás jugando para ti, no para el equipo». Los demás han bajado la mirada. Tú sientes cómo te sube la sangre por el cuello, pero también una duda: ¿y si tiene razón?",
    [
      o("a", "Aceptar la crítica y pedir perdón al grupo", "Tragarte el orgullo", { rel_vestuario: 5, reputacion: 3, moral: -2, flags: { v2_bronca_cap: "acepto" } }, "Te levantas y dices: «Tienes razón. Voy a mejorar». El capitán se queda parado. Esperaba una pelea. Al salir del vestuario, te da una palmada en la espalda: «Lo he dicho porque creo en ti»."),
      o("b", "Contestarle con firmeza, delante de todos", "Plantar cara", { rel_vestuario: -3, moral: 2, rel_entrenador: -1, flags: { v2_bronca_cap: "planto" } }, "Dices que juegas como te piden. El capitán da un paso adelante, el míster intercede y el vestuario queda dividido. En el aparcamiento, nadie se habla. Al día siguiente, hay un silencio que pesa."),
      o("c", "Responder en el campo: jugar para el equipo en el siguiente partido", "Callar y cumplir", { forma: 2, rel_vestuario: 3, rel_entrenador: 2, moral: 1, flags: { v2_bronca_cap: "respondo" } }, "No dices ni una palabra. Pero el domingo corres más que nadie y das tres asistencias. Al final, el capitán te abraza en el túnel. «Ahora sí», dice. Y tú entiendes que era una prueba."),
    ]),
  S("v2-cumple-sorpresa", "vestuario", { minAge: 16, clubTurns: [2, 400], notFlags: ["v2_cumple"] }, "vestuario",
    "Tu cumpleaños, con una sorpresa que no esperabas",
    "Te despiertas pensando que nadie se ha acordado. Llegas al entrenamiento con cara de pocos amigos y, cuando entras al vestuario, se apagan las luces. Veinte voces cantan, un balón flota en el aire con una vela pegada y el utillero sostiene una tarta que dice, en letras torcidas: «Felicidades, crack (de pega)». Detrás, tu madre, a la que han traído a escondidas.",
    [
      o("a", "Abrazar a tu madre antes que a nadie", "Lo primero, lo primero", { moral: 10, rel_vestuario: 4, reputacion: 2, flags: { v2_cumple: "madre" } }, "Le das un abrazo largo, con los ojos cerrados. Tu madre dice: «Te han tratado muy bien». Tú contestas: «Me han tratado como a un hijo». El vestuario aplaude con un cariño que se nota en el aire."),
      o("b", "Hacer un discurso corto lleno de bromas", "Brillar", { moral: 6, rel_vestuario: 5, fama: 1, flags: { v2_cumple: "discurso" } }, "Dices que no te lo mereces, que has jugado fatal, que el míster tenía razón en todo. El vestuario te abuchea de broma. Terminas el discurso con un «os quiero». Se hace un silencio. Luego, todos a comer tarta."),
      o("c", "Pedir que corten la tarta enseguida: hay entrenamiento", "Profesional hasta en esto", { rel_entrenador: 2, moral: 2, flags: { v2_cumple: "tarta" } }, "El míster levanta una ceja, sonríe y dice: «Bien, hijo, pero a las doce estás en el campo». Todos comen tarta de pie, con el chándal puesto. Es el cumpleaños más rápido y más bonito que has tenido."),
    ]),
  S("v2-viaje-dubai", "vestuario", { minAge: 19, patrimonio: [3000, 100000000], clubTurns: [4, 400], turn: [9, 10], notFlags: ["v2_viaje"] }, "vestuario",
    "El vestuario organiza un viaje de fin de temporada",
    "Es la tradición de los equipos con más dinero que sentido común: una semana en una isla con hotel, jet-ski y una cena en la que no se pregunta cuánto cuesta. Los veteranos ya lo han planeado todo. El capitán te mira y dice: «Todo el que no venga se queda sin sentido del humor». Tu agente, por teléfono, murmura: «Ten cuidado con las fotos».",
    [
      o("a", "Apuntarte y disfrutar al máximo", "Vivirlo", { patrimonio: -1500, moral: 8, rel_vestuario: 7, reputacion: -1, flags: { v2_viaje: "voy" } }, "La semana es una locura: jet-ski, cena con langosta, un compañero que se cae al agua con el móvil, tres canciones de karaoke en idiomas diferentes. Vuelves con el pelo salado y el corazón lleno."),
      o("b", "Ir pero con cabeza: sin pasarte y pendiente de las cámaras", "Con prudencia", { patrimonio: -1000, moral: 5, rel_vestuario: 4, reputacion: 2, flags: { v2_viaje: "prudente" } }, "Te portas bien. A la vuelta, un periodista publica unas fotos de tus compañeros haciendo tonterías. Tú sales, discreto, con un refresco. Tu agente te escribe: «Esta vez, bien»."),
      o("c", "No ir y descansar en casa", "Prioridad: descanso", { forma: 3, moral: 1, rel_vestuario: -4, flags: { v2_viaje: "no" } }, "Te quedas a descansar. Cuando regresan, bronceados y de buen humor, hay bromas internas que no entiendes. Un compañero te cuenta: «Te echamos de menos». Y tú sabes que se queda corto."),
    ]),
  S("v2-musica", "vestuario", { minAge: 16, clubTurns: [2, 400], notFlags: ["v2_musica"] }, "vestuario",
    "Guerra por la lista de reproducción del vestuario",
    "Dos bandos: los de reguetón y los de rock. Cada uno tiene un altavoz, un líder y una causa. El utillero ha instalado un sistema de turnos que no cumple nadie. Esta mañana, a las ocho y diez, tres canciones se solapan en el pasillo: una sobre un amor roto, otra sobre una moto y una tercera sobre el poder de la lluvia. El míster, desde su despacho, grita: «¡Parad ya!».",
    [
      o("a", "Proponer un sistema: un día cada bando", "Mediar", { rel_vestuario: 5, reputacion: 2, moral: 3, flags: { v2_musica: "mediador" } }, "Presentas la solución en un papel pegado en la puerta. Se cumple durante dos semanas. Al tercer día de rock, descubres a los de reguetón tarareando a escondidas. Todo es posible."),
      o("b", "Pasarte a tu propio altavoz con una lista distinta", "Meter tu música", { rel_vestuario: -1, moral: 2, fama: 1, flags: { v2_musica: "tercera" } }, "Pones clásica española, de tu abuelo. Primero se ríen; luego, al tercer día, preguntan qué canción es. Algo se ha roto en la guerra: ya hay una tercera vía."),
      o("c", "Ponerte auriculares y esperar a que acabe", "Aislarte", { moral: 1, flags: { v2_musica: "aislado" } }, "Te pones los cascos y te desconectas. La guerra dura un mes. Un día, con los auriculares puestos, te enteras de que los dos bandos han hecho las paces. Habéis ganado todos. Tú, además, has perdido la mejor parte de la bronca."),
    ]),
  S("v2-cena-equipo", "vestuario", { minAge: 17, clubTurns: [2, 400], turn: [3, 8], notFlags: ["v2_cena"] }, "vestuario",
    "La cena de equipo en un restaurante muy raro",
    "El capitán ha reservado un restaurante «con experiencia»: los platos llegan en cajas de zapatos, el vino se sirve en probetas y el camarero habla en verso. El primer plato es una espuma de algo que nadie identifica. En la mesa, los más jóvenes se miran. El míster, serio, prueba un bocado con cara de científico. Nadie dice nada.",
    [
      o("a", "Probarlo todo con entusiasmo y comentar cada plato", "Entregarte", { rel_vestuario: 4, moral: 4, flags: { v2_cena: "entrega" } }, "Declaras que la espuma sabe «a un recuerdo de mi abuela». El camarero te hace una reverencia. El vestuario estalla en carcajadas. Acabáis pidiendo, de postre, tres bocadillos de jamón a un repartidor."),
      o("b", "Pedir en voz baja una hamburguesa a escondidas", "Sobrevivir", { rel_vestuario: 2, moral: 2, flags: { v2_cena: "hamburguesa" } }, "Llega a la puerta trasera una hamburguesa de cinco euros. La compartís entre seis, escondidos tras una cortina. El capitán se asoma, os ve, y se une. «Esto sí es una experiencia», dice."),
      o("c", "Contar el chiste del vino en probeta que llevas preparado", "Hacer reír", { rel_vestuario: 5, fama: 1, moral: 3, flags: { v2_cena: "chiste" } }, "El chiste es malísimo. Os reís igualmente. Al final de la cena, el míster levanta su probeta: «Por el chiste más malo de la temporada». Es, probablemente, la frase más cálida que te ha dicho."),
    ]),
  S("v2-rival-interno", "vestuario", { minAge: 17, roles: ["rotacion", "suplente"], clubTurns: [4, 400], notFlags: ["v2_rival_int"] }, "vestuario",
    "Dos compañeros del mismo puesto se pelean por el hueco… y tú estás en medio",
    "Ocurre cada temporada en todos los clubes: dos jugadores de la misma posición que se miran de reojo y se hablan solo por obligación. Esta vez, el conflicto se ha desbordado: han tenido una discusión feroz en la zona de duchas. Uno de ellos, el que te cae mejor, te busca con la mirada. «Tú vas a estar de mi lado, ¿verdad?», parece preguntar.",
    [
      o("a", "Mediar entre los dos y pedirles que se escuchen", "Hacer de puente", { rel_vestuario: 5, reputacion: 4, moral: 2, flags: { v2_rival_int: "mediador" } }, "Los sientas a los dos en un banco con un café cada uno. «Nadie se va», dices. Tardan una hora en reconciliarse, pero acaban abrazados. El míster, desde lejos, hace como que no ve nada."),
      o("b", "Ponerte del lado del amigo", "Elegir bando", { rel_vestuario: -2, moral: 1, flags: { v2_rival_int: "bando" } }, "Defiendes a tu amigo en público. El otro lo vive como una traición. Durante meses, el vestuario es un campo de minas: nadie se atreve a pisar donde no debe."),
      o("c", "Mantenerte al margen y no tomar partido", "Suiza", { moral: 0, reputacion: 1, flags: { v2_rival_int: "neutral" } }, "Te quedas fuera. Ambos te lo agradecen por separado. Pero a la larga, se dice que «el de la taquilla 11 nunca se moja». Hay veces que no mojarse también cuesta."),
    ]),
  S("v2-portero-sorpresa", "vestuario", { minAge: 17, positions: ["Delantero", "Centrocampista", "Defensa"], clubTurns: [3, 400], notFlags: ["v2_portero"] }, "entrenamiento",
    "El míster te pone de portero en el rondo de castigo",
    "Es una tradición cruel: quien pierde el último rondo se pone bajo los palos mientras el resto lanza penaltis. Hoy te toca a ti. Llevas unos guantes que te vienen enormes, un peto de portero que huele a otro siglo y una expresión de dignidad tambaleante. En la fila, tus compañeros afilan las botas con sonrisas torcidas.",
    [
      r("a", "Tirarte con todo a cada balón, sin rendirte", "Entregarte", 0.4, "Paras dos penaltis. El segundo, de espaldas, con la cara. El vestuario ruge. El portero titular, a un lado, se lleva las manos a la cabeza: «Me quitas el sueldo». Te llaman «el portero de la casa» durante toda la temporada.", { rel_vestuario: 6, moral: 7, fama: 1, flags: { v2_portero: "heroe" } }, "Recibes seis goles seguidos. Uno de ellos te rebota en la cara y entra. El vestuario, que no puede dejar de reírse, te hace una ovación de pie. Tú, dolorido y feliz, saludas.", { rel_vestuario: 4, moral: 3, flags: { v2_portero: "comico" } }, "forma"),
      o("b", "Negociar un cambio de castigo", "Una salida diplomática", { rel_vestuario: -1, moral: 0, flags: { v2_portero: "negocia" } }, "Ofreces pagar el café del vestuario durante una semana. El capitán lo estudia. «Aceptado, pero también te quedas con el peto». Te lo quedas, y lo guardas como recuerdo."),
    ]),
  S("v2-guante-herencia", "vestuario", { after: [after("v2-portero-sorpresa", undefined, 5, 40)], minAge: 20 }, "vestuario",
    "El portero te regala un guante, en broma, para tu cumpleaños",
    "Es un guante izquierdo, enorme, desgastado, con el pulgar roto. Lo envuelve con papel de periódico y te lo entrega con una voz grave: «Para el portero que nunca fue». Lleva escrito con rotulador: «Paradas: 2. Goles encajados: 6». En la parte de atrás, la firma de todo el vestuario. Es un regalo horrible y precioso.",
    [
      o("a", "Colgarlo en la pared de tu casa", "Honrarlo", { moral: 6, rel_vestuario: 4, reputacion: 2 }, "Lo enmarcas junto a las camisetas de la infancia. Cada vez que alguien entra en tu casa, pregunta: «¿Y esto?». «Es mi mejor momento como portero», dices. Y te ríes."),
      o("b", "Devolvérselo con otro regalo igual de absurdo", "Contraatacar", { moral: 5, rel_vestuario: 5, patrimonio: -40 }, "Le regalas un balón pinchado dedicado: «Para el delantero que nunca fue». Se establece una tradición: cada año, el regalo viaja de taquilla en taquilla, con una nota nueva cada vez."),
    ]),
  S("v2-regalo-mister", "vestuario", { minAge: 18, clubTurns: [6, 400], turn: [5, 6], notFlags: ["v2_regalo_mis"] }, "vestuario",
    "Qué regalarle al míster por Navidad",
    "Es una cuestión de Estado: el míster, serio, estricto, de cara de pocos amigos, acaba el año y el vestuario debe regalarle algo. Alguien propone una corbata. Alguien más, un reloj. Un tercero, que lleva doce años en el club, sugiere: «Un libro de poemas». El capitán te mira: «Tú que eres de los que hablan con él… ¿qué le gusta?».",
    [
      o("a", "Proponer algo personal: un cuadro con la foto del primer equipo", "Algo con alma", { rel_entrenador: 6, rel_vestuario: 3, patrimonio: -100, flags: { v2_regalo_mis: "cuadro" } }, "El cuadro se entrega en la cena, envuelto en papel de estraza. El míster lo abre, lo mira en silencio y se aclara la garganta tres veces. Lo cuelga en su despacho el día siguiente, con una chincheta de cada color."),
      o("b", "Proponer algo gracioso: un silbato de oro de plástico", "Tomar el pelo con cariño", { rel_entrenador: 3, rel_vestuario: 5, moral: 3, flags: { v2_regalo_mis: "silbato" } }, "El míster abre el regalo, ve el silbato y levanta una ceja. Luego, para sorpresa de todos, lo hace sonar con tres pitidos cortos. «Esto nunca lo voy a usar —dice—. Pero lo voy a guardar para siempre»."),
      o("c", "No meterte en el asunto: que lo decidan otros", "Dejarlo pasar", { rel_vestuario: -1, moral: 0, flags: { v2_regalo_mis: "paso" } }, "Se decide por una corbata. El míster la agradece con cortesía, y nunca se la pone. En el despacho, hay una fotografía vuestra que sí cuelga, y no sabes si fue por tu consejo o por su cuenta."),
    ]),
  S("v2-cambio-numero", "vestuario", { minAge: 17, clubTurns: [4, 400], notFlags: ["v2_dorsal"] }, "vestuario",
    "Un veterano te pide tu dorsal",
    "Es el 10, el de toda la vida. Lo lleva desde que debutó, hace quince años, pero esta temporada el club le ha quitado el dorsal «por reestructuración», y él, con la voz rota, te lo pide: «Necesito ese número. Es el de mi hijo, que nació el día de mi debut». Tú llevas ese 10 desde hace tres meses y es la primera vez que sientes que algo es tuyo.",
    [
      o("a", "Cedérselo sin pedir nada a cambio", "Un gesto de grandeza", { moral: -2, rel_vestuario: 8, reputacion: 6, flags: { v2_dorsal: "cedido" } }, "Se lo das con un abrazo. El veterano llora en silencio; la grada, que lo sabe, os ovaciona cuando salís al campo. Tú, con tu nuevo número, juegas como si llevaras el viento a favor."),
      o("b", "Proponerle que lo compartáis: él en la liga, tú en las copas", "Una solución creativa", { rel_vestuario: 5, reputacion: 3, moral: 2, flags: { v2_dorsal: "compartido" } }, "El club se lo piensa, con una expresión muy seria, y finalmente lo autoriza. Aquel año, el 10 cambia de espalda según la competición. Los periodistas lo llaman «el dorsal de dos»."),
      o("c", "Negarte: te lo has ganado y es tuyo", "Defender lo tuyo", { moral: 2, rel_vestuario: -4, reputacion: -2, flags: { v2_dorsal: "no" } }, "Se lo explicas con respeto. El veterano asiente, pero te mira con una dureza nueva. No hay bronca, no hay discusión. Pero ya nunca te pasa el balón con la misma alegría."),
    ]),
];
