import type { ShareData } from "./types";
import type { ClubVisualIdentity } from "./club-identity";

export type MilestoneVisualKind = "signing" | "debut" | "trophy" | "retirement" | "career";
export type PlayerVisualAgeStage = "academy" | "young-pro" | "prime" | "veteran" | "legacy";

export interface MilestoneVisualSpec { kind: MilestoneVisualKind; label: string; scene: "presentation" | "pitch" | "celebration" | "farewell" | "portrait"; }
export interface PlayerVisualProfile { age: number; stage: PlayerVisualAgeStage; ageDirection: string; }
export interface MilestoneGenerationBrief { scene: MilestoneVisualSpec["scene"]; identityRule: string; ageRule: string; clubRule: string; composition: string; prohibited: string[]; }

export function playerVisualProfile(age: number): PlayerVisualProfile {
  const safeAge = Number.isFinite(age) ? Math.max(16, Math.min(50, Math.round(age))) : 16;
  if (safeAge <= 18) return { age: safeAge, stage: "academy", ageDirection: "teenage academy player; youthful face; clean, understated football look" };
  if (safeAge <= 23) return { age: safeAge, stage: "young-pro", ageDirection: "young professional footballer; subtle maturation; contemporary but restrained look" };
  if (safeAge <= 30) return { age: safeAge, stage: "prime", ageDirection: "prime-age footballer; mature facial structure; natural hairstyle or light facial-hair variation" };
  if (safeAge <= 35) return { age: safeAge, stage: "veteran", ageDirection: "veteran footballer; visibly mature but athletic; plausible hair and beard evolution" };
  return { age: safeAge, stage: "legacy", ageDirection: "late-career footballer; natural ageing; experienced appearance; preserve recognisable identity" };
}

export function milestoneGenerationBrief(milestone: MilestoneVisualSpec, visual: PlayerVisualProfile, clubName: string, clubIdentity?: Pick<ClubVisualIdentity, "primary" | "secondary">): MilestoneGenerationBrief {
  const palette = clubIdentity ? ` Use the configured palette primary ${clubIdentity.primary} and secondary ${clubIdentity.secondary}.` : "";
  const compositions: Record<MilestoneVisualSpec["scene"], string> = {
    presentation: `professional football signing presentation for ${clubName}; player posing naturally with a rights-safe club-colour shirt; press-room/stadium presentation atmosphere`,
    pitch: `football debut for ${clubName}; player on the pitch with the ball in a rights-safe club-colour kit; match-night stadium atmosphere`,
    celebration: `major football achievement with ${clubName}; player as the clear protagonist in an emotional celebration; trophy only when the milestone actually represents a title or award`,
    farewell: `late-career farewell for ${clubName}; emotional stadium goodbye with the player as the clear protagonist`,
    portrait: `cinematic football-career portrait associated with ${clubName}; grounded documentary feel`,
  };
  return { scene: milestone.scene, identityRule: "Preserve the exact recognisable identity, ethnicity and core facial features of the persisted uploaded player photo; do not substitute another person.", ageRule: `Render the same person at career age ${visual.age}. ${visual.ageDirection}. Changes in hair or facial hair must be plausible, gradual and identity-preserving.`, clubRule: `Use ${clubName} name and configured club colours only.${palette} Do not invent or reproduce an official crest, sponsor mark or protected shirt artwork unless separately rights-cleared.`, composition: compositions[milestone.scene], prohibited: ["identity drift", "different person", "official crest without cleared rights", "sponsor logo without cleared rights", "wrong career age", "unearned trophy or award"] };
}

