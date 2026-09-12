import { ensureCareerCast } from "../src/game/career-life";
import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import { afterOpeningClubChoice, forceOpeningPending, initializeOpening, OPENING_DONE, OPENING_PHASE, OpeningPhase } from "../src/game/opening";
import { setCareerMode, type CareerMode } from "../src/game/pacing";
import type { DynamicCard, GameState, Player } from "../src/game/types";

function rng(seed:number){let x=seed>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/0x100000000;};}
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m);}
function norm(s:string){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();}
function player(seed:number):Player{return{name:`Repetition V3 ${seed}`,nickname:"",position:["DC","MC","MCO","EXT","DFC","LAT"][seed%6] as Player["position"],nationality:"España",city:seed%2?"Sevilla":"Madrid",avatar:null,traits:seed%2?["familiar","leal"]:["ambicioso","profesional"]};}

function semanticFamily(p:DynamicCard):string{
 if(p.kind==="arc")return `arc:${String(p.data["arcId"]??"unknown")}`;
 if(p.kind==="arc_beat")return `beat:${String(p.data["beatId"]??"unknown")}`;
 if(p.kind==="arc_callback")return `callback:${String(p.data["cbId"]??"unknown")}`;
 if(p.kind==="thread")return `thread:${String(p.data["threadKind"]??"unknown")}`;
 if(p.kind.startsWith("cons_"))return `consequence:${p.kind}`;
 return `dynamic:${p.kind}`;
}

type D={title:string;text:string;family:string;category:string;kind:string;choices:string[]};
function describe(s:GameState):D|null{
 const p=s.pending;if(!p||p.type==="season")return null;
 if(p.type==="event"){
  const e=eventById(p.eventId);assert(e,`missing ${p.eventId}`);
  const text=typeof e.text==="function"?e.text(s):e.text;
  return{title:e.title,text,family:e.family??e.category,category:e.category,kind:`event:${e.id}`,choices:e.choices.map(c=>c.label)};
 }
 if(p.type==="match"){
  if(!p.match.keyMoment)return null;
  return{title:`${p.match.ctx.storyLabel} · ${p.match.opponent}`,text:`${p.match.ctx.competition} · ${p.match.ctx.venue} · ${p.match.keyMoment.prompt}`,family:"match",category:"match",kind:"match",choices:p.match.keyMoment.options.map(o=>o.label)};
 }
 assert(p.kind!=="match_flash",`BANNED match_flash leaked: ${JSON.stringify(p.data)}`);
 const v=renderDynamic(s,p);
 return{title:v.title,text:v.text,family:semanticFamily(p),category:v.category,kind:`dynamic:${p.kind}`,choices:v.choices.map(c=>c.label)};
}

function resolveCurrent(s:GameState):GameState{
 if(s.lastOutcome)return advance(s);const p=s.pending;if(!p||p.type==="season")return advance(s);
 if(p.type==="event"){const e=eventById(p.eventId)!;return resolveEvent(s,p.eventId,e.choices[0]!.id);}
 if(p.type==="match")return resolveMatch(s,p.match,p.match.keyMoment?.options[0]?.id);
 const v=renderDynamic(s,p);assert(v.choices[0],`dynamic ${p.kind} has no choice`);return resolveDynamicCard(s,p,v.choices[0]!.id);
}

function jaccard(a:string,b:string){const A=new Set(norm(a).split(" ").filter(x=>x.length>3));const B=new Set(norm(b).split(" ").filter(x=>x.length>3));if(!A.size||!B.size)return 0;let hit=0;for(const x of A)if(B.has(x))hit++;return hit/(A.size+B.size-hit);}

