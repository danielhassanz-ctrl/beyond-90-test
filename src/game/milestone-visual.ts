import type { ShareData } from "./types";

export type MilestoneVisualKind = "signing" | "debut" | "trophy" | "retirement" | "career";

export interface MilestoneVisualSpec {
  kind: MilestoneVisualKind;
  label: string;
  scene: "presentation" | "pitch" | "celebration" | "farewell" | "portrait";
}

/**
 * Rights-safe milestone classification used by share cards.
 *
 * This is deliberately deterministic and local. It does not pretend to create
 * an AI photograph. The uploaded player photo remains the identity source;
 * official crests, shirt artwork and sponsors remain excluded until rights are
 * explicitly cleared.
 */
export function milestoneVisualSpec(share: ShareData): MilestoneVisualSpec {
  const haystack = `${share.headline} ${share.kicker} ${share.lines.map((line) => `${line.label} ${line.value}`).join(" ")}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/retir|despedida|ultimo partido|fin de carrera/.test(haystack)) {
    return { kind: "retirement", label: "Despedida", scene: "farewell" };
  }
  if (/balon de oro|campeon|titulo|trofeo|copa|liga|champions|mundial|eurocopa/.test(haystack)) {
    return { kind: "trophy", label: "Noche de gloria", scene: "celebration" };
  }
  if (/debut|primer partido|estreno/.test(haystack)) {
    return { kind: "debut", label: "Debut", scene: "pitch" };
  }
  if (/fich|traspas|firma|nuevo club|presentacion|contrato/.test(haystack)) {
    return { kind: "signing", label: "Nuevo capítulo", scene: "presentation" };
  }
  return { kind: "career", label: "Mi carrera", scene: "portrait" };
}
