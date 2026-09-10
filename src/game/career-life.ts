import { careerSeed, hash } from "./npc";
import type { GameState } from "./types";

export type CareerEra = "academy" | "breakthrough" | "established" | "prime" | "veteran" | "legacy";
export type CareerStatus = "prospect" | "squad" | "starter" | "star" | "elite" | "legend";
export type AdviserKind = "agent" | "father" | "friend";

export interface CareerPerson {
  id: string;
  name: string;
  role: "adviser" | "coach" | "physio" | "captain" | "teammate" | "social";
  relation: number;
  met: boolean;
  lastContactScene: number;
}
export interface CareerCast {
  adviserKind: AdviserKind;
  adviser: CareerPerson;
  coach: CareerPerson;
  physio: CareerPerson;
  captain: CareerPerson;
  teammate: CareerPerson;
  social: CareerPerson;
}
const NAMES = {
  adviser: ["Álex Salas", "Mario Vega", "Javi Romero", "Rubén Costa", "Sergio León"],
  coach: ["Rafa Molina", "Óscar Mena", "Iñaki Torres", "Luis Aranda", "Pablo Ríos"],
  physio: ["Clara Vidal", "Marta Sanz", "Álvaro Rey", "Nuria Campos", "David Serra"],
  captain: ["Álex Moreno", "Dani Rivas", "Marcos Vidal", "Jorge Peña", "Iván Santos"],
  teammate: ["Nico Lara", "Hugo Rey", "Mateo Cruz", "Iker Vidal", "Adrián Soler"],
  social: ["Lucía", "Marta", "Alba", "Carla", "Sofía"],
} as const;
function pick(s: GameState, key: keyof typeof NAMES): string { const list=NAMES[key]; return list[hash(careerSeed(s), `career-person-${key}`)%list.length]!; }
function person(s: GameState, role: CareerPerson["role"], key: keyof typeof NAMES): CareerPerson { return {id:`${role}-${hash(careerSeed(s),role)}`,name:pick(s,key),role,relation:50,met:false,lastContactScene:-99}; }
/** Persistent named people: a career is a biography, not anonymous cards. */
export function ensureCareerCast(s: GameState): CareerCast {
  const holder=s.memory as typeof s.memory & {careerCast?:CareerCast};
  if(holder.careerCast) return holder.careerCast;
  const adviserKind:AdviserKind=(["agent","father","friend"] as const)[hash(careerSeed(s),"adviser-kind")%3]!;
  const adviser=person(s,"adviser","adviser");
  adviser.name=adviserKind==="father"?"Papá":adviserKind==="friend"?pick(s,"teammate"):pick(s,"adviser");
  holder.careerCast={adviserKind,adviser,coach:person(s,"coach","coach"),physio:person(s,"physio","physio"),captain:person(s,"captain","captain"),teammate:person(s,"teammate","teammate"),social:person(s,"social","social")};
  return holder.careerCast;
}
export function careerEra(s:GameState):CareerEra { if(s.age<=18)return"academy";if(s.age<=21)return"breakthrough";if(s.age<=24)return"established";if(s.age<=30)return"prime";if(s.age<=34)return"veteran";return"legacy"; }
export function careerStatus(s:GameState):CareerStatus { const titles=s.titles?.length??0,awards=s.awards?.length??0;if(s.age>=27&&s.overall>=89&&(titles>=4||awards>=2))return"legend";if(s.overall>=88||awards>=1)return"elite";if(s.overall>=83||s.fame>=75)return"star";if(s.overall>=76||s.fame>=45)return"starter";if(s.overall>=70)return"squad";return"prospect"; }
export function plausibleMoneyScale(s:GameState):"youth"|"pro"|"star"|"superstar" { const x=careerStatus(s);if(s.age<=18||x==="prospect")return"youth";if(x==="squad"||x==="starter")return"pro";if(x==="star")return"star";return"superstar"; }
export function canReceiveSocialDm(s:GameState):boolean { return s.age>=17&&s.fame>=18&&!s.flags["social_dm_intro"]; }
export function touch(p:CareerPerson,s:GameState,delta=0):void {p.met=true;p.lastContactScene=s.sceneCount;p.relation=Math.max(0,Math.min(100,p.relation+delta));}
