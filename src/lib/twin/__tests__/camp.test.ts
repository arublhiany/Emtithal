import { test } from "node:test";
import assert from "node:assert/strict";
import { applyEvent, applyScenario, createCamp, restoreCamp, simulateCamp, summarize, observations, STALE_AFTER_MS, type CampEvent } from "../camp";
import { projectCompany } from "../projection";
import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
const event = (overrides: Partial<CampEvent> = {}): CampEvent => ({ id: "e1", zoneId: "a", field: "occupancy", value: 420, observedAt: 200, source: "MANUAL_DEMO", ...overrides });

test("an operational event updates its zone, revision and provenance without mutating the baseline",()=>{
 const base=createCamp(100); const next=applyEvent(base,event(),210);
 assert.equal(base.zones[0].occupancy,360); assert.equal(next.zones[0].occupancy,420);
 assert.equal(next.revision,1);assert.equal(next.history[0].previous,360);assert.equal(next.history[0].receivedAt,210);
 assert.equal(next.zones[1],base.zones[1]); assert.match(observations(next.zones[0]).join(),/تجاوز السعة/);
});
test("late, duplicate, future and invalid updates are rejected",()=>{
 const base=createCamp(100), next=applyEvent(base,event(),200);
 assert.throws(()=>applyEvent(next,event(),200),/سبق/);
 assert.throws(()=>applyEvent(next,event({id:"older",observedAt:199}),210),/أقدم/);
 assert.throws(()=>applyEvent(base,event({observedAt:6000}),200),/المستقبل/);
 for (const value of [-1,1.5,NaN,Infinity]) assert.throws(()=>applyEvent(base,event({value}),200));
 assert.throws(()=>applyEvent(base,event({field:"exitOpen",value:1}),200),/نوع/);
 assert.throws(()=>applyEvent(base,event({value:true}),200),/نوع/);
});
test("exit and zero-worker observations are independent of occupancy capacity",()=>{
 const a=applyEvent(createCamp(100),event({field:"exitOpen",value:false}),200);
 const b=applyEvent(a,event({id:"e2",field:"workers",value:0}),200);
 assert.equal(observations(b.zones[0]).length,2);
});
test("a transfer conserves total population and leaves the observed state untouched",()=>{
 const base=createCamp(100), snap=JSON.stringify(base);
 const p=simulateCamp(base,{kind:"MOVE",from:"a",to:"c",count:20});
 assert.equal(summarize(p.zones).occupancy,970);assert.equal(p.zones[0].occupancy,340);
 assert.equal(p.zones[2].occupancy,300);assert.equal(JSON.stringify(base),snap);
});
test("deficits are calculated per zone rather than concealed by spare resources elsewhere",()=>{
 const base=createCamp(100); const p=simulateCamp(base,{kind:"ADD",from:"a",to:"c",count:200});
 const s=summarize(p.zones);assert.equal(s.occupancy,1170);assert.equal(s.overCapacity,80);assert.equal(s.mealDeficit,180);
 assert.throws(()=>applyScenario(base,p,200,"apply"),/تجاوز/);
});
test("invalid transfers and amounts cannot create people or negative counts",()=>{
 const base=createCamp(100);
 assert.throws(()=>simulateCamp(base,{kind:"MOVE",from:"a",to:"a",count:20}));
 assert.throws(()=>simulateCamp(base,{kind:"MOVE",from:"a",to:"c",count:361}));
 for(const count of [0,-1,0.5,NaN,Infinity,100001])assert.throws(()=>simulateCamp(base,{kind:"ADD",from:"a",to:"c",count}));
});
test("accepted scenarios become timestamped events and a proposal cannot apply twice",()=>{
 const base=createCamp(100);const p=simulateCamp(base,{kind:"MOVE",from:"a",to:"c",count:20});
 const next=applyScenario(base,p,200,"apply");assert.equal(next.revision,2);assert.equal(next.history.length,2);
 assert.ok(next.history.every(e=>e.source==="SCENARIO"));assert.equal(summarize(next.zones).occupancy,970);
 assert.throws(()=>applyScenario(next,p,201,"apply2"),/تغيرت/);
});
test("a new event invalidates an old proposal and stale observations block adoption",()=>{
 const base=createCamp(100);const p=simulateCamp(base,{kind:"ADD",from:"a",to:"c",count:10});
 assert.throws(()=>applyScenario(applyEvent(base,event({field:"workers",value:17}),200),p,200,"apply"),/تغيرت/);
 assert.throws(()=>applyScenario(base,p,100+STALE_AFTER_MS+1,"apply"),/متأخرة/);
});
test("a proposal cannot forge capacity or other fields to evade checks",()=>{
 const base=createCamp(100);const p=simulateCamp(base,{kind:"ADD",from:"a",to:"c",count:200});
 p.zones[2].capacity=9999;p.zones[2].meals=9999;
 assert.throws(()=>applyScenario(base,p,200,"apply"),/خارج نطاق/);
});
test("persistence restores only valid versioned camp data",()=>{
 const base=createCamp(100);assert.deepEqual(restoreCamp(JSON.stringify(base)),base);
 assert.equal(restoreCamp('{'),null);assert.equal(restoreCamp(JSON.stringify({...base,schemaVersion:2})),null);
 assert.equal(restoreCamp(JSON.stringify({...base,zones:[base.zones[0],base.zones[0],base.zones[2]]})),null);
 assert.equal(restoreCamp(JSON.stringify({...base,zones:base.zones.map(z=>({...z,occupancy:-1}))})),null);
});
test("the independent company projection keeps official scoring boundaries and original profile",()=>{
 const before=JSON.stringify(DEMO_COMPANY_PROFILE);const state=createCamp(100);
 const p=simulateCamp(state,{kind:"ADD",from:"a",to:"c",count:10});const projected=projectCompany(p.zones)!;
 assert.equal(projected.kpis.officialScoreComputed,false);assert.equal(projected.requirements.length,15);
 assert.equal(projected.mutations[0].scenarioValue,4210);assert.equal(projected.mutations[0].source,"SCENARIO_ASSUMPTION");
 assert.equal(JSON.stringify(DEMO_COMPANY_PROFILE),before);
});

 test("scenario comparison retains its original baseline after new observations", () => {
  const base = createCamp(100);
  const scenario = simulateCamp(base,{kind:"ADD",from:"a",to:"c",count:200});
  const updated = applyEvent(base,{id:"later",zoneId:"a",field:"occupancy",value:370,observedAt:200,source:"MANUAL_DEMO"},200);
  assert.equal(summarize(updated.zones).occupancy,980);
  assert.equal(summarize(scenario.baselineZones).occupancy,970);
  assert.equal(summarize(scenario.zones).occupancy,1170);
  assert.notEqual(scenario.baselineZones[0],base.zones[0]);
 });
