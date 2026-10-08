import {routeRace} from './engine.js?v=0.2.1';
self.onmessage=({data})=>{try{
 if(data.forecastWind?.length){
  const samples=data.forecastWind,base=data.forecastBaseMs;
  data.wind=(_position,seconds)=>{const at=base+seconds*1000;let i=samples.findIndex(s=>s.timeMs>=at);if(i<0)return samples.at(-1).wind;if(i===0)return samples[0].wind;const a=samples[i-1],b=samples[i],f=(at-a.timeMs)/(b.timeMs-a.timeMs);const change=((b.wind.fromDeg-a.wind.fromDeg+540)%360)-180;return {fromDeg:(a.wind.fromDeg+change*f+360)%360,speedKnots:a.wind.speedKnots+(b.wind.speedKnots-a.wind.speedKnots)*f};};
 }
 self.postMessage({result:routeRace(data)});
}catch(error){self.postMessage({error:error.message});}};
