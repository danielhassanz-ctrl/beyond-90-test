import assert from "node:assert/strict";
import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { renderDynamic } from "../src/game/dynamic";
import { eventById } from "../src/game/events";
import { ensureCareerCast } from "../src/game/career-life";
import { applyCareerPacing, CAREER_MODES, careerModeConfig, setCareerMode, type CareerMode } from "../src/game/pacing";
import type { GameState, Player } from "../src/game/types";

function rng(seed:number){let x=seed>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/0x100000000;};}
const player:Player={name:"Runtime Pacing QA",nickname:"",position:"MC",nationality:"España",city:"Madrid",avatar:null,traits:["ambicioso","profesional"]};
const informationalDynamic=new Set(["promotion","growth","career_end"]);
function withRuntime(s:GameState):GameState{ensureCareerCast(s);applyCareerPacing(s);return s;}
function isDecision(s:GameState):boolean{
  if(!s.pending)return false;
  if(s.pending.type==="event"||s.pending.type==="match")return true;
  if(s.pending.type!=="dynamic"||informationalDynamic.has(s.pending.kind))return false;
  return renderDynamic(s,s.pending).choices.length>0;
}
function resolvePending(s:GameState):GameState{
  if(s.lastOutcome)return withRuntime(advance(s));
  if(!s.pending||s.pending.type==="season")return withRuntime(advance(s));
  if(s.pending.type==="match")return withRuntime(resolveMatch(s,s.pending.match,s.pending.match.keyMoment?.options[0]?.id));
  if(s.pending.type==="event"){
    const event=eventById(s.pending.eventId);assert.ok(event,`Missing event ${s.pending.eventId}`);
    const choice=event.choices[0];assert.ok(choice,`Event ${event.id} has no choice`);
    return withRuntime(resolveEvent(s,event.id,choice.id));
  }
  const view=renderDynamic(s,s.pending);const choice=view.choices[0];
  return withRuntime(choice?resolveDynamicCard(s,s.pending,choice.id):advance(s));
}
function runFirstSeason(mode:CareerMode,seed:number){
  const originalRandom=Math.random;Math.random=rng(seed);
  try{
    let s=createGame(player);s.careerSeed=seed;setCareerMode(s,mode);ensureCareerCast(s);
    const offer=s.offers[0];assert.ok(offer,`${mode}/${seed}: no initial club offer`);s=withRuntime(chooseClub(s,offer.clubId));
    const startAge=s.age;let decisions=0,matches=0,steps=0;let hadInjury=false;
    while(s.age===startAge&&steps<600){
      if(s.pending?.type==="dynamic"&&(s.pending.kind==="injury_diagnosis"||s.pending.kind==="return"))hadInjury=true;
      if(isDecision(s)){decisions++;if(s.pending?.type==="match")matches++;}
      s=resolvePending(s);steps++;
    }
    assert.ok(s.age>startAge,`${mode}/${seed}: season did not close`);
    const config=careerModeConfig(mode);
    assert.ok(decisions>=config.decisions[0]&&decisions<=config.decisions[1],`${mode}/${seed}: saw ${decisions}, expected ${config.decisions[0]}-${config.decisions[1]}`);
    assert.ok(matches<=config.keyMatches[1],`${mode}/${seed}: saw ${matches} key matches, maximum is ${config.keyMatches[1]}`);
    const contextualMin=hadInjury?Math.max(2,config.keyMatches[0]-2):config.keyMatches[0];
    assert.ok(matches>=contextualMin,`${mode}/${seed}: saw ${matches} key matches, expected at least ${contextualMin}${hadInjury?" in an injury-disrupted season":""}`);
  }finally{Math.random=originalRandom;}
}
for(const {id} of CAREER_MODES)for(const seed of [101,211,307,401,503])runFirstSeason(id,seed);
console.log("RUNTIME_PACING_SMOKE_OK: counts match app runtime; injury seasons may legitimately lose up to two playable key matches.");
