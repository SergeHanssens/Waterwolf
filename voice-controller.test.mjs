import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVoiceController} from './voice-controller.js';
function fixture(){let time=0,calls=[];const state={race:{name:'Test',points:[]},active:1,ship:{sails:[]}};const handle=createVoiceController({getState:()=>state,now:()=>time,execute:c=>{calls.push(c);return 'Uitgevoerd';}});return {handle,calls,state,tick:n=>time=n};}
test('race-changing command executes only after explicit confirmation',async()=>{const f=fixture();assert.match(await f.handle('volgende boei'),/bevestig/);assert.equal(f.calls.length,0);await f.handle('bevestig');assert.equal(f.calls[0].type,'next_waypoint');});
test('expired confirmation and changed race are rejected',async()=>{const f=fixture();await f.handle('startsein gegeven');f.tick(31000);assert.match(await f.handle('bevestig'),/verlopen/);assert.equal(f.calls.length,0);await f.handle('volgende boei');f.state.active=2;await f.handle('bevestig');assert.equal(f.calls.length,0);});
test('cancel and unknown commands never execute pending or arbitrary code',async()=>{const f=fixture();await f.handle('volgende boei');await f.handle('annuleer');await f.handle('bevestig');await f.handle('verwijder alle bestanden');assert.equal(f.calls.length,0);});
