import fs from "node:fs";

const file = "src/game/director.ts";
let src = fs.readFileSync(file, "utf8");
const marker = "  /* ---------------- 11. FAMILIA ---------------- */";
if (!src.includes(marker)) throw new Error("Family arc marker not found");
if (src.includes('id: "arc_identidad"')) {
  console.log("Youth identity arc already present");
  process.exit(0);
}

const arc = `  /* ---------------- 10B. IDENTIDAD / ORIGEN ---------------- */
  {
    id: "arc_identidad",
    label: "Quién quieres ser",
    family: "identidad",
    requires: (s) => s.age <= 20 && s.stage !== "first",
    weight: (s) => 24 + (s.player.traits.includes("carismatico") ? 8 : 0) + (s.player.traits.includes("familiar") ? 5 : 0),
    chapters: [
      {
        family: "identidad",
        image: "press",
        category: "story",
        kicker: (c) => \`\${c.month} · ciudad deportiva\`,
        title: () => "Tu primera cámara",
        text: (c) =>
          \`El \${c.club} quiere grabar una pieza con tres canteranos y te ponen delante de una cámara por primera vez. Te preguntan de dónde vienes, a quién quieres parecerte y dónde te ves en cinco años. El responsable de comunicación te pide una frase más ambiciosa porque “queda mejor para redes”. Detrás de la cámara, dos compañeros esperan a ver qué personaje eliges ser.\`,
        freeform: "¿Qué dirías cuando te preguntan dónde te ves en cinco años?",
        choices: [
          {
            id: "ambicion",
            label: "Decir que quieres llegar al primer equipo",
            hint: "Te expones pronto",
            apply: (c) => {
              stat(c.s, "fame", 5);
              stat(c.s, "morale", 4);
              rel(c.s, "coach", -1);
              remember(c.s, "Delante de tu primera cámara dijiste que querías llegar al primer equipo");
              callback(c.s, "cb_primera_camara", "Aquel vídeo en el que prometiste llegar al primer equipo sigue circulando", 10);
              return { title: "Lo dices en voz alta", text: "El clip funciona y tu móvil empieza a llenarse de mensajes. Al día siguiente el entrenador te recuerda que las cámaras no entrenan por ti.", tone: "neutral" };
            },
          },
          {
            id: "origen",
            label: "Hablar de tu familia y de tu barrio",
            hint: "Menos titular, más raíz",
            apply: (c) => {
              rel(c.s, "family", 9);
              rel(c.s, "dressing", 4);
              stat(c.s, "fame", 2);
              remember(c.s, "En tu primera entrevista pusiste a tu familia y a tu barrio por delante del fútbol");
              return { title: "Sin personaje", text: "No das el titular que buscaban, pero en casa guardan el vídeo. En el vestuario alguno empieza a verte como alguien que no se ha olvidado de dónde viene.", tone: "good" };
            },
          },
          {
            id: "limite",
            label: "Pedir que no te conviertan en una promesa antes de tiempo",
            hint: "Marcas límites al club",
            apply: (c) => {
              stat(c.s, "discipline", 5);
              stat(c.s, "morale", 2);
              rel(c.s, "coach", 3);
              remember(c.s, "Pediste al club que no vendiera una versión de ti que todavía no existía");
              return { title: "Sin eslogan", text: "El responsable de comunicación resopla y corta esa parte. El entrenador, en cambio, te cruza en el pasillo y te dice que has hecho bien.", tone: "good" };
            },
          },
        ],
      },
      {
        family: "identidad",
        image: "family",
        category: "life",
        skip: "Unas semanas después",
        kicker: (c) => \`\${c.month} · mensaje pendiente\`,
        title: () => "El grupo del barrio",
        text: (c) =>
          \`El grupo de WhatsApp de tus amigos no para: este fin de semana juegan el torneo que disputabais desde niños. Quieren que vayas aunque sea a ver la final, pero el lunes tienes una sesión que el cuerpo técnico considera importante. Uno de tus amigos te suelta que “desde que estás en la cantera ya nunca puedes”. No es una gran crisis, pero por primera vez notas que tu vida antigua y la nueva ya no caben enteras en la misma agenda.\`,
        freeform: "¿Qué les contestas a tus amigos?",
        choices: [
          {
            id: "volver",
            label: "Ir unas horas y volver esa misma noche",
            hint: "Recuperas a los tuyos, llegas cansado",
            apply: (c) => {
              rel(c.s, "family", 6);
              stat(c.s, "morale", 7);
              stat(c.s, "fitness", -4);
              remember(c.s, "Volviste al torneo del barrio aunque al día siguiente entrenabas");
              return { title: "Dos vidas en un día", text: "No juegas ni un minuto, pero acabas celebrando como antes. El lunes las piernas pesan y la cabeza está bastante más ligera.", tone: "good", end: true };
            },
          },
          {
            id: "quedarte",
            label: "Quedarte y priorizar el entrenamiento",
            hint: "Profesionalidad con coste personal",
            apply: (c) => {
              stat(c.s, "discipline", 6);
              rel(c.s, "coach", 5);
              rel(c.s, "family", -3);
              remember(c.s, "Elegiste entrenar cuando tus amigos te pidieron volver al torneo del barrio");
              return { title: "El lunes primero", text: "Entrenas muy bien y el cuerpo técnico lo ve. En el grupo del barrio hay menos mensajes durante unos días.", tone: "neutral", end: true };
            },
          },
          {
            id: "invitar",
            label: "Invitarlos a verte entrenar otro día",
            hint: "Intentas unir las dos vidas",
            apply: (c) => {
              rel(c.s, "family", 5);
              rel(c.s, "dressing", 2);
              stat(c.s, "discipline", 2);
              remember(c.s, "Intentaste que tus amigos entendieran tu nueva vida en vez de desaparecer de la suya");
              return { title: "Que vean tu mundo", text: "No arregla el torneo perdido, pero dos semanas después aparecen en la valla de la ciudad deportiva. Entienden un poco mejor por qué ya no siempre puedes estar.", tone: "good", end: true };
            },
          },
        ],
      },
    ],
  },

`;

src = src.replace(marker, arc + marker);
fs.writeFileSync(file, src);
console.log("Added coherent youth identity arc with two chapters and three choices each.");
