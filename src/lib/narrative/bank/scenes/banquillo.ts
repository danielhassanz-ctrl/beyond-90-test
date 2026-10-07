/**
 * Familia "El banquillo": qué haces cuando no cuentan contigo. Depende de tu
 * rol real (suplente o apartado) y de cómo te lleves con el míster. Lo que
 * decidas aquí (aceptar jugar en otro sitio, plantar cara, trabajar en
 * silencio) cambia las ofertas, la relación con el entrenador y, a largo
 * plazo, cómo te recuerda el club.
 */
import type { BankScene } from "../types";

export const BANQUILLO: BankScene[] = [
  {
    id: "bank-banquillo-lateral",
    family: "banquillo",
    weight: 1.4,
    when: { roles: ["suplente", "rotacion"], minAge: 18, maxAge: 29, media: [50, 78], clubLevels: ["grande", "europeo"], notFlags: ["polivalente", "orgulloso"] },
    event: {
      category: "entrenamiento",
      title: "El míster te pide que juegues de lateral",
      description:
        "Te cita en su despacho con la pizarra del día de ayer aún sin borrar. «Tengo un problema en el lateral izquierdo y una solución que no te va a gustar: tú. Tres partidos. Si lo haces bien, esto cambia tu temporada. Si lo haces mal, nadie te lo reprochará.» Se rasca la barba y no te mira.",
      options: [
        {
          id: "a",
          label: "Aceptar: lo que sea por jugar",
          subtitle: "Ganarte minutos aunque no sea tu posición",
          consequences: { rel_entrenador: 5, moral: 2, forma: 2, flags: { polivalente: true } },
          thread: { kind: "favor", who: "el míster", text: "Aceptaste jugar fuera de tu posición cuando el equipo te necesitó" },
          outcomeText:
            "Dices que sí antes de que termine la frase. El míster levanta la mirada, sorprendido: «Pensé que tardarías más en decidirlo». Apunta algo en su libreta.",
        },
        {
          id: "b",
          label: "Negarte con educación",
          subtitle: "Eres delantero, no un parche",
          consequences: { rel_entrenador: -5, moral: 1, flags: { orgulloso: true } },
          outcomeText:
            "Le dices, con respeto, que no te ves en esa posición. Él asiente muy despacio, como quien guarda un nombre en un cajón: «Entendido». No hay más conversación.",
        },
        {
          id: "c",
          label: "Pedir una cesión para jugar en tu posición",
          subtitle: "Buscar minutos en otro sitio",
          consequences: { rel_entrenador: -2, moral: 2, rel_representante: 2, flags: { quiere_salir: true } },
          outcomeText:
            "Le dices que prefieres un sitio donde te dejen ser delantero. No lo discute, pero tampoco te retiene: «Se lo diré al director deportivo».",
        },
      ],
    },
  },
  {
    id: "bank-banquillo-resultado",
    family: "banquillo",
    when: { after: [{ scene: "bank-banquillo-lateral", option: "a", minGap: 3, maxGap: 14 }] },
    event: {
      category: "partido",
      title: "Tres partidos de lateral",
      description:
        "Los tres partidos pasan en un suspiro. El primero, con el extremo rival haciéndote un siete; el segundo, con un pase tuyo que acaba en gol; el tercero, con la grada gritando tu nombre cuando despejas bajo palos. Al salir del campo, el míster, que nunca sonríe, enseña los dientes un segundo. Es una sonrisa corta, pero se ve.",
      options: [
        {
          id: "a",
          label: "Pedirle en privado seguir de polivalente",
          subtitle: "Abrirte una puerta a la titularidad",
          consequences: { rel_entrenador: 4, media: 1, forma: 2 },
          outcomeText:
            "«Cuando me necesites, donde me necesites», le dices. El míster te mira como si te viera por primera vez: «Eso me gusta. Esto se acaba de poner interesante».",
        },
        {
          id: "b",
          label: "Volver a pedir tu sitio de delantero",
          subtitle: "Ya has demostrado lo que vales",
          consequences: { rel_entrenador: 1, moral: 3 },
          outcomeText:
            "Le recuerdas, sin dramatismo, que tu sitio está arriba. Él no promete nada, pero escribe en la libreta tu nombre al lado de «delantero» con una flecha.",
        },
      ],
    },
  },
  {
    id: "bank-banquillo-castigo",
    family: "banquillo",
    when: { after: [{ scene: "bank-banquillo-lateral", option: "b", minGap: 5, maxGap: 30 }], roles: ["suplente", "rotacion", "apartado"] },
    event: {
      category: "entrenamiento",
      title: "El míster te deja fuera de la lista",
      description:
        "La lista de convocados cuelga del corcho del vestuario. Tu nombre no está, ni en el banquillo ni en la grada. El míster pasa por tu lado y no te mira. En el grupo de WhatsApp del equipo alguien suelta un «mal asunto» y borra el mensaje a los dos segundos.",
      options: [
        {
          id: "a",
          label: "Pedirle explicaciones cara a cara",
          subtitle: "Dar la cara, venga lo que venga",
          consequences: { rel_entrenador: 2, moral: -2, reputacion: 1 },
          outcomeText:
            "Llamas a su puerta. Te escucha sin interrumpir y contesta con una frase de cuatro palabras: «Piénsalo y vuelve». No es una bronca, pero tampoco es una puerta abierta.",
        },
        {
          id: "b",
          label: "Entrenar el doble y esperar tu momento",
          subtitle: "Que hablen los hechos",
          consequences: { forma: 3, rel_entrenador: 1, moral: -1 },
          outcomeText:
            "Llegas el primero y te vas el último. Durante dos semanas nadie dice nada. A la tercera, el preparador físico te comenta, sin mirarte: «Se te ve fino».",
        },
        {
          id: "c",
          label: "Hablar con tu representante para buscar salida",
          subtitle: "No esperar a que el tiempo lo arregle",
          consequences: { rel_representante: 3, moral: 1, rel_entrenador: -2, flags: { quiere_salir: true } },
          outcomeText:
            "Tu representante te escucha sin interrumpir y resume: «Hay clubes que pagarían por tu perfil. Dame unas semanas». Cuelgas con el pulso más tranquilo.",
        },
      ],
    },
  },
  {
    id: "bank-banquillo-vuelta",
    family: "banquillo",
    when: { after: [{ scene: "bank-banquillo-castigo", option: "b", minGap: 6, maxGap: 35 }] },
    event: {
      category: "vestuario",
      title: "El míster te llama otra vez",
      description:
        "Un lesionado y una sanción te devuelven al once sin que nadie lo haya anunciado. El míster te lo dice en el pasillo, con las manos en los bolsillos: «Juegas. Y no es un premio ni un favor. Es que lo has trabajado». Después, lo más parecido a una disculpa que vas a oírle jamás: «Me he fijado».",
      options: [
        {
          id: "a",
          label: "Darle las gracias y salir a comerte el campo",
          subtitle: "Hacer de la oportunidad un trampolín",
          consequences: { rel_entrenador: 5, moral: 6, forma: 2, media: 1 },
          outcomeText:
            "Juegas como si te fuera la vida. Al volver al vestuario, el míster te choca la mano sin una palabra. Entre ellos, eso es un abrazo.",
        },
        {
          id: "b",
          label: "Recordarle con tacto lo que pasó antes",
          subtitle: "Que no se le olvide",
          consequences: { rel_entrenador: -2, moral: 3 },
          outcomeText:
            "Le sueltas una frase con segundas. Él sonríe de lado, pero no la olvida: la apunta, como todo.",
        },
      ],
    },
  },
  {
    id: "bank-banquillo-eleccion",
    family: "banquillo",
    when: { flags: ["quiere_salir"], roles: ["suplente", "apartado", "rotacion"], minAge: 18, maxAge: 30, notFlags: ["salida_decidida"], minWeek: 20 },
    event: {
      category: "representante",
      title: "Tu representante vuelve con tres opciones",
      description:
        "Entra en tu casa sin llamar al timbre, como siempre. Sobre la mesa deja una hoja con tres opciones. «Esto es lo que hay: un club donde serías titular desde ya, la opción de quedarte y pelear, o esperar a ver qué se mueve. Las tres tienen su coste».",
      options: [
        {
          id: "a",
          label: "Fichar por un club donde sí cuenten contigo",
          subtitle: "Continuidad y minutos de verdad",
          consequences: { club: "@LOWER", moral: 6, forma: 3, rel_representante: 3, fama: -1, flags: { salida_decidida: true } },
          outcomeText:
            "Aceptas. Cuando se lo dices al míster, no te lo reprocha: «Ojalá te vaya bien. Y ojalá lo hubiera visto antes». En el nuevo club, el presidente te recibe con una camiseta enmarcada y un discurso de doce minutos que no escuchas, porque estás mirando el campo.",
        },
        {
          id: "b",
          label: "Quedarte y pelear tu sitio",
          subtitle: "Nadie se baja del barco",
          consequences: { rel_entrenador: 3, moral: 1, forma: 2, flags: { salida_decidida: true } },
          outcomeText:
            "Le dices a tu representante que no. Él arquea una ceja, sonríe sin ganas y recoge los papeles: «Lo guardo. Nunca se sabe cuándo se vuelven a necesitar».",
        },
        {
          id: "c",
          label: "Pedirle que espere a la próxima ventana",
          subtitle: "Ganar tiempo sin cerrar puertas",
          consequences: { rel_representante: 1, moral: 0 },
          outcomeText:
            "Le pides un par de meses de margen. «El tiempo es dinero, pero también es un buen consejero», contesta, guardando la hoja en la carpeta.",
        },
      ],
    },
  },
];
