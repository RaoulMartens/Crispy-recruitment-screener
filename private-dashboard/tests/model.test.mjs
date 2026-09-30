import test from "node:test";
import assert from "node:assert/strict";
import { parseRows, filterRows, aggregate, definitions, versions } from "../model.mjs";
import { RESEARCH_VERSION, DETAILED_SECTOR_VERSION, PREVIOUS_RESEARCH_VERSION } from "../../src/lib/screener/research.ts";
import { researchHeaders } from "../../src/lib/screener/research-storage.ts";
function row(routes, context, priorities) {
  const r = researchHeaders.map(() => "");
  r[0]="uuid";r[3]=RESEARCH_VERSION;r[5]=routes;r[9]="Secret name";r[10]="private@example.com";r[13]=context;
  r[researchHeaders.findIndex(h=>h.startsWith("personalPriorities:") && !h.endsWith(": Anders"))]=priorities;
  return r;
}
test("separate routes, keep both and omit contact data",()=>{
  const data=parseRows([researchHeaders,row("personal","Ervaring: afgelopen twee jaar","Salaris"),row("employer; personal","Verwachting: hypothetisch","Salaris; Thuis kunnen werken")]);
  assert.equal(filterRows(data,{route:"employer"}).length,1);
  assert.equal(filterRows(data,{route:"personal",context:"Ervaring: afgelopen twee jaar"}).length,1);
  assert.ok(!JSON.stringify(data).includes("private@example.com")); assert.ok(!JSON.stringify(data).includes("Secret name"));
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
