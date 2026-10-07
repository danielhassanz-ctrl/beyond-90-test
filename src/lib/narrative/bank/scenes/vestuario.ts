/**
 * Familias del vestuario: "El brazalete" (llegar a capitán y lo que cuesta) y
 * "El canterano" (el chaval que viene detrás: maestro o rival, y cómo te lo
 * devuelve diez años después). Solo salen si el vestuario te respeta y tu
 * rendimiento lo justifica; lo que eliges aquí vuelve, por escrito.
 */
import type { BankScene } from "../types";

export const VESTUARIO: BankScene[] = [
  {
    id: "bank-capitan-brazalete",
    family: "brazalete",
    weight: 1.4,
    when: { minAge: 24, maxAge: 35, rel: { vestuario: [68, 100] }, media: [64, 99], roles: ["titular", "rotacion"], notFlags: ["capitan_equipo", "capitan_cede"] },
    event: {
      category: "vestuario",
      title: "El capitán te mira el brazo",
      description:
        "Después del entrenamiento, el capitán se queda el último en el vestuario, con la toalla al cuello y cara de haber ensayado la frase en la ducha. «Esto se me acaba, chaval. Y cuando yo me vaya, alguien tendrá que llevar el brazalete. Y no quiero que sea el que más habla, sino el que más escucha.» Te señala con el mentón, sin decir tu nombre.",
      options: [
        {
          id: "a",
          label: "Aceptar el reto con humildad",
          subtitle: "Llevar el brazalete cuando él se vaya",
          consequences: { rel_vestuario: 4, moral: 4, reputacion: 2, flags: { capitan_equipo: true } },
          thread: { kind: "promesa", who: "el capitán", text: "Le prometiste cuidar del vestuario como él lo cuidó" },
          outcomeText:
            "No dices nada épico. Solo «lo intentaré», y él asiente despacio, como quien confía en una firma dada a mano. Al salir, un compañero te choca el hombro: «Se te nota en la cara, capi».",
        },
        {
          id: "b",
          label: "Proponer a otro compañero más veterano",
          subtitle: "Respeto antes que ambición",
          consequences: { rel_vestuario: 3, reputacion: 2, flags: { capitan_cede: true } },
          outcomeText:
            "Sugieres a otro, con más años y más cicatrices. El capitán sonríe con un punto de decepción y otro de orgullo: «Eso también es liderar, aunque no te des cuenta».",
        },
        {
          id: "c",
          label: "Decirle que prefieres jugar, no mandar",
          subtitle: "Honestidad antes que galones",
          consequences: { moral: 1, rel_vestuario: -1, flags: { capitan_cede: true } },
          outcomeText:
            "Se lo dices sin rodeos. Él se encoge de hombros: «Nadie lo quiere hasta que le toca». Te da una palmada que suena a «ya hablaremos».",
        },
      ],
    },
  },
  {
    id: "bank-capitan-discurso",
    family: "brazalete",
    when: { after: [{ scene: "bank-capitan-brazalete", option: "a", minGap: 8, maxGap: 45 }], roles: ["titular", "rotacion"] },
    event: {
      category: "vestuario",
      title: "Te toca hablar antes del partido grande",
      description:
        "Faltan quince minutos para salir. El míster se aparta a la pizarra y, sin avisar, te cede la palabra: «Capitán, di algo». El vestuario se queda en silencio, con las botas a medio atar y la mirada en el suelo. Todos esperan el discurso. Tú solo tienes un nudo en la garganta.",
      options: [
        {
          id: "a",
          label: "Hablar con el corazón, sin guion",
          subtitle: "Arriesgarte a decir lo que sientes",
          consequences: {},
          resolve: {
            baseChance: 0.62,
            statModifier: "moral",
            success: {
              text: "Dices tres cosas simples: de dónde vienes, a quién tienes al lado y qué vas a dejar en el campo. Cuando terminas, alguien da un golpe en la taquilla y todos se levantan. El estadio, al salir, parece más pequeño.",
              consequences: { rel_vestuario: 8, moral: 6, media: 1, reputacion: 2 },
            },
            fail: {
              text: "Se te traba la lengua en la segunda frase y acabas diciendo «salid y ya está». Alguien se ríe, nervioso. Pero al salir, el lateral te coge del cuello: «Mejor eso que un discurso de cartón».",
              consequences: { rel_vestuario: 2, moral: -2 },
            },
          },
        },
        {
          id: "b",
          label: "Leer lo que has preparado en el móvil",
          subtitle: "Orden y seguridad",
          consequences: { rel_vestuario: 2, reputacion: 1 },
          outcomeText:
            "Lees el texto con voz firme. Es correcto, es limpio y es inofensivo. Nadie se emociona, pero nadie se ríe tampoco, y a veces eso es todo lo que hace falta.",
        },
        {
          id: "c",
          label: "Ceder la palabra al más veterano",
          subtitle: "Que hable la experiencia",
          consequences: { rel_vestuario: 3, reputacion: 1 },
          outcomeText:
            "El central de treinta y siete años carraspea, mira la pared y suelta cuatro frases con más autoridad que un máster de liderazgo. Al acabar te lanza una mirada de gratitud torcida.",
        },
      ],
    },
  },
  {
    id: "bank-capitan-conflicto",
    family: "brazalete",
    when: { after: [{ scene: "bank-capitan-brazalete", option: "a", minGap: 25, maxGap: 100 }], roles: ["titular", "rotacion"] },
    event: {
      category: "vestuario",
      title: "Hugo falta al entrenamiento",
      description:
        "Hugo Barral, el extremo de diecinueve años que acabas de ver crecer, no aparece a las diez. Ni a las diez y cuarto. El míster mira el reloj con la mandíbula apretada y te llama aparte: «Esto lo gestionas tú, que para eso llevas el brazalete. O lo gestiono yo, y no te va a gustar cómo».",
      options: [
        {
          id: "a",
          label: "Ir a buscarlo a su casa y hablar a solas",
          subtitle: "Sin cámaras, sin público",
          consequences: { rel_vestuario: 3, moral: 2, reputacion: 2 },
          thread: { kind: "favor", who: "Hugo Barral", text: "Fuiste a buscarlo a casa un día que se hundió y le cubriste las espaldas ante el míster" },
          outcomeText:
            "Lo encuentras en el sofá, con el móvil apagado y los ojos hinchados. No le echas una bronca. Te sientas a su lado y le cuentas la vez que tú también quisiste desaparecer. A las doce lo llevas al campo en tu coche.",
        },
        {
          id: "b",
          label: "Multar a todo el grupo para dar ejemplo",
          subtitle: "Mano dura, pero justa",
          consequences: { rel_vestuario: -4, rel_entrenador: 3, reputacion: 1 },
          outcomeText:
            "La multa colectiva cae como un jarro de agua fría. El míster asiente satisfecho; en el vestuario, alguien murmura «el capi se ha vuelto policía». Hugo aparece al día siguiente, rojo como un tomate.",
        },
        {
          id: "c",
          label: "Dejar que lo gestione el míster",
          subtitle: "No es tu papel",
          consequences: { rel_entrenador: 1, rel_vestuario: -2 },
          outcomeText:
            "Te lavas las manos con educación. El míster lo suspende dos partidos y en el vestuario nadie te mira a los ojos esa semana. No es culpa, pero se le parece.",
        },
      ],
    },
  },
  {
    id: "bank-capitan-gracias",
    family: "brazalete",
    when: { after: [{ scene: "bank-capitan-conflicto", option: "a", minGap: 20, maxGap: 140 }] },
    event: {
      category: "vestuario",
      title: "Hugo te devuelve el favor",
      description:
        "Hugo Barral, ya titular y con el dorsal fijo, te espera en el parking con una caja de cartón. Dentro hay un balón del partido en el que marcó su primer hat-trick, firmado por todo el vestuario y con una frase torcida en rotulador: «Al capi, que me sacó del sofá». Tiene los ojos brillantes y no quiere que lo notes.",
      isMilestone: true,
      milestoneType: "escena",
      imageScene:
        "Photorealistic photo of two footballers in training kits in a stadium parking lot at dusk, the younger one handing a signed match ball to the older one, emotional but understated moment, natural light",
      options: [
        {
          id: "a",
          label: "Abrazarlo y decirle que era lo mínimo",
          subtitle: "Emoción sin discursos",
          consequences: { moral: 8, rel_vestuario: 5, reputacion: 3, flags: { ahijado_hugo: "Hugo Barral" } },
          outcomeText:
            "Lo abrazas sin decir nada y él se aprieta contra tu hombro como un crío. «Cuando te retires, voy a llevar yo el brazalete», dice. «Y te dejaré el balón en la vitrina.»",
        },
        {
          id: "b",
          label: "Quedarte el balón y devolverle otro regalo",
          subtitle: "Una buena costumbre",
          consequences: { patrimonio: -600, moral: 5, rel_vestuario: 3, flags: { ahijado_hugo: "Hugo Barral" } },
          outcomeText:
            "Al día siguiente le regalas unas botas hechas a medida con su nombre en el talón. Hugo se las prueba en el vestuario con la cara de quien abre un coche nuevo.",
        },
      ],
    },
  },
  {
    id: "bank-canterano-copia",
    family: "canterano",
    weight: 1.3,
    when: { minAge: 24, maxAge: 33, roles: ["titular"], media: [66, 99], rel: { entrenador: [45, 100] }, positions: ["Delantero", "Centro", "Extremo"] },
    event: {
      category: "entrenamiento",
      title: "El canterano que se peina como tú",
      description:
        "Hay un chaval de dieciocho años que entrena con el primer equipo desde septiembre: Iván Cortés. Se ha cortado el pelo como tú, celebra como tú y, según el utillero, ha empezado a pedir el mismo número de botas que usas. En el rondo, se coloca justo detrás de ti y copia el movimiento de caderas. No sabes si es un homenaje o una amenaza.",
      options: [
        {
          id: "a",
          label: "Enseñarle los trucos que a ti te enseñaron",
          subtitle: "Pasar el testigo",
          consequences: { rel_vestuario: 3, moral: 3, reputacion: 2 },
          thread: { kind: "favor", who: "Iván Cortés", text: "Le enseñaste tus trucos de delantero cuando era un canterano de dieciocho años" },
          outcomeText:
            "Después del entreno le muestras el desmarque de ruptura y el truco del primer toque. Iván apunta todo en el móvil. «No lo apuntes, ¡hazlo!», le dices, y se ríe por primera vez en meses.",
        },
        {
          id: "b",
          label: "Ignorarlo: cada uno que se gane el sitio",
          subtitle: "Distancia profesional",
          consequences: { moral: 0 },
          outcomeText:
            "No le dedicas ni un comentario. Iván sigue copiando tus movimientos desde lejos, aprendiendo sin pedir permiso. Al final de la semana, ya te sabe de memoria.",
        },
        {
          id: "c",
          label: "Picarle: «Este sitio no se regala»",
          subtitle: "Competencia sin anestesia",
          consequences: { rel_vestuario: -2, moral: 1 },
          outcomeText:
            "Se lo sueltas con una sonrisa que no es del todo amable. Iván traga saliva y asiente. En el vestuario, el lateral te mira de reojo: «Qué dura eres con los críos».",
        },
      ],
    },
  },
  {
    id: "bank-canterano-debut",
    family: "canterano",
    when: { after: [{ scene: "bank-canterano-copia", option: "a", minGap: 8, maxGap: 45 }] },
    event: {
      category: "partido",
      title: "El debut de Iván Cortés",
      description:
        "El míster mete a Iván en el minuto 78 y el chaval sale como quien entra en un templo: con miedo y con ganas. A los cuatro minutos, recibe un pase tuyo, se gira como le enseñaste y la mete por la escuadra. Corre hacia ti, con los brazos abiertos y la boca abierta de par en par, y te grita algo que no se entiende pero que parece «gracias».",
      isMilestone: true,
      milestoneType: "escena",
      imageScene:
        "Photorealistic photo of a young footballer celebrating his first professional goal, running to hug an older teammate in a packed stadium, joyful tears, floodlights",
      options: [
        {
          id: "a",
          label: "Levantarlo en brazos delante de la grada",
          subtitle: "Que lo vea todo el estadio",
          consequences: { rel_vestuario: 5, rel_aficion: 4, moral: 7, fama: 2, flags: { padrino_ivan: "Iván Cortés" } },
          outcomeText:
            "Lo levantas en vilo y la grada ruge. En la rueda de prensa, Iván dirá: «Lo he hecho por él». Y tú harás como que no oyes, porque si no se te nota demasiado en la cara.",
        },
        {
          id: "b",
          label: "Dejarle el protagonismo y quitarte de en medio",
          subtitle: "Que brille él solo",
          consequences: { rel_vestuario: 4, moral: 5, reputacion: 2, flags: { padrino_ivan: "Iván Cortés" } },
          outcomeText:
            "Te apartas de la foto y le dejas el foco. Iván, en el túnel, te agarra del brazo: «¿Por qué te vas?». «Porque esto es tuyo, chaval.»",
        },
      ],
    },
  },
  {
    id: "bank-canterano-rivalidad",
    family: "canterano",
    when: { after: [{ scene: "bank-canterano-copia", option: "c", minGap: 6, maxGap: 35 }], roles: ["titular", "rotacion"] },
    event: {
      category: "partido",
      title: "Iván te quita el puesto por una semana",
      description:
        "El míster ha dado a Iván la titularidad ante el rival más difícil de la jornada, y tú te sientas en el banquillo con la camiseta de calentamiento. La prensa lo ha notado: «El canterano que le gana el pulso a la estrella». Iván, a lo lejos, no te mira. Sabes que, esta vez, el que lo ha provocado has sido tú.",
      options: [
        {
          id: "a",
          label: "Aplaudirle desde el banquillo y felicitarle después",
          subtitle: "Dar la talla fuera del campo",
          consequences: { rel_vestuario: 4, rel_entrenador: 2, moral: 2, reputacion: 3 },
          outcomeText:
            "Al final del partido le tiendes la mano. Iván duda un segundo y te la estrecha: «Gracias... por lo del otro día». Y no entiendes, hasta que lo piensas, que tiene razón: debías pedirle perdón tú.",
        },
        {
          id: "b",
          label: "Responder en rueda de prensa con ironía",
          subtitle: "Una frase afilada, otra vez",
          consequences: { fama: 3, rel_vestuario: -4, rel_entrenador: -2, moral: -1 },
          outcomeText:
            "Dices que «la experiencia no se improvisa» y los periodistas se relamen. Al día siguiente, el titular es tuyo, y el vestuario ha dejado de reírse de tus bromas.",
        },
      ],
    },
  },
  {
    id: "bank-canterano-maestro",
    family: "canterano",
    when: { after: [{ scene: "bank-canterano-debut", minGap: 60, maxGap: 220 }], minAge: 29 },
    event: {
      category: "prensa",
      title: "«Fue mi maestro»",
      description:
        "Iván Cortés ya no es el chaval del peinado copiado: es el delantero del que hablan los periódicos y el nombre en las camisetas de los críos. En rueda de prensa, delante de cuarenta micrófonos, le preguntan quién le enseñó a jugar. Él te busca con la mirada en la sala, aunque no estés, y contesta sin pensarlo: «Mi maestro tenía el dorsal de siempre y cinco minutos de paciencia para un chaval que no sabía nada».",
      isMilestone: true,
      milestoneType: "carrera",
      imageScene:
        "Photorealistic photo of a young star footballer at a press conference table with microphones, smiling and looking toward the camera with emotion, modern sports media style",
      options: [
        {
          id: "a",
          label: "Responder con un mensaje corto y sincero",
          subtitle: "«Se lo ganó él solo»",
          consequences: { fama: 4, moral: 8, reputacion: 4, flags: { maestro_ivan: true } },
          outcomeText:
            "Escribes tres líneas desde el móvil, sin adornos. Iván las lee en el vestuario y las guarda en una carpeta que ya no borrará nunca.",
        },
        {
          id: "b",
          label: "Invitarlo a cenar en tu casa",
          subtitle: "Una conversación sin cámaras",
          consequences: { moral: 7, reputacion: 3, flags: { maestro_ivan: true } },
          outcomeText:
            "Cenáis en la cocina, con las zapatillas puestas. Iván te cuenta lo que nadie preguntó: lo solo que se sentía el primer día y cómo tu «tranquilo» le cambió el invierno.",
        },
      ],
    },
  },
];
