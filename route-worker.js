import {loadBathymetry,depthAt} from './bathymetry.js?v=0.5.1';
import {routeRace} from './engine.js?v=0.5.1';
self.onmessage=async({data})=>{try{
 if(data.waterLevels?.some(s=>s.levelM!==null&&Date.now()-Date.parse(s.timestamp)<=1800000)){try{await loadBathymetry();data.depthAt=p=>depthAt(p,data.waterLevels,{maxAgeSeconds:1800}).depthM;}catch{}}
 if(data.forecastWind?.length){
  const samples=data.forecastWind,base=data.forecastBaseMs;
  data.wind=(_position,seconds)=>{const at=base+seconds*1000;let i=samples.findIndex(s=>s.timeMs>=at);if(i<0)return samples.at(-1).wind;if(i===0)return samples[0].wind;const a=samples[i-1],b=samples[i],f=(at-a.timeMs)/(b.timeMs-a.timeMs);const change=((b.wind.fromDeg-a.wind.fromDeg+540)%360)-180;return {fromDeg:(a.wind.fromDeg+change*f+360)%360,speedKnots:a.wind.speedKnots+(b.wind.speedKnots-a.wind.speedKnots)*f};};
 }
 self.postMessage({result:routeRace(data)});
}catch(error){self.postMessage({error:error.message});}};
