import type { Consequences, EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";

/**
 * La búsqueda del primer club, hasta ahora, no existía como tal: en
 * cuanto el jugador elegía representante, el turno siguiente SIEMPRE
 * traía ya las ofertas de club, sin ninguna espera ni incertidumbre de
 * por medio — puramente mecánico. Pedido explícito: que el principio
 * tenga emoción real ("a veces no encontramos nada", "hay un grande que
 * te ha visto", "grábate vídeos y súbelos a redes"), no siempre lo mismo.
 *
 * Mecanismo: al elegir agente, cada carrera sortea (de forma
 * determinista por el id del jugador, sin guardar nada hasta que hace
 * falta) cuántos turnos de espera va a vivir antes de que lleguen las
 * ofertas de verdad — entre 0 (suerte, ofertas inmediatas) y 3 (una
 * búsqueda larga y tensa). Cada turno de espera muestra una escena
 * distinta del pool de abajo, con anti-repetición como en
 * preseason-life.ts. Si el jugador decide grabarse vídeos y le sale
 * bien, además de fama sube las opciones de que aparezca un club grande
 * entre las ofertas finales (ver hadViralMoment + constants.ts).
 */
const MAX_WAIT_TURNS = 3;

function mixSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  return h >>> 0;
}

function totalWaitTurns(player: Player): number {
  return mixSeed(`${player.id}:busqueda-total`) % (MAX_WAIT_TURNS + 1);
}

export function shouldTriggerBusquedaEquipo(player: Player): boolean {
  if (!player.agent_name) return false;
  const fase = Number(player.flags?.busqueda_fase ?? 0);
  return fase < totalWaitTurns(player);
}

/** Si el jugador tuvo un vídeo viral durante la búsqueda, las ofertas finales tienen más opciones de incluir un club grande. */
export function hadViralMoment(player: Pick<Player, "flags">): boolean {
  return player.flags?.busqueda_viral === "yes";
}

interface Ctx {
  agent: string;
}

type Opt = Omit<EventOption, "id"> & { id?: string };
interface Tpl {
  key: string;
  title: string;
  desc: (c: Ctx) => string;
  opts: (c: Ctx, fase: number) => Opt[];
}

