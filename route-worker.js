import {loadBathymetry,depthAt} from './bathymetry.js?v=0.6.3';
import {routeRace} from './engine.js?v=0.6.3';
import {explainRoute} from './explanation.js?v=0.6.3';
import {currentFromField} from './current-field.js?v=0.6.3';
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
 let result=routeRace(data),alternative=null;result.explanation=explainRoute(result,data,{compareAlternatives:data.explainAlternatives!==false,onAlternative:r=>alternative=r});
 if(alternative?.status==='ok'&&alternative.etaSeconds<result.etaSeconds-1){
  const original=result;result=alternative;result.explanation=explainRoute(result,data);
  const gain=original.etaSeconds-result.etaSeconds,reason=`De eerste vergelijkingsroute bleek ${Math.round(gain)} s sneller dan de oorspronkelijke zoekroute en is daarom overgenomen. Dit vergelijkt twee volledige begrensde routes; het bewijst geen globale optimaliteit.`;
  result.explanation.comparison={status:'compared',chosenHeading:result.path[1]?.heading,alternativeHeading:original.path[1]?.heading,chosenVmgKnots:result.explanation.segments[0]?.vmgKnots,alternativeVmgKnots:original.explanation.segments[0]?.vmgKnots,chosenEtaSeconds:result.etaSeconds,alternativeEtaSeconds:original.etaSeconds,etaGainSeconds:gain,reason};
  result.explanation.summary=`De route bevat ${result.explanation.segments.length} berekende vaarstappen met de gebruikte wind, stroming en polar. ${reason}`;
 }

 if(missingCurrent.size&&result.status!=='ok'){result.warnings=result.warnings.filter(w=>w!=='Ongeldige stroming: richting en niet-negatieve snelheid vereist.');result.warnings.push('Stromingsmodel ontbreekt voor onderzochte posities of routetijden; onbekende cellen zijn niet als nulstroming gebruikt. '+[...missingCurrent].join(' '));}
 if(input.current==null&&result.status==='ok'){result.warnings.push('Koers gecorrigeerd met RWS stromingsverwachting per positie en routetijd; dit is een model, geen meting.');if(missingCurrent.size)result.warnings.push('De routezoeker heeft bij het onderzoeken van varianten ontbrekende stroomcellen vermeden. De gekozen vaarstappen gebruiken geldige stroomwaarden.');}
 return result;
}
if(typeof WorkerGlobalScope!=='undefined'&&self instanceof WorkerGlobalScope)self.onmessage=async({data})=>{try{self.postMessage({result:await calculateWorkerRoute(data)});}catch(error){self.postMessage({error:error.message});}};



