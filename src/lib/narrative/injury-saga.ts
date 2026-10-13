/**
 * LESIONES GRAVES CON DECISIONES. Hasta ahora una lesión larga era un contador de tres meses con tres escenas del
 * fisio. Una rotura de ligamento de verdad dura medio año o más y cambia una carrera: aquí es una historia con
 * cuatro momentos, y lo que decides en cada uno se acumula en un "riesgo de secuelas" que se resuelve al volver.
 *
 *  1. DIAGNÓSTICO (hito): operarte con el club, pedir una segunda opinión a un cirujano de renombre (cuesta dinero) o
 *     intentar tratamiento conservador (si sale mal, pierdes meses).
 *  2. A MITAD DE LA REHABILITACIÓN: seguir el plan, una clínica privada, forzar el regreso o ayuda psicológica.
 *  3. EL ALTA / LA VUELTA (hito): volver poco a poco, pedir ser titular ya, o volver con un homenaje. Aquí se decide
 *     si quedan secuelas (media permanente más baja y más riesgo de volver a lesionarte).
 *  4. LA SECUELA AVISA (si quedó alguna): gestionar cargas, ignorarlo o una operación de limpieza.
 *
 * La baja usa el mismo contador de siempre (injury_duration_*), así que no juegas partidos mientras dure. Todo en
 * código: cero llamadas a la IA.
 */