function assertVariety(mode:CareerMode,seed:number,seen:D[]){
 const titles=new Map<string,number>();
 const choiceSets=new Map<string,number>();
 for(let i=0;i<seen.length;i++){
  const d=seen[i]!;
  if(d.kind!=="match"){
   const tk=norm(d.title);const prev=titles.get(tk);assert(prev===undefined,`${mode}/${seed}: repeated title '${d.title}' at ${prev!+1}/${i+1}`);titles.set(tk,i);
  }
  if(d.choices.length>=2){const ck=d.choices.map(norm).sort().join("|");const prev=choiceSets.get(ck);assert(prev===undefined,`${mode}/${seed}: repeated choice set at ${prev!+1}/${i+1}: ${ck}`);choiceSets.set(ck,i);}
  for(let j=0;j<i;j++){
   const p=seen[j]!;
   if(d.kind==="match"&&p.kind==="match")continue;
   if(d.text.length>60&&p.text.length>60){const sim=jaccard(d.text,p.text);assert(sim<0.82,`${mode}/${seed}: near-duplicate narrative ${p.title} vs ${d.title} (${sim.toFixed(2)})`);}
  }
  if(i>=2)assert(!(seen[i-2]!.family===d.family&&seen[i-1]!.family===d.family),`${mode}/${seed}: three consecutive decisions in family ${d.family}`);
 }
 const postOpening=seen.slice(10);
 assert(new Set(postOpening.map(x=>x.family)).size>=3,`${mode}/${seed}: first five post-opening decisions span fewer than 3 families`);
 assert(seen.filter(x=>x.kind==="match").length<=5,`${mode}/${seed}: first 15 too match-heavy`);
 assert(seen.filter(x=>x.kind!=="match").length>=10,`${mode}/${seed}: fewer than 10 non-match decisions`);
 assert(seen.filter(x=>/life|agent|club|story|gossip/.test(x.category)||/opening/.test(x.kind)).length>=8,`${mode}/${seed}: fewer than 8 human/career-context decisions`);
 assert(seen.filter(x=>/preseason|training|medical/.test(x.category)).length>=2,`${mode}/${seed}: fewer than 2 development/adaptation decisions`);
}

function run(mode:CareerMode,seed:number){const old=Math.random;Math.random=rng(seed);try{
 let s=createGame(player(seed));s.careerSeed=seed;setCareerMode(s,mode);ensureCareerCast(s);initializeOpening(s);const seen:D[]=[];let guard=0;
 while(seen.length<15&&guard++<800){
  if((s.flags[OPENING_PHASE]??OpeningPhase.DONE)===OpeningPhase.CLUB_CHOICE&&!s.clubId){const offers=s.offers.slice(0,4);assert(offers.length>0,`${mode}/${seed}: no club offer`);const idx=Math.abs(seed+seen.length*7)%offers.length;seen.push({title:"Elegir primer club",text:`Comparas cuatro caminos y eliges ${offers[idx]!.clubId}`,family:"club_choice",category:"club",kind:"club_choice",choices:offers.map(o=>o.clubId)});s=afterOpeningClubChoice(chooseClub(s,offers[idx]!.clubId));continue;}
  const d=describe(s);if(d)seen.push(d);
  if(s.pending?.type==="event"&&(s.flags[OPENING_PHASE]??OPENING_DONE)<OPENING_DONE){const id=s.pending.eventId;const map:Record<string,string>={opening_home_family:"familia",opening_adviser_choice:seed%3===0?"father":seed%3===1?"agent":"friend",opening_first_agreement:seed%2?"minutes":"development",opening_signing_day:seed%2?"family":"quiet",opening_named_coach:seed%2?"listen":"patient",opening_preseason_adaptation:seed%2?"extra":"listen",opening_named_captain:seed%2?"respect":"observe",opening_named_teammate:seed%2?"friend":"quiet",opening_named_physio:seed%2?"trust":"ask"};const e=eventById(id)!;const wanted=map[id];const chosen=e.choices.find(c=>c.id===wanted)??e.choices[(seed+seen.length)%e.choices.length]??e.choices[0]!;const next=resolveEvent(s,id,chosen.id);s=forceOpeningPending(next)??next;}else s=resolveCurrent(s);
 }
 assert(seen.length===15,`${mode}/${seed}: only ${seen.length} decisions`);assertVariety(mode,seed,seen);
}finally{Math.random=old;}}

const modes:CareerMode[]=["express","standard","pro"];const seeds=[17,101,2026,31337];for(const mode of modes)for(const seed of seeds)run(mode,seed+modes.indexOf(mode)*100000);
console.log("FIRST15_REPETITION_V3_OK: 12 deterministic careers reject repeated titles, choice sets, near-duplicate text and family loops.");
