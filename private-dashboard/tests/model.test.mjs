import test from "node:test";
import assert from "node:assert/strict";
import { parseRows, filterRows, aggregate, definitions, versions } from "../model.mjs";
import { RESEARCH_VERSION, DETAILED_SECTOR_VERSION, PREVIOUS_RESEARCH_VERSION } from "../../src/lib/screener/research.ts";
import { researchHeaders } from "../../src/lib/screener/research-storage.ts";
function row(routes, context, priorities) {
  const r = researchHeaders.map(() => "");
  r[0]="uuid";r[3]=RESEARCH_VERSION;r[5]=routes;r[7]="Ja";r[9]="Testdeelnemer";r[10]="private@example.com";r[11]="0612345678";r[13]=context;
  r[researchHeaders.findIndex(h=>h.startsWith("personalPriorities:") && !h.endsWith(": Anders"))]=priorities;
  return r;
}
test("separate routes, keep names locally and omit email and phone",()=>{
  const data=parseRows([researchHeaders,row("personal","Ervaring: afgelopen twee jaar","Salaris"),row("employer; personal","Verwachting: hypothetisch","Salaris; Thuis kunnen werken")]);
  assert.equal(filterRows(data,{route:"employer"}).length,1);
  assert.equal(filterRows(data,{route:"personal",context:"Ervaring: afgelopen twee jaar"}).length,1);
  assert.equal(data[0].name,"Testdeelnemer");assert.equal(data[0].id,"uuid");
  assert.ok(!JSON.stringify(data).includes("private@example.com")); assert.ok(!JSON.stringify(data).includes("0612345678"));
});

test("unnamed participants remain identifiable and names without consent are omitted",()=>{
  const unnamed=row("personal","", "Salaris");unnamed[9]="   ";
  const refused=row("personal","", "Salaris");refused[0]="second-id";refused[7]="Nee";
  const data=parseRows([researchHeaders,unnamed,refused]);
  assert.equal(data[0].name,"");assert.equal(data[0].reference,"Inzending 1");
  assert.equal(data[1].name,"");assert.equal(data[1].id,"second-id");assert.equal(data[1].interviewConsent,"Nee");
});

test("individual answers preserve route order and literal text without adding unasked questions",()=>{
  const both=row("employer; personal","Ervaring: afgelopen twee jaar","Salaris; Anders: <script>tekst</script>");
  both[researchHeaders.findIndex(h=>h.startsWith("employerLocation:"))]="Venlo";
  const data=parseRows([researchHeaders,both])[0];
  assert.deepEqual(data.sections.map(s=>s.title),["De organisatie","Keuzes en ervaringen"]);
  assert.equal(data.sections[0].entries[0].value,"Venlo");
  assert.equal(data.sections[1].entries[0].value,"Salaris; Anders: <script>tekst</script>");
  assert.ok(!data.sections.flatMap(s=>s.entries).some(e=>e.value===""));
});

test("individual answer labels reflect the original version and search context",()=>{
  const channel=researchHeaders.findIndex(h=>h.startsWith("personalChannels:"));
  const current=row("personal","Ervaring: afgelopen twee jaar", "Salaris");current[channel]="LinkedIn";
  const hypothetical=row("personal","Verwachting: hypothetisch", "Salaris");hypothetical[channel]="LinkedIn";
  const other=row("personal","Niet ingedeeld: eigen antwoord", "Salaris");other[channel]="LinkedIn";
  const previous=row("personal","Ervaring: afgelopen twee jaar", "Salaris");previous[channel]="LinkedIn";previous[3]=PREVIOUS_RESEARCH_VERSION;
  const data=parseRows([researchHeaders,current,hypothetical,other,previous]);
  const label=r=>r.sections.find(s=>s.title==="Werk zoeken").entries[0].label;
  assert.equal(label(data[0]),"Welke manieren heb je bij je laatste zoektocht naar werk gebruikt?");
  assert.equal(label(data[1]),"Waar zou je beginnen met zoeken naar werk?");
  assert.equal(label(data[2]),"Welke manieren gebruikte je of zou je gebruiken om werk te zoeken?");
  assert.equal(label(data[3]),"Waar heb je naar werk gezocht of rondgekeken?");
});
test("denominator is answered participants, not choices or skipped",()=>{
  const data=parseRows([researchHeaders,row("personal","","Salaris; Thuis kunnen werken"),row("personal","","Salaris"),row("personal","","")]);
  const result=aggregate(data,definitions.find(q=>q.id==="personalPriorities"));
  assert.equal(result.answered,2);assert.equal(result.skipped,1);assert.equal(result.items[0].percent,100);assert.equal(result.items[1].percent,50);
});
test("other explanations are not split or counted as separate categories",()=>{
  const data=parseRows([researchHeaders,row("personal","","Salaris; Anders: Eigen reden; toelichting")]);
  const result=aggregate(data,definitions.find(q=>q.id==="personalPriorities"));
  assert.equal(result.items.length,2);assert.equal(result.other[0].text,"Eigen reden; toelichting");
});
test("unexpected storage layout is rejected",()=>{assert.throws(()=>parseRows([["wrong"]]));});

test("research versions use separate participants and their own original answer labels",()=>{
  const old=row("personal","","Salaris; Flexibiliteit");old[3]=PREVIOUS_RESEARCH_VERSION;
  const current=row("personal","","Salaris; Thuis kunnen werken");
  const detailed=row("personal","","Salaris; Thuis kunnen werken");detailed[3]=DETAILED_SECTOR_VERSION;
  const data=parseRows([researchHeaders,old,detailed,current]);
  for(const version of versions){
    const selected=filterRows(data,{route:"personal",version:version.id});
    assert.equal(selected.length,1);
    const result=aggregate(selected,version.questions.find(q=>q.id==="personalPriorities"));
    assert.equal(result.answered,1);assert.equal(result.items.length,2);
    assert.ok(result.items.some(i=>i.label===(version.id===PREVIOUS_RESEARCH_VERSION?"Flexibiliteit":"Thuis kunnen werken")));
  }
});
test("sector filter is scoped to the chosen route and empty selections stay valid",()=>{
  const data=parseRows([researchHeaders,row("employer; personal","Ervaring: afgelopen twee jaar","Salaris")]);
  data[0].answers.personalSector="Onderwijs";
  data[0].answers.employerSector="Logistiek";
  assert.equal(filterRows(data,{route:"personal",sector:"Onderwijs"}).length,1);
  assert.equal(filterRows(data,{route:"employer",sector:"Onderwijs"}).length,0);
  assert.equal(filterRows(data,{route:"employer",sector:"Logistiek"}).length,1);
  const result=aggregate([],definitions.find(q=>q.id==="personalPriorities"));
  assert.deepEqual(result,{answered:0,skipped:0,other:[],items:[]});
});
