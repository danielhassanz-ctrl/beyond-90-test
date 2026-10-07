/**
 * La familia: los tuppers, las llamadas del padre después de cada partido, la promesa de la casa
 * que se cumple (o no) años más tarde, el susto que te recuerda qué importa.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const FAMILIA: BankScene[] = [
  S("fm-padre-llamada", "familia", { minAge: 16, clubTurns: [2, 400], notFlags: ["fm_padre_llamada"] }, "vida",
    "Tu padre te llama tras cada partido para analizarlo",
    "Siempre empieza con la misma frase: «No es por criticar, pero…». Y desde ahí, durante diez minutos, desmonta tu partido con una precisión de entrenador de Primera. Hoy te ha dicho que «te falta pausa en la frontal» y que «el lateral derecho de tu equipo es un coladero». Tiene una libreta con tus estadísticas desde que tenías doce años. Y tiene razón en un ochenta por ciento.",
    [
      o("a", "Escucharlo con paciencia y darle las gracias", "Su mayor alegría", { moral: 5, reputacion: 2, flags: { fm_padre_llamada: "escucho" } }, "Le dices que sus ideas te ayudan, que sin él no habrías llegado. Tu padre, al otro lado, se queda callado un segundo. «Pues en el córner del minuto 70», dice, con la voz más suave que le has oído."),
      o("b", "Pedirle con cariño que, a veces, solo te diga «bien jugado»", "Poner un límite", { moral: 3, reputacion: 1, flags: { fm_padre_llamada: "limite" } }, "Le explicas que necesitas, a veces, solo un «te quiero». Tu padre guarda silencio y dice: «Bien jugado, hijo». Y añade, tras una pausa: «Aunque, la frontal…». Os reís los dos."),
      o("c", "Discutir con él sobre la frontal y la línea de cuatro", "Defender tu fútbol", { moral: 1, rel_entrenador: 0, flags: { fm_padre_llamada: "discuto" } }, "Discutís durante media hora. A los dos días, descubres en el campo que tu padre tenía razón. Le llamas. «Qué, ¿había que pisar la frontal?», dice. «Algo así», admites. Y se alegra más que si hubieras marcado."),
    ]),
  S("fm-tuppers", "familia", { minAge: 16, clubTurns: [2, 400], notFlags: ["fm_tuppers"] }, "vestuario",
    "Tu madre manda tuppers para todo el vestuario",
    "Aparece una mañana en el club, con dos bolsas enormes, y las entrega al utillero: «Para los muchachos». Dentro hay veinte tuppers de croquetas, tortilla, albóndigas y un guiso que huele a infancia. El vestuario, que come cada día un menú de nutricionista, se lanza como una jauría. El míster, desde la puerta, solo dice: «Que nadie se entere el preparador físico».",
    [
      o("a", "Presentarle a tu madre a todo el vestuario", "Sacar pecho", { rel_vestuario: 7, moral: 6, reputacion: 2, flags: { fm_tuppers: "presentada" } }, "Tu madre, algo cortada, saluda uno por uno. El capitán le besa la mano. El portero le pide la receta. A la salida, uno de los jugadores le dice: «Señora, cuando quiera, firmamos un contrato». Ella sonríe: «Con el mío ya tengo bastante»."),
      o("b", "Pedirle con cariño que no lo haga más: el nutricionista se enfada", "Hablar con ella", { moral: 0, rel_entrenador: 1, flags: { fm_tuppers: "frenar" } }, "Tu madre te mira, se cruza de brazos y asiente. Al día siguiente, aparece otra bolsa. Esta vez, con una nota: «Esto es para el nutricionista»."),
      o("c", "Esconder los tuppers y comerlos tú solo", "Egoísmo goloso", { forma: -1, moral: 3, rel_vestuario: -3, flags: { fm_tuppers: "escondo" } }, "Lo haces durante una semana. A la segunda, un compañero huele la tortilla en tu mochila y arma un escándalo cómico. Pagas con una ronda de cafés y una promesa: «La próxima, se reparte»."),
    ]),
  S("fm-hermano-reto", "familia", { minAge: 17, clubTurns: [2, 400], notFlags: ["fm_hermano_reto"] }, "vida",
    "Tu hermano pequeño te reta a un uno contra uno",
    "Tiene doce años, una camiseta tuya que le llega a las rodillas y una confianza ciega en sí mismo. Aparece en el campo del club, tras una visita familiar, con un balón bajo el brazo: «Te reto. Primero a cinco goles». Los compañeros que pasan se paran a mirar. El utillero saca un silbato. Alguien, desde la grada, apuesta diez euros por el chaval.",
    [
      r("a", "Jugarlo en serio, sin dejarte ganar", "A cinco goles", 0.65, "Le ganas por 5-3, con tres regates que lleva un mes ensayando. Tu hermano, con los ojos llenos de lágrimas, te abraza: «La próxima te gano». Y tú sabes que lo hará. Esa tarde, los compañeros le dedican una ovación al pequeño.", { moral: 6, rel_vestuario: 3, flags: { fm_hermano_reto: "gano" } }, "Pierdes 5-4, con un gol del pequeño en el último minuto. El campo entero estalla. Tu hermano, ido, corre a abrazar a todo el que pasa. Tú le dedicas una reverencia. «Se ha hecho mayor», dices.", { moral: 4, rel_vestuario: 5, fama: 1, flags: { fm_hermano_reto: "pierdo" } }, "forma"),
      o("b", "Dejarle ganar con un pequeño teatro", "Un buen hermano", { moral: 5, rel_vestuario: 2, flags: { fm_hermano_reto: "dejo" } }, "Finges tropezar dos veces y fallas a puerta vacía. Tu hermano, sin sospechar nada, celebra como un campeón del mundo. Esa noche, en casa, tu madre te guiña un ojo: «Te vi». No dices nada."),
      o("c", "Decir que hoy no, que tienes entrenamiento", "Otro día", { moral: -2, flags: { fm_hermano_reto: "no" } }, "Le dices que otro día. Tu hermano asiente, con la mirada baja. Esa noche, no te habla en la cena. A los tres días, te lo encuentras en la puerta con el balón: «¿Hoy sí?»."),
    ]),
  S("fm-abuela-velas", "familia", { minAge: 16, clubTurns: [2, 400], notFlags: ["fm_abuela"] }, "vida",
    "Tu abuela enciende velas por ti en todas las iglesias del pueblo",
    "Es su manera de ayudarte: antes de cada partido importante, camina por el pueblo con una caja de cerillas y va dejando velitas en tres iglesias, dos ermitas y una capillita que ya nadie visita. Una vecina te lo cuenta con la boca llena de pastel: «Tu abuela hace lo que puede. Y puede mucho». Hay que verla: ochenta años, un bastón y una fe inquebrantable.",
    [
      o("a", "Acompañarla en su ruta de velas antes del próximo partido", "Caminar a su lado", { moral: 9, reputacion: 2, flags: { fm_abuela: "ruta" } }, "Caminas con ella por las seis paradas, con las manos en los bolsillos y la cabeza gacha. En la capillita del final, ella te mira: «Ahora le pides tú algo». No sabes qué decir. Pides que le dure la salud. Ella, sonriendo, asiente."),
      o("b", "Mandarle una caja de velas aromáticas desde la ciudad", "Un regalo bonito", { moral: 4, patrimonio: -40, flags: { fm_abuela: "regalo" } }, "Le llega una caja con cien velas de lavanda. Tu abuela las enciende… todas a la vez. El pueblo se llena de olor a lavanda y la iglesia parece un incendio de domingo. «Esto sí que va a funcionar», dice."),
      o("c", "Decirle que no hace falta que se esfuerce tanto", "Quitar hierro", { moral: -1, flags: { fm_abuela: "no" } }, "Ella te mira en silencio. «No es por ti —dice—. Es por mí». Entiendes, de golpe, que hay cosas que se hacen para sentirse útil. Le pides perdón."),
    ]),
  S("fm-casa-padres", "familia", { after: [after("jv-madre-recuerda", "b", 8, 100)], patrimonio: [14000, 100000000], minAge: 21 }, "vida",
    "Te toca cumplir la promesa de la casa de tus padres",
    "Hace años le dijiste a tu madre: «Algún día te compraré una casa con jardín». Ella sonrió sin creerte del todo. Hoy, con la cuenta como está y el calendario como está, el momento ha llegado. Un agente inmobiliario te enseña tres casas a las afueras: una con jardín, otra con huerto y otra con una piscina que a tu padre le parece una ostentación. La elección es tuya.",
    [
      o("a", "Comprar la casa con jardín y sorprender a tus padres", "Cumplir la promesa", { patrimonio: -14000, moral: 12, reputacion: 5, flags: { madre_casa: "cumplida" } }, "Los llevas con los ojos vendados. Cuando quitas la venda, tu madre se queda mirando el jardín como quien ve el mar. Tu padre, que no habla, camina despacio por el césped y toca una a una las flores. Esa noche, ninguno duerme."),
      o("b", "Comprar la casa más sencilla y quedarte con la diferencia", "Con cabeza", { patrimonio: -8000, moral: 8, reputacion: 3, flags: { madre_casa: "sencilla" } }, "Compras una casa pequeña, con un patio donde cabe una mesa de plástico. Tu madre llora igual. Tu padre pregunta si no era demasiado. «No —dices—, era lo justo»."),
      o("c", "Pospongo la decisión «hasta que sea más seguro»", "Dar largas", { moral: -4, reputacion: -2, flags: { madre_casa: "pospuesta" } }, "Se lo cuentas a tus padres. Tu madre dice: «No pasa nada, hijo». Pero la mirada de tu madre, un segundo, se apaga. Aquella tarde, cuando te vas, deja la lavadora funcionando."),
    ], { isMilestone: true, milestoneType: "carrera", imageScene: "Photorealistic photo of a young footballer standing in a garden of a new house with his elderly parents, mother crying with joy, father touching a flower, warm afternoon light, no logos or readable text" }),
  S("fm-cena-navidad", "familia", { minAge: 17, clubTurns: [1, 400], turn: [5, 6], notFlags: ["fm_navidad"] }, "vida",
    "La cena de Navidad con toda la familia haciendo preguntas",
    "Hay veinte personas en una mesa para doce. Un tío te explica la vida del fútbol con un palillo en la boca, una tía quiere saber «para cuándo la novia», y un primo se ha traído una guitarra y un plan de negocio. Tu madre, con el delantal puesto, observa la escena con una sonrisa que dice: «Aguanta». Tu padre mira fijamente el reloj. Y tú, en el centro, eres el menú.",
    [
      o("a", "Contestar a todo con humor y cariño", "Ser el alma de la fiesta", { moral: 6, reputacion: 2, flags: { fm_navidad: "humor" } }, "A la tía le dices que «cuando aparezca alguien tan majo como ella». Al tío, que te ficha de entrenador. Al primo, que invertirás en la guitarra si sale a la primera. La noche acaba con cánticos."),
      o("b", "Escaparte a la cocina a ayudar a tu madre", "Refugio", { moral: 4, flags: { fm_navidad: "cocina" } }, "En la cocina, tu madre te cuenta cuánto os quiere. «Lo mejor de la cena es cuando te veo entrar por esa puerta». Lloras sin que se note. El pavo, mientras tanto, se enfría."),
      o("c", "Aprovechar para hacer un brindis sentido por todos", "Hablar con el corazón", { moral: 7, reputacion: 4, flags: { fm_navidad: "brindis" } }, "Te levantas con la copa en alto y das las gracias por cada uno. La mesa se queda en silencio. Luego, un aplauso. Hasta el tío del palillo se emociona. «Qué bien lo has dicho, chaval», murmura."),
    ]),
  S("fm-padre-susto", "familia", { minAge: 22, clubTurns: [3, 400], notFlags: ["fm_susto"] }, "vida",
    "Llaman desde el hospital: tu padre ha tenido un susto",
    "Estabas en la sala de vídeo cuando te ha llegado el mensaje de tu hermana: «Papá está en urgencias. Ven». No hay más. Dejas la tableta y sales corriendo, con el chándal del club y la carpeta de táctica aún en las manos. El míster, que te ve pasar por el pasillo, solo dice: «Ve. Yo me encargo». En el coche, el trayecto se hace eterno.",
    [
      o("a", "Quedarte en el hospital toda la noche con tu familia", "Estar presente", { moral: -4, rel_entrenador: 4, reputacion: 4, flags: { fm_susto: "presente" } }, "Pasas la noche en una silla de plástico, con el móvil apagado. A las seis, el médico dice: «Está estable». Tu madre te abraza. Tu hermano pequeño duerme sobre tus rodillas. Aprendes más en esa noche que en una temporada."),
      o("b", "Estar solo un rato y volver a entrenar para despejarte", "Distraerte", { forma: 1, moral: -6, flags: { fm_susto: "entreno" } }, "Pasas dos horas en el hospital y vuelves al campo. Corres hasta quedarte sin aire. Un compañero te pregunta qué pasa. «Mi padre», dices. Y se hace un silencio de los que se agradecen."),
      o("c", "Pedirle al club una semana libre", "Priorizar", { moral: 3, rel_entrenador: 2, forma: -2, flags: { fm_susto: "libre" } }, "El club te concede cinco días. Pasas cada uno de ellos con tu padre, que se recupera mejor de lo esperado. Cuando vuelves, el míster te recibe con un abrazo: «Lo primero, la familia»."),
    ], { weight: 1.2 }),
  S("fm-padre-recupera", "familia", { after: [after("fm-padre-susto", undefined, 6, 40)] }, "vida",
    "Tu padre te da las gracias a su manera",
    "Pasan los meses y tu padre vuelve a su rutina, con una dieta más sana y una cara nueva. Un domingo, en la sobremesa, saca una caja vieja de debajo de la cama. Dentro, todos los recortes de tu carrera, guardados con celo, con las fechas anotadas. «Lo hice sin decirte nada —dice—. Quería que algún día lo supieras». Tiene los ojos húmedos. Tú, aún más.",
    [
      o("a", "Quedarte con él hojeando la caja toda la tarde", "Compartir el tiempo", { moral: 10, reputacion: 3, flags: { padre_caja: true } }, "Pasáis horas repasando cada recorte. Tu padre te cuenta anécdotas que no conocías: el día que lloró en el campo, el partido en el que se escondió entre la gente para que no lo vieras. Sales de allí con un nudo precioso."),
      o("b", "Prometer que seguirás haciendo la caja, tú, para él", "Continuar la tradición", { moral: 8, reputacion: 4, flags: { padre_caja: true } }, "Desde ese día, cada hito de tu carrera tiene una copia en papel, con una dedicatoria. Cuando tu padre abre la caja cada Navidad, suma una más. Es la mejor vitrina que tendrás."),
    ]),
  S("fm-primo-agente", "familia", { minAge: 19, fama: [30, 100], clubTurns: [2, 400], notFlags: ["fm_primo"] }, "representante",
    "Tu primo se ha hecho «agente» y te trae negocios imposibles",
    "Se presenta en tu casa con un maletín prestado, un traje que le queda corto y una tarjeta de visita con el título «CEO». Trae una lista de propuestas: un anuncio de una marca de bebidas energéticas que nadie conoce, un torneo de pádel con tu nombre, una línea de ropa llamada «Crack by Tu Primo». Tu agente de verdad, que está en el sofá, mira la escena con una sonrisa congelada.",
    [
      o("a", "Escucharle con cariño y elegir uno solo, el más sensato", "Darle una oportunidad", { patrimonio: -500, moral: 4, rel_vestuario: 1, flags: { fm_primo: "oportunidad" } }, "Escoges el torneo de pádel. Sale bien, para sorpresa de todos. Tu primo llora de emoción, tu agente de verdad se ríe, y tu madre, al verlo, te da un abrazo por haber confiado."),
      o("b", "Agradecerle y rechazarlo todo, con mucha delicadeza", "Con firmeza", { rel_representante: 2, moral: -1, flags: { fm_primo: "no" } }, "Le dices que ya tienes quien lleve esas cosas. Tu primo asiente, con la dignidad herida, y se lleva el maletín. En la puerta, murmura: «Algún día te acordarás de mí». Y tienes la sensación de que tiene razón."),
      o("c", "Contratarlo de chófer a media jornada", "Una solución creativa", { patrimonio: -800, moral: 3, flags: { fm_primo: "chofer" } }, "Se lo propones, medio en broma. Tu primo acepta con una dignidad sorprendente. A los dos meses, conduce como un auténtico profesional y te cuenta mil cosas del barrio. Y tú descubres que es la mejor compañía posible en los trayectos."),
    ]),
  S("fm-perro", "familia", { minAge: 19, patrimonio: [1000, 100000000], clubTurns: [2, 400], notFlags: ["fm_perro"] }, "vida",
    "Adoptas un perro sin haberlo planeado",
    "Fue en la puerta de un supermercado, con una caja de cartón y un cartel: «Regalo cachorros». Un chucho blanco con una mancha negra en el ojo te mira desde dentro con una cara de «tú y yo tenemos que hablar». Tu agente, a tu lado, murmura: «No lo hagas». Tu corazón dice otra cosa. Cinco minutos después, el perro va en el asiento del copiloto.",
    [
      o("a", "Llamarlo con un nombre del vestuario y presentarle al equipo", "Dar la bienvenida", { moral: 8, rel_vestuario: 5, fama: 1, flags: { fm_perro: "mascota" } }, "Se llama «Míster». Lo llevas a un entrenamiento, y el míster de verdad se agacha a rascarle la barriga con la cara más dulce que le has visto. El vestuario lo adopta como mascota. El perro se instala en la taquilla del portero."),
      o("b", "Dejarlo con tus padres en el pueblo", "Pensar con cabeza", { moral: 4, reputacion: 1, flags: { fm_perro: "pueblo" } }, "Tus padres lo reciben con una mezcla de resignación y ternura. A la semana, tu padre le habla en voz baja y tu madre le prepara un guiso. Cuando lo visitas, el perro salta tanto que casi te tira."),
      o("c", "Buscarle un hogar a través de una protectora", "Con responsabilidad", { moral: 2, reputacion: 3, patrimonio: -100, flags: { fm_perro: "protectora" } }, "Lo dejas en manos de una protectora de confianza y haces una donación. Al cabo de un mes, te mandan una foto: el perro, con una familia entera sonriendo. Te quedas mirando la imagen un buen rato."),
    ]),
  S("fm-perro-vuelta", "familia", { after: [after("fm-perro", "a", 20, 140)], minAge: 24 }, "vida",
    "«Míster» se hace viejo, y el vestuario lo despide",
    "Los perros no viven tanto como quisieras. Una tarde, el veterinario te llama con voz suave: es su hora. Lo llevas en brazos al campo, porque era su sitio favorito, y todos los compañeros —incluido el míster de verdad— salen del vestuario y hacen un pasillo. Nadie dice nada. El perro, desde tus brazos, mira a cada uno, y por última vez mueve la cola.",
    [
      o("a", "Quedarte con él hasta el final, bajo el sol", "Acompañarlo", { moral: -6, rel_vestuario: 8, reputacion: 3, flags: { perro_adios: true } }, "Pasas con él la tarde, sin prisas. Cuando el veterinario termina, el vestuario entero aplaude en silencio. Esa noche, el míster te llama: «Mañana, entrena a las doce». Es su forma de decir «lo siento»."),
      o("b", "Enterrarlo en el campo de entrenamiento, con permiso del club", "Un homenaje", { moral: -4, rel_vestuario: 6, rel_aficion: 4, flags: { perro_adios: true } }, "El club accede. Bajo un banco del césped, junto a la banda donde se calientan los suplentes, hay una placa con tres palabras: «Míster. Buen chico». Los suplentes la tocan antes de salir al campo, en señal de respeto."),
    ]),
];
