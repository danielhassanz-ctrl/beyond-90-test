import { clone } from "./engine";
import { clamp, note } from "./mutate";
import type { GameState } from "./types";

export type PostCareerPath = "coach" | "agent" | "president";
export type PostCareerStyle = "a" | "b" | "c";

const PATH_CODE: Record<PostCareerPath, number> = { coach: 1, agent: 2, president: 3 };
const CODE_PATH: Record<number, PostCareerPath> = { 1: "coach", 2: "agent", 3: "president" };
const STYLE_CODE: Record<PostCareerStyle, number> = { a: 1, b: 2, c: 3 };
const CODE_STYLE: Record<number, PostCareerStyle> = { 1: "a", 2: "b", 3: "c" };

export interface PostCareerOption {
  id: PostCareerPath | PostCareerStyle;
  label: string;
  hint: string;
}

export interface PostCareerStatus {
  path: PostCareerPath | null;
  style: PostCareerStyle | null;
  title: string;
  text: string;
  options: PostCareerOption[];
  complete: boolean;
}

const PATHS: Record<PostCareerPath, { label: string; intro: string; styles: Record<PostCareerStyle, { label: string; hint: string; result: string }> }> = {
  coach: {
    label: "Entrenador",
    intro: "Cambias las botas por una pizarra. Tu nombre abre puertas, pero dirigir a antiguos compañeros es otro oficio.",
    styles: {
      a: { label: "Empezar desde abajo", hint: "Cantera, formación y paciencia", result: "Aceptas un juvenil y vuelves a campos sin cámaras. Te sorprende cuánto echabas de menos enseñar." },
      b: { label: "Ser segundo en la élite", hint: "Aprender cerca de los mejores", result: "Entras en un cuerpo técnico de primer nivel. Hablas menos y tomas notas como cuando tenías dieciséis años." },
      c: { label: "Pedir un banquillo ya", hint: "Máxima responsabilidad desde el inicio", result: "Aceptas un primer equipo con problemas. La primera rueda de prensa como míster pesa más que muchas finales." },
    },
  },
  agent: {
    label: "Representante",
    intro: "Años viendo contratos, promesas y llamadas a deshora te han enseñado dónde se rompe una carrera antes de empezar.",
    styles: {
      a: { label: "Representar canteranos", hint: "Pocos clientes, acompañamiento real", result: "Tu primera cartera son chicos que todavía van al instituto. A sus padres les hablas más de paciencia que de dinero." },
      b: { label: "Ir a por estrellas", hint: "Comisiones grandes, presión enorme", result: "Buscas futbolistas consolidados y operaciones internacionales. El teléfono vuelve a no apagarse nunca." },
      c: { label: "Montar una agencia distinta", hint: "Psicología, estudios y carrera además del contrato", result: "Creas una agencia que cobra menos y acompaña más. Algunos se ríen hasta que empiezan a llamarte familias de media liga." },
    },
  },
  president: {
    label: "Presidente",
    intro: "Has estado en el césped, en el vestuario y delante de los focos. Ahora te planteas sentarte donde se firman todas las decisiones.",
    styles: {
      a: { label: "Volver a uno de tus clubes", hint: "Proyecto sentimental, mucha memoria alrededor", result: "Presentas un proyecto para volver a un club de tu carrera. Cada promesa electoral tiene un nombre y una cara conocidos." },
      b: { label: "Entrar con inversores", hint: "Más recursos, menos independencia", result: "Te rodeas de capital y profesionales de gestión. Descubres que negociar un presupuesto puede ser más duro que negociar un contrato." },
      c: { label: "Construir desde la cantera", hint: "Menos fichajes, identidad a largo plazo", result: "Tu primera decisión es proteger presupuesto de cantera. No vende tantas portadas, pero sabes exactamente por qué lo haces." },
    },
  },
};

export function postCareerStatus(s: GameState): PostCareerStatus {
  const path = CODE_PATH[s.flags["post_career_path"] ?? 0] ?? null;
  const style = CODE_STYLE[s.flags["post_career_style"] ?? 0] ?? null;
  if (!path) {
    return {
      path: null,
      style: null,
      title: "¿Y después del minuto 90?",
      text: "La carrera ha terminado, pero tu nombre sigue teniendo peso. El fútbol te ofrece tres maneras muy distintas de volver a entrar.",
      options: [
        { id: "coach", label: "Ser entrenador", hint: "Gestionar vestuario, táctica y presión" },
        { id: "agent", label: "Ser representante", hint: "Guiar carreras y negociar desde el otro lado" },
        { id: "president", label: "Ser presidente", hint: "Construir un club y asumir todas las decisiones" },
      ],
      complete: false,
    };
  }
  const def = PATHS[path];
  if (!style) {
    return {
      path,
      style: null,
      title: `Nueva vida · ${def.label}`,
      text: def.intro,
      options: (Object.entries(def.styles) as [PostCareerStyle, (typeof def.styles)[PostCareerStyle]][]).map(([id, option]) => ({ id, label: option.label, hint: option.hint })),
      complete: false,
    };
  }
  const chosen = def.styles[style];
  return {
    path,
    style,
    title: `${def.label} · empieza otra carrera`,
    text: chosen.result,
    options: [],
    complete: true,
  };
}

export function choosePostCareerPath(state: GameState, path: PostCareerPath): GameState {
  if (!state.retired || !PATH_CODE[path]) return state;
  const s = clone(state);
  s.flags["post_career_path"] = PATH_CODE[path];
  s.flags["post_career_style"] = 0;
  note(s, `Tras retirarte eliges continuar en el fútbol como ${PATHS[path].label.toLowerCase()}.`, "gold");
  return s;
}

export function choosePostCareerStyle(state: GameState, style: PostCareerStyle): GameState {
  const path = CODE_PATH[state.flags["post_career_path"] ?? 0];
  if (!state.retired || !path || !STYLE_CODE[style]) return state;
  const s = clone(state);
  s.flags["post_career_style"] = STYLE_CODE[style];
  const def = PATHS[path].styles[style];

  // Consecuencias pequeñas pero persistentes: el segundo oficio parte de la carrera que construiste.
  if (path === "coach") {
    if (style === "a") {
      s.discipline = clamp(s.discipline + 5);
      s.rel.fans = clamp(s.rel.fans + 3);
    } else if (style === "b") {
      s.fame = clamp(s.fame + 4);
      s.rel.dressing = clamp(s.rel.dressing + 3);
    } else {
      s.fame = clamp(s.fame + 8);
      s.morale = clamp(s.morale - 3);
    }
  } else if (path === "agent") {
    if (style === "a") {
      s.rel.family = clamp(s.rel.family + 5);
      s.rel.agent = clamp(s.rel.agent + 4);
    } else if (style === "b") {
      s.wealth = (s.wealth ?? 0) + 350;
      s.fame = clamp(s.fame + 5);
    } else {
      s.rel.fans = clamp(s.rel.fans + 6);
      s.discipline = clamp(s.discipline + 3);
    }
  } else {
    if (style === "a") {
      s.rel.fans = clamp(s.rel.fans + 8);
      s.fame = clamp(s.fame + 4);
    } else if (style === "b") {
      s.wealth = (s.wealth ?? 0) + 500;
      s.rel.fans = clamp(s.rel.fans - 2);
    } else {
      s.rel.fans = clamp(s.rel.fans + 6);
      s.discipline = clamp(s.discipline + 4);
    }
  }
  note(s, `Postcarrera · ${PATHS[path].label}: ${def.label}. ${def.result}`, "gold");
  return s;
}