/** Rights-safe milestone classification used by share cards. */
export function milestoneVisualSpec(share: ShareData): MilestoneVisualSpec {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const subject = normalize(`${share.headline} ${share.kicker}`);
  const haystack = normalize(`${share.headline} ${share.kicker} ${share.lines.map((line) => `${line.label} ${line.value}`).join(" ")}`);
  const thirdPartyActor = "(?:rival|oponente|adversario|adversaria|companero|companera|excompanero|excompanera|exjugador|exjugadora|otro jugador|otra jugadora|capitan|capitana|entrenador|seleccionador|presidente|director deportivo|director tecnico|directora deportiva|directora tecnica|fisio|fisioterapeuta|medico|doctora|staff|padre|madre|hermano|hermana|abuelo|abuela|tio|tia|primo|prima|hijo|hija|pareja|novio|novia|amigo|amiga|aficion|aficionados|aficionadas|hinchas|seguidores|seguidoras|grada|prensa|periodista|periodistas|medios|diario|television|radio)";
  // Cover singular and plural Spanish recipient articles so headlines such as
  // "Dan el The Best al capitán" or "Entregan el trofeo a los aficionados"
  // cannot be mistaken for an award won by the player's own character.
  const thirdPartySubject = new RegExp(`^(?:el |la |los |las |un |una |unos |unas |tu |tus )?${thirdPartyActor}\\b`).test(subject) || new RegExp(`\\b(?:a|al|de|del|para) (?:el |la |los |las |tu |tus )?${thirdPartyActor}\\b`).test(subject);
  const formerSubject = /^(?:el |la |tu )?(?:exclub|ex club|antiguo club|anterior club|former club|exequipo|ex equipo|antiguo equipo|anterior equipo)\b/.test(subject);
  const nonCareerRetirement = /\b(?:lesion|lesionado|medico|hospital|dinero|efectivo|cajero|mercado|oferta|fichaje|traspaso)\b/.test(subject);
  if ((/\b(?:despedida|ultimo partido|fin de carrera|cuelga las botas|retirada|retiro|retirarse|se retira)\b/.test(subject)) && !nonCareerRetirement && !thirdPartySubject && !formerSubject) return { kind: "retirement", label: "Despedida", scene: "farewell" };

  const youthDebutContext = /\b(?:juvenil|cantera|filial|equipo b|sub[- ]?(?:17|18|19|20|21|23)|youth|academy|reserva)\b/.test(haystack);
  const seniorDebutContext = /\b(?:primer equipo|senior|profesional|primera division|segunda division|seleccion absoluta)\b/.test(haystack) || (!youthDebutContext && /\b(?:liga|copa|champions|europa league)\b/.test(haystack));
  const explicitDebut = /\bdebut\b|\bprimer partido\b/.test(subject);
  const footballEstreno = /\bestreno\b/.test(subject) && /\b(?:equipo|primer equipo|partido|liga|copa|champions|seleccion|titular|campo|cesped)\b/.test(haystack);
  const institutionalDebut = /\b(?:debut|estreno|primer partido)\s+(?:del|de la)\s+(?:club|equipo|seleccion)\b/.test(subject);
  if ((explicitDebut || footballEstreno) && seniorDebutContext && !thirdPartySubject && !institutionalDebut && !formerSubject) return { kind: "debut", label: "Debut", scene: "pitch" };

  const namedAward = /\b(?:balon de oro|the best|bota de oro|golden boy)\b/;
  const awardNearMiss = /\b(?:nominad[oa]|finalista|segund[oa]|tercer[oa]|podio|candidat[oa]|aspirante|favorit[oa])\b.{0,48}\b(?:balon de oro|the best|bota de oro|golden boy)\b/.test(subject) || /\b(?:balon de oro|the best|bota de oro|golden boy)\b.{0,48}\b(?:nominad[oa]|finalista|segund[oa]|tercer[oa]|podio|candidat[oa]|aspirante|favorit[oa])\b/.test(subject);
  const awardWon = !thirdPartySubject && !formerSubject && !awardNearMiss && ((namedAward.test(subject) && /\b(?:ganas?|gana|ganamos|ganan|conquistas?|conquista|recibes?|recibe|levantas?|levanta|te coronas|premiado|galardonado)\b/.test(subject)) || /\b(?:ganador|ganadora|vencedor|vencedora)\b.{0,36}\b(?:balon de oro|the best|bota de oro|golden boy)\b/.test(subject));
  const negatedAchievement = /\b(?:sin|ningun|ninguna|no (?:ganas?|gana|ganamos|ganan|conquistas?|conquista|levantas?|levanta|recibes?|recibe))\b.{0,32}\b(?:titulo|trofeo|campeon|copa|liga|champions|mundial|eurocopa|europa league|balon de oro|the best|bota de oro|golden boy)\b/.test(subject) || /\b(?:pierdes?|pierde|perdemos|eliminado|eliminada|subcampeon|subcampeona)\b.{0,32}\b(?:final|titulo|trofeo|copa|liga|champions|mundial|eurocopa|europa league)\b/.test(subject);
  const aspirationalAchievement = /\b(?:objetivo|meta|sueno|suenas|aspiras?|aspiracion|quieres?|esperas?|prometes?|reto)\b.{0,48}\b(?:ser|ganar|conquistar|levantar|campeon|titulo|trofeo|copa|liga|champions|mundial|eurocopa|europa league)\b/.test(subject);
  const qualificationOnly = /\b(?:clasificas?|clasificacion|clasificado|clasificada|billete|pase|acceso)\b.{0,48}\b(?:champions|mundial|eurocopa|europa league|copa)\b/.test(subject) || /\b(?:champions|mundial|eurocopa|europa league|copa)\b.{0,48}\b(?:clasificas?|clasificacion|clasificado|clasificada|billete|pase|acceso)\b/.test(subject);
  const friendlyAchievement = /\b(?:pretemporada|amistos[oa]s?|torneo amistoso|trofeo amistoso|torneo de verano|trofeo de verano|trofeo veraniego)\b/.test(subject);
  const youthAchievement = /\b(?:juvenil|cantera|filial|equipo b|sub[- ]?(?:17|18|19|20|21|23)|youth|academy|reserva)\b/.test(subject);
  const competitionName = "(?:copa(?: del rey)?|liga|champions|mundial|eurocopa|europa league|supercopa)";
  const championAchievement = new RegExp(`\\bcampeon(?:es|a|as)?\\b.{0,24}\\b${competitionName}\\b`).test(subject) || new RegExp(`\\b${competitionName}\\b.{0,24}\\bcampeon(?:es|a|as)?\\b`).test(subject);
  const genericTitleWon = /\b(?:ganas?|gana|ganamos|ganan|conquistas?|conquista|levantas?|levanta|alz(?:as|a)|recibes?|recibe)\b.{0,32}\b(?:titulo|trofeo)\b/.test(subject) || /\b(?:titulo|trofeo)\b.{0,32}\b(?:ganado|ganada|conquistado|conquistada|levantado|levantada)\b/.test(subject);
  const explicitCompetitionWin = new RegExp(`\\b(?:ganas?|gana|ganamos|ganan)\\s+(?:la|el)\\s+${competitionName}\\b`).test(subject);
  const strongCompetitionAchievement = new RegExp(`\\b(?:conquistas?|conquista|levantas?|levanta|alz(?:as|a)|coronas?|corona)\\b.{0,32}\\b${competitionName}\\b`).test(subject) || new RegExp(`\\b${competitionName}\\b.{0,32}\\b(?:ganada|conquistada|levantada|campeon)\\b`).test(subject);
  if (!thirdPartySubject && !formerSubject && !negatedAchievement && !aspirationalAchievement && !qualificationOnly && !friendlyAchievement && (!youthAchievement || awardWon) && (awardWon || championAchievement || genericTitleWon || explicitCompetitionWin || strongCompetitionAchievement)) return { kind: "trophy", label: "Noche de gloria", scene: "celebration" };

  const excludedSigningContext = /\b(?:renov|patrocin|sponsor|marca|adidas|nike|puma|ficha medica|ficha tecnica)\b/.test(subject);
  const speculativeMove = /\b(?:oferta|interes|negocia|negociacion|rumor|sondeo|posible|podria|puede|opcion)\b.{0,48}\b(?:fichaje|fichar|traspaso|cesion|cedido|nuevo club)\b/.test(subject) || /\b(?:fichaje|fichar|traspaso|cesion|cedido|nuevo club)\b.{0,48}\b(?:oferta|interes|negocia|negociacion|rumor|sondeo|posible|podria|puede|opcion)\b/.test(subject);
  const thirdPartySigning = thirdPartySubject || formerSubject || /\b(?:nuevo fichaje del club|fichaje rival|mercado)\b/.test(subject);
  const explicitClubMove = /\b(?:fichaje|fichas|fichado|traspasado|nuevo club|cambio de club)\b/.test(subject) && !excludedSigningContext && !thirdPartySigning && !speculativeMove;
  const clubPresentation = /\bpresentacion\b.{0,36}\b(?:con|en|como nuevo jugador|nuevo club)\b/.test(subject) && !excludedSigningContext && !thirdPartySigning && !speculativeMove;
  const signedForClub = /\bfirma(?:s|do)? (?:por|con) (?:el |la )?[a-z0-9]/.test(subject) && !excludedSigningContext && !thirdPartySigning && !speculativeMove;
  if (explicitClubMove || clubPresentation || signedForClub) return { kind: "signing", label: "Nuevo capítulo", scene: "presentation" };
  return { kind: "career", label: "Mi carrera", scene: "portrait" };
}
