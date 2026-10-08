/**
 * Vida de lujo y sus consecuencias: la fiesta en el yate, el asesor fiscal con ideas creativas, el
 * robo en casa mientras juegas, la propina que se hace viral. Con dinero llegan las decisiones que
 * parecen pequeñas y se cobran después: una foto, una firma, una inspección.
 */
import { S, o, r, after } from "../dsl";
import type { BankScene } from "../types";

export const LUJO: BankScene[] = [
  S("lj-yate", "lujo", { minAge: 19, fama: [45, 100], patrimonio: [8000, 100000000], clubTurns: [3, 400], turn: [1, 2], notFlags: ["lj_yate"] }, "vida",
    "Te invitan a una fiesta en un yate con gente que no conoces",
    "Un empresario de un país lejano, con una camisa de seda y una pulsera de oro, te manda una invitación por mensaje: «Fiesta en mi barco. Solo gente interesante». Hay música alta, camareros con bandejas y un grupo de desconocidos con gafas de sol a las once de la noche. Alguien te pasa una copa. Alguien te hace una foto. Tu agente, desde tierra firme, escribe: «No bebas lo que no veas servir».",
    [
      o("a", "Ir un rato, saludar, y marcharte antes de medianoche", "Con cabeza", { moral: 3, reputacion: 2, flags: { lj_yate: "breve" } }, "Charlas con tres personas, dos de ellas encantadoras, una de ellas un poco turbia. A las once y media, tu móvil vibra: «Vete ya». Obedeces. Al día siguiente, te enteras de que la policía visitó el barco a las tres. Tu agente, con voz solemne: «Siempre me haces caso. No sé por qué hoy me sorprende»."),
      o("b", "Quedarte hasta el final y disfrutar de la noche", "Dejarte llevar", { moral: 6, fama: 2, rel_vestuario: 2, reputacion: -3, forma: -2, flags: { lj_yate: "noche", lj_foto: true } }, "Bailas, ríes, te haces cien fotos. A las seis, nadas en el mar con la camisa puesta. Al día siguiente, una de esas fotos, con tu cara y una copa, circula por la prensa del corazón. «¿Con quién estaba?», se pregunta un titular."),
      o("c", "Declinar la invitación y quedarte cenando con tu familia", "Elegir la tranquilidad", { moral: 4, reputacion: 3, flags: { lj_yate: "no" } }, "Tu madre te sirve una sopa y pregunta si has comido. Es la mejor cena de la semana. Al día siguiente, en el vestuario, un compañero cuenta lo del yate. «Menos mal que no fui», piensas. Y sonríes."),
    ]),
  S("lj-foto", "lujo", { after: [after("lj-yate", "b", 1, 6)], flags: ["lj_foto"] }, "prensa",
    "La foto del yate llega a la portada y a tu patrocinador",
    "La revista la pone en grande, con un titular de dos líneas y un subtítulo que insinúa más de lo que dice. Ya no es solo tu madre quien te llama: es tu patrocinador, con voz de pocos amigos. «Tenemos que hablar de tu imagen», dice. Tu agente, con una carpeta de recortes, añade: «Y de tu reputación». Hay una reunión mañana a las nueve.",
    [
      o("a", "Asumirlo con sinceridad y pedir disculpas a quien corresponda", "Dar la cara", { reputacion: 4, moral: -2, patrimonio: -400, flags: { lj_foto_resuelta: "disculpas" } }, "Llegas a la reunión con la cabeza alta. «Fue una imprudencia», dices. El patrocinador, que esperaba un drama, se desarma. Te propone una campaña de «buenas prácticas». Sales con una multa simbólica y un compromiso firmado."),
      o("b", "Negar que sea tú y pedir que rectifiquen", "Mentir con valentía", { reputacion: -5, moral: -3, fama: 2, flags: { lj_foto_resuelta: "niego" } }, "La revista publica otra foto desde otro ángulo. Es indiscutible. Tu patrocinador, furioso, rescinde un contrato menor. Te llaman «el delantero del yate» en cada estadio durante meses."),
      o("c", "Convertirlo en una broma: «Fui a rescatar a un delfín»", "Salir con ingenio", { fama: 5, reputacion: -1, moral: 3, flags: { lj_foto_resuelta: "delfin" } }, "La frase hace reír a medio país. Un acuario te ofrece apadrinar a un delfín. Aceptas. La broma, bien llevada, te salva. El patrocinador, divertido a regañadientes, mantiene el contrato."),
    ]),
  S("lj-asesor", "lujo", { minAge: 21, patrimonio: [30000, 100000000], clubTurns: [4, 400], notFlags: ["lj_asesor"] }, "representante",
    "Un asesor fiscal te propone «optimizar» tus impuestos con una sociedad en el extranjero",
    "Es un hombre muy educado, con un traje a medida y un maletín con una frase grabada en latín. «Con una estructura adecuada, podría ahorrarse un cuarenta por ciento». Dice «adecuada» como quien dice «legal». Te enseña un organigrama con flechas, islas y siglas. Tu agente, a tu lado, tose. Una vez. Dos. Tres. Es una tos con significado.",
    [
      o("a", "Rechazarlo y pagar lo que corresponda con un asesor de confianza", "Hacerlo bien", { patrimonio: -1500, reputacion: 6, moral: 3, flags: { lj_asesor: "limpio" } }, "Contratas a una gestora seria, aburrida y fiable. Pagas más impuestos, y duermes mejor. Dos años después, un compañero, con otra estructura, tiene una inspección. Tú ni te inmutas."),
      o("b", "Aceptar la propuesta: todo el mundo lo hace", "Optimizar", { patrimonio: 6000, moral: 2, reputacion: -3, flags: { lj_asesor: "sociedad" } }, "Firmas una pila de papeles que no entiendes. Tu cuenta se llena con un alivio inmediato. Una sensación pequeña, en la nuca, se instala: ¿y si alguien pregunta?"),
      o("c", "Pedirle que te lo ponga por escrito y consultar con un abogado", "Pedir garantías", { patrimonio: -300, reputacion: 3, flags: { lj_asesor: "consulta" } }, "El abogado lee el documento, levanta una ceja y concluye: «Es legal, pero arriesgado». Decides no firmar. Seis meses después, la estructura que te ofrecían aparece en la prensa. Con un titular que te alivia."),
    ]),
  S("lj-inspeccion", "lujo", { after: [after("lj-asesor", "b", 10, 90)], minAge: 23 }, "especial",
    "Hacienda te cita para revisar tus cuentas de los últimos años",
    "Llega una carta con un membrete serio, tres hojas y un plazo. «Nos ponemos en contacto con usted para una comprobación de ejercicios anteriores». En un papel aparte, una lista de documentos que no tienes a mano. Tu agente palidece. «Esto es por la sociedad», murmura. El abogado, con cara de funeral, saca una libreta: «Vamos a tener que preparar mucha información».",
    [
      r("a", "Colaborar de forma total y regularizar todo lo que haga falta", "Poner las cartas boca arriba", 0.6, "La regularización te cuesta una buena suma y un par de noches sin dormir, pero el expediente se cierra sin sanciones graves. Tu abogado resume: «Haber llegado antes habría sido más barato». Aprendes la lección que más cara sale.", { patrimonio: -8000, reputacion: -2, moral: -3, flags: { lj_inspeccion: "regularizado" } }, "Los inspectores detectan más de lo que tú declaras. Hay recargos, una multa notable y una nota en la prensa: «El delantero y sus cuentas». Tu agente, que te advirtió, tiene la decencia de no decir nada.", { patrimonio: -18000, reputacion: -8, fama: -3, moral: -8, rel_aficion: -3, flags: { lj_inspeccion: "multa" } }, "reputacion"),
      o("b", "Ocultar documentación y confiar en tu asesor", "Resistir", { patrimonio: -14000, reputacion: -8, moral: -6, flags: { lj_inspeccion: "resisto" } }, "Es el camino más caro. A los seis meses, el asesor desaparece del mapa y tú te quedas con las sanciones, los recargos y un abogado nuevo. «Era previsible», comenta, secamente, el nuevo letrado."),
    ], { weight: 1.3 }),
  S("lj-robo", "lujo", { minAge: 19, patrimonio: [15000, 100000000], clubTurns: [4, 400], notFlags: ["lj_robo"] }, "vida",
    "Te roban en casa mientras juegas un partido",
    "Lo sabes cuando, al volver de un viaje de dos días, tu pareja, tu madre o el portero llama a la policía. La puerta de tu piso tiene los cerrojos rotos, el salón está revuelto y faltan unas cuantas cosas: dos relojes, una consola y un cuadro que no valía nada. Lo único que echas de menos de verdad es una caja de zapatos con cartas de tu abuela. El policía, amable, te toma declaración.",
    [
      o("a", "Instalar un sistema de seguridad y contratar a un vigilante", "Blindarte", { patrimonio: -2500, moral: 2, reputacion: 1, flags: { lj_robo: "blindaje" } }, "En dos semanas, tu casa parece un búnker. Un vigilante te saluda con un «Buenas noches, jefe». Duermes mejor, aunque te sientes algo prisionero. Un día, los ladrones son detenidos. Te devuelven la caja de zapatos."),
      o("b", "Mudarte de piso y empezar de cero", "Cambiar de aires", { patrimonio: -4000, moral: 3, flags: { lj_robo: "mudanza" } }, "Dejas el piso, con sus recuerdos, y te mudas a otro barrio. Las cartas de tu abuela, que habías guardado en tu madre, te acompañan. Al fin, aprendes a sentirte en casa en un sitio más pequeño."),
      o("c", "Tomártelo con filosofía y comprar lo imprescindible", "Quitar hierro", { patrimonio: -800, moral: -1, flags: { lj_robo: "filosofia" } }, "Reemplazas lo que falta, cambias los cerrojos y haces una cena con los vecinos. Tu madre, al enterarse, te regala una caja nueva de zapatos con otra carta dentro. «Para que escribas tú a quien necesites», dice."),
    ]),
  S("lj-multa", "lujo", { minAge: 18, patrimonio: [5000, 100000000], clubTurns: [2, 400], notFlags: ["lj_multa"] }, "vida",
    "Un radar te hace una foto a ciento ochenta con el coche de tu madre",
    "Fue por una prisa tonta, con la música alta y la cabeza en un partido. Lo descubres por un sobre amarillo: una foto de tu cara, tu matrícula y una cifra. Lo peor: el coche era de tu madre, que lo había prestado «solo un ratito». La carta llega a su buzón. La llamada de tu madre dura veintidós minutos y ninguno incluye la palabra «fútbol».",
    [
      o("a", "Pagar la multa, perder los puntos y pedir perdón con flores", "Asumirlo", { patrimonio: -600, reputacion: 2, moral: -2, flags: { lj_multa: "asumo" } }, "Entras en casa de tu madre con un ramo grande. Te mira con severidad, lo coge, huele las flores y dice: «Esto no arregla nada, pero ayuda». Te prepara un guiso. El sermón, que dura media hora, merece cada minuto."),
      o("b", "Recurrir la multa con un abogado por un defecto de forma", "Intentar escaparte", { patrimonio: -400, reputacion: -2, moral: -1, flags: { lj_multa: "recurro" } }, "El abogado encuentra un fallo en la notificación. La multa se anula, pero la prensa se entera. «El delantero que se libró de un radar», titulan. Tu madre, al leerlo, no habla contigo tres días."),
      o("c", "Hacer una campaña de seguridad vial con el club", "Convertirlo en algo útil", { reputacion: 5, rel_aficion: 4, moral: 2, patrimonio: -300, flags: { lj_multa: "campana" } }, "Grabas un vídeo contando tu error. El club lo distribuye por colegios. A los seis meses, un chaval te dice: «Por tu vídeo, mi padre ya no corre». Es un buen rescate."),
    ]),
  S("lj-cita-famosa", "lujo", { minAge: 20, fama: [55, 100], clubTurns: [3, 400], notFlags: ["lj_cita", "pareja"] }, "prensa",
    "Una actriz conocida te invita a cenar y los paparazzi llegan antes que el postre",
    "Es un restaurante discreto, con una mesa en el fondo y camareros entrenados para no mirar. La actriz, de una serie que ven tus padres, es encantadora, curiosa y tiene un humor ácido. Pasadas dos horas, un flash estalla desde un coche. Luego otro. A la salida, hay cinco fotógrafos con cara de haber ganado la lotería. Tu agente te escribe: «Sonríe y no hables».",
    [
      o("a", "Salir con ella de la mano y sonreír a las cámaras", "Asumir la situación", { fama: 6, rel_aficion: 2, reputacion: -1, moral: 4, flags: { lj_cita: "publica" } }, "Al día siguiente, sois portada. Tus compañeros te bautizan «el galán». Dura un par de meses. Ella, después, será una buena amiga. Los fotógrafos, a cambio, te han dado dos titulares que no esperabas."),
      o("b", "Salir por la puerta de atrás y pedirle que haga lo mismo", "Protegerte", { reputacion: 2, moral: 1, flags: { lj_cita: "discreta" } }, "Salís por la cocina, entre risas, con un cocinero que os desea suerte. Los fotógrafos se quedan con la puerta principal. Al día siguiente, la prensa no tiene nada. Os escribís. Es una amistad bonita."),
      o("c", "Cancelar el resto de la cena y volver a casa", "Cortar", { moral: -2, flags: { lj_cita: "corto" } }, "Te marchas con la cabeza gacha. En el coche, tu agente pregunta: «¿Qué ha pasado?». «Nada», dices. Esa noche, te sientes más solo que antes de cenar."),
    ]),
  S("lj-propina", "lujo", { minAge: 18, patrimonio: [3000, 100000000], clubTurns: [2, 400], notFlags: ["lj_propina"] }, "vida",
    "Dejas una propina enorme a una camarera y alguien lo graba",
    "Era una cena normal, con un servicio estupendo, una camarera con ojeras y una cara de cansancio profundo. La cuenta, por trescientos euros. Pagas con tarjeta y, al marcharte, dejas, sin pensar, mil más. «Para ti —le dices—. Y para el niño que no veo desde hace tres días». Ella se queda muda. En la mesa de al lado, alguien tiene el móvil encendido.",
    [
      o("a", "Quitarle importancia y marcharte con discreción", "Humildad", { reputacion: 6, rel_aficion: 4, moral: 5, patrimonio: -1000, flags: { lj_propina: "humilde" } }, "El vídeo se hace viral. «El delantero que dejó mil euros a una camarera», dicen los titulares. La camarera te manda un mensaje con una foto de su hijo con tu camiseta. «Gracias por esta noche», escribe. Lo guardas."),
      o("b", "Pedir que no publiquen el vídeo", "Proteger la intimidad", { reputacion: 4, moral: 3, patrimonio: -1000, flags: { lj_propina: "discreto" } }, "Hablas con la persona del móvil. Lo borra, algo avergonzado. La camarera, que lo ha visto, te lo agradece con una sonrisa. Nadie sabrá nada, salvo tú, ella y ese niño."),
      o("c", "Decir en redes que animes a todos a dejar propinas generosas", "Dar ejemplo", { fama: 4, rel_aficion: 5, reputacion: 3, moral: 4, patrimonio: -1000, flags: { lj_propina: "campana" } }, "Tu mensaje se hace tendencia. Los restaurantes de la ciudad se llenan de clientes con ganas de ser generosos. Un sindicato de hostelería te nombra «amigo de la mesa»."),
    ]),
  S("lj-primera-clase", "lujo", { minAge: 18, patrimonio: [4000, 100000000], clubTurns: [2, 400], notFlags: ["lj_primera"] }, "vida",
    "Te confunden con un empresario en primera clase y te dan un trato que no mereces",
    "Es un vuelo largo, con asientos reclinables y un azafato con guantes. Al sentarte, te ofrece una copa, una manta y una carta de vinos. «¿Qué desea el señor?». Estás pensando en un refresco, pero la timidez te lleva a pedir un «tinto con cuerpo». Un empresario, a tu lado, te guiña un ojo: «Se nota que sabe de esto». Tú, en tu interior, no sabes ni lo que has pedido.",
    [
      o("a", "Seguirle la corriente y disfrutar de la experiencia", "Representar el papel", { moral: 5, forma: -1, flags: { lj_primera: "disfruto" } }, "Pruebas el vino, haces un comentario que suena a «notas de cuero» y el empresario asiente con respeto. A las tres horas, estáis hablando de bodegas. Al aterrizar, te da su tarjeta. Es un viticultor. Y, sin querer, has ganado un amigo."),
      o("b", "Confesar con una sonrisa que eres futbolista y no entiendes de vinos", "Decir la verdad", { moral: 4, reputacion: 3, rel_aficion: 1, flags: { lj_primera: "verdad" } }, "El empresario ríe. «Mi hijo es hincha tuyo». Te firma una servilleta con una frase y tú le firmas otra con otra. Os pasáis el vuelo hablando de fútbol y de vinos. Sale ganando el fútbol."),
      o("c", "Pedir un refresco y cerrar el asunto", "Ser práctico", { moral: 1, flags: { lj_primera: "refresco" } }, "El azafato, discreto, te trae un refresco con una rodajita de limón. En su cara no hay ni un gesto de desaprobación. Cuando aterrizas, descubres que el empresario se ha ido sin despedirse. Sabrás por qué dentro de meses."),
    ]),
  S("lj-regalo-madre", "lujo", { minAge: 20, patrimonio: [12000, 100000000], clubTurns: [4, 400], notFlags: ["lj_regalo_madre"] }, "vida",
    "Le regalas a tu madre un abrigo de piel y lo devuelve en cinco minutos",
    "Lo elegiste con ilusión en una tienda de lujo: suave, negro, con el forro de seda. Se lo entregas en una caja con lazo. Tu madre lo abre, lo mira, lo acaricia y lo deja en la mesa. «Es precioso, hijo. Pero yo no puedo con esto». Se hace un silencio. Tu padre, a su lado, mira por la ventana, como quien contempla una tormenta que no es suya.",
    [
      o("a", "Preguntarle qué le gustaría de verdad y ofrecérselo", "Escuchar de verdad", { moral: 7, reputacion: 4, patrimonio: -300, flags: { lj_regalo_madre: "escucho" } }, "Te pide un reloj sencillo, con un cristal grande para ver bien la hora. Se lo regalas un domingo. Tu madre lo luce con un orgullo inmenso. «Esto sí», dice. A veces, el regalo perfecto no es el que impresiona."),
      o("b", "Insistir en que se lo quede, aunque no lo use", "Mantener tu gesto", { moral: 2, patrimonio: -200, flags: { lj_regalo_madre: "insisto" } }, "Se lo queda por educación. El abrigo vive un año en el armario, envuelto en una sábana. Un invierno, lo usa para una boda. «Estás guapa», le dices. «Tú también», responde, algo ruborizada."),
      o("c", "Devolverlo y contribuir con una donación a su parroquia", "Redirigir el gesto", { patrimonio: -1500, reputacion: 4, moral: 5, flags: { lj_regalo_madre: "parroquia" } }, "Tu madre se emociona: «La parroquia necesita un tejado». El cura, al enterarse, te manda un abrazo. En la misa del domingo, tu nombre sale en un anuncio. Tu madre, al volver, dice: «Esto sí es un abrigo»."),
    ]),
];