const TEMPLATES: Tpl[] = [
  {
    key: "trabajando-en-ello",
    title: "Moviendo tu nombre",
    desc: (c) => `${c.agent} te llama para ponerte al día: "Estoy moviendo tu nombre entre varios clubes, pero esto lleva su tiempo. No te desesperes todavía."`,
    opts: () => [
      { label: "Confiar y tener paciencia", subtitle: "Dejar que tu agente trabaje", consequences: { moral: 1 }, outcomeText: "Tu agente lo agradece: 'Así me gusta, cabeza fría.' Cuelgas con la sensación de que de verdad sigue en ello." },
      { label: "Preguntar directamente qué clubes hay en danza", subtitle: "Necesitas saber algo concreto", consequences: { moral: -1, rel_representante: 1 }, outcomeText: "Tu agente duda un segundo de más antes de soltar dos nombres, ninguno muy convincente. Al menos ya no es un misterio total." },
      {
        label: "Grabarte entrenando y subirlo a redes por tu cuenta",
        subtitle: "Ayudar mientras esperas",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          success: {
            text: "Uno de los vídeos se mueve más de lo esperado dentro del mundillo del fútbol base — varios ojeadores lo comparten entre ellos.",
            consequences: { fama: 4, moral: 3 },
          },
          fail: {
            text: "Los vídeos pasan sin pena ni gloria, unas pocas decenas de visitas. No ha hecho daño, pero tampoco ha cambiado nada.",
            consequences: { moral: -1 },
          },
        },
      },
    ],
  },
  {
    key: "de-momento-nada",
    title: "De momento, nada",
    desc: (c) => `${c.agent} no se anda con rodeos: "Nada todavía. Ningún club ha mordido el anzuelo esta semana. Estas cosas a veces tardan más de lo que gustaría."`,
    opts: (c) => [
      { label: "Mantener la calma", subtitle: "Confiar en que llegará", consequences: { moral: 1 }, outcomeText: `${c.agent} valora el temple: "Eso es, no hay prisa que valga."` },
      { label: "Frustrarte y decírselo a tu agente", subtitle: "La espera empieza a pesar", consequences: { moral: -2, rel_representante: -1 }, outcomeText: `${c.agent} encaja el golpe sin mucho drama: "Lo entiendo, pero gritarme a mí no mueve ningún fichaje."` },
      {
        label: "Proponerle tú la idea de subir contenido a TikTok e Instagram",
        subtitle: "Hacer algo en vez de solo esperar",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          success: {
            text: `${c.agent} se sorprende de que se te haya ocurrido a ti: "No es mala idea, la verdad." Uno de los vídeos empieza a circular más de lo esperado.`,
            consequences: { fama: 4, moral: 2, rel_representante: 1 },
          },
          fail: {
            text: "Los vídeos apenas se mueven. Al menos ya no sientes que estás completamente parado.",
            consequences: { moral: 1 },
          },
        },
      },
    ],
  },
  {
    key: "grande-te-ha-visto",
    title: "Un grande te ha visto",
    desc: (c) => `${c.agent} te llama con la voz distinta a las otras veces: "Un ojeador de un club grande estuvo en tu último partido. No es nada seguro todavía, pero quería que lo supieras."`,
    opts: (c) => [
      { label: "Ilusionarte abiertamente", subtitle: "Dejarte llevar por la noticia", consequences: { moral: 5 }, outcomeText: "Pasas el resto del día distraído, revisando el teléfono cada dos minutos por si hay más noticias. No llega nada, pero la ilusión ya se ha instalado." },
      { label: "No hacerte ilusiones todavía", subtitle: "Protegerte de una decepción", consequences: { moral: 1, forma: 1 }, outcomeText: "Sigues entrenando exactamente igual que ayer, aunque por dentro la noticia te ronde la cabeza más de lo que admites." },
      { label: "Preguntar de qué club se trata exactamente", subtitle: "Tu agente no suelta prenda", consequences: { moral: 2 }, outcomeText: `${c.agent} sonríe y niega con la cabeza: "Eso, de momento, es solo mío."` },
    ],
  },
  {
    key: "idea-del-agente-redes",
    title: "Tu agente te propone grabarte",
    desc: (c) => `${c.agent} te suelta una idea que no esperabas: "Grábate entrenando, sube algo a Instagram y TikTok. Hoy en día los clubes también miran ahí, no solo los informes de ojeadores."`,
    opts: () => [
      {
        label: "Hacerlo: grabar y publicar vídeos de entrenamientos",
        subtitle: "Jugarte la exposición",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          success: {
            text: "Un vídeo tuyo se hace viral dentro del mundo del fútbol base — comentarios de cuentas de scouting, algún que otro club preguntando quién eres.",
            consequences: { fama: 6, moral: 4 },
          },
          fail: {
            text: "Los vídeos no despegan como esperabas, pero al menos ya tienes algo de contenido para cuando de verdad importe.",
            consequences: { moral: 0 },
          },
        },
      },
      { label: "No sentirte cómodo exponiéndote así", subtitle: "Prefieres que hablen tus pies", consequences: { moral: 1, rel_representante: -1 }, outcomeText: "Tu agente se encoge de hombros: 'Tú te lo pierdes, pero lo entiendo.' No vuelve a sacar el tema." },
    ],
  },
  {
    key: "casi-ficha-se-cae",
    title: "Estuvo a punto de pasar",
    desc: (c) => `${c.agent} te da una noticia agridulce: "Un club te iba a convocar a una prueba esta semana. Han cambiado de entrenador de un día para otro y lo han parado todo. No es un no, pero tampoco es un sí."`,
    opts: () => [
      { label: "Verlo como parte del camino", subtitle: "Estas cosas pasan", consequences: { moral: 2 }, outcomeText: "Sigues entrenando con la cabeza despejada — sabes que este tipo de cosas van a pasar más veces antes de que llegue la de verdad." },
      { label: "Sentir que la mala suerte te persigue", subtitle: "Cuesta no tomárselo personal", consequences: { moral: -2 }, outcomeText: "Te cuesta sacudirte la sensación durante varios días, por mucho que intentes no darle más vueltas de las necesarias." },
    ],
  },
];

export function buildBusquedaEquipoEvent(player: Player): GameEvent {
  const fase = Number(player.flags?.busqueda_fase ?? 0);
  const recent = String(player.flags?.busqueda_recent ?? "").split(",").filter(Boolean);
  let pool = TEMPLATES.filter((t) => !recent.includes(t.key));
  if (pool.length === 0) pool = TEMPLATES;
  const tpl = pool[Math.floor(Math.random() * pool.length)];

  // "Sin representante aún"/"definitivo" son placeholders que guarda
  // rechazar al primer agente (ver first-signing-variants.ts), no un
  // nombre real — usarlos tal cual como si hablaran producía frases rotas
  // ("Sin representante aún te llama..."). Mismo patrón de exclusión que
  // ya usa npcs.ts para el mismo caso en las menciones de texto.
  const hasRealAgent = !!player.agent_name && !/^(Tu |Sin |Nueva )/.test(player.agent_name);
  const ctx: Ctx = { agent: hasRealAgent ? player.agent_name! : "Tu representante" };
  const newRecent = [...recent, tpl.key].slice(-3).join(",");
  const baseFlags: Consequences["flags"] = { busqueda_fase: String(fase + 1), busqueda_recent: newRecent };
  const withFlags = (c: Consequences, viral: boolean): Consequences => ({
    ...c,
    flags: { ...(c.flags ?? {}), ...baseFlags, ...(viral ? { busqueda_viral: "yes" } : {}) },
  });

  return {
    id: `busqueda-equipo-${tpl.key}-${player.week}`,
    category: "representante",
    title: tpl.title,
    description: tpl.desc(ctx),
    options: tpl.opts(ctx, fase).map((o, i) => ({
      ...o,
      id: String(i),
      consequences: withFlags(o.consequences, false),
      resolve: o.resolve
        ? {
            ...o.resolve,
            success: { ...o.resolve.success, consequences: withFlags(o.resolve.success.consequences, true) },
            fail: { ...o.resolve.fail, consequences: withFlags(o.resolve.fail.consequences, false) },
          }
        : undefined,
    })),
  };
}
