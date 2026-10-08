/** Numeric explanations of sampled route decisions; never invents forecast shifts or optimality. */
import {bearingDeg,evaluateHeading,routeRace} from './engine.js?v=0.6.3';
const delta=(a,b)=>((a-b+540)%360)-180,round=(v,n=1)=>Number.isFinite(v)?Number(v.toFixed(n)):null;
const at=(source,p,t)=>typeof source==='function'?source(p,t):source;
export function explainRoute(result,options,{compareAlternatives=false,onAlternative}={}){
 const limitations=['Begrensde zoekberekening; geen bewijs van de wereldwijd snelste koers.','Iedere verplichte deelroute wordt achtereenvolgens gepland. Een vroegere aankomst bij een boei kan een voordeel op een latere deelroute missen.','Polar, modelstroming en windverwachting zijn schattingen; schipper controleert vaarwater en uitvoering.'];
 const segments=(result.path||[]).slice(1).map((p,index)=>{
  const from=result.path[index],target=p.target||result.legs?.find(l=>l.etaSeconds>=p.timeSeconds)?.to||p,goal=bearingDeg(from,target),wind={fromDeg:p.windFromDeg,speedKnots:p.windSpeedKnots},current={toDeg:p.currentToDeg,speedKnots:p.currentSpeedKnots};
  const vmg=p.sogKnots*Math.cos(delta(p.cogDeg,goal)*Math.PI/180),direct=Number.isFinite(wind.fromDeg)?evaluateHeading(goal,wind,current,options.polar):null,reasons=[];
  reasons.push(`Heading ${round(p.heading)}° levert volgens de ingevoerde polar ${round(p.boatSpeedKnots)} kn door het water bij een ware windhoek van ${round(p.twa)}°.`);
  reasons.push(`Koers over grond ${round(p.cogDeg)}°, snelheid ${round(p.sogKnots)} kn; voortgang naar ${p.targetName||'het doel'} ${round(vmg)} kn. Rechtstreekse peiling is ${round(goal)}°.`);
  if(direct?.speedKnots===0)reasons.push('De rechtstreekse heading valt buiten de bevaarbare hoeken van deze polar; een omweg via bevaarbare koersen is nodig.');
  else if(direct&&Math.abs(delta(p.heading,goal))>2)reasons.push(`De rechtstreekse heading zou ${round(direct.speedKnots)} kn door het water leveren; de gekozen koers maakt deel uit van de begrensd berekende route, niet alleen een vergelijking van directe snelheid.`);
  if(Number.isFinite(current.speedKnots)&&current.speedKnots>0)reasons.push(`Stroming ${round(current.speedKnots,2)} kn naar ${round(current.toDeg)}° verschuift de heading naar de berekende koers over grond; dit is de voor dit segment gebruikte invoer.`);
  if(p.maneuver)reasons.push(`${p.maneuver==='gijpen'?'Gijpen':'Overstag'} begint op routetijd ${round(p.maneuverAtSeconds,0)} s; ${round(p.maneuverCostSeconds,0)} s ingevoerd manoeuvreverlies is in de aankomsttijd opgenomen.`);
  if(index>0){const previous=result.path[index];if(Number.isFinite(previous.windFromDeg)&&Math.abs(delta(wind.fromDeg,previous.windFromDeg))>1)reasons.push(`De bemonsterde windrichting verandert hier van ${round(previous.windFromDeg)}° naar ${round(wind.fromDeg)}°. Dit volgt de gebruikte windinvoer; het is geen waargenomen windshift aan boord.`);}
  return {index,from:{lat:from.lat,lon:from.lon},to:{lat:p.lat,lon:p.lon},targetName:p.targetName||'Routepunt',heading:p.heading,cogDeg:p.cogDeg,targetBearingDeg:goal,twa:p.twa,boatSpeedKnots:p.boatSpeedKnots,sogKnots:p.sogKnots,vmgKnots:vmg,wind,current,maneuver:p.maneuver,maneuverAtSeconds:p.maneuverAtSeconds,maneuverCostSeconds:p.maneuverCostSeconds,reasons,briefing:reasons.join(' ')};
 });
 let comparison={status:'unavailable',reason:'Geen complete alternatieve eerste koers doorgerekend; een latere winst door een aanvankelijk mindere koers is niet aangetoond.'};
 if(compareAlternatives&&result.status==='ok'&&segments.length){const first=segments[0],wind=at(options.wind,options.position,0),current=at(options.current,options.position,0),goal=first.targetBearingDeg;
  if(wind&&current&&Number.isFinite(current.speedKnots)){const candidates=[first.heading,goal,...Array.from({length:36},(_,i)=>i*10)].map(h=>{const e=evaluateHeading(h,wind,current,options.polar);return {...e,vmg:e.sogKnots*Math.cos(delta(e.cogDeg,goal)*Math.PI/180)};}).filter(e=>e.speedKnots>0&&Number.isFinite(e.vmg)).sort((a,b)=>b.vmg-a.vmg);const best=candidates[0];
   if(best){comparison={...comparison,alternativeHeading:best.heading,chosenHeading:first.heading,chosenVmgKnots:first.vmgKnots,alternativeVmgKnots:best.vmg,chosenEtaSeconds:result.etaSeconds,alternativeEtaSeconds:null,etaGainSeconds:null};
    if(Math.abs(delta(best.heading,first.heading))<.1){comparison.status='same';comparison.reason='De gekozen eerste heading geeft ook de hoogste directe voortgang in de onderzochte headinglijst; geen afwijkende eerste koers vergeleken.';}
    else {const alternative=routeRace({...options,forcedFirstHeading:best.heading});if(alternative.status==='ok'){onAlternative?.(alternative);const gain=alternative.etaSeconds-result.etaSeconds;comparison={...comparison,status:'compared',alternativeEtaSeconds:alternative.etaSeconds,etaGainSeconds:gain,reason:gain>1?`De gekozen route komt in deze berekening ${round(gain,0)} s eerder aan dan starten met de hoogste directe voortgang.${first.vmgKnots<best.vmg-.05?` De eerste stap lijkt minder gunstig (${round(first.vmgKnots)} tegenover ${round(best.vmg)} kn voortgang), maar het doorgerekende vervolg compenseert dat.`:''} Beide vervolgtrajecten zijn binnen dezelfde zoekgrenzen doorgerekend.`:gain< -1?`De vergelijkingsroute komt ${round(-gain,0)} s eerder aan; de oorspronkelijke route is dus niet de beste onderzochte variant. Bespreek dit alternatief vóór uitvoering.`:'De doorgerekende eerste koersen hebben vrijwel dezelfde aankomsttijd; geen betekenisvolle latere winst aangetoond.'};}else comparison.reason='De eerste koers met de hoogste directe voortgang leverde binnen de zoekgrenzen geen complete vervolgroute; daardoor is geen betrouwbare tijdwinstvergelijking mogelijk.';}
   }
  }
 }
 const summary=result.status==='ok'?`De route bevat ${segments.length} berekende vaarstappen. Elke stap toont de gebruikte wind, stroming, polar en voortgang naar het volgende verplichte punt. ${comparison.reason}`:'Er is geen complete route om tactische keuzes te verklaren. Vul ontbrekende gegevens in of controleer de baan.';
 return {summary,limitations,comparison,segments};
}