import type { Consequences, EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";
import { getNpcName } from "@/lib/narrative/npcs";
import { playerAge } from "@/types/career";
import { NO_CLUB_YET } from "@/lib/constants";

export const SAGA_KEY = "injury_duration_saga";
/** Turnos mínimos entre dos lesiones graves. */
const COOLDOWN = 30;
/** Duración máxima de cualquier baja de la saga (con recaídas), en turnos. */
const MAX_TURNS = 10;

export type SagaKind = "cruzado" | "menisco" | "fractura" | "pubalgia" | "aquiles";

interface KindDef {
  label: string;
  part: string;
  months: number;
  /** Riesgo base de secuelas, en %. */
  risk: number;
  title: string;
  diagnosis: (doctor: string) => string;
}

export const KINDS: Record<SagaKind, KindDef> = {
  cruzado: {
    label: "rotura del ligamento cruzado",
    part: "rodilla",
    months: 7,
    risk: 38,
    title: "La rodilla que lo para todo",
    diagnosis: (d) => `Un apoyo mal hecho, sin contacto, y un crujido que oyes tú antes que nadie. En la resonancia, ${d} te lo dice sin rodeos: rotura del ligamento cruzado. Entre siete y nueve meses de baja, una operación y la pregunta que nadie dice en voz alta: ¿volverás al mismo nivel?`,
  },
  menisco: {
    label: "rotura de menisco",
    part: "rodilla",
    months: 3,
    risk: 22,
    title: "El menisco no perdona",
    diagnosis: (d) => `Un giro tonto en un entrenamiento y la rodilla se te bloquea. ${d} lo confirma con la resonancia en la mano: rotura de menisco. Se puede operar o intentar un tratamiento conservador, y cada camino tiene su precio.`,
  },
  fractura: {
    label: "fractura de tibia y peroné",
    part: "pierna",
    months: 4,
    risk: 15,
    title: "Un golpe que se oyó en la grada",
    diagnosis: (d) => `La entrada llegó tarde y el crujido se oyó hasta en la grada. ${d} te enseña la radiografía: fractura de tibia y peroné. Cuatro meses de baja, tornillos y una rehabilitación larga que empieza por aprender a apoyar el pie.`,
  },
  pubalgia: {
    label: "pubalgia crónica",
    part: "ingle",
    months: 4,
    risk: 28,
    title: "Una molestia que ya no se va",
    diagnosis: (d) => `Llevas semanas jugando con una molestia que ha pasado de ingle a cadera y de cadera a todo el cuerpo. ${d} lo llama por su nombre: pubalgia crónica. Se trata, se opera o se aguanta, y las tres cosas son una apuesta.`,
  },
  aquiles: {
    label: "rotura del tendón de Aquiles",
    part: "tendón",
    months: 8,
    risk: 40,
    title: "El chasquido del tendón",
    diagnosis: (d) => `Sentiste un golpe en el talón, como una patada que nadie te había dado. ${d} no se anda con eufemismos: rotura del tendón de Aquiles. Ocho meses largos de baja, y una pregunta de fondo: a tu edad, ¿se vuelve igual?`,
  },
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;
const eur = (n: number) => `${Math.round(n).toLocaleString("es")} €`;
const round1k = (n: number) => Math.round(n / 1000) * 1000;

type Flags = Record<string, string | boolean>;

/** Suma dos efectos (números y banderas). */
function merge(a: Consequences, b: Consequences): Consequences {
  const out: Consequences = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (k === "flags") continue;
    if (typeof v === "number") (out as Record<string, unknown>)[k] = ((out as Record<string, number | undefined>)[k] ?? 0) + v;
    else (out as Record<string, unknown>)[k] = v;
  }
  if (a.flags || b.flags) out.flags = { ...a.flags, ...b.flags };
  return out;
}

const hasSecuela = (flags: Flags | null | undefined) => Object.keys(flags ?? {}).some((k) => k.startsWith("secuela_") && flags![k]);

// ───────────────────────── 1. Cuándo se lesiona ─────────────────────────

/** Probabilidad por turno de una lesión grave: sube con la edad, el cansancio y las secuelas. */
export function injuryChance(player: Player): number {
  const age = playerAge(player.week);
  let p = 0.008 + Math.max(0, age - 22) * 0.0025;
  if ((player.forma ?? 70) < 55) p += 0.012;
  if (hasSecuela(player.flags)) p += 0.02;
  if (String(player.flags?.lg_gestion ?? "") === "1") p -= 0.008;
  return clamp(p, 0.004, 0.07);
}

export function shouldTriggerSeriousInjury(player: Player, rng: () => number = Math.random): boolean {
  const f = player.flags ?? {};
  if (player.status !== "active" || !player.club || player.club === NO_CLUB_YET) return false;
  if (player.week < 25 || playerAge(player.week) < 17) return false;
  if (getInjuryRemaining(f) > 0 || f.lg_stage) return false;
  if (f.lg_last !== undefined && player.week - num(f.lg_last) < COOLDOWN) return false;
  return rng() < injuryChance(player);
}

function pickKind(player: Player, rng: () => number): SagaKind {
  const age = playerAge(player.week);
  const table: [SagaKind, number][] = [["cruzado", 30], ["menisco", 25], ["fractura", 15], ["pubalgia", 15], ["aquiles", age >= 29 ? 15 : 0]];
  const total = table.reduce((n, [, w]) => n + w, 0);
  let r = rng() * total;
  for (const [k, w] of table) {
    if ((r -= w) < 0) return k;
  }
  return "cruzado";
}

/** Escalones de coste (clínica, cirujano, psicólogo) a partir del dinero que tienes. */
function costs(player: Player) {
  const money = Math.max(0, player.patrimonio ?? 0);
  const surgeon = clamp(round1k(money * 0.05), 20000, 90000);
  const clinic = clamp(round1k(money * 0.03), 12000, 60000);
  return { money, surgeon, clinic, psico: 4000 };
}

// ───────────────────────── 2. El diagnóstico ─────────────────────────

export function buildSeriousInjuryEvent(player: Player, rng: () => number = Math.random): GameEvent {
  const kind = pickKind(player, rng);
  const def = KINDS[kind];
  const week = player.week;
  const doctor = getNpcName(player, "fisio");
  const c = costs(player);
  const M = def.months;
  const surgical = kind === "cruzado" || kind === "aquiles";

  const start = (turns: number, risk: number, extra: Flags = {}): Flags => ({
    [SAGA_KEY]: String(clamp(turns, 1, MAX_TURNS)),
    lg_stage: "1",
    lg_kind: kind,
    lg_part: def.part,
    lg_total: String(clamp(turns, 1, MAX_TURNS)),
    lg_start: String(week),
    lg_riesgo: String(clamp(risk, 0, 95)),
    lg_recaidas: "0",
    lg_psico: "",
    ...extra,
  });
  const base: Consequences = { forma: -20, moral: -8 };

  const options: EventOption[] = [
    {
      id: "a",
      label: surgical ? "Operarte ya con el equipo médico del club" : "Operarte con el equipo médico del club",
      subtitle: `${M} meses de baja · el camino de siempre`,
      consequences: merge(base, { rel_entrenador: 1, flags: start(M, def.risk) }),
      outcomeText: `Te operas esa misma semana con los médicos del club. ${doctor} te lo explica con la calma de quien ya lo ha hecho cien veces: «Salvo sorpresas, serán ${M} meses. Y los vamos a contar uno a uno». Sales del quirófano con la pierna vendada y la cabeza todavía en otro sitio.`,
    },
  ];

  if (c.money >= c.surgeon * 2) {
    options.push({
      id: "b",
      label: `Pedir una segunda opinión a un cirujano de renombre — ${eur(c.surgeon)}`,
      subtitle: "Cuesta dinero, pero puede acortar la baja y bajar el riesgo",
      consequences: {},
      resolve: {
        baseChance: 0.7,
        statModifier: "reputacion",
        success: {
          text: `Viajas a ver a uno de los mejores especialistas de Europa. Revisa la resonancia dos veces, cambia la técnica y te promete un mes menos de baja. Pagas ${eur(c.surgeon)} sin pestañear. Sales con algo que hacía semanas que no tenías: esperanza.`,
          consequences: merge({ ...base, patrimonio: -c.surgeon, moral: -4 }, { flags: start(Math.max(2, M - 1), def.risk - 12, { lg_calidad: "alta" }) }),
        },
        fail: {
          text: `El cirujano confirma lo que ya sabías: la misma técnica, los mismos plazos. Pagas ${eur(c.surgeon)} por una respuesta que no cambia nada. Te vas a casa con el bolsillo más ligero y un poco más de miedo que antes.`,
          consequences: merge({ ...base, patrimonio: -c.surgeon, moral: -9 }, { flags: start(M, def.risk) }),
        },
      },
    });
  }

  options.push({
    id: "c",
    label: surgical ? "Intentar tratamiento conservador, sin operar" : "Intentar tratamiento conservador antes de operar",
    subtitle: "Menos tiempo si sale bien; si sale mal, pierdes meses",
    consequences: {},
    resolve: {
      baseChance: surgical ? 0.25 : 0.45,
      statModifier: "forma",
      success: {
        text: `Funciona. Rehabilitación a fondo, sin quirófano: en ${Math.max(2, Math.ceil(M * 0.55))} meses estás de vuelta. ${doctor} no lo dice, pero se le nota que no se lo esperaba. Eso sí: la zona queda más frágil de lo que estaba.`,
        consequences: merge({ ...base, forma: -14, moral: -3 }, { flags: start(Math.max(2, Math.ceil(M * 0.55)), def.risk + 8) }),
      },
      fail: {
        text: `No cuaja. Tras dos meses de rehabilitación, la zona cede otra vez y no queda más remedio que operar, tarde y con más daño. ${doctor} te mira con respeto y mucha pena: «Era la apuesta, y no ha salido». Pierdes ${Math.min(MAX_TURNS - M, 2)} meses más.`,
        consequences: merge({ ...base, forma: -24, moral: -10 }, { flags: start(M + 2, def.risk + 18) }),
      },
    },
  });

  return {
    id: `lesion-diagnostico-${week}`,
    category: "especial",
    title: def.title,
    description: def.diagnosis(doctor),
    options,
    priority: true,
    isMilestone: true,
    milestoneType: "lesion",
    imageScene:
      "Photorealistic photo of the photographed man on crutches leaving a hospital in tracksuit, knee heavily bandaged, determined but tired expression, overcast daylight, photojournalistic style",
  };
}

// ───────────────────────── 3. Las fases siguientes ─────────────────────────

export type SagaStage = "rehab" | "vuelta" | "secuela" | null;

/** Qué toca ahora de la saga (si algo). */
export function sagaStage(player: Player): SagaStage {
  const f = player.flags ?? {};
  const left = getInjuryRemaining(f);
  const stage = String(f.lg_stage ?? "");
  if (stage === "1") {
    if (left === 0) return "vuelta"; // se curó antes de llegar a la mitad (o saltó la escena): toca el alta
    return left <= Math.ceil(num(f.lg_total) / 2) && left >= 2 ? "rehab" : null;
  }
  if (stage === "2") return left === 0 ? "vuelta" : null;
  if (left > 0) return null;
  for (const [k, v] of Object.entries(f)) {
    if (!k.startsWith("secuela_") || !v) continue;
    const since = num(v);
    if (since > 0 && player.week - since >= 15 && !f[`lg_sec_${since}`]) return "secuela";
  }
  return null;
}

export function shouldTriggerSagaStage(player: Player): boolean {
  if (player.status !== "active") return false;
  const last = num(player.flags?.lg_scene_last);
  if (last > 0 && player.week - last < 2) return false;
  return sagaStage(player) !== null;
}

export function buildSagaStageEvent(player: Player, rng: () => number = Math.random): GameEvent {
  const stage = sagaStage(player);
  if (stage === "rehab") return buildRehabEvent(player);
  if (stage === "vuelta") return buildReturnEvent(player, rng);
  return buildSequelaEvent(player);
}

function riskOf(player: Player) {
  return num(player.flags?.lg_riesgo);
}

function buildRehabEvent(player: Player): GameEvent {
  const f = player.flags ?? {};
  const week = player.week;
  const kind = (String(f.lg_kind ?? "cruzado") as SagaKind) in KINDS ? (String(f.lg_kind) as SagaKind) : "cruzado";
  const def = KINDS[kind];
  const left = getInjuryRemaining(f);
  const fisio = getNpcName(player, "fisio");
  const c = costs(player);
  const risk = riskOf(player);
  const seen = { lg_scene_last: String(week) };
  const set = (turns: number, riskDelta: number, extra: Flags = {}): Flags => ({
    [SAGA_KEY]: String(clamp(turns, 1, MAX_TURNS)),
    lg_riesgo: String(clamp(risk + riskDelta, 0, 95)),
    ...seen,
    ...extra,
  });

  const options: EventOption[] = [
    {
      id: "a",
      label: "Seguir el plan del club al pie de la letra",
      subtitle: "Sin atajos · baja segura",
      consequences: { moral: 1, rel_entrenador: 2, flags: set(left, -4, { lg_stage: "2" }) },
      outcomeText: `Cada sesión, cada serie, cada pesa. ${fisio} no te pide heroísmo, te pide constancia. Un martes cualquiera descubres que has pasado una semana entera sin pensar en la pierna. Eso, en rehabilitación, es una gran noticia.`,
    },
  ];
  if (c.money >= c.clinic * 2) {
    options.push({
      id: "b",
      label: `Rehabilitarte en una clínica privada especializada — ${eur(c.clinic)}`,
      subtitle: "Gana un mes y baja el riesgo",
      consequences: { patrimonio: -c.clinic, forma: 3, moral: 2, flags: set(Math.max(1, left - 1), -10, { lg_stage: "2", lg_clinica: "1" }) },
      outcomeText: `Una clínica con piscina de contraflujo, un fisio que solo atiende a deportistas de élite y un plan hecho a tu medida. Pagas ${eur(c.clinic)} y notas la diferencia a la tercera semana: el cuerpo responde más rápido y duermes mejor.`,
    });
  }
  options.push({
    id: "c",
    label: "Forzar: volver antes de lo previsto",
    subtitle: "Puede acortar la baja o provocar una recaída",
    consequences: {},
    resolve: {
      baseChance: 0.45,
      statModifier: "forma",
      success: {
        text: `Aprietas y el cuerpo te responde. ${fisio} revisa los números con una ceja levantada y te da el visto bueno para pasar a campo antes de lo previsto. Dos meses menos de baja. No te lo dice en voz alta, pero te mira distinto.`,
        consequences: { fama: 1, moral: 5, flags: set(Math.max(1, left - 2), 6, { lg_stage: "2" }) },
      },
      fail: {
        text: `Te pasas de rosca y la zona se queja: una recaída que te devuelve a la casilla de salida. ${fisio} no necesita decirte nada. La baja se alarga dos meses más y el ánimo se te cae al suelo.`,
        consequences: { forma: -10, moral: -8, flags: set(Math.min(MAX_TURNS, left + 2), 18, { lg_stage: "2", lg_recaidas: String(num(f.lg_recaidas) + 1) }) },
      },
    },
  });
  options.push({
    id: "d",
    label: `Ayudarte de un psicólogo deportivo — ${eur(c.psico)}`,
    subtitle: "Trabajar el miedo a volver",
    consequences: { patrimonio: -c.psico, moral: 4, flags: set(left, -6, { lg_stage: "2", lg_psico: "1" }) },
    outcomeText: "La primera sesión es una conversación en la que, sin darte cuenta, hablas veinte minutos seguidos de la noche de la lesión. «Muchos creen que lo difícil es la rodilla», dice. «Lo difícil es fiarse de ella». Sales más ligero.",
  });

  const total = num(f.lg_total) || left;
  return {
    id: `lesion-rehab-${week}`,
    category: "vida",
    title: "A mitad de la rehabilitación",
    description: `Llevas ${Math.max(1, total - left)} meses de ${def.label}. El gimnasio huele a cloro y a sudor frío, el calendario de partidos sigue sin ti y ${fisio} te enseña el informe de la semana: a mitad de camino, te quedan ${left} meses de baja. «Ahora es cuando te pica la impaciencia», te advierte. «Y ahora es cuando se decide cómo vuelves».`,
    options,
    priority: true,
  };
}

function buildReturnEvent(player: Player, rng: () => number): GameEvent {
  const f = player.flags ?? {};
  const week = player.week;
  const kind = (String(f.lg_kind ?? "cruzado") as SagaKind) in KINDS ? (String(f.lg_kind) as SagaKind) : "cruzado";
  const def = KINDS[kind];
  const fisio = getNpcName(player, "fisio");
  const recaidas = num(f.lg_recaidas);
  const risk = clamp(riskOf(player) + recaidas * 8 - (f.lg_psico ? 4 : 0), 2, 85);
  const sequela = rng() * 100 < risk;
  const hard = kind === "cruzado" || kind === "aquiles";
  const mediaLoss = hard ? 2 : 1;

  // Lo que dice la prueba final y lo que se queda para siempre, decidido ya y guardado en cada opción.
  const verdict: Consequences = sequela
    ? { media: -mediaLoss, moral: -3, flags: { [`secuela_${def.part}`]: String(week) } }
    : risk <= 22
      ? { media: 1, moral: 4 }
      : { moral: 2 };
  const text = sequela
    ? `${fisio} te recibe con la carpeta cerrada y se toma un segundo antes de hablar. «Estás de alta. Y voy a ser sincero contigo: la ${def.part} no va a volver a ser la que era. Se puede jugar así, y se juega muy bien, pero habrá que cuidarla toda la vida».`
    : risk <= 22
      ? `${fisio} abre la carpeta con una sonrisa que no puede disimular. «Estás de alta. Y te lo digo sin exagerar: las pruebas salen mejor que antes de lesionarte». Habías contado cada semana, y tantas semanas después, por fin, se acaban.`
      : `${fisio} te da el alta con un abrazo breve y una advertencia: «Todo en orden. Pero la ${def.part} tiene memoria, y hay que escucharla».`;

  const clean: Flags = { lg_stage: "", lg_last: String(week), lg_total: "", lg_riesgo: "", lg_recaidas: "", lg_psico: "", lg_calidad: "", lg_clinica: "", lg_scene_last: String(week) };

  const options: EventOption[] = [
    {
      id: "a",
      label: "Volver poco a poco: minutos controlados",
      subtitle: "Tres meses de regreso gradual",
      consequences: merge(verdict, { rel_entrenador: 2, forma: 4, flags: { ...clean, estado_regreso: "@WEEK+3" } }),
      outcomeText: `Vuelves convocado, sales en el minuto setenta y juegas veinte minutos que se te hacen eternos. Nadie te pide nada más. El míster va dosificando tus minutos con paciencia de jardinero y, al cabo de unas semanas, la pierna vuelve a sentirse tuya.`,
    },
  ];
  if (recaidas < 2) {
    options.push({
      id: "b",
      label: "Pedir ser titular desde el primer día",
      subtitle: "Puede salir muy bien o muy mal",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "forma",
        success: {
          text: "Sales de inicio con el estadio en pie y juegas como si no hubieras faltado ni un día. Cuando acaba el partido, te cuesta bajar las escaleras del túnel, pero es de la emoción. Es la mejor noche en meses.",
          consequences: merge(verdict, { moral: 8, fama: 2, rel_aficion: 4, forma: 4, flags: { ...clean } }),
        },
        fail: {
          text: "Al cuarto de hora sientes una punzada que no era la que esperabas. Pides el cambio, con la cara descompuesta. No es grave, pero te devuelve dos meses al gimnasio y la vieja pregunta de si te has precipitado.",
          consequences: { forma: -8, moral: -7, flags: { [SAGA_KEY]: "2", lg_stage: "2", lg_recaidas: String(recaidas + 1), lg_riesgo: String(clamp(riskOf(player) + 12, 0, 95)), lg_scene_last: String(week) } },
        },
      },
    });
  }
  if ((player.fama ?? 0) >= 45) {
    options.push({
      id: "c",
      label: "Volver con un homenaje de la afición y del club",
      subtitle: "Un regreso para recordar",
      consequences: merge(verdict, { rel_aficion: 6, moral: 4, fama: 2, flags: { ...clean, estado_regreso: "@WEEK+3", lg_homenaje: "1" } }),
      outcomeText: "El club prepara un vídeo con tus mejores jugadas y la grada lo recibe con una ovación de pie. Sales al campo con un nudo en la garganta. Tu madre, en la tribuna, llora sin disimular. Después de tantos meses, la pelota vuelve a ser un juego.",
    });
  }

  return {
    id: `lesion-vuelta-${week}`,
    category: "especial",
    title: "El alta: vuelves a casa",
    description: `${text}\n\nEs el momento de decidir cómo volver.`,
    options,
    priority: true,
    isMilestone: true,
    milestoneType: "lesion_vuelta",
    imageScene:
      "Photorealistic photo of the photographed man walking back onto a packed football pitch at golden hour wearing his club kit, stadium crowd on their feet applauding, emotional grateful expression, cinematic sports photography",
  };
}

