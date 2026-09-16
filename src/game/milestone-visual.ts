import type { ShareData } from "./types";

export type MilestoneVisualKind = "signing" | "debut" | "trophy" | "retirement" | "career";
export type PlayerVisualAgeStage = "academy" | "young-pro" | "prime" | "veteran" | "legacy";

export interface MilestoneVisualSpec {
  kind: MilestoneVisualKind;
  label: string;
  scene: "presentation" | "pitch" | "celebration" | "farewell" | "portrait";
}

export interface PlayerVisualProfile {
  age: number;
  stage: PlayerVisualAgeStage;
  /**
   * Prompt-safe direction for a future image-generation backend. This metadata
   * never pretends that the local fallback card has altered the player's face.
   * Identity must remain anchored to the persisted uploaded player photo.
   */
  ageDirection: string;
}

/**
 * Stable visual-age bands keep future generated milestones recognisably the
 * same person while allowing natural ageing across a 20+ year career.
 * Hair/beard/style changes belong to the image backend and must preserve
 * identity; the deterministic local fallback continues to use the source photo.
 */
export function playerVisualProfile(age: number): PlayerVisualProfile {
  const safeAge = Number.isFinite(age) ? Math.max(16, Math.min(50, Math.round(age))) : 16;
  if (safeAge <= 18) {
    return { age: safeAge, stage: "academy", ageDirection: "teenage academy player; youthful face; clean, understated football look" };
  }
  if (safeAge <= 23) {
    return { age: safeAge, stage: "young-pro", ageDirection: "young professional footballer; subtle maturation; contemporary but restrained look" };
  }
  if (safeAge <= 30) {
    return { age: safeAge, stage: "prime", ageDirection: "prime-age footballer; mature facial structure; natural hairstyle or light facial-hair variation" };
  }
  if (safeAge <= 35) {
    return { age: safeAge, stage: "veteran", ageDirection: "veteran footballer; visibly mature but athletic; plausible hair and beard evolution" };
  }
  return { age: safeAge, stage: "legacy", ageDirection: "late-career footballer; natural ageing; experienced appearance; preserve recognisable identity" };
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

  // Event semantics beat competition names. "Debut en Champions" is a debut,
  // not a trophy celebration merely because the competition is mentioned.
  if (/debut|primer partido|estreno/.test(haystack)) {
    return { kind: "debut", label: "Debut", scene: "pitch" };
  }
  if (/balon de oro|campeon|titulo|trofeo|copa|liga|champions|mundial|eurocopa/.test(haystack)) {
    return { kind: "trophy", label: "Noche de gloria", scene: "celebration" };
  }

  // A new-club presentation is a special visual milestone. A renewal, sponsor
  // agreement or generic contract is not: classifying those as a signing would
  // show a fake new-shirt presentation for a player who has not changed club.
  const excludedSigningContext = /renov|patrocin|sponsor|marca|adidas|nike|puma/.test(haystack);
  const explicitClubMove = /fich|traspas|nuevo club|presentacion|cambio de club/.test(haystack);
  const signedForClub = /firma(?:s|do)? (?:por|con) (?:el |la )?[a-z0-9]/.test(haystack) && !excludedSigningContext;
  if (explicitClubMove || signedForClub) {
    return { kind: "signing", label: "Nuevo capítulo", scene: "presentation" };
  }
  return { kind: "career", label: "Mi carrera", scene: "portrait" };
}
