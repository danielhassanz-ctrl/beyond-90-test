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

  const youthDebutContext = /\b(?:juvenil|cantera|filial|equipo b|sub[- ]?(?:17|18|19|20|21|23)|youth|academy|reserva)\b/.test(haystack);
  const explicitSeniorIdentity = /\b(?:primer equipo|senior|profesional|primera division|segunda division|seleccion absoluta)\b/.test(haystack);
  const seniorCompetition = /\b(?:liga|copa|champions|europa league)\b/.test(haystack);
  const seniorDebutContext = explicitSeniorIdentity || (!youthDebutContext && seniorCompetition);
  const explicitDebut = /\bdebut\b/.test(haystack) || /\bprimer partido\b/.test(haystack);
  const footballEstreno = /\bestreno\b/.test(haystack) && /\b(?:equipo|primer equipo|partido|liga|copa|champions|seleccion|titular|campo|cesped)\b/.test(haystack);
  const thirdPartyDebut = /\b(?:companero|companera|rival|oponente|adversario|adversaria|otro jugador|otra jugadora|nuevo companero|nuevo fichaje|seleccionador|entrenador|canterano|canterana)\b/.test(haystack);
  const institutionalDebut = /\b(?:debut|estreno|primer partido)\s+(?:del|de la)\s+(?:club|equipo|seleccion)\b/.test(haystack);
  if ((explicitDebut || footballEstreno) && seniorDebutContext && !thirdPartyDebut && !institutionalDebut) return { kind: "debut", label: "Debut", scene: "pitch" };

  const namedAward = /\b(?:balon de oro|the best|bota de oro|golden boy)\b/;
  const awardNearMiss = /\b(?:nominad[oa]|finalista|segund[oa]|tercer[oa]|podio|candidat[oa]|aspirante|favorit[oa])\b.{0,48}\b(?:balon de oro|the best|bota de oro|golden boy)\b/.test(haystack) ||
    /\b(?:balon de oro|the best|bota de oro|golden boy)\b.{0,48}\b(?:nominad[oa]|finalista|segund[oa]|tercer[oa]|podio|candidat[oa]|aspirante|favorit[oa])\b/.test(haystack);
  const awardWon = !awardNearMiss && ((namedAward.test(haystack) && /\b(?:ganas?|gana|ganamos|ganan|conquistas?|conquista|recibes?|recibe|levantas?|levanta|te coronas|premiado|galardonado)\b/.test(haystack)) ||
    /\b(?:ganador|ganadora|vencedor|vencedora)\b.{0,36}\b(?:balon de oro|the best|bota de oro|golden boy)\b/.test(haystack));
  const negatedAchievement = /\b(?:sin|ningun|ninguna|no (?:ganas?|gana|ganamos|ganan|conquistas?|conquista|levantas?|levanta|recibes?|recibe))\b.{0,32}\b(?:titulo|trofeo|campeon|copa|liga|champions|mundial|eurocopa|europa league|balon de oro|the best|bota de oro|golden boy)\b/.test(haystack) ||
    /\b(?:pierdes?|pierde|perdemos|eliminado|eliminada|subcampeon|subcampeona)\b.{0,32}\b(?:final|titulo|trofeo|copa|liga|champions|mundial|eurocopa|europa league)\b/.test(haystack);
  const aspirationalAchievement = /\b(?:objetivo|meta|sueno|suenas|aspiras?|aspiracion|quieres?|esperas?|prometes?|reto)\b.{0,48}\b(?:ser|ganar|conquistar|levantar|campeon|titulo|trofeo|copa|liga|champions|mundial|eurocopa|europa league)\b/.test(haystack);
  const qualificationOnly = /\b(?:clasificas?|clasificacion|clasificado|clasificada|billete|pase|acceso)\b.{0,48}\b(?:champions|mundial|eurocopa|europa league|copa)\b/.test(haystack) ||
    /\b(?:champions|mundial|eurocopa|europa league|copa)\b.{0,48}\b(?:clasificas?|clasificacion|clasificado|clasificada|billete|pase|acceso)\b/.test(haystack);
  const friendlyAchievement = /\b(?:pretemporada|amistos[oa]s?|torneo amistoso|trofeo amistoso|torneo de verano|trofeo de verano|trofeo veraniego)\b/.test(haystack);
  const championCompetition = "(?:liga|copa(?: del rey)?|champions|mundial|eurocopa|europa league|supercopa)";
  const championAchievement = new RegExp(`\\bcampeon(?:es|a|as)?\\b.{0,24}\\b${championCompetition}\\b`).test(haystack) ||
    new RegExp(`\\b${championCompetition}\\b.{0,24}\\bcampeon(?:es|a|as)?\\b`).test(haystack);
  const genericTitleWon = /\b(?:ganas?|gana|ganamos|ganan|conquistas?|conquista|levantas?|levanta|alz(?:as|a)|recibes?|recibe)\b.{0,32}\b(?:titulo|trofeo)\b/.test(haystack) ||
    /\b(?:titulo|trofeo)\b.{0,32}\b(?:ganado|ganada|conquistado|conquistada|levantado|levantada)\b/.test(haystack);
  const genericAchievement = (championAchievement || genericTitleWon) && !negatedAchievement && !aspirationalAchievement && !qualificationOnly && !friendlyAchievement;
  const competitionName = "(?:copa|liga|champions|mundial|eurocopa|europa league|supercopa)";
  const explicitCompetitionWin = new RegExp(`\\b(?:ganas?|gana|ganamos|ganan)\\s+(?:la|el)\\s+${competitionName}\\b`).test(haystack);
  const strongCompetitionAchievement = new RegExp(`\\b(?:conquistas?|conquista|levantas?|levanta|alz(?:as|a)|coronas?|corona)\\b.{0,32}\\b${competitionName}\\b`).test(haystack) ||
    new RegExp(`\\b${competitionName}\\b.{0,32}\\b(?:ganada|conquistada|levantada|campeon)\\b`).test(haystack);
  const competitionWon = !negatedAchievement && !aspirationalAchievement && !qualificationOnly && !friendlyAchievement && (explicitCompetitionWin || strongCompetitionAchievement);
  if (!negatedAchievement && !aspirationalAchievement && !qualificationOnly && !friendlyAchievement && (awardWon || genericAchievement || competitionWon)) return { kind: "trophy", label: "Noche de gloria", scene: "celebration" };

  const excludedSigningContext = /\b(?:renov|patrocin|sponsor|marca|adidas|nike|puma|ficha medica|ficha tecnica)\b/.test(haystack);
  // Market/loan discussion is not a completed signing. Premium presentation imagery
  // is reserved for a confirmed move by the player's own career.
  const speculativeMove = /\b(?:oferta|interes|negocia|negociacion|rumor|sondeo|posible|podria|puede|opcion)\b.{0,48}\b(?:fichaje|fichar|traspaso|cesion|cedido|nuevo club)\b/.test(haystack) ||
    /\b(?:fichaje|fichar|traspaso|cesion|cedido|nuevo club)\b.{0,48}\b(?:oferta|interes|negocia|negociacion|rumor|sondeo|posible|podria|puede|opcion)\b/.test(haystack);
  const thirdPartySigning = /\b(?:companero|companera|rival|otro jugador|otra jugadora|nuevo companero|nuevo fichaje del club|fichaje rival|mercado)\b/.test(haystack);
  const explicitClubMove = /\b(?:fichaje|fichas|fichado|traspasado|nuevo club|cambio de club)\b/.test(haystack) && !excludedSigningContext && !thirdPartySigning && !speculativeMove;
  const clubPresentation = /\bpresentacion\b.{0,36}\b(?:con|en|como nuevo jugador|nuevo club)\b/.test(haystack) && !excludedSigningContext && !thirdPartySigning && !speculativeMove;
  const signedForClub = /\bfirma(?:s|do)? (?:por|con) (?:el |la )?[a-z0-9]/.test(haystack) && !excludedSigningContext && !thirdPartySigning && !speculativeMove;
  if (explicitClubMove || clubPresentation || signedForClub) return { kind: "signing", label: "Nuevo capítulo", scene: "presentation" };
  return { kind: "career", label: "Mi carrera", scene: "portrait" };
}