function buildSequelaEvent(player: Player): GameEvent {
  const f = player.flags ?? {};
  const week = player.week;
  const entry = Object.entries(f).find(([k, v]) => k.startsWith("secuela_") && v && num(v) > 0 && !f[`lg_sec_${num(v)}`]);
  const [key, value] = entry ?? ["secuela_rodilla", String(week)];
  const part = key.replace("secuela_", "");
  const since = num(value);
  const fisio = getNpcName(player, "fisio");
  const c = costs(player);
  const handled = { [`lg_sec_${since}`]: "1", lg_scene_last: String(week) };

  const options: EventOption[] = [
    {
      id: "a",
      label: "Gestionar cargas con el cuerpo técnico",
      subtitle: "Jugar con cabeza: menos riesgo a largo plazo",
      consequences: { forma: -2, moral: 1, rel_entrenador: 2, flags: { ...handled, lg_gestion: "1" } },
      outcomeText: `Aceptas descansar en los partidos menos importantes y entrenar con cargas medidas. ${fisio} lo apunta todo en una tabla que parece de contabilidad. Pierdes algún minuto, y a cambio la ${part} se queda tranquila.`,
    },
    {
      id: "b",
      label: "Ignorar el aviso y seguir a tope",
      subtitle: "Una apuesta: puede salir bien o provocar una baja corta",
      consequences: {},
      resolve: {
        baseChance: 0.55,
        statModifier: "forma",
        success: {
          text: `La ${part} aguanta y la molestia se queda en eso. Esa semana juegas tres partidos y marcas en dos. No sabes si has tenido suerte o si eres de acero, pero decides no preguntártelo.`,
          consequences: { forma: 2, moral: 3, flags: { ...handled } },
        },
        fail: {
          text: `La ${part} cede en el peor momento. No es una lesión grave, pero te pierdes tres meses y vuelve la sensación que tanto odiabas: que tu cuerpo manda más que tú. ${fisio} no te dice «te lo advertí». No hace falta.`,
          consequences: { forma: -8, moral: -6, flags: { ...handled, [SAGA_KEY]: "3", lg_last: String(week) } },
        },
      },
    },
  ];
  if (c.money >= 24000) {
    options.push({
      id: "c",
      label: `Operación de limpieza en verano — ${eur(12000)}`,
      subtitle: "Dos meses de baja, pero puede quitarte la secuela",
      consequences: {},
      resolve: {
        baseChance: 0.75,
        statModifier: "reputacion",
        success: {
          text: `La operación sale como la soñabas: el cirujano limpia la zona y, tras dos meses de rehabilitación, la ${part} vuelve a responder. Cuando te dan el alta, algo se ha soltado dentro de ti: ya no estás esperando que falle.`,
          consequences: { patrimonio: -12000, media: 1, moral: 5, flags: { ...handled, [key]: "", [SAGA_KEY]: "2", lg_last: String(week) } },
        },
        fail: {
          text: `La operación no cambia gran cosa: pierdes dos meses y ${eur(12000)} y la ${part} sigue donde estaba. «Lo intentamos», dice ${fisio}. Y lo cierto es que lo intentasteis.`,
          consequences: { patrimonio: -12000, moral: -4, flags: { ...handled, [SAGA_KEY]: "2", lg_last: String(week) } },
        },
      },
    });
  }

  return {
    id: `lesion-secuela-${week}`,
    category: "vida",
    title: `La ${part} avisa`,
    description: `Han pasado meses desde el alta y todo parecía en orden, hasta que, una mañana cualquiera, la ${part} se queja al bajar de la cama. Nada grave, pero lo suficiente para recordarte lo que pasó. ${fisio} te lo explica en la camilla: «Cada cuerpo tiene un límite y el tuyo lo sabe. Lo que hagas ahora decide cuánto te dura».`,
    options,
    priority: true,
  };
}
