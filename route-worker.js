import {loadBathymetry,depthAt} from './bathymetry.js?v=0.6.1';
import {routeRace} from './engine.js?v=0.6.1';
import {currentFromField} from './current-field.js?v=0.6.1';
/** Shared entry point for worker execution and integration tests. Manual current wins. */
export async function calculateWorkerRoute(input){
 const data={...input},missingCurrent=new Set();
 if(data.waterLevels?.some(s=>s.levelM!==null&&Date.now()-Date.parse(s.timestamp)<=1800000)){try{await loadBathymetry();data.depthAt=p=>depthAt(p,data.waterLevels,{maxAgeSeconds:1800}).depthM;}catch{}}
 if(data.forecastWind?.length){
  const samples=data.forecastWind,base=data.forecastBaseMs;
  data.wind=(_position,seconds)=>{const at=base+seconds*1000;let i=samples.findIndex(s=>s.timeMs>=at);if(i<0)return samples.at(-1).wind;if(i===0)return samples[0].wind;const a=samples[i-1],b=samples[i],f=(at-a.timeMs)/(b.timeMs-a.timeMs);const change=((b.wind.fromDeg-a.wind.fromDeg+540)%360)-180;return {fromDeg:(a.wind.fromDeg+change*f+360)%360,speedKnots:a.wind.speedKnots+(b.wind.speedKnots-a.wind.speedKnots)*f};};
 }
 if(data.current==null){
  const field=data.currentField,base=Number.isFinite(data.forecastBaseMs)?data.forecastBaseMs:Date.now();
  data.current=(position,seconds)=>{const sample=currentFromField(field,position,base+seconds*1000);if(sample.kind==='unknown'||!Number.isFinite(sample.speedKnots)||!Number.isFinite(sample.toDeg)){missingCurrent.add(sample.reason||'Geen geldige numerieke stromingscel.');return {speedKnots:null,toDeg:null};}return sample;};
 }
 const result=routeRace(data);
 if(missingCurrent.size)result.warnings.push('Stromingsmodel ontbreekt voor onderzochte posities of routetijden; routezoeker mijdt die cellen en kan de route daarom omleggen of blokkeren. Onbekende cellen zijn niet als nulstroming gebruikt. '+[...missingCurrent].join(' '));
 else if(input.current==null&&result.status==='ok')result.warnings.push('Koers gecorrigeerd met RWS stromingsverwachting per positie en routetijd; dit is een model, geen meting.');
 return result;
}
if(typeof WorkerGlobalScope!=='undefined'&&self instanceof WorkerGlobalScope)self.onmessage=async({data})=>{try{self.postMessage({result:await calculateWorkerRoute(data)});}catch(error){self.postMessage({error:error.message});}};


