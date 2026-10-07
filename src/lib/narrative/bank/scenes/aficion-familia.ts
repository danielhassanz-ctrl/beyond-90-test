/**
 * Familias "La peña" (la afición que te adopta: una carta, una cena, un
 * pregón al retirarte) y "Casa" (tu padre y tu madre: lo que hacen por ti y
 * lo que decides devolverles). Lo que eliges con ellos pesa en lo emocional
 * y en lo práctico a largo plazo.
 */
import type { BankScene } from "../types";

export const AFICION_FAMILIA: BankScene[] = [
  {
    id: "bank-pena-carta",
    family: "pena",
    weight: 1.2,
    when: { rel: { aficion: [60, 100] }, minAge: 19, minWeek: 20, roles: ["titular", "rotacion"] },
    event: {
      category: "vida",
      title: "La carta de la peña",
      description:
        "En el buzón del club hay un sobre con tu nombre, escrito a bolígrafo y con faltas de ortografía con cariño. Es de la Peña El Gol Sur: ochenta socios que van a todos los partidos, cuentan hasta las pipas del campo y te quieren como a un hijo que no han tenido. Te invitan a su cena anual. Hay una silla vacía con tu nombre en una tarjeta.",
      options: [
        {
          id: "a",
          label: "Ir a la cena y quedarte hasta el final",
          subtitle: "Compartir mantel con quienes te empujan",
          consequences: { rel_aficion: 6, moral: 5, fama: 2, patrimonio: -150 },
          thread: { kind: "promesa", who: "el presidente de la peña", text: "Prometiste volver a su cena cada año mientras vistieras esta camiseta" },
          outcomeText:
            "Llegas con una caja de turrón y te sientan en la cabecera. Cantan tu nombre con la melodía de otro himno, y un abuelo de ochenta años te enseña una foto de su carné de socio de 1964. «Aquí se queda un rato, ¿verdad?», te pregunta. Y dices que sí.",
        },
        {
          id: "b",
          label: "Mandar un vídeo desde casa",
          subtitle: "No puedes, pero te acuerdas",
          consequences: { rel_aficion: 2, moral: 1 },
          outcomeText:
            "Grabas un mensaje de treinta segundos. En la cena lo ponen en un proyector prestado y lo aplauden con cariño, sabiendo que no es lo mismo.",
        },
        {
          id: "c",
          label: "Agradecerlo, pero no ir",
          subtitle: "Tu vida privada también cuenta",
          consequences: { rel_aficion: -1, moral: 0 },
          outcomeText:
            "Mandas un mensaje de agradecimiento. El presidente de la peña contesta con un emoji de corazón y un «no pasa nada, ya vendrás». Esa silla vacía se queda ahí, pero nadie la quita.",
        },
      ],
    },
  },
  {
    id: "bank-pena-pregon",
    family: "pena",
    when: { after: [{ scene: "bank-pena-carta", option: "a", minGap: 80, maxGap: 260 }], minAge: 31 },
    event: {
      category: "vida",
      title: "La peña te pide el pregón",
      description:
        "Han pasado años y siguen siendo ochenta, con más canas y más banderas. El presidente de la peña te llama con la voz rota: quieren que seas el pregonero de la fiesta del club. «Eres de los pocos que ha vuelto a cenar con nosotros cada año. No hay nadie que lo merezca más». Es un honor y una responsabilidad que nadie te pidió.",
      isMilestone: true,
      milestoneType: "carrera",
      imageScene:
        "Photorealistic photo of an older footballer giving a speech from a stage to a stadium crowd waving scarves and flags, golden hour light, emotional and proud, documentary sports photography",
      options: [
        {
          id: "a",
          label: "Aceptar y escribirlo tú mismo, a mano",
          subtitle: "Una carta de vuelta",
          consequences: { rel_aficion: 10, moral: 9, fama: 3, reputacion: 4, flags: { pregonero: true } },
          outcomeText:
            "Escribes el pregón en una libreta de tapas verdes, de madrugada, y lo lees delante de veinte mil personas con la voz temblando. Cuando llegas a «gracias por ser mi casa», el estadio se pone en pie sin que nadie lo pida.",
        },
        {
          id: "b",
          label: "Aceptar, pero pedirle ayuda a la peña para escribirlo",
          subtitle: "Un pregón de todos",
          consequences: { rel_aficion: 8, moral: 7, reputacion: 3, flags: { pregonero: true } },
          outcomeText:
            "Os reunís en el bar de la peña con folios y cañas. El resultado tiene cuatro letras de cada uno y una frase de un niño de nueve años que acaba siendo la mejor de todas.",
        },
      ],
    },
  },
  {
    id: "bank-casa-padre-estadio",
    family: "casa",
    when: { minAge: 17, maxAge: 28, patrimonio: [8000, 400000], flags: [] },
    event: {
      category: "vida",
      title: "Tu padre no se ha perdido ni un partido",
      description:
        "Tu padre lleva cuatro años cogiendo el autobús de línea para verte jugar. Siempre se sienta en la misma fila y siempre lleva el mismo termo con café y una chaqueta que le queda grande. Hoy, al salir, lo ves esperándote en el pasillo con la cabeza gacha, sin decirte nada. Alguien del club te comenta que el autobús de línea lo ha dejado a media hora del estadio otra vez.",
      options: [
        {
          id: "a",
          label: "Regalarle un abono con asiento reservado y coche para ir",
          subtitle: "Que no tenga que andar más",
          consequences: { patrimonio: -2800, moral: 6, rel_vestuario: 1 },
          thread: { kind: "deuda", who: "tu padre", text: "Le pagaste el abono y el coche para que no tuviera que volver a pie del estadio" },
          outcomeText:
            "Le das las llaves del coche en un sobre con un lazo de papel. Él no dice nada durante un rato largo. Luego, sin mirarte: «Esto lo vas a tener que explicar en casa». Y se le saltan las lágrimas con una media sonrisa.",
        },
        {
          id: "b",
          label: "Pedir que lo recoja un coche del club cada partido",
          subtitle: "Una solución discreta",
          consequences: { moral: 3, rel_vestuario: 1 },
          outcomeText:
            "El club lo arregla con una llamada. Tu padre sigue llevando su termo, pero ahora llega sin prisas y con los zapatos secos.",
        },
        {
          id: "c",
          label: "Acompañarlo tú a la parada y pasar la tarde con él",
          subtitle: "Tiempo antes que dinero",
          consequences: { moral: 7, forma: -1 },
          outcomeText:
            "Os sentáis juntos en el banco de la parada. Habláis de cosas pequeñas: del vecino, de los precios, de cuando eras un crío que no soltaba el balón ni para dormir. El autobús llega y sale. Vais a tardar un poco más en volver a casa.",
        },
      ],
    },
  },
  {
    id: "bank-casa-madre-camiseta",
    family: "casa",
    when: { after: [{ scene: "bank-casa-padre-estadio", minGap: 25, maxGap: 120 }], minAge: 20 },
    event: {
      category: "vida",
      title: "Tu madre guarda las entradas de cada partido",
      description:
        "Vuelves a casa por Navidad y la encuentras en el salón con una caja de zapatos sobre las rodillas. Dentro hay todas las entradas de todos los partidos que le han tocado: de infantiles, de juveniles, del primer equipo. Las ha ido ordenando por fechas, con una anotación a lápiz en el reverso: el resultado, si ganaste, si te pegaron, qué cara tenías al salir.",
      options: [
        {
          id: "a",
          label: "Pasar la tarde repasándolas con ella",
          subtitle: "Un viaje con la caja de por medio",
          consequences: { moral: 8, forma: 0, reputacion: 1, flags: { caja_entradas: true } },
          outcomeText:
            "Os pasáis las horas y las horas con la caja, entre risas y suspiros. En una entrada de hace nueve años pone: «No quiso cenar. Perdió 5-0. Mañana le haré croquetas». Y no puedes evitar llorar con la cara tapada.",
        },
        {
          id: "b",
          label: "Prometerle que las enmarcarás todas",
          subtitle: "Un museo con su letra",
          consequences: { moral: 6, patrimonio: -400, flags: { caja_entradas: true } },
          thread: { kind: "promesa", who: "tu madre", text: "Le prometiste enmarcar las entradas que ha guardado de todos tus partidos" },
          outcomeText:
            "Se lo dices sin saber cómo cumplirlo, y ella se ríe como si le hubieras prometido la luna. «Eso, hijo, cuando seas viejo y tengas casa grande».",
        },
        {
          id: "c",
          label: "Darle un beso y un abrazo sin decir más",
          subtitle: "A veces no hace falta nada más",
          consequences: { moral: 5 },
          outcomeText:
            "La abrazas por detrás en el sofá y apoyas la barbilla en su hombro. Ninguno de los dos dice nada. En la tele, sin volumen, alguien celebra un gol que nadie ve.",
        },
      ],
    },
  },
  {
    id: "bank-casa-madre-vitrina",
    family: "casa",
    when: { flags: ["caja_entradas"], minAge: 31, patrimonio: [60000, 100000000], after: [{ scene: "bank-casa-madre-camiseta", option: "b", minGap: 60, maxGap: 300 }] },
    event: {
      category: "vida",
      title: "La vitrina de las entradas",
      description:
        "Has cumplido lo que prometiste: una vitrina de madera de cerezo, con luz cálida, ocupa la pared del salón de tu madre. Dentro, ordenadas por fechas, están todas las entradas de todos tus partidos, cada una con su nota a lápiz. Tu madre no sabe dónde poner las manos y las mueve como una niña frente a un regalo demasiado grande.",
      isMilestone: true,
      milestoneType: "escena",
      imageScene:
        "Photorealistic photo of an elderly woman standing in her living room beside a glass display cabinet full of old football match tickets, her adult son in a suit hugging her from the side, warm lamplight, emotional family moment",
      options: [
        {
          id: "a",
          label: "Quedarte a ver con ella la primera entrada",
          subtitle: "Un rato, solo para los dos",
          consequences: { moral: 10, reputacion: 2 },
          outcomeText:
            "Os sentáis frente a la vitrina y ella te cuenta la primera: un partido de benjamines, en un campo de tierra, con lluvia, bajo un paraguas que no servía para nada. «Aquel día hiciste un gol. Uno. Y lloré más que si hubieras ganado el Mundial».",
        },
        {
          id: "b",
          label: "Hacerte una foto con ella y compartirla",
          subtitle: "Que lo vea la gente",
          consequences: { moral: 7, fama: 3, rel_aficion: 3 },
          outcomeText:
            "Subes la foto con una sola línea: «Mi madre, la mejor hincha». En unas horas la comparten medio millón de personas y la prensa deportiva se la lleva a portada.",
        },
      ],
    },
  },
];
