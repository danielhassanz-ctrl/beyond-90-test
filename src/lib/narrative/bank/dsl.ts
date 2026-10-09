/**
 * Ayudas para escribir escenas del banco sin boilerplate: así cada escena
 * ocupa pocas líneas y el esfuerzo va al texto, no a la estructura.
 *
 *   S(id, familia, cuándo, categoría, título, descripción, [opciones], extras?)
 *   o(id, etiqueta, subtítulo, efectos, reacción, extras?)       opción con resultado fijo
 *   r(id, etiqueta, subtítulo, prob, ok, efectosOk, ko, efectosKo, stat?)   opción con tirada
 */
import type { Consequences, EventCategory, EventOption, GameEvent } from "@/types/career";
import type { BankScene, BankWhen } from "./types";

type OptExtra = Partial<Pick<EventOption, "thread" | "imageUrl">>;

export const o = (id: string, label: string, subtitle: string, consequences: Consequences, outcomeText: string, extra: OptExtra = {}): EventOption => ({
  id,
  label,
  subtitle,
  consequences,
  outcomeText,
  ...extra,
});

export const r = (
  id: string,
  label: string,
  subtitle: string,
  baseChance: number,
  okText: string,
  okC: Consequences,
  koText: string,
  koC: Consequences,
  statModifier?: "forma" | "moral" | "fama" | "reputacion" | "media",
  extra: OptExtra = {},
): EventOption => ({
  id,
  label,
  subtitle,
  consequences: {},
  resolve: { baseChance, statModifier, success: { text: okText, consequences: okC }, fail: { text: koText, consequences: koC } },
  ...extra,
});

/** Hilo abierto de una opción: tipo, persona y qué queda pendiente. */
export const th = (kind: "favor" | "deuda" | "rencor" | "promesa" | "secreto", who: string, text: string) => ({ kind, who, text });

type SceneExtra = {
  weight?: number;
  isMilestone?: boolean;
  imageScene?: string;
  milestoneType?: GameEvent["milestoneType"];
  allowFreeText?: boolean;
  freeTextPrompt?: string;
  /** Mensaje por redes que abre la escena (con foto opcional del remitente). */
  dm?: GameEvent["dm"];
};

export function S(
  id: string,
  family: string,
  when: BankWhen,
  category: EventCategory,
  title: string,
  description: string,
  options: EventOption[],
  extra: SceneExtra = {},
): BankScene {
  const { weight, ...eventExtra } = extra;
  return {
    id: `bank-${id}`,
    family,
    when,
    weight,
    event: { category, title, description, options, ...eventExtra } as BankScene["event"],
  };
}

/** Referencia a otra escena del banco para encadenar. */
export const after = (id: string, option?: string, minGap = 3, maxGap?: number) => ({ scene: `bank-${id}`, option, minGap, maxGap });
