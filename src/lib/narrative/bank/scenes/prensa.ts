/**
 * Familias de prensa y redes: "Laura Cano" (la periodista que te sigue desde
 * los inicios: una entrevista honesta, un favor pendiente y, al retirarte, el
 * libro que escribe sobre ti) y "El tuit" (lo que dices una noche de rabia
 * vuelve cuando menos te conviene).
 */
import type { BankScene } from "../types";

export const PRENSA: BankScene[] = [
  {
    id: "bank-laura-entrevista",
    family: "laura",
    weight: 1.2,
    when: { minAge: 18, maxAge: 30, fama: [18, 90], minWeek: 20 },
    event: {
      category: "prensa",
      title: "La periodista que no hace preguntas fáciles",
      description:
        "Laura Cano, de un diario de provincias con más lectores que muchos nacionales, te pide una entrevista larga. Sin tema impuesto, sin cámara, sin titular de ocho columnas: «Quiero saber cómo es ser tú un martes cualquiera». Su fama es la de preguntar justo lo que más cuesta responder, y escribirlo sin torcerlo.",
      options: [
        {
          id: "a",
          label: "Aceptar y contarle de verdad cómo estás",
          subtitle: "Arriesgar a ser vulnerable",
          consequences: { fama: 3, moral: 3, reputacion: 3 },
          thread: { kind: "favor", who: "Laura Cano", text: "Te abriste con ella en una entrevista honesta cuando nadie te conocía" },
          outcomeText:
            "Hablas dos horas con el grabador apagado y encendido, sin saber cuándo es cuándo. El domingo, el reportaje ocupa dos páginas y no tiene ni una frase fuera de lugar. Tu madre lo recorta y lo enmarca.",
        },
        {
          id: "b",
          label: "Aceptar, pero con respuestas de manual",
          subtitle: "Quedar bien sin enseñar nada",
          consequences: { fama: 2, reputacion: 1 },
          outcomeText:
            "Respondes con frases pulidas y sin una grieta. Laura te lo agradece con una sonrisa que no llega a los ojos: «Prometo que no se notará que no me has contado nada».",
        },
        {
          id: "c",
          label: "Rechazarla: ahora no toca",
          subtitle: "Proteger tu perfil bajo",
          consequences: { moral: 1, fama: -1 },
          outcomeText:
            "Le dices que prefieres que hable el campo. Laura asiente, sin enfado, y apunta algo en su libreta. Te das cuenta de que aún no has aprendido a leer a quien te lee.",
        },
      ],
    },
  },
  {
    id: "bank-laura-favor",
    family: "laura",
    when: { after: [{ scene: "bank-laura-entrevista", option: "a", minGap: 15, maxGap: 80 }] },
    event: {
      category: "prensa",
      title: "Laura Cano te pide un favor",
      description:
        "Un mensaje de Laura a las once de la noche: «Necesito que me hagas un favor y no te lo pediría si no fuera importante». Su periódico va a cerrar la edición de papel. Quiere que la última portada lleve tu foto, con una frase tuya sobre lo que significa tener un medio local que cuente las cosas. Y que lo hagas gratis, claro.",
      options: [
        {
          id: "a",
          label: "Decir que sí y llevar la foto tú mismo",
          subtitle: "Devolver lo que te dieron",
          consequences: { fama: 3, rel_aficion: 4, moral: 5, reputacion: 3 },
          outcomeText:
            "Te presentas en la redacción con la camiseta de entrenar y un café para cada periodista. La última portada del diario lleva tu cara y una frase corta: «Gracias por contarlo bien». Medio barrio la guarda.",
        },
        {
          id: "b",
          label: "Decir que sí, pero con tu agente de por medio",
          subtitle: "Hacerlo con cabeza y papeles",
          consequences: { fama: 1, rel_representante: 1, reputacion: 1 },
          outcomeText:
            "Tu representante lo gestiona con un correo de cinco líneas y una condición: nada de fotos con camiseta de marca. Laura lo entiende. Tarda un día en contestar, y la última portada llega sin ruido.",
        },
        {
          id: "c",
          label: "Decir que no puedes",
          subtitle: "Cada cosa en su sitio",
          consequences: { moral: -2, fama: -1 },
          outcomeText:
            "Le dices que tu agenda no da para más. Laura te da las gracias con un mensaje corto y educado. Es la última vez que te pide algo.",
        },
      ],
    },
  },
  {
    id: "bank-laura-libro",
    family: "laura",
    when: { after: [{ scene: "bank-laura-favor", option: "a", minGap: 50, maxGap: 220 }], minAge: 31 },
    event: {
      category: "prensa",
      title: "Laura Cano quiere escribir tu libro",
      description:
        "Laura te recibe en su nuevo despacho, con vistas a una redacción pequeña y una taza que dice «Lo prometo, esto es un trabajo de verdad». Lleva doce años siguiéndote sin que lo sepas del todo. Tiene tres cajas de recortes y un título tentativo: «Los martes de un crack». «No es un libro de goles. Es un libro de personas», te dice.",
      isMilestone: true,
      milestoneType: "carrera",
      imageScene:
        "Photorealistic photo of an older footballer sitting across a desk from a woman journalist with a stack of old newspaper clippings and a notebook, warm office light, intimate documentary style",
      options: [
        {
          id: "a",
          label: "Darle acceso a todo: recuerdos, cartas, fotos",
          subtitle: "Un libro sin filtros",
          consequences: { fama: 5, reputacion: 5, moral: 6, flags: { libro_laura: true } },
          outcomeText:
            "Le abres las cajas del trastero: cartas de la infancia, entradas de los primeros partidos, las botas del campo de tierra. Laura llora sin darse cuenta con una foto de tu primera convocatoria.",
        },
        {
          id: "b",
          label: "Contarle solo lo que quieras que se sepa",
          subtitle: "Un libro cuidado",
          consequences: { fama: 3, reputacion: 2, moral: 2, flags: { libro_laura: true } },
          outcomeText:
            "Pones límites con educación. Laura los acepta, sabiendo que lo importante, tarde o temprano, termina colándose entre líneas.",
        },
      ],
    },
  },
  {
    id: "bank-tuit-rabia",
    family: "tuit",
    when: { moral: [0, 55], fama: [30, 100], minAge: 18 },
    event: {
      category: "prensa",
      title: "El tuit de las dos de la madrugada",
      description:
        "Vuelves de un partido con un 3-0 en contra y la rabia en los dedos. Abres el móvil, ves un comentario de un aficionado que te llama «jubilado a los veintitrés» y empiezas a teclear. Tienes el mensaje escrito antes de que el coche llegue a casa. Es duro, es justo, y sabes que mañana lo vas a lamentar.",
      options: [
        {
          id: "a",
          label: "Publicarlo: te lo has ganado",
          subtitle: "Que se entere el mundo",
          consequences: { fama: 5, rel_aficion: -5, rel_entrenador: -2, moral: 2, flags: { tuit_polemico: true } },
          outcomeText:
            "Lo publicas. En una hora tiene diez mil me gusta y mil respuestas. A la mañana, tu representante te llama y solo dice: «Borra eso». Pero ya es tarde: los pantallazos viajan solos.",
        },
        {
          id: "b",
          label: "Guardarlo en borradores y dormir",
          subtitle: "Dejar que pase la rabia",
          consequences: { moral: 1, reputacion: 1 },
          outcomeText:
            "Lo guardas sin enviar y te acuestas con el pulso a mil. Por la mañana lo relees: era cierto, pero no era necesario. Lo borras con un nudo de orgullo extraño.",
        },
        {
          id: "c",
          label: "Llamar a tu representante para que lo lea primero",
          subtitle: "Una segunda opinión",
          consequences: { rel_representante: 3, reputacion: 1, moral: 1 },
          outcomeText:
            "A las dos y cuarto, tu representante te contesta con voz de sueño: «Léemelo». Cuando acabas, se queda en silencio. «Es muy bueno. Y no lo envíes.»",
        },
      ],
    },
  },
  {
    id: "bank-tuit-eco",
    family: "tuit",
    when: { after: [{ scene: "bank-tuit-rabia", option: "a", minGap: 10, maxGap: 90 }] },
    event: {
      category: "prensa",
      title: "El tuit vuelve",
      description:
        "En plena semana de una negociación importante, alguien rescata aquel tuit y lo mete en un montaje con música épica: «El día que el crack perdió los papeles». Está en todas partes. Tu representante te llama con la voz grave: «Esto lo van a usar en contra tuya en la mesa. Lo sabes, ¿verdad?»",
      options: [
        {
          id: "a",
          label: "Pedir disculpas públicas, sin excusas",
          subtitle: "Cerrar la herida de golpe",
          consequences: { rel_aficion: 4, fama: -2, moral: -1, reputacion: 3 },
          outcomeText:
            "Publicas un mensaje corto, sin adornos: lo siento, no estuvo bien. La afición, que perdona más rápido que la prensa, empieza a responderte con corazones. El montaje se desinfla en un día.",
        },
        {
          id: "b",
          label: "Ignorarlo y esperar a que escampe",
          subtitle: "No dar más combustible",
          consequences: { rel_aficion: -3, moral: -2 },
          outcomeText:
            "No dices nada. El montaje sigue creciendo tres días y después se hunde bajo otro escándalo. Pero en la mesa de negociación, el directivo sonríe un segundo de más.",
        },
        {
          id: "c",
          label: "Responder con humor: «Aprendí que a las 2 no se tuitea»",
          subtitle: "Reírte de ti mismo",
          consequences: { fama: 3, rel_aficion: 3, moral: 2 },
          outcomeText:
            "Subes una foto con un almohadón sobre la cara y la frase del título. La gente te perdona con un millón de risas. Alguien lo convierte en un meme que durará una temporada.",
        },
      ],
    },
  },
];
