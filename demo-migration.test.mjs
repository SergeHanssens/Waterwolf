import{test}from'node:test';import assert from'node:assert/strict';import{isLegacyDemo}from'./demo-migration.js';
const legacy=()=>({demo:true,race:{name:'DEMO · Oefenbaan',start:'',points:[{name:'Start',lat:52.73,lon:5.3,rounding:'lijn'},{name:'Boei 1',lat:52.76,lon:5.34,rounding:'bakboord'},{name:'Finish',lat:52.72,lon:5.35,rounding:'lijn'}]}});
test('exact old shipped demo is recognized',()=>assert.equal(isLegacyDemo(legacy()),true));
test('edited course, real race and historical replay are preserved',()=>{for(const change of [s=>s.demo=false,s=>s.race.name='Mijn race',s=>s.race.points[1].lat+=.001,s=>s.race.points[1].rounding='stuurboord',s=>s.race.start='2026-10-10T10:00',s=>s.historicalReplay={track:[]}]){const s=legacy();change(s);assert.equal(isLegacyDemo(s),false);}});
