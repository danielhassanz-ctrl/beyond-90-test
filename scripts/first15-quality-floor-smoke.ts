import { ensureCareerCast } from "../src/game/career-life";
import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import { afterOpeningClubChoice, forceOpeningPending, initializeOpening, OPENING_DONE, OPENING_PHASE, OpeningPhase } from "../src/game/opening";
import { setCareerMode, type CareerMode } from "../src/game/pacing";
import type { GameState, Player } from "../src/game/types";

function rng(seed:number){let x=seed>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/0x100000000;};}
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m);}
function player(seed:number):Player{return{name:`Quality ${seed}`,nickname:"",position:["DC","MC","EXT","DFC"][seed%4] as Player["position"],nationality:"España",city:seed%2?"Sevilla":"Madrid",avatar:null,traits:seed%2?["familiar","leal"]:["ambicioso","profesional"]};}

type D={title:string;family:string;kind:string};
function describe(s:GameState):D|null{
 const p=s.pending;if(!p||p.type==="season")return null;
 if(p.type==="event"){const e=eventById(p.eventId);assert(e,`missing ${p.eventId}`);return{title:e.title,family:e.family??e.category,kind:`event:${e.id}`};}
 if(p.type==="match"){if(!p.match.keyMoment)return null;return{title:`${p.match.ctx.storyLabel} · ${p.match.opponent}`,family:"match",kind:"match"};}
 assert(p.kind!=="match_flash",`match_flash leaked: ${JSON.stringify(p.data)}`);
 const v=renderDynamic(s,p);return{title:v.title,family:v.category,kind:`dynamic:${p.kind}`};
}
function resolveCurrent(s:GameState):GameState{
 if(s.lastOutcome)return advance(s);const p=s.pending;if(!p||p.type==="season")return advance(s);
 if(p.type==="event"){const e=eventById(p.eventId)!;return resolveEvent(s,p.eventId,e.choices[0]!.id);}
 if(p.type==="match")return resolveMatch(s,p.match,p.match.keyMoment?.options[0]?.id);
 const v=renderDynamic(s,p);return resolveDynamicCard(s,p,v.choices[0]!.id);
}
function run(mode:CareerMode,seed:number){const old=Math.random;Math.random=rng(seed);try{
 let s=createGame(player(seed));s.careerSeed=seed;setCareerMode(s,mode);ensureCareerCast(s);initializeOpening(s);const seen:D[]=[];let guard=0;
 while(seen.length<15&&guard++<600){
  if((s.flags[OPENING_PHASE]??OpeningPhase.DONE)===OpeningPhase.CLUB_CHOICE&&!s.clubId){const offer=s.offers[0]?.clubId;assert(offer,`${mode}/${seed}: no club offer`);seen.push({title:"Elegir primer club",family:"club_choice",kind:"club_choice"});s=afterOpeningClubChoice(chooseClub(s,offer));continue;}
  const d=describe(s);if(d)seen.push(d);
  if(s.pending?.type==="event"&&(s.flags[OPENING_PHASE]??OPENING_DONE)<OPENING_DONE){const id=s.pending.eventId;const choices:Record<string,string>={opening_home_family:"familia",opening_adviser_choice:seed%3===0?"father":seed%3===1?"agent":"friend",opening_first_agreement:"minutes",opening_signing_day:"family",opening_named_coach:"listen",opening_preseason_adaptation:"extra",opening_named_captain:"respect",opening_named_teammate:"friend",opening_named_physio:"trust"};const next=resolveEvent(s,id,choices[id]??eventById(id)!.choices[0]!.id);s=forceOpeningPending(next)??next;}else s=resolveCurrent(s);
 }
 assert(seen.length===15,`${mode}/${seed}: only ${seen.length} decisions`);
 const matches=seen.filter(x=>x.kind==="match").length;
 const human=seen.filter(x=>/opening|life|agent|club|story|gossip/.test(`${x.family} ${x.kind}`)).length;
 const footballDevelopment=seen.filter(x=>/preseason|training|medical/.test(`${x.family} ${x.kind}`)).length;
 assert(matches<=5,`${mode}/${seed}: ${matches}/15 decisions are key matches; early career is too match-heavy`);
 assert(human>=8,`${mode}/${seed}: only ${human}/15 human/career-context decisions`);
 assert(footballDevelopment>=2,`${mode}/${seed}: only ${footballDevelopment}/15 development/adaptation decisions`);
 assert(!seen.some(x=>x.title==="Semana de trabajo"),`${mode}/${seed}: generic fallback filler reached first 15`);
 const nonMatch=seen.filter(x=>x.kind!=="match");assert(nonMatch.length>=10,`${mode}/${seed}: only ${nonMatch.length}/15 non-match decisions`);
}finally{Math.random=old;}}
const modes:CareerMode[]=["express","standard","pro"];const seeds=[17,101,2026,31337];for(const mode of modes)for(const seed of seeds)run(mode,seed+modes.indexOf(mode)*100000);
console.log("FIRST15_QUALITY_FLOOR_OK: 12 deterministic careers keep the first 15 decisions human-led, varied and low on match filler.");
