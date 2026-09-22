import type { ShareData } from "./types";
import type { ClubVisualIdentity } from "./club-identity";

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
  /** Prompt-safe direction for a future image-generation backend. */
  ageDirection: string;
}

export interface MilestoneGenerationBrief {
  scene: MilestoneVisualSpec["scene"];
  identityRule: string;
  ageRule: string;
  clubRule: string;
  composition: string;
  prohibited: string[];
}

export function playerVisualProfile(age: number): PlayerVisualProfile {
  const safeAge = Number.isFinite(age) ? Math.max(16, Math.min(50, Math.round(age))) : 16;
  if (safeAge <= 18) return { age: safeAge, stage: "academy", ageDirection: "teenage academy player; youthful face; clean, understated football look" };
  if (safeAge <= 23) return { age: safeAge, stage: "young-pro", ageDirection: "young professional footballer; subtle maturation; contemporary but restrained look" };
  if (safeAge <= 30) return { age: safeAge, stage: "prime", ageDirection: "prime-age footballer; mature facial structure; natural hairstyle or light facial-hair variation" };
  if (safeAge <= 35) return { age: safeAge, stage: "veteran", ageDirection: "veteran footballer; visibly mature but athletic; plausible hair and beard evolution" };
  return { age: safeAge, stage: "legacy", ageDirection: "late-career footballer; natural ageing; experienced appearance; preserve recognisable identity" };
}

export function milestoneGenerationBrief(
  milestone: MilestoneVisualSpec,
  visual: PlayerVisualProfile,
  clubName: string,
  clubIdentity?: Pick<ClubVisualIdentity, "primary" | "secondary">,
): MilestoneGenerationBrief {
  const palette = clubIdentity
    ? ` Use the configured palette primary ${clubIdentity.primary} and secondary ${clubIdentity.secondary}.`
    : "";
  const compositions: Record<MilestoneVisualSpec["scene"], string> = {
    presentation: `professional football signing presentation for ${clubName}; player posing naturally with a rights-safe club-colour shirt; press-room/stadium presentation atmosphere`,
    pitch: `football debut for ${clubName}; player on the pitch with the ball in a rights-safe club-colour kit; match-night stadium atmosphere`,
    celebration: `major football achievement with ${clubName}; player as the clear protagonist in an emotional celebration; trophy only when the milestone actually represents a title or award`,
    farewell: `late-career farewell for ${clubName}; emotional stadium goodbye with the player as the clear protagonist`,
    portrait: `cinematic football-career portrait associated with ${clubName}; grounded documentary feel`,
  };
  return {
    scene: milestone.scene,
    identityRule: "Preserve the exact recognisable identity, ethnicity and core facial features of the persisted uploaded player photo; do not substitute another person.",
    ageRule: `Render the same person at career age ${visual.age}. ${visual.ageDirection}. Changes in hair or facial hair must be plausible, gradual and identity-preserving.`,
    clubRule: `Use ${clubName} name and configured club colours only.${palette} Do not invent or reproduce an official crest, sponsor mark or protected shirt artwork unless separately rights-cleared.`,
    composition: compositions[milestone.scene],
    prohibited: ["identity drift", "different person", "official crest without cleared rights", "sponsor logo without cleared rights", "wrong career age", "unearned trophy or award"],
  };
}

/** Rights-safe milestone classification used by share cards. */
export function milestoneVisualSpec(share: ShareData): MilestoneVisualSpec {
  const haystack = `${share.headline} ${share.kicker} ${share.lines.map((line) => `${line.label} ${line.value}`).join(" ")}`
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const nonCareerRetirement = /\b(?:lesion|lesionado|medico|hospital|dinero|efectivo|cajero|mercado|oferta|fichaje|traspaso)\b/.test(haystack);
  const explicitFarewell = /\b(?:despedida|ultimo partido|fin de carrera|cuelga las botas)\b/.test(haystack);
  const explicitRetirement = /\b(?:retirada|retiro|retirarse|se retira)\b/.test(haystack) && !nonCareerRetirement;
  if (explicitFarewell || explicitRetirement) return { kind: "retirement", label: "Despedida", scene: "farewell" };

  // A youth/reserve debut is a legitimate story beat but not the expensive,
  // share-worthy first-team debut milestone. Require explicit senior context or
  // an unqualified debut; suppress academy/B-team debuts.
  const youthDebutContext = /\b(?:juvenil|cantera|filial|equipo b|sub[- ]?(?:17|18|19|20|21|23)|youth|academy|reserva)\b/.test(haystack);
  const seniorDebutContext = /\b(?:primer equipo|senior|profesional|primera division|segunda division|liga|copa|champions|europa league|seleccion absoluta)\b/.test(haystack);
  const explicitDebut = /\bdebut\b/.test(haystack) || /\bprimer partido\b/.test(haystack);
  const footballEstreno = /\bestreno\b/.test(haystack) && /\b(?:equipo|primer equipo|partido|liga|copa|champions|seleccion|titular|campo|cesped)\b/.test(haystack);
  if ((explicitDebut || footballEstreno) && (!youthDebutContext || seniorDebutContext)) return { kind: "debut", label: "Debut", scene: "pitch" };

  if (/\b(?:balon de oro|campeon|titulo|trofeo|copa|liga|champions|mundial|eurocopa)\b/.test(haystack)) return { kind: "trophy", label: "Noche de gloria", scene: "celebration" };

  const excludedSigningContext = /\b(?:renov|patrocin|sponsor|marca|adidas|nike|puma|ficha medica|ficha tecnica)\b/.test(haystack);
  const explicitClubMove = /\b(?:fichaje|fichas|fichado|fichar|traspaso|traspasado|nuevo club|cambio de club)\b/.test(haystack) && !excludedSigningContext;
  const clubPresentation = /\bpresentacion\b.{0,36}\b(?:con|en|como nuevo jugador|nuevo club)\b/.test(haystack) && !excludedSigningContext;
  const signedForClub = /\bfirma(?:s|do)? (?:por|con) (?:el |la )?[a-z0-9]/.test(haystack) && !excludedSigningContext;
  if (explicitClubMove || clubPresentation || signedForClub) return { kind: "signing", label: "Nuevo capítulo", scene: "presentation" };
  return { kind: "career", label: "Mi carrera", scene: "portrait" };
}
