/**
 * Lesionado: el cuerpo roto y la cabeza llena de tiempo. Rehabilitaciones absurdas, series
 * interminables, el miedo a volver. Todas estas escenas solo salen si estás de baja.
 */
import { S, o, r } from "../dsl";
import type { BankScene } from "../types";

export const LESIONES: BankScene[] = [
  S("ls-piscina", "lesion", { injured: true, minAge: 16, notFlags: ["ls_piscina"] }, "entrenamiento",
    "Rehabilitación en la piscina con un preparador muy peculiar",
    "Tu nuevo preparador de recuperación se llama Eugenio, lleva un bañador de los años ochenta y un silbato colgado al cuello que usa cada vez que haces una cosa bien. «¡Una brazada de campeón!», grita. Te hace nadar con una pelota entre las rodillas, hacer el muerto durante cinco minutos y cantar mientras pedaleas bajo el agua. Dice que «es científico». No lo es.",
    [
      o("a", "Seguirle el juego con entusiasmo", "Entregarte", { forma: 3, moral: 4, flags: { ls_piscina: "entrega" } }, "A la tercera sesión, ya cantas con él. A la sexta, la rodilla responde. Eugenio no es serio, pero funciona. Cuando vuelves a jugar, le dejas una caja de bombones en el borde de la piscina."),
      o("b", "Pedir al club otro preparador, más convencional", "Pedir seriedad", { forma: 1, rel_entrenador: 1, moral: -1, flags: { ls_piscina: "cambio" } }, "El club te asigna a una fisio muy competente que no sonríe nunca. Recuperas igual de rápido, pero echas de menos los silbatos. A veces, el entusiasmo también cura."),
      o("c", "Hacer lo mínimo y esperar a que pase el tiempo", "Resignación", { forma: -1, moral: -2, flags: { ls_piscina: "paso" } }, "Vas a la piscina con la cabeza en otro sitio. Eugenio lo nota: «Esto no es un castigo —te dice—. Es una oportunidad». Y no sabes si tiene razón, pero te lo quedas pensando."),
    ]),
  S("ls-series", "lesion", { injured: true, minAge: 16, notFlags: ["ls_series"] }, "vida",
    "Una serie te devora la baja entera",
    "Empezaste el primer capítulo «solo para echar un ojo». Ya llevas cuarenta y tres horas de visionado. Has llorado con un personaje que murió en la primera temporada, has discutido por mensaje con tu compañero de la taquilla de al lado sobre el final, y tu pareja o tu madre te han traído de comer más veces de las que recuerdas. Tu fisio, con una sonrisa, te pregunta si ya sales del sofá.",
    [
      o("a", "Acabar la serie y empezar otra con el vestuario", "Hacerte seriéfilo", { moral: 5, rel_vestuario: 4, forma: -1, flags: { ls_series: "adicto" } }, "A la semana, medio vestuario sigue la serie contigo y las discusiones sobre quién muere llegan a la sala de vídeo. El míster, harto, dice: «Dejad de hablar de dragones y entrenad». Él también la sigue."),
      o("b", "Apagar la tele y salir a pasear con muletas", "Salir de casa", { forma: 2, moral: 3, flags: { ls_series: "sano" } }, "Das una vuelta lenta por el parque, con las muletas y una bufanda. Una niña te dice: «¿Eres futbolista de verdad o de la tele?». «De los dos», respondes. Ella sonríe y se va corriendo."),
      o("c", "Terminar la serie pero escribir una reseña pública", "Convertirlo en contenido", { fama: 3, rel_aficion: 2, moral: 2, flags: { ls_series: "reseña" } }, "Tu reseña, «Lo que aprendí en cuarenta capítulos de baja», se hace viral. Una plataforma te invita a comentar la próxima temporada. Todo por romperte el tobillo."),
    ]),
  S("ls-hipnosis", "lesion", { injured: true, minAge: 17, notFlags: ["ls_hipnosis"] }, "vida",
    "El fisio te propone hipnosis para acelerar la recuperación",
    "Lo ha leído en un libro, en una revista, en una web de gente muy convencida. Te mira con una intensidad inusual, saca un péndulo de madera y dice: «Relájate. Cuando cuente tres, tu rodilla estará sana». El vestuario entero espía por la puerta entreabierta. Tu compañero de al lado ya ha sacado el móvil.",
    [
      o("a", "Dejarte hipnotizar con total confianza", "Ir hasta el final", { moral: 4, rel_vestuario: 4, forma: 1, flags: { ls_hipnosis: "si" } }, "Cuando abres los ojos, creías haberte quedado dormido cinco minutos. Llevas una hora. En el pasillo, el vestuario te recibe aplaudiendo. «Has estado diciendo cosas muy bonitas de tu madre», cuentan, entre carcajadas."),
      o("b", "Aceptar pero con una condición: sin grabarlo", "Poner un límite", { moral: 2, flags: { ls_hipnosis: "limite" } }, "Pides que echen a todos y que cierren la puerta. Funciona a medias: te duermes, pero cuando despiertas, el fisio tiene una sonrisa rara. «No he escuchado nada», dice. Es la frase más sospechosa de tu carrera."),
      o("c", "Negarte y decirle que prefieres el hielo de siempre", "Escéptico", { forma: 1, moral: 0, flags: { ls_hipnosis: "no" } }, "El fisio guarda el péndulo con dignidad. «Cuando quieras, aquí estaré», dice. Con una pena que no esperabas. Esa noche, sueñas con un péndulo gigante, balanceándose sobre el estadio."),
    ]),
  S("ls-visita-mega", "lesion", { injured: true, minAge: 17, fama: [35, 100], notFlags: ["ls_visita_mega"] }, "vida",
    "{mega2} te manda un mensaje desde otro hospital, con humor negro",
    "Es un mensaje breve, con una foto de él con la pierna escayolada: «Mira, compañero, ya somos dos. Aquí se está calentito. Tú ocupas la cama de al lado, ¿no?». {mega2}, el {mega2_pos} de {mega2_club}, también está de baja. Es el tipo de broma que solo se hacen dos rivales con cariño. Tu móvil vibra otra vez: «A ver quién vuelve antes».",
    [
      o("a", "Aceptar el reto y apostar quién vuelve primero", "Un pique sano", { moral: 6, forma: 1, rel_vestuario: 1, flags: { ls_visita_mega: "reto", rv_mega_amigo: true } }, "«Perdedor paga la cena», le escribes. Os mandáis fotos de rehabilitación, vídeos de ejercicios, y memes de la cama del hospital. Cuando volvéis, a la vez, os hacéis una foto juntos con las muletas aún en las manos."),
      o("b", "Contestarle con cariño pero sin entrar al juego", "Con tacto", { moral: 3, reputacion: 2, flags: { ls_visita_mega: "calido" } }, "Le escribes: «Cuídate mucho y vuelve como un tren». Contesta con un emoji de corazón. Es, tal vez, el momento más humano que habéis tenido en la vida."),
      o("c", "No responder: no quieres sentirte comparado", "Quedarte contigo", { moral: -2, flags: { ls_visita_mega: "silencio" } }, "Dejas el mensaje sin contestar. En el fondo, sabes que tendrías que haber escrito algo. Pero la rabia de estar lesionado se mete en todos los rincones. Mañana, quizá."),
    ]),
  S("ls-miedo", "lesion", { injured: true, minAge: 18, notFlags: ["ls_miedo"] }, "vida",
    "A medida que mejoras, aparece el miedo a volver",
    "El médico dice que estás casi listo. El fisio, que la rodilla responde. Los compañeros, que te echan de menos. Pero esta mañana, al ponerte las botas por primera vez en meses, sientes algo que no esperabas: una opresión en el pecho. Y si vuelve a pasar. Y si ya no eres el mismo. La pregunta, repetida, te quita el aliento.",
    [
      o("a", "Hablarlo con el psicólogo del club", "Pedir ayuda", { moral: 4, forma: 2, reputacion: 3, flags: { ls_miedo: "psico", terapia: true } }, "En la primera sesión, hablas más de lo que pensabas. El psicólogo, sin dramatizar, te da una técnica de respiración y un cuaderno. «El miedo es un compañero de equipo. Hay que aprender a jugar con él»."),
      o("b", "Contárselo a tu pareja, a tu madre o a un buen amigo", "Abrir el corazón", { moral: 5, rel_vestuario: 1, flags: { ls_miedo: "familia" } }, "Se lo cuentas al teléfono. Al otro lado, alguien no dice nada, solo escucha. Cuando acabas, te dice: «Aquí estoy». A veces, eso es todo lo que hace falta."),
      o("c", "Callártelo y entrenar con una sonrisa fingida", "Disimular", { forma: 1, moral: -4, flags: { ls_miedo: "callo" } }, "Entrenas con las rodillas rígidas y una sonrisa de plástico. Tus compañeros no notan nada. Tú sí, en cada giro, en cada salto. El miedo no desaparece: se acomoda, como un compañero de viaje."),
    ]),
  S("ls-grada", "lesion", { injured: true, minAge: 16, notFlags: ["ls_grada"] }, "vida",
    "Ver el partido desde la grada, con la gente de verdad",
    "Es la primera vez en años que lo haces: sentarte en la grada, con una bufanda que te prestó un chaval y un bocadillo de tortilla que alguien te pasa sin preguntar. Alrededor, la gente comenta, grita, se cabrea. Un señor mayor te dice: «Menos mal que no estás ahí abajo, porque con esta defensa…». No sabe que eres tú.",
    [
      o("a", "Quedarte hasta el final sin decir quién eres", "Vivirlo como uno más", { moral: 6, rel_aficion: 5, reputacion: 3, flags: { ls_grada: "anonimo" } }, "Gritas, te levantas, te cabreas con el árbitro. Al final, el señor mayor te da la mano: «Qué bien, chaval, se nota que sabes». Sales del estadio con un respeto nuevo por la gente que paga por sufrir."),
      o("b", "Revelar quién eres al descanso", "Dejar que te reconozcan", { fama: 3, rel_aficion: 6, moral: 4, flags: { ls_grada: "reconocido" } }, "Al decir tu nombre, el señor se pone rojo. Los de alrededor te hacen fotos. Dos chavales te piden un autógrafo en el bocadillo. Tienes la sensación de que, en ese momento, eres una celebridad de barrio."),
      o("c", "Marcharte antes de que acabe: ver jugar a otros te duele", "Rehuir", { moral: -3, flags: { ls_grada: "huyo" } }, "A los cuarenta minutos, el nudo en el estómago no te deja seguir. Te levantas y te vas al aparcamiento. Un niño te grita desde lejos: «¡Gracias por venir!». No sabes qué contestar."),
    ]),
  S("ls-veterano-consejo", "lesion", { injured: true, minAge: 18, notFlags: ["ls_veterano"] }, "vestuario",
    "Un veterano que se rompió el cruzado te cuenta cómo lo superó",
    "Es el defensa central, el de las cicatrices en la rodilla, el de las gafas de leer. Un día, mientras esperas en la sala del fisio, se sienta a tu lado y dice sin mirarte: «Yo estuve donde tú estás. Seis meses de nada, y otros seis de duda. Hoy te voy a contar lo que me habría gustado que me dijeran». Se aclara la garganta.",
    [
      o("a", "Escucharle con atención y anotar sus consejos", "Aprender", { moral: 5, forma: 2, rel_vestuario: 3, flags: { ls_veterano: "escucho" } }, "Te cuenta que lo peor no fue el dolor, sino la soledad. Que se agarró a una rutina: levantarse a la misma hora, caminar, leer. «Ponte metas pequeñas», dice. Tiene razón. Lo notas en cada semana siguiente."),
      o("b", "Preguntarle si algún día dejará de doler", "Ser sincero", { moral: 3, rel_vestuario: 2, flags: { ls_veterano: "pregunto" } }, "El veterano guarda silencio. «Duele menos —dice—. Y luego aprendes a vivir con ese dolor». Te mira. «Pero nunca estarás peor que ahora». No sabes por qué, pero te reconforta."),
    ]),
  S("ls-adelantar", "lesion", { injured: true, minAge: 17, fama: [20, 100], notFlags: ["ls_adelantar"] }, "entrenamiento",
    "Te sientes bien y quieres volver antes de lo previsto",
    "Hoy has caminado sin dolor, has subido las escaleras de dos en dos y has hecho tres sentadillas bajo la mirada atónita del fisio. El calendario te dice que te quedan dos semanas de baja; tu cuerpo, que ya está listo. El equipo juega un partido importante el sábado y el míster te mira desde la banda con una sonrisa que dice: «Ya veremos».",
    [
      r("a", "Presionar al médico para que te dé el alta antes", "Arriesgar", 0.45, "El médico accede con el ceño fruncido. Juegas veinte minutos en el sábado y marcas. Nadie se acuerda de la advertencia. La rodilla, desde ese día, está mejor que antes.", { moral: 9, fama: 2, forma: 2, rel_entrenador: 3, flags: { ls_adelantar: "bien" } }, "En el minuto 14, la rodilla grita. Te caes, con las manos en la cara. Lo que debía ser una semana más se convierte en seis. El fisio no dice «te lo avisé»; solo te toma la mano.", { moral: -8, forma: -4, rel_entrenador: -2, flags: { ls_adelantar: "mal" } }, "forma"),
      o("b", "Esperar a que acabe el plazo", "Con cabeza", { moral: -1, forma: 2, rel_entrenador: 3, reputacion: 2, flags: { ls_adelantar: "espero" } }, "Esperas. El sábado, desde la grada, ves cómo tu equipo empata. Te muerdes las uñas. Pero cuando vuelves, el domingo siguiente, lo haces entero y con las rodillas en paz. El míster lo agradece."),
    ]),
];
