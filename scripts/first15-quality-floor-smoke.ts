import { ensureCareerCast } from "../src/game/career-life";
import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import { afterOpeningClubChoice, forceOpeningPending, initializeOpening, OPENING_DONE, OPENING_PHASE, OpeningPhase } from "../src/game/opening";
import { setCareerMode, type CareerMode } from "../src/game/pacing";
import type { DynamicCard, GameState, Player } from "../src/game/types";

function rng(seed:number){let x=seed>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/0x100000000;};}
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m);}
function player(seed:number):Player{return{name:`Quality ${seed}`,nickname:"",position:["DC","MC","EXT","DFC"][seed%4] as Player["position"],nationality:"España",city:seed%2?"Sevilla":"Madrid",avatar:null,traits:seed%2?["familiar","leal"]:["ambicioso","profesional"]};}
function norm(s:string){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();}
function semanticFamily(p:DynamicCard):string{
 if(p.kind==="arc")return `arc:${String(p.data["arcId"]??"unknown")}`;
 if(p.kind==="arc_beat")return `beat:${String(p.data["beatId"]??"unknown")}`;
 if(p.kind==="arc_callback")return `callback:${String(p.data["cbId"]??"unknown")}`;
 if(p.kind==="thread")return `thread:${String(p.data["threadKind"]??"unknown")}`;
 return `dynamic:${p.kind}`;
}

type D={title:string;family:string;category:string;kind:string;choices:string[]};
function describe(s:GameState):D|null{
 const p=s.pending;if(!p||p.type==="season")return null;
 if(p.type==="event"){const e=eventById(p.eventId);assert(e,`missing ${p.eventId}`);return{title:e.title,family:e.family??e.category,category:e.category,kind:`event:${e.id}`,choices:e.choices.map(c=>c.label)};}
 if(p.type==="match"){if(!p.match.keyMoment)return null;return{title:`${p.match.ctx.storyLabel} · ${p.match.opponent}`,family:"match",category:"match",kind:"match",choices:p.match.keyMoment.options.map(o=>o.label)};}
 assert(p.kind!=="match_flash",`match_flash leaked: ${JSON.stringify(p.data)}`);
 const v=renderDynamic(s,p);return{title:v.title,family:semanticFamily(p),category:v.category,kind:`dynamic:${p.kind}`,choices:v.choices.map(c=>c.label)};
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
  if((s.flags[OPENING_PHASE]??OpeningPhase.DONE)===OpeningPhase.CLUB_CHOICE&&!s.clubId){const offer=s.offers[0]?.clubId;assert(offer,`${mode}/${seed}: no club offer`);seen.push({title:"Elegir primer club",family:"club_choice",category:"club",kind:"club_choice",choices:s.offers.slice(0,4).map(o=>o.clubId)});s=afterOpeningClubChoice(chooseClub(s,offer));continue;}
  const d=describe(s);if(d)seen.push(d);
  if(s.pending?.type==="event"&&(s.flags[OPENING_PHASE]??OPENING_DONE)<OPENING_DONE){const id=s.pending.eventId;const choices:Record<string,string>={opening_home_family:"familia",opening_adviser_choice:seed%3===0?"father":seed%3===1?"agent":"friend",opening_first_agreement:"minutes",opening_signing_day:"family",opening_named_coach:"listen",opening_preseason_adaptation:"extra",opening_named_captain:"respect",opening_named_teammate:"friend",opening_named_physio:"trust"};const next=resolveEvent(s,id,choices[id]??eventById(id)!.choices[0]!.id);s=forceOpeningPending(next)??next;}else s=resolveCurrent(s);
 }
 assert(seen.length===15,`${mode}/${seed}: only ${seen.length} decisions`);
 const matches=seen.filter(x=>x.kind==="match").length;
 const human=seen.filter(x=>/life|agent|club|story|gossip/.test(x.category)||/opening/.test(x.kind)).length;
 const footballDevelopment=seen.filter(x=>/preseason|training|medical/.test(x.category)).length;
 assert(matches<=5,`${mode}/${seed}: ${matches}/15 decisions are key matches; early career is too match-heavy`);
 assert(human>=8,`${mode}/${seed}: only ${human}/15 human/career-context decisions`);
 assert(footballDevelopment>=2,`${mode}/${seed}: only ${footballDevelopment}/15 development/adaptation decisions`);
 assert(!seen.some(x=>x.title==="Semana de trabajo"),`${mode}/${seed}: generic fallback filler reached first 15`);
 const nonMatch=seen.filter(x=>x.kind!=="match");assert(nonMatch.length>=10,`${mode}/${seed}: only ${nonMatch.length}/15 non-match decisions`);

 // User-facing boredom regressions: a technically different card is still filler if
 // the player sees the same title or the same three decisions again.
 const titleSeen=new Map<string,number>();
 const choiceSeen=new Map<string,number>();
 for(let i=0;i<seen.length;i++){
  const d=seen[i]!;const titleKey=norm(d.title);assert(titleKey.length>0,`${mode}/${seed}: empty title at decision ${i+1}`);
  const previousTitle=titleSeen.get(titleKey);assert(previousTitle===undefined,`${mode}/${seed}: repeated title "${d.title}" at decisions ${previousTitle!+1} and ${i+1}`);titleSeen.set(titleKey,i);
  if(d.choices.length>=2){const sig=d.choices.map(norm).sort().join(" | ");const previousChoices=choiceSeen.get(sig);assert(previousChoices===undefined,`${mode}/${seed}: repeated choice set at decisions ${previousChoices!+1} and ${i+1}: ${sig}`);choiceSeen.set(sig,i);}
 }
 let streak=1;
 for(let i=1;i<seen.length;i++){
  streak=seen[i]!.family===seen[i-1]!.family?streak+1:1;
  assert(streak<=2,`${mode}/${seed}: three consecutive decisions in semantic family ${seen[i]!.family}: ${seen.slice(Math.max(0,i-2),i+1).map(x=>x.title).join(" / ")}`);
 }
 const postOpening=seen.slice(10);
 assert(new Set(postOpening.map(x=>x.family)).size>=3,`${mode}/${seed}: post-opening first five decisions span fewer than 3 semantic families: ${postOpening.map(x=>`${x.family}:${x.title}`).join(" | ")}`);
}finally{Math.random=old;}}
const modes:CareerMode[]=["express","standard","pro"];const seeds=[17,101,2026,31337];for(const mode of modes)for(const seed of seeds)run(mode,seed+modes.indexOf(mode)*100000);
console.log("FIRST15_QUALITY_FLOOR_OK: 12 deterministic careers keep the first 15 decisions human-led, varied, non-repetitive and low on match filler.");
