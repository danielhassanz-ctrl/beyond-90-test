/**
 * Familia "La cabeza": cuando la moral se hunde de verdad. Pedir ayuda,
 * aguantar solo o esconderlo tienen caminos distintos que se notan en el
 * campo, en las relaciones y, mucho después, en lo que decides contar en
 * público. Solo sale con el ánimo por los suelos, nunca como relleno.
 */
import type { BankScene } from "../types";

export const MENTE: BankScene[] = [
  {
    id: "bank-mente-noche",
    family: "mente",
    weight: 1.5,
    when: { moral: [0, 38], minAge: 17, notFlags: ["terapia", "mente_callado"] },
    event: {
      category: "vida",
      title: "Llevas tres semanas sin dormir bien",
      description:
        "Te despiertas a las cuatro en punto, con el corazón acelerado y la imagen del último fallo repetida como un vídeo en bucle. El móvil dice que has abierto la aplicación de las estadísticas veintiséis veces hoy. En el espejo del baño, la cara que te devuelve la mirada tiene ojeras que ni el maquillaje del club arreglaría.",
      options: [
        {
          id: "a",
          label: "Hablar con la psicóloga del club",
          subtitle: "Pedir ayuda a tiempo",
          consequences: { moral: 6, forma: 1, rel_entrenador: 1, flags: { terapia: true } },
          thread: { kind: "promesa", who: "la psicóloga del club", text: "Prometiste ir a las sesiones aunque no tuvieras ganas" },
          outcomeText:
            "Llamas a la puerta con un nudo. La psicóloga no te habla de fútbol: te pregunta qué desayunaste. Sales con una cita semanal y la sensación rara de que hablar es pesado, pero que pesa menos que callar.",
        },
        {
          id: "b",
          label: "Aguantar solo: se pasa con el tiempo",
          subtitle: "Que no se note nada",
          consequences: { moral: -3, forma: -2, flags: { mente_callado: true } },
          outcomeText:
            "Te dices que es una racha, que pasará. En el campo sonríes lo justo y sudas lo necesario. Por las noches, cuentas las rendijas de la persiana.",
        },
        {
          id: "c",
          label: "Contárselo a un compañero de confianza",
          subtitle: "Compartir, sin dramas",
          consequences: { moral: 3, rel_vestuario: 3 },
          thread: { kind: "secreto", who: "el compañero de confianza", text: "Le confesaste que llevabas semanas sin dormir bien" },
          outcomeText:
            "Se lo sueltas al final de un entreno, sin mirarle. Él no te dice nada sabio: te propone una cerveza sin alcohol y un paseo. Es lo mejor que te han dicho en un mes.",
        },
      ],
    },
  },
  {
    id: "bank-mente-recaida",
    family: "mente",
    when: { after: [{ scene: "bank-mente-noche", option: "b", minGap: 5, maxGap: 30 }], moral: [0, 50] },
    event: {
      category: "vida",
      title: "Se te cae el mundo en pleno entrenamiento",
      description:
        "Fallas un control sencillo, el balón rueda hasta la valla y de pronto no puedes respirar bien. Te sientas en el césped con las manos en las rodillas. El fisio corre hacia ti, el míster se queda a diez metros con cara de preocupación sincera. «¿Qué te pasa?», pregunta alguien. Y por primera vez no sabes mentir.",
      options: [
        {
          id: "a",
          label: "Decir la verdad: llevas semanas mal",
          subtitle: "Dejar de aparentar",
          consequences: { moral: 4, rel_entrenador: 3, rel_vestuario: 3, flags: { terapia: true } },
          outcomeText:
            "Lo dices en voz alta, con los ojos llenos. Nadie se ríe ni se asusta. El míster te pone una mano en el hombro: «Te llevas el resto de la semana de descanso. Y mañana, a la psicóloga». No es una pregunta.",
        },
        {
          id: "b",
          label: "Decir que ha sido un mareo y seguir",
          subtitle: "Disimular un día más",
          consequences: { moral: -4, forma: -2 },
          outcomeText:
            "Te levantas, sacudes la hierba de las rodillas y dices que fue el calor. El fisio frunce el ceño. Esta noche, otra vez, el techo.",
        },
      ],
    },
  },
  {
    id: "bank-mente-mejora",
    family: "mente",
    when: { after: [{ scene: "bank-mente-noche", option: "a", minGap: 6, maxGap: 40 }] },
    event: {
      category: "vida",
      title: "Las sesiones empiezan a notarse",
      description:
        "Duermes cinco horas seguidas, luego seis. En el entreno, te sorprendes riéndote de una tontería del utillero. La psicóloga te mira por encima de las gafas en la última sesión: «No estás curado, y no hace falta. Estás aprendiendo a no cargar la mochila en la cabeza, sino en los pies».",
      options: [
        {
          id: "a",
          label: "Seguir con las sesiones aunque ya estés mejor",
          subtitle: "Cuidarte antes de que duela",
          consequences: { moral: 6, forma: 2, reputacion: 2 },
          outcomeText:
            "Mantienes la cita de los jueves. Un día la psicóloga te dice, casi sin darse cuenta: «Tú has dejado de ser mi caso para ser mi ejemplo». Te lo guardas.",
        },
        {
          id: "b",
          label: "Dejarlas: ya estás bien",
          subtitle: "Volver a tu ritmo",
          consequences: { moral: 3, forma: 1 },
          outcomeText:
            "Te despides con un apretón de manos. Ella, sin dramas: «La puerta no tiene cerradura». Y la dejas, de verdad, ni entreabierta.",
        },
      ],
    },
  },
  {
    id: "bank-mente-voz",
    family: "mente",
    when: { after: [{ scene: "bank-mente-mejora", option: "a", minGap: 40, maxGap: 220 }], fama: [60, 100], minAge: 26 },
    event: {
      category: "prensa",
      title: "Te piden que hables en público de lo que pasaste",
      description:
        "Una asociación te invita a una charla en un instituto lleno de adolescentes. Quieren a «el futbolista que no se esconde». Alguien del club te pide discreción; tu representante duda; la psicóloga, en cambio, te manda un único mensaje: «Si lo cuentas, algún chaval se salva».",
      isMilestone: true,
      milestoneType: "carrera",
      imageScene:
        "Photorealistic photo of a footballer standing on a school auditorium stage speaking sincerely to a crowd of teenagers, warm stage lighting, emotional and authentic, documentary style",
      options: [
        {
          id: "a",
          label: "Contarlo todo, con tus palabras",
          subtitle: "Aunque cueste, aunque se sepa",
          consequences: { fama: 5, reputacion: 6, moral: 8, rel_aficion: 4, flags: { habla_salud_mental: true } },
          outcomeText:
            "Subes al escenario sin papeles. Hablas veinte minutos y nadie mira el móvil. Al acabar, un chaval de dieciséis años te espera en la puerta con los ojos rojos y solo dice: «Gracias, yo también».",
        },
        {
          id: "b",
          label: "Ir, pero hablando de forma general",
          subtitle: "Ayudar con prudencia",
          consequences: { fama: 2, reputacion: 3, moral: 3 },
          outcomeText:
            "Cuentas lo justo y animas a hablar con alguien. Es una charla correcta que ayuda a algunos. Tú sabes que, en el fondo, te has guardado lo importante.",
        },
        {
          id: "c",
          label: "Declinar: es algo privado",
          subtitle: "Proteger tu intimidad",
          consequences: { moral: 1, reputacion: -1 },
          outcomeText:
            "Das las gracias, rehúsas con respeto. La psicóloga te contesta con un emoji de pulgar y una frase: «Cuando quieras, aquí estamos».",
        },
      ],
    },
  },
];
