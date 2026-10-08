/**
 * Lo que vives según el sitio que ocupas en el equipo: el suplente que se convierte en el alma del
 * banquillo, el apartado que entrena solo, el titular indiscutible al que le piden más, el de
 * rotación que no sabe si juega. Cada rol tiene sus escenas y sus consecuencias en minutos y ánimo.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const ROLES: BankScene[] = [
  S("rl-banquillo-alma", "rol", { roles: ["suplente"], minAge: 17, clubTurns: [4, 400], notFlags: ["rl_banquillo"] }, "vestuario",
    "Sin jugar, te conviertes en el alma del banquillo",
    "Llevas un mes sin minutos. Cada domingo, te sientas en el banquillo con la tableta de vídeo, el peto y las rodillas apretadas. Pero algo empieza a cambiar: celebras los goles como si los hubieras marcado tú, animas a los cambios con palmadas, haces chistes entre cuarto y cuarto. El capitán, al verlo, murmura: «Este chaval tiene una energía que no se compra». Te das cuenta de que te hace bien.",
    [
      o("a", "Asumir ese papel con orgullo y cuidar del ambiente", "Ser el pegamento", { moral: 5, rel_vestuario: 7, rel_entrenador: 3, flags: { rl_banquillo: "alma" } }, "El míster, a final de temporada, te lo reconoce: «Sin gente como tú, el vestuario se rompe». Te renueva con una mejora. No juegas más, pero juegas un papel que importa. Y lo sabes."),
      o("b", "Seguir entrenando como si fueras a jugar el domingo", "Seguir peleando", { forma: 3, rel_entrenador: 2, moral: 1, flags: { rl_banquillo: "pelea" } }, "Cada sesión, la das como si fuera la última. Un día, un compañero se lesiona y te toca. Estás tan preparado que, en veinte minutos, marcas. El míster, sin mirar, apunta tu nombre en la libreta."),
      o("c", "Pedir cuentas al míster por qué no juegas", "Exigir claridad", { rel_entrenador: -3, moral: 2, flags: { rl_banquillo: "exijo" } }, "El míster, de brazos cruzados, te explica sin adornos: «Porque el de tu posición está mejor hoy. Mañana, no lo sé». No es lo que querías oír. Pero al menos, ya no tienes dudas."),
    ]),
  S("rl-apartado-solo", "rol", { roles: ["apartado"], minAge: 17, clubTurns: [4, 400], notFlags: ["rl_apartado"] }, "entrenamiento",
    "Te apartan del grupo y entrenas solo en la otra punta del campo",
    "No hay comunicado, ni explicación. Lunes por la mañana, el míster te dice: «Entrenas aparte». Te asignan un fisio, un saco de balones y una portería sin red. Desde tu rincón, ves a tus compañeros correr, reír, discutir. La nube de polvo del grupo llega hasta ti. Un chaval del filial, que pasa con una bolsa, murmura: «Qué dura es la vida, ¿eh?».",
    [
      o("a", "Entrenar con una disciplina de monje y esperar la oportunidad", "Trabajar en silencio", { forma: 4, moral: -2, rel_entrenador: 2, flags: { rl_apartado: "monje" } }, "Haces tandas de tiros, ejercicios de control, circuitos de piernas. A las seis semanas, el fisio, sorprendido, te dice: «Estás mejor que nunca». Una tarde, el míster te llama a su despacho: «Vuelves al grupo»."),
      o("b", "Hablar con el míster y ofrecerte a ayudar de otras formas", "Ser útil", { rel_entrenador: 4, reputacion: 4, moral: 1, flags: { rl_apartado: "util" } }, "Le propones ayudar con los chavales del filial. El míster, sorprendido, accede. Pasas las tardes enseñando a canteranos. Al cabo de un mes, el míster te mira con respeto distinto: «Me has sorprendido»."),
      o("c", "Pedir a tu agente que busque una cesión o una salida", "Buscar salida", { rel_representante: 3, moral: -1, flags: { rl_apartado: "salida", quiere_salir: true } }, "Tu agente se pone a trabajar. A las dos semanas, hay tres ofertas sobre la mesa. El míster, al enterarse, te dedica una mirada que no sabes interpretar. A veces, un movimiento brusco abre las puertas, y a veces las cierra."),
    ]),
  S("rl-titular-peso", "rol", { roles: ["titular"], minAge: 19, media: [72, 99], clubTurns: [6, 400], notFlags: ["rl_titular_peso"] }, "prensa",
    "Eres titular indiscutible y cada partido pesa el doble",
    "Los medios lo repiten: «El equipo depende de él». Tu ausencia en un entrenamiento por un catarro ocupa tres titulares. Los compañeros te miran con una mezcla de respeto y carga: «Si tú fallas, nos caemos». En el vestuario, el capitán te agarra el hombro: «Respira. Tú haz lo tuyo». Te ríes. Pero por dentro, notas que la responsabilidad empieza a ser un traje demasiado ajustado.",
    [
      o("a", "Hablar con el míster y pedirle que reparta el peso entre todos", "Compartir la carga", { rel_entrenador: 3, rel_vestuario: 5, moral: 3, flags: { rl_titular_peso: "comparto" } }, "El míster lo estudia. A la semana, ensaya un sistema donde otros asumen más protagonismo. En el siguiente partido, ganáis 3-0 con goles de tres jugadores distintos. Respiras. «Esto es un equipo», dices."),
      o("b", "Asumir el peso con orgullo y convertirte en líder", "Cargar con ello", { forma: 1, moral: 3, rel_vestuario: 4, reputacion: 4, flags: { rl_titular_peso: "lider" } }, "Te pones el equipo a la espalda. Hay partidos que ganas casi solo. Otros, no. Pero cada domingo, la gente te mira con un respeto distinto. Y tú, aprendes a convivir con el peso."),
      o("c", "Pedir ayuda al psicólogo del club para manejar la presión", "Cuidar la cabeza", { moral: 5, forma: 2, reputacion: 2, flags: { rl_titular_peso: "psico", terapia: true } }, "Tres sesiones con la psicóloga. Te enseña a separar el partido del resultado, la persona del jugador. A las dos semanas, juegas con una ligereza que no tenías. El vestuario lo nota: «Estás distinto»."),
    ]),
  S("rl-rotacion-duda", "rol", { roles: ["rotacion"], minAge: 17, clubTurns: [4, 400], notFlags: ["rl_rotacion"] }, "vestuario",
    "Nunca sabes si jugarás el domingo y empiezas a vivir con ansiedad",
    "Cada jueves, a las doce, el míster revela la alineación. Cada jueves, notas cómo se te acelera el pulso. Un día juegas noventa minutos; otro, cinco. Los compañeros bromean: «¿Te lo ha dicho la bola de cristal?». Tu familia pregunta si eres titular. «Depende», respondes. Esa palabra se te ha convertido en una piedra. En el espejo, empiezas a ver a un jugador que mira siempre hacia el banquillo.",
    [
      o("a", "Hablar con el míster y preguntarle qué necesita de ti para ser titular", "Pedir claridad", { rel_entrenador: 4, moral: 3, flags: { rl_rotacion: "pregunto" } }, "El míster te dice tres cosas: más intensidad sin balón, más lectura en el repliegue, más voz. Las anotas. A las tres semanas, empiezas a jugar más. «Esto es lo que quería»."),
      o("b", "Aceptar el rol de rotación y preparar cada partido como si fuera el único", "Convertirlo en virtud", { forma: 2, moral: 2, rel_entrenador: 2, flags: { rl_rotacion: "acepto" } }, "Te conviertes en el jugador al que se llama cuando hay que cambiar un partido. A los dos meses, el míster te dice: «Tú eres mi comodín». Es un puesto que nadie quería y tú has hecho tuyo."),
      o("c", "Dejarte llevar por la ansiedad y obsesionarte con los minutos", "Agobiarte", { moral: -4, forma: -1, rel_vestuario: -1, flags: { rl_rotacion: "agobio" } }, "Cuentas cada minuto. Tus compañeros se dan cuenta. Un día, el capitán te sienta en un banco: «Tienes que soltarlo, o te comerá». Aceptas el consejo. Pero cuesta."),
    ]),
  S("rl-capitan-candidato", "rol", { roles: ["titular"], minAge: 22, clubTurns: [10, 400], notFlags: ["rl_cap_cand", "capitan_equipo"] }, "vestuario",
    "El vestuario te propone como próximo capitán, y el actual no lo lleva bien",
    "Es un rumor que corre por los pasillos: «El nuevo capitán eres tú». Algunos compañeros te lo dicen con cariño; otros, con prudencia. El capitán actual, un veterano de treinta y seis años, te mira un día con una media sonrisa: «Me han dicho que me vas a quitar el puesto». Te quedas sin habla. Sabes que no es una amenaza: es una prueba.",
    [
      o("a", "Decirle que lo respetas y que no aceptarás nada sin su visto bueno", "Ir con respeto", { rel_vestuario: 6, reputacion: 5, moral: 3, flags: { rl_cap_cand: "respeto" } }, "El veterano, emocionado, te abraza. «Si te toca a ti, será un honor», dice. Meses después, en su despedida, te entrega el brazalete en el túnel. Es un gesto que se recordará durante años."),
      o("b", "Aceptar la propuesta del vestuario y hablar con el míster", "Dar el paso", { moral: 4, rel_entrenador: 3, rel_vestuario: 3, flags: { rl_cap_cand: "acepto" } }, "El míster te escucha en silencio. «Es una decisión compartida», dice. A los dos días, el capitán actual y tú os sentáis a hablar. La transición, aunque tensa, se hace con dignidad."),
      o("c", "Pedir que lo dejen para más adelante: no es tu momento", "Declinar con humildad", { reputacion: 3, rel_vestuario: 2, moral: 1, flags: { rl_cap_cand: "no" } }, "Les dices que aún te queda aprender. El vestuario lo respeta. El veterano, al oírlo, sonríe: «Eso es lo que hace un capitán de verdad». Dos años después, el brazalete llegará solo."),
    ]),
  S("rl-regreso-titular", "rol", { roles: ["titular"], after: [after("rl-banquillo-alma", "a", 8, 60)], minAge: 17 }, "partido",
    "Un día el míster te llama para jugar de titular tras meses en el banquillo",
    "Lo dice con un tono casual, en el desayuno, mientras unta una tostada: «Hoy sales de inicio». Te quedas mirando la mesa. Los compañeros, al oírlo, hacen silencio. El utillero, desde la barra, levanta el pulgar. Tras tantos domingos sentado, te ves en el calentamiento con el pulso a mil. En el túnel, el capitán te agarra el hombro: «Estás listo».",
    [
      r("a", "Salir a darlo todo desde el primer minuto", "Aprovechar la oportunidad", 0.55, "Marcas a los veinte minutos y das una asistencia en el segundo tiempo. El míster, desde la banda, aplaude con una sonrisa. Al acabar, te señala con el dedo: «Esto es lo que queríamos». El vestuario te lanza al aire en una manta.", { moral: 10, rel_entrenador: 5, rel_vestuario: 5, forma: 2, flags: { rl_regreso: "bien" } }, "El partido es un desastre: fallas dos pases, pierdes un balón en el medio y concedes un gol. El míster, tras el partido, te dice: «Mañana, otra vez a entrenar». No es un reproche. Pero duele.", { moral: -4, rel_entrenador: -1, flags: { rl_regreso: "mal" } }, "forma"),
      o("b", "Jugar con prudencia y no complicarte", "Cuidar los básicos", { moral: 4, rel_entrenador: 3, flags: { rl_regreso: "cuido" } }, "No haces nada espectacular, pero tampoco fallas. El míster, al final, te dice: «Un debut limpio». Para quien lleva tanto tiempo fuera, es suficiente."),
    ]),
  S("rl-ocho-minutos", "rol", { roles: ["suplente", "rotacion"], minAge: 17, clubTurns: [4, 400], notFlags: ["rl_ocho"] }, "partido",
    "Juegas ocho minutos y los recordarás toda la vida",
    "Es el minuto 82, con empate en el marcador y el estadio en tensión. El míster te hace una seña desde la banda. Entras con los nervios en la garganta. En ocho minutos, recortas a un central, mandas un centro envenenado y presionas a un lateral que pierde el balón. No marcas ni das una asistencia. Pero el equipo, con tu empuje, consigue el gol de la victoria en el 90. Al acabar, un compañero te dice: «Tú lo has hecho posible».",
    [
      o("a", "Quitarte importancia y celebrar con el grupo", "Ser humilde", { moral: 6, rel_vestuario: 5, rel_entrenador: 3, flags: { rl_ocho: "humilde" } }, "«Hay jugadores que marcan —dices—. Yo, hoy, ayudé». El míster, al oírlo, apunta tu nombre con un círculo. Al día siguiente, entras en el once."),
      o("b", "Llamar a tu familia y contarles cada detalle", "Compartirlo", { moral: 8, reputacion: 2, flags: { rl_ocho: "familia" } }, "Tu madre, al otro lado, grita. Tu padre, con voz temblorosa, pide que se lo cuentes otra vez. Pasáis una hora al teléfono repasando cada centro y cada presión. Es la mejor conversación de tu semana."),
      o("c", "Pedir al míster más minutos a partir de ahora", "Reivindicarte", { rel_entrenador: -1, moral: 3, flags: { rl_ocho: "pido" } }, "El míster te mira: «Te los ganarás». Y es verdad. A partir de entonces, juegas más. Pero cada minuto te lo ha costado una conversación."),
    ]),
  S("rl-cantera-promocion", "rol", { minAge: 16, maxAge: 20, roles: ["suplente", "rotacion"], media: [60, 99], clubTurns: [2, 60], notFlags: ["rl_promocion"] }, "especial",
    "Te suben al primer equipo y tu ficha cambia de color",
    "Lo sabes por el utillero: «Mañana, a las diez, tu taquilla está en el vestuario de los mayores». Recoges tus cosas con las manos temblorosas. En el pasillo, los chavales del filial te despiden con un abrazo. En el vestuario nuevo, hay una camiseta con tu nombre, un número y un silencio educado. El capitán te señala una taquilla: «Aquí. Pero te vigilaré».",
    [
      o("a", "Entrar con la cabeza baja, saludar a todos y empezar a trabajar", "Pasar desapercibido", { rel_vestuario: 5, rel_entrenador: 3, moral: 4, flags: { rl_promocion: "humilde" } }, "Los primeros días, solo escuchas. A la semana, el capitán te invita a un café. «Eres de los que callan y trabajan —dice—. Pocos hay»."),
      o("b", "Entrar con una sonrisa y una broma sobre la vigilancia del capitán", "Ganarte al vestuario", { rel_vestuario: 7, moral: 5, flags: { rl_promocion: "broma" } }, "«Vigilarme es mi hobby favorito», dices. El vestuario estalla. El capitán, entre risas, te señala: «Este promete». Un mes después, ya eres uno más."),
      o("c", "Demostrar de inmediato que mereces el sitio con un entrenamiento brutal", "Impresionar", { forma: 3, rel_entrenador: 4, rel_vestuario: -1, moral: 3, flags: { rl_promocion: "impresiono" } }, "Entrenas como si fuera tu último día. El míster te mira con una ceja levantada. Algunos veteranos murmuran: «Este viene con prisa». A los dos meses, se acostumbran. Y empiezan a pasarte el balón."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a teenage footballer walking into a first-team dressing room for the first time, holding a new jersey with his name on it, veteran players watching, nervous excited smile, warm light, no logos or readable text" }),
  S("rl-clausula-renovar", "rol", { roles: ["titular", "rotacion"], minAge: 20, clubTurns: [10, 400], notFlags: ["rl_clausula"] }, "representante",
    "Te ofrecen renovar con una cláusula que te ata «hasta que seas leyenda»",
    "El contrato es tentador: un sueldo mayor, una prima por objetivos y una cláusula de rescisión astronómica. «Para que nadie te pueda comprar», explica el director. En la letra pequeña, un párrafo más: «El jugador se compromete a permanecer en el club hasta los treinta y cinco años». Tu agente, con unos dedos nerviosos, repasa el papel. «Esto es una jaula de oro».",
    [
      o("a", "Firmar con la cláusula porque amas el club", "Quedarte para siempre", { patrimonio: 8000, rel_aficion: 8, rel_entrenador: 3, moral: 4, flags: { rl_clausula: "firmo" } }, "La afición, al enterarse, te dedica un cántico. Los medios te llaman «el hombre del club». Pero, años después, cuando llegue una oferta que te cambia la vida, recordarás aquella firma con una mezcla de orgullo y duda."),
      o("b", "Negociar para eliminar el párrafo y firmar sin atarte", "Pedir libertad", { patrimonio: 4000, rel_representante: 3, rel_aficion: -1, flags: { rl_clausula: "negocio" } }, "Tu agente consigue quitar la frase. El club, algo contrariado, accede. Firmas con una sonrisa y una puerta abierta. Es más caro, pero más tuyo."),
      o("c", "Rechazar la renovación y esperar a ver qué ofrece el mercado", "Buscar nuevos aires", { moral: -1, rel_aficion: -4, rel_entrenador: -2, flags: { rl_clausula: "no", quiere_salir: true } }, "El club lo interpreta como un desafío. Las relaciones se enfrían. En tres meses, habrá ofertas sobre la mesa, pero ninguna tan cálida como la que dejaste atrás."),
    ]),
];
