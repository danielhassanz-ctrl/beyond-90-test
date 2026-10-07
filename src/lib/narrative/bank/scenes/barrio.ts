/**
 * Familia "El barrio": los amigos de siempre. Una cena decide si Nacho sigue
 * en tu vida; de ahí salen un préstamo, un bar con tus botas en la pared y,
 * veinte temporadas después, una camiseta enmarcada que se acuerda de ti.
 * Corto plazo: la reacción inmediata. Medio: el bar abre (o se enfría la
 * amistad). Largo: el homenaje, y lo que contará tu segunda vida.
 */
import type { BankScene } from "../types";

export const BARRIO: BankScene[] = [
  {
    id: "bank-barrio-cena",
    family: "barrio",
    weight: 1.3,
    when: { minAge: 17, maxAge: 26, minWeek: 14, fama: [8, 85] },
    event: {
      category: "vida",
      title: "La cena de los de siempre",
      description:
        "El grupo de WhatsApp del barrio lleva tres días en llamas: los de siempre, los que te vieron jugar con botas heredadas en un campo de tierra, han reservado mesa en la pizzería de Manolo para el sábado. Nacho, el que llevaba el balón en una bolsa de supermercado, remata el mensaje: «Si no vienes, te quitamos del grupo».",
      options: [
        {
          id: "a",
          label: "Ir y pagar la cuenta de todos",
          subtitle: "Generoso, aunque duela la cartera",
          consequences: { patrimonio: -450, moral: 5, fama: 1 },
          outcomeText:
            "Pagas la ronda de pizzas sin mirar el ticket. Manolo te abraza por la espalda y Nacho levanta el vaso: «Este es de los nuestros». Al salir, nadie habla del dinero; todos hablan de la noche.",
        },
        {
          id: "b",
          label: "Ir un rato y volver pronto a descansar",
          subtitle: "Equilibrio entre amigos y disciplina",
          consequences: { moral: 2, forma: 1, rel_entrenador: 1 },
          outcomeText:
            "Te quedas hasta el postre y te despides antes del café. Nacho te acompaña a la puerta: «Se nota que ahora tienes otra vida, pero sigues siendo tú».",
        },
        {
          id: "c",
          label: "Excusarte: tienes concentración",
          subtitle: "El fútbol, primero",
          consequences: { moral: -2, rel_entrenador: 1 },
          outcomeText:
            "Escribes que no puedes. Nadie contesta en dos horas. Después llega un solo emoji, un pulgar levantado. Pesa más que un reproche.",
        },
      ],
    },
  },
  {
    id: "bank-barrio-bar",
    family: "barrio",
    when: { after: [{ scene: "bank-barrio-cena", option: "a", minGap: 6, maxGap: 35 }], minAge: 17 },
    event: {
      category: "vida",
      title: "Nacho y su idea del bar",
      description:
        "Nacho te espera a la salida del entreno con una carpeta que huele a ilusión y a fotocopias. Quiere traspasar el bar de su tío, el de la esquina del campo de tierra, y poner en la pared «las botas del crack». Le faltan 3.000 euros para la entrada y no se atreve a decirlo en voz alta, así que lo dice con los ojos.",
      options: [
        {
          id: "a",
          label: "Prestárselos, sin papeles de por medio",
          subtitle: "De amigos, de los de siempre",
          consequences: { patrimonio: -3000, moral: 3 },
          thread: { kind: "deuda", who: "Nacho Ferrer", text: "Le prestaste 3.000 € para abrir el bar de la esquina del campo de tierra" },
          outcomeText:
            "Le haces la transferencia delante de él, desde el móvil. Nacho se queda mirando la pantalla como quien ve un gol en el descuento: «Te lo devuelvo hasta el último céntimo, y con intereses en cañas».",
        },
        {
          id: "b",
          label: "Ayudarle con un aval, pero con contrato",
          subtitle: "Amistad y papeles: las dos cosas",
          consequences: { patrimonio: -1000, reputacion: 2 },
          thread: { kind: "promesa", who: "Nacho Ferrer", text: "Nacho prometió invitarte el día de la inauguración de su bar" },
          outcomeText:
            "Lo hacéis bien, con notario y con risas. Nacho, serio por primera vez en su vida: «Esto no se me olvida».",
        },
        {
          id: "c",
          label: "Decirle que no mezclas dinero y amistad",
          subtitle: "Honesto, aunque suene frío",
          consequences: { moral: -2, reputacion: 1 },
          outcomeText:
            "Se lo dices mirándole a los ojos, y lo entiende, o lo aparenta. Pasan semanas antes de que vuelva a escribirte, y cuando lo hace es para hablar del tiempo.",
        },
      ],
    },
  },
  {
    id: "bank-barrio-inauguracion",
    family: "barrio",
    when: { after: [{ scene: "bank-barrio-bar", minGap: 10, maxGap: 50 }], notFlags: ["amigo_bar"] },
    event: {
      category: "vida",
      title: "El bar de Nacho abre sus puertas",
      description:
        "El cartel dice «Bar Las Botas» y tiene una pizarra con el menú del día en letra de niño. En la pared del fondo, entre un banderín del equipo del barrio y una foto de la cuadrilla con doce años, hay un hueco vacío con un clavo. Nacho te lo señala con el mentón y no dice nada.",
      options: [
        {
          id: "a",
          label: "Ir con medio vestuario y llenarle el local",
          subtitle: "Un estreno para recordar",
          consequences: { patrimonio: -300, rel_vestuario: 4, fama: 2, moral: 5, flags: { amigo_bar: "Nacho Ferrer" } },
          outcomeText:
            "Llegas con seis compañeros y un capitán que pide «lo que tenga más colesterol». Esa noche el Bar Las Botas factura lo de una semana, y tu camiseta firmada se queda en el clavo del fondo.",
        },
        {
          id: "b",
          label: "Ir solo, discreto, y colgar tú mismo la camiseta",
          subtitle: "Un gesto íntimo",
          consequences: { moral: 4, fama: 1, flags: { amigo_bar: "Nacho Ferrer" } },
          outcomeText:
            "Entras por la puerta de atrás, cuelgas la camiseta con el martillo de Nacho y os sentáis a una mesa de formica. «Qué rico», dice él, y no habla del bar.",
        },
        {
          id: "c",
          label: "Mandar una camiseta firmada con un mensajero",
          subtitle: "No llegas, pero te acuerdas",
          consequences: { moral: -1, rel_vestuario: 0 },
          outcomeText:
            "La camiseta llega en una caja con tu letra apretada: «Para el bar de los de siempre». Nacho la cuelga igual, pero esa noche no hay foto contigo.",
        },
      ],
    },
  },
  {
    id: "bank-barrio-silencio",
    family: "barrio",
    when: { after: [{ scene: "bank-barrio-cena", option: "c", minGap: 8, maxGap: 45 }], minAge: 17 },
    event: {
      category: "vida",
      title: "Te sacan del grupo del barrio",
      description:
        "Un lunes por la mañana, el grupo de WhatsApp ya no te aparece. No hay mensaje, ni bronca, solo un hueco donde estaba la foto de la cuadrilla. Nacho te sigue en redes pero no ha puesto ni un «me gusta» a tu último partido. En un barrio, eso es un portazo muy educado.",
      options: [
        {
          id: "a",
          label: "Escribirle a Nacho a título personal",
          subtitle: "Dar tú el primer paso",
          consequences: { moral: 3, reputacion: 1 },
          thread: { kind: "promesa", who: "Nacho Ferrer", text: "Le prometiste ir a verlo en cuanto el calendario te dejara respirar" },
          outcomeText:
            "Le mandas tres líneas sin florituras. Tarda cuatro horas en contestar, y cuando lo hace es con una foto de la pizzería vacía: «Aquí hay una mesa con tu nombre».",
        },
        {
          id: "b",
          label: "Dejarlo estar: cada uno va a lo suyo",
          subtitle: "La vida cambia, y no pasa nada",
          consequences: { moral: -3 },
          outcomeText:
            "Piensas que es lo natural, que los años separan. Esa noche, sin querer, buscas en el móvil fotos de la cuadrilla y te quedas diez minutos mirando una en la que sales con las rodillas llenas de tierra.",
        },
      ],
    },
  },
  {
    id: "bank-barrio-homenaje",
    family: "barrio",
    when: { flags: ["amigo_bar"], minAge: 29, after: [{ scene: "bank-barrio-inauguracion", minGap: 40 }] },
    event: {
      category: "vida",
      title: "La camiseta sigue en el clavo",
      description:
        "Pasas por el barrio sin avisar. El Bar Las Botas ha crecido: tiene terraza, un plato con tu nombre en la carta y en la pared del fondo, tras un cristal, la camiseta que colgaste hace años. Nacho tiene el pelo con canas y una libreta donde todavía apunta la deuda que no existe. Un crío con una camiseta de tu primer equipo te pide un selfi sin saber quién eres, solo que «eres del bar».",
      isMilestone: true,
      milestoneType: "carrera",
      imageScene:
        "Photorealistic photo of the photographed man sitting at the back table of a small neighbourhood bar, a framed football shirt on the wall behind him, warm evening light, an old friend laughing next to him, nostalgic documentary style",
      options: [
        {
          id: "a",
          label: "Quedarte a cerrar el bar con ellos",
          subtitle: "Como cuando teníais doce años",
          consequences: { moral: 8, fama: 2, reputacion: 2 },
          outcomeText:
            "Cerráis a las tres de la madrugada, con las sillas encima de las mesas y Nacho poniendo el himno del barrio en un altavoz roto. Piensas que, de todo lo que has ganado, esto no se compra.",
        },
        {
          id: "b",
          label: "Invertir en ampliar el bar con Nacho",
          subtitle: "Que el local crezca contigo",
          consequences: { patrimonio: -8000, moral: 5, reputacion: 3, flags: { socio_bar: true } },
          outcomeText:
            "Firmáis en una servilleta, y después en el notario, con testigos y cañas. «Socios», dice Nacho, y se emociona sin querer.",
        },
        {
          id: "c",
          label: "Hacerte la foto y volver a tu vida",
          subtitle: "Cariño, pero con prisa",
          consequences: { fama: 1, moral: 1 },
          outcomeText:
            "Te haces la foto con el chaval, con Nacho, con la camiseta. En el coche, de vuelta, te das cuenta de que no probaste el plato con tu nombre.",
        },
      ],
    },
  },
];
