/**
 * Escenas condicionadas que no forman una cadena larga pero sí leen tu estado
 * real (dinero, relaciones, rol, lesión, cesión, edad): solo salen si
 * encajan, así que nunca son relleno. Algunas abren hilos o marcas que otras
 * familias recogen después.
 */
import type { BankScene } from "../types";

export const SUELTAS: BankScene[] = [
  {
    id: "bank-suelta-primera-nomina",
    family: "dinero",
    weight: 1.5,
    when: { minAge: 17, maxAge: 21, patrimonio: [1500, 40000], minWeek: 14, maxWeek: 80 },
    event: {
      category: "vida",
      title: "La primera nómina que se nota",
      description:
        "Abres la aplicación del banco en el vestuario y te quedas mirando los ceros. Es más dinero del que tu padre ve en tres meses. Un compañero veterano, que te vigila con el rabillo del ojo, suelta sin mirarte: «Esto es lo difícil, chaval. No ganarlo, sino saber qué hacer con ello el primer año».",
      options: [
        {
          id: "a",
          label: "Regalar algo grande a tu familia",
          subtitle: "Compartir lo que has conseguido",
          consequences: { patrimonio: -2500, moral: 6, rel_vestuario: 1 },
          outcomeText:
            "Le compras a tu madre una lavadora nueva y a tu padre un abrigo de verdad. Los dos te regañan por gastar y no pueden esconder que están encantados.",
        },
        {
          id: "b",
          label: "Ahorrar casi todo y vivir como antes",
          subtitle: "Pensar a largo plazo",
          consequences: { patrimonio: 800, moral: 1, reputacion: 2 },
          outcomeText:
            "Apartas un buen pellizco y sigues con tus zapatillas de siempre. El veterano te mira con respeto: «Esto sí es de jugador de verdad».",
        },
        {
          id: "c",
          label: "Darte un capricho a lo grande",
          subtitle: "Una vez en la vida",
          consequences: { patrimonio: -4000, moral: 7, fama: 1 },
          outcomeText:
            "Te compras un reloj que llevas dos años mirando en un escaparate. Lo llevas puesto al día siguiente, y el vestuario, claro, no deja pasar la ocasión de reírse un buen rato.",
        },
      ],
    },
  },
  {
    id: "bank-suelta-sueldo-evaporado",
    family: "dinero",
    when: { minAge: 19, maxAge: 33, patrimonio: [0, 2500], minWeek: 25, media: [58, 99] },
    event: {
      category: "vida",
      title: "El sueldo se ha ido sin que te des cuenta",
      description:
        "Haces cuentas en el sofá y no te cuadra nada: cenas, favores, un préstamo que nunca volvió, una cuota que no recordabas. Tu representante te mira con una ceja levantada. «No es que ganes poco. Es que lo que entra por una puerta sale por otra. Hay que ordenar esto o se te va a ir de las manos».",
      options: [
        {
          id: "a",
          label: "Pedirle que lleve tus cuentas con un gestor",
          subtitle: "Poner orden de una vez",
          consequences: { rel_representante: 3, reputacion: 2, moral: 2 },
          outcomeText:
            "Tu representante te presenta a un gestor serio, con jersey de cuello alto y calculadora de las de antes. En una semana tienes una hoja con colores y una cifra que, por primera vez, no te da miedo.",
        },
        {
          id: "b",
          label: "Recortar gastos tú mismo, sin ayuda",
          subtitle: "Aprender a base de números",
          consequences: { moral: 1, patrimonio: 600 },
          outcomeText:
            "Te instalas una aplicación y descubres que gastas ciento veinte euros al mes en suscripciones que no usas. Lo cancelas todo con una satisfacción culpable.",
        },
        {
          id: "c",
          label: "Pedirle a tu familia que te ayude a ordenarlo",
          subtitle: "Volver a las raíces",
          consequences: { moral: 5, rel_vestuario: 0 },
          outcomeText:
            "Tu madre trae una libreta de las de cuadros y tu padre unas gafas de leer que no usaba. Os pasáis una tarde entera apuntando todo. Al final, ella cierra la libreta: «Mira, hijo, ¿ves? No era tan grave».",
        },
      ],
    },
  },
  {
    id: "bank-suelta-hospital-infantil",
    family: "baja",
    weight: 1.3,
    when: { injured: true, fama: [18, 100], minAge: 18 },
    event: {
      category: "vida",
      title: "Una visita al hospital durante la baja",
      description:
        "Con la rodilla vendada y demasiado tiempo libre, el club te propone una visita al hospital infantil. Una niña de siete años, que lleva tres semanas ingresada, ha pedido conocerte porque su padre te pone en el móvil cada noche. «Pero sin cámaras, por favor, que no es un acto de marketing», aclara la enfermera.",
      options: [
        {
          id: "a",
          label: "Ir sin avisar a nadie y quedarte toda la tarde",
          subtitle: "Sin cámaras, de verdad",
          consequences: { moral: 7, rel_aficion: 3, reputacion: 3 },
          thread: { kind: "promesa", who: "la niña del hospital", text: "Prometiste invitarla a un partido cuando se pusiera bien" },
          outcomeText:
            "Te sientas en el borde de la cama y le cuentas cómo te rompiste la rodilla, con sonidos y todo. Ella se ríe tanto que la enfermera tiene que asomarse. Al salir, la niña te agarra la mano: «Tú también te vas a curar, ¿verdad?».",
        },
        {
          id: "b",
          label: "Ir un rato, con foto para el club",
          subtitle: "Un gesto bonito y visible",
          consequences: { moral: 4, rel_aficion: 4, fama: 2 },
          outcomeText:
            "Te haces una foto con la niña y su padre, con una camiseta firmada en brazos. Ella la enseña a todo el pasillo. Sabes que podías haber hecho más, pero también que hiciste algo.",
        },
        {
          id: "c",
          label: "Mandar una camiseta firmada y un vídeo",
          subtitle: "No puedes ir, pero te acuerdas",
          consequences: { moral: 1, rel_aficion: 1 },
          outcomeText:
            "El vídeo dura treinta segundos. La niña lo ve ocho veces seguidas, según el padre, que te escribe después un mensaje con tres corazones y un «gracias de verdad».",
        },
      ],
    },
  },
  {
    id: "bank-suelta-hospital-vuelve",
    family: "baja",
    when: { after: [{ scene: "bank-suelta-hospital-infantil", option: "a", minGap: 8, maxGap: 90 }] },
    event: {
      category: "vida",
      title: "La niña del hospital viene al estadio",
      description:
        "Han pasado semanas y un mensaje del padre llega sin avisar: ya le han dado el alta. La niña, con un gorro de lana y una bufanda del club al cuello, lleva toda la semana pidiendo ver «el partido de verdad». Tienes que decidir qué le preparas, porque lo prometido, con una criatura, es deuda sagrada.",
      isMilestone: true,
      milestoneType: "escena",
      imageScene:
        "Photorealistic photo of a young girl in a wool hat and club scarf standing in a stadium tunnel with a footballer kneeling beside her, soft light, emotional and gentle, documentary sports photography",
      options: [
        {
          id: "a",
          label: "Invitarla al palco y salir al campo con ella de la mano",
          subtitle: "Un partido que no olvidará",
          consequences: { moral: 9, rel_aficion: 6, fama: 3, reputacion: 4 },
          outcomeText:
            "Sales al campo con la niña de la mano ante veinte mil personas que se levantan sin saber por qué. Ella te aprieta los dedos cada vez que suena el himno. Esa noche, en el vestuario, nadie bromea con tus lágrimas.",
        },
        {
          id: "b",
          label: "Esperarla en el túnel, a solas, con su camiseta con nombre",
          subtitle: "Un momento solo para ella",
          consequences: { moral: 7, rel_aficion: 3, reputacion: 3 },
          outcomeText:
            "Le entregas una camiseta con su nombre en la espalda y un «10» enorme. La niña se la pone encima del abrigo y no se la quita en toda la tarde.",
        },
      ],
    },
  },
  {
    id: "bank-suelta-cedido-llamada",
    family: "cesion",
    weight: 1.4,
    when: { loan: true, minAge: 17 },
    event: {
      category: "representante",
      title: "Tu club de origen llama en mitad de la cesión",
      description:
        "Tu representante te llama con tono de noticia buena y mala a la vez: tu club de origen te quiere de vuelta en enero. Tu entrenador de aquí, en cambio, lleva días diciendo que sin ti se hunde la defensa que tan bien le ha salido. Tú, sentado en la mitad de dos camisetas, solo sabes que estás jugando como nunca.",
      options: [
        {
          id: "a",
          label: "Quedarte hasta que acabe la cesión",
          subtitle: "Terminar lo que empezaste",
          consequences: { moral: 5, rel_entrenador: 4, rel_vestuario: 3, rel_representante: -1 },
          outcomeText:
            "Cumples lo pactado. Tu entrenador de aquí te lo agradece con un abrazo torpe, y tu club de origen, con un silencio educado que sabes que no es del todo bueno.",
        },
        {
          id: "b",
          label: "Volver a enero y pelear por tu sitio",
          subtitle: "Volver con lo aprendido",
          consequences: { moral: 2, rel_entrenador: -3, rel_vestuario: -2, media: 1, forma: 2 },
          outcomeText:
            "Haces las maletas con el estómago encogido. En la despedida, el delantero suplente te regala una bufanda del club y te dice que, ojalá, vuelvas a verlo en una final.",
        },
      ],
    },
  },
  {
    id: "bank-suelta-derbi",
    family: "partido",
    when: { clubLevels: ["grande", "europeo"], fama: [45, 100], roles: ["titular", "rotacion"], minAge: 19 },
    event: {
      category: "vestuario",
      title: "La semana del derbi",
      description:
        "Desde el lunes, la ciudad huele a otra cosa. El panadero te desea suerte con un pellizco de amenaza, el taxista te sermonea sobre el rival y en la puerta del club hay pintadas que no estaban. El míster, que nunca da discursos largos, reúne al grupo el miércoles y dice solo una frase: «El derbi no se juega con las piernas, se juega con lo que cada uno lleva dentro».",
      options: [
        {
          id: "a",
          label: "Pasar la semana en casa, sin salir",
          subtitle: "Aislarte para estar fresco",
          consequences: { forma: 3, moral: -1 },
          outcomeText:
            "No pisas la calle en cuatro días. Pides sushi y ves vídeos del rival. Cuando llega el sábado, estás más fino que nunca, aunque un poco más solo.",
        },
        {
          id: "b",
          label: "Salir a la calle y hablar con la gente",
          subtitle: "Sentir lo que significa para ellos",
          consequences: { rel_aficion: 4, moral: 4, fama: 1 },
          outcomeText:
            "Tomas café con los de la peña, firmas una bufanda de un abuelo y escuchas a un chaval contarte, en plan técnico, cómo hay que ganar. Cuando se acerca el partido, ya no es un partido: es de todos.",
        },
        {
          id: "c",
          label: "Hablar con el capitán de cómo lo vive él",
          subtitle: "Aprender de quien ya ha estado aquí",
          consequences: { rel_vestuario: 3, moral: 3, reputacion: 1 },
          outcomeText:
            "El capitán, después de dos cafés, te cuenta su primer derbi: se desmayó en el túnel. «Y salí, y marqué. Con la cabeza, además». Te da una palmada que dura más de lo normal.",
        },
      ],
    },
  },
  {
    id: "bank-suelta-tregua-mister",
    family: "mister",
    weight: 1.4,
    when: { rel: { entrenador: [0, 36] }, minAge: 18, roles: ["suplente", "rotacion", "apartado", "titular"] },
    event: {
      category: "entrenamiento",
      title: "El míster y tú: una tregua",
      description:
        "Lleváis semanas hablándoos con monosílabos. En el vestuario se nota, en los entrenos se nota y en la grada, probablemente, también. Un día, al terminar el entrenamiento, el míster te pide que te quedes. Cierra la puerta, se sienta en un banco y dice: «Esto no está funcionando. Y no sé si es culpa mía o tuya. Probablemente de los dos».",
      options: [
        {
          id: "a",
          label: "Reconocer tu parte y proponer empezar de cero",
          subtitle: "Tender la mano primero",
          consequences: { rel_entrenador: 8, moral: 5, reputacion: 2, flags: { tregua_mister: true } },
          outcomeText:
            "Admites que has estado a la defensiva y que ni siquiera sabes desde cuándo. El míster respira hondo. «Yo tampoco he sido fácil». Os dais un apretón de manos que dura un segundo más del necesario.",
        },
        {
          id: "b",
          label: "Decirle todo lo que llevas dentro",
          subtitle: "Sin filtros, para bien o para mal",
          consequences: { rel_entrenador: 2, moral: 3, reputacion: 1 },
          outcomeText:
            "Se lo dices todo, con la voz un poco rota. Él escucha sin interrumpir y al final apunta algo. No cambia todo de un día para otro, pero esa noche duermes mejor.",
        },
        {
          id: "c",
          label: "Cortar la conversación: no hay nada que arreglar",
          subtitle: "Cada uno en su sitio",
          consequences: { rel_entrenador: -4, moral: -2 },
          outcomeText:
            "Dices que está todo bien y te vas. Tras cerrar la puerta, oyes cómo el míster deja caer el cuaderno contra el banco. No te giras.",
        },
      ],
    },
  },
  {
    id: "bank-suelta-tregua-historia",
    family: "mister",
    when: { after: [{ scene: "bank-suelta-tregua-mister", option: "a", minGap: 10, maxGap: 80 }] },
    event: {
      category: "entrenamiento",
      title: "El míster te cuenta por qué es como es",
      description:
        "En el autobús de vuelta de un partido fuera, el asiento de al lado se queda libre y el míster se sienta. No habla de táctica. Te cuenta que a los veintidós se rompió el cruzado y no volvió a ser el que era, y que todavía le duele ver jóvenes con talento que tiran por la borda lo que él nunca tuvo. «Por eso me pongo duro. No porque no confíe, sino porque me da miedo que lo pierdas».",
      options: [
        {
          id: "a",
          label: "Agradecerle que te lo cuente",
          subtitle: "Ver al hombre detrás del míster",
          consequences: { rel_entrenador: 6, moral: 6, reputacion: 2 },
          outcomeText:
            "No dices nada solemne: «gracias por contármelo». Él mira por la ventanilla, asiente y deja que el silencio haga el resto. A partir de ahora, tus entrenamientos dejarán de sonar a examen.",
        },
        {
          id: "b",
          label: "Contarle tú también algo que no le habías dicho",
          subtitle: "Compartir confidencias",
          consequences: { rel_entrenador: 7, moral: 7, reputacion: 3, flags: { mister_confidente: true } },
          thread: { kind: "secreto", who: "el míster", text: "Os contasteis en un autobús lo que nunca dijisteis a nadie" },
          outcomeText:
            "Le hablas del miedo a no ser suficiente, de las noches en vela. El míster no te interrumpe. Cuando terminas, apoya el puño en tu hombro: «De esto, ni una palabra. Ni a mi mujer». Y sabes que cumplirá.",
        },
      ],
    },
  },
];
