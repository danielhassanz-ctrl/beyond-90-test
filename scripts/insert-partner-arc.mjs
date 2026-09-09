import { readFileSync, writeFileSync } from "node:fs";

const path = "src/game/director.ts";
let src = readFileSync(path, "utf8");

if (src.includes('id: "arc_pareja"')) {
  console.log("PARTNER_ARC_ALREADY_PRESENT");
  process.exit(0);
}

const marker = '  /* ---------------- 12. ESTRELLA / LEGADO ---------------- */';
const index = src.indexOf(marker);
if (index < 0) throw new Error("Partner arc insertion marker not found");
if (src.indexOf(marker, index + marker.length) >= 0) throw new Error("Partner arc insertion marker is not unique");

const arc = `  /* ---------------- 11B. VIDA EN PAREJA ---------------- */
  {
    id: "arc_pareja",
    label: "Vida en pareja",
    family: "pareja",
    requires: (s) => s.age >= 18 && s.age <= 34 && s.stage !== "youth" && s.flags["partner_closed"] !== 1,
    weight: (s) => (s.age <= 24 ? 18 : 11) + (s.player.traits.includes("familiar") ? 5 : 0),
    open: (s) => ({ partner: npc(s, "partner").name }),
    chapters: [
      {
        family: "pareja",
        image: "travel",
        category: "life",
        kicker: (c) => \\`Fuera del fútbol · \\${c.month}\\`,
        title: () => "Una conversación que no va de minutos",
        text: (c) =>
          \\`\${npc(c.s, "friend").name} insiste en que vayas al cumpleaños de un amigo común. Allí conoces a \${c.arc.params["partner"]}, que no te pregunta cuántos goles llevas ni cuánto cobras. Dos horas después sigues hablando y por primera vez en semanas has olvidado mirar el móvil. Al despedirse te dice: "si quieres otro café, que no sea después de un partido".\\`,
        freeform: "¿Qué le escribes al día siguiente?",
        choices: [
          {
            id: "quedar",
            label: "Proponer otro café esa semana",
            hint: "Abres espacio para alguien fuera del fútbol",
            apply: (c) => {
              flag(c.s, "partner_active", 1);
              npcMood(c.s, "partner", 12);
              stat(c.s, "morale", 7);
              remember(c.s, \\`Conociste a \${c.arc.params["partner"]} y decidiste darle espacio en tu vida\\`);
              callback(c.s, "cb_partner_inicio", \\`\${c.arc.params["partner"]} recuerda cómo empezó todo cuando tu carrera se complica\\`, 10);
              return { title: "Segundo café", text: \\`Quedáis sin fotógrafos, sin compañeros y sin hablar del próximo rival durante casi una hora. \${c.arc.params["partner"]} empieza a formar parte de tu semana.\\`, tone: "good" };
            },
          },
          {
            id: "privado",
            label: "Quedar, pero pedir máxima discreción",
            hint: "Relación sí; foco mediático, no",
            apply: (c) => {
              flag(c.s, "partner_active", 1);
              flag(c.s, "partner_private", 1);
              npcMood(c.s, "partner", 5);
              stat(c.s, "discipline", 4);
              stat(c.s, "morale", 4);
              remember(c.s, \\`Empezaste a ver a \${c.arc.params["partner"]} con una regla: nada de exposición pública\\`);
              return { title: "Fuera de cámara", text: \\`\${c.arc.params["partner"]} acepta la discreción, pero te avisa de que una relación no puede sentirse como un secreto para siempre.\\`, tone: "neutral" };
            },
          },
          {
            id: "ahora_no",
            label: "Decir que ahora mismo no puedes con algo más",
            hint: "Proteges el foco deportivo y cierras esta historia",
            apply: (c) => {
              flag(c.s, "partner_active", 0);
              flag(c.s, "partner_closed", 1);
              stat(c.s, "discipline", 3);
              stat(c.s, "morale", -2);
              remember(c.s, \\`Elegiste no empezar una relación con \${c.arc.params["partner"]} porque el fútbol ocupaba todo\\`);
              return { title: "No es el momento", text: \\`Lo entiende y no insiste. Guardas el teléfono y vuelves a la rutina con una sensación difícil de clasificar.\\`, tone: "neutral", end: true };
            },
          },
        ],
      },
      {
        family: "pareja",
        image: "press",
        category: "gossip",
        skip: "Unos meses después",
        kicker: (c) => \\`Rumor · \\${c.month}\\`,
        title: () => "Una foto cenando",
        text: (c) =>
          \\`Una cuenta pequeña publica una foto borrosa: tú y \${c.arc.params["partner"]} cenando en una terraza. A la mañana siguiente hay mensajes de compañeros, dos periodistas preguntando y un empleado del club recordándote que "no tienes que explicar nada". \${c.arc.params["partner"]} te pregunta qué vas a hacer antes de leer comentarios.\\`,
        freeform: "¿Qué dices si un periodista te pregunta por la foto?",
        choices: [
          {
            id: "confirmar",
            label: "Confirmarlo sin convertirlo en espectáculo",
            hint: "Más exposición, menos sensación de secreto",
            apply: (c) => {
              flag(c.s, "partner_public", 1);
              npcMood(c.s, "partner", 10);
              stat(c.s, "fame", 7);
              stat(c.s, "morale", 3);
              remember(c.s, \\`Confirmaste públicamente tu relación con \${c.arc.params["partner"]}\\`);
              return { title: "Sí, estamos juntos", text: \\`Una frase y nada más. El titular dura un día; a \${c.arc.params["partner"]} le importa bastante más que no hayas fingido que estaba allí por casualidad.\\`, tone: "good" };
            },
          },
          {
            id: "privacidad",
            label: "Pedir respeto y no confirmar detalles",
            hint: "Proteges la relación sin mentir",
            apply: (c) => {
              flag(c.s, "partner_private", 1);
              npcMood(c.s, "partner", 7);
              stat(c.s, "discipline", 5);
              stat(c.s, "fame", 2);
              remember(c.s, \\`Defendiste la privacidad de tu relación sin negar a \${c.arc.params["partner"]}\\`);
              return { title: "Hasta aquí", text: \\`"Mi vida privada es privada". No da para tres portadas, pero en casa la frase se recibe mejor que cualquier exclusiva.\\`, tone: "good" };
            },
          },
          {
            id: "negar",
            label: "Negarlo para cortar el ruido",
            hint: "El rumor baja; la relación paga el precio",
            apply: (c) => {
              npcMood(c.s, "partner", -16);
              stat(c.s, "fame", -1);
              stat(c.s, "morale", -6);
              callback(c.s, "cb_partner_negado", \\`\${c.arc.params["partner"]} no ha olvidado que negasteis la relación delante de una cámara\\`, 7);
              remember(c.s, \\`Negaste públicamente tu relación con \${c.arc.params["partner"]} para apagar un rumor\\`);
              return { title: "No hay nada", text: \\`El titular se muere rápido. La conversación con \${c.arc.params["partner"]} esa noche dura bastante más.\\`, tone: "bad" };
            },
          },
        ],
      },
      {
        family: "pareja",
        image: "travel",
        category: "life",
        skip: "Temporadas después",
        kicker: (c) => \\`Vida · \\${c.month}\\`,
        title: () => "Otra ciudad",
        text: (c) =>
          \\`Tu carrera vuelve a moverse y aparece la conversación que habíais evitado: otra ciudad, otra casa y otro calendario. \${c.arc.params["partner"]} tiene su propia vida y no quiere que cada mercado de fichajes decida por los dos. No es una discusión de una noche; lleváis semanas posponiéndola. Esta vez hay que elegir cómo seguir.\\`,
        choices: [
          {
            id: "juntos",
            label: "Construir el siguiente paso juntos",
            hint: "Más compromiso y más coste personal",
            apply: (c) => {
              const f = ensureFinance(c.s);
              const moveCost = Math.min(f.cash, 40);
              f.cash -= moveCost;
              flag(c.s, "partner_active", 1);
              flag(c.s, "partner_long_distance", 0);
              npcMood(c.s, "partner", 14);
              stat(c.s, "morale", 9);
              rel(c.s, "family", 5);
              milestone(c.s, \\`Construiste una vida estable con \${c.arc.params["partner"]}\\`);
              remember(c.s, \\`Elegiste que el siguiente cambio de ciudad se decidiera junto a \${c.arc.params["partner"]}\\`);
              return { title: "Dos nombres en la mudanza", text: \\`Por primera vez el nuevo destino no se decide solo mirando minutos y salario. Perdéis comodidad, ganáis una casa que se siente de los dos.\\`, tone: "gold", end: true };
            },
          },
          {
            id: "distancia",
            label: "Probar una etapa a distancia",
            hint: "Mantienes ambas carreras, con desgaste real",
            apply: (c) => {
              flag(c.s, "partner_active", 1);
              flag(c.s, "partner_long_distance", 1);
              npcMood(c.s, "partner", -4);
              stat(c.s, "discipline", 4);
              stat(c.s, "morale", -3);
              callback(c.s, "cb_partner_distancia", \\`La distancia con \${c.arc.params["partner"]} lleva meses acumulando aeropuertos y conversaciones aplazadas\\`, 9);
              remember(c.s, \\`Tú y \${c.arc.params["partner"]} decidisteis intentar una relación a distancia\\`);
              return { title: "Dos calendarios", text: \\`Aprendéis horarios de vuelos y a cenar por videollamada. Funciona de momento; nadie promete que sea gratis.\\`, tone: "neutral", end: true };
            },
          },
          {
            id: "terminar",
            label: "Aceptar que vuestras vidas se han separado",
            hint: "Cierra la relación y deja una huella emocional",
            apply: (c) => {
              flag(c.s, "partner_active", 0);
              flag(c.s, "partner_closed", 1);
              flag(c.s, "partner_ex", 1);
              npcMood(c.s, "partner", -25);
              stat(c.s, "morale", -12);
              remember(c.s, \\`Tu relación con \${c.arc.params["partner"]} terminó cuando vuestras vidas dejaron de caber en la misma ciudad\\`);
              callback(c.s, "cb_partner_ex", \\`Tiempo después vuelves a cruzarte con \${c.arc.params["partner"]}\\`, 12);
              return { title: "Se acaba sin villanos", text: \\`No hay portazos. Dos maletas, una conversación larga y la sensación de que el fútbol también cobra cosas que no salen en el contrato.\\`, tone: "bad", end: true };
            },
          },
        ],
      },
    ],
  },

`;

src = src.slice(0, index) + arc + src.slice(index);
if (!src.includes('id: "arc_pareja"')) throw new Error("Partner arc was not inserted");
writeFileSync(path, src);
console.log("PARTNER_ARC_INSERTED_OK");
