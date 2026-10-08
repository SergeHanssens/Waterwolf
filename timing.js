export function ageSeconds(iso,now=Date.now()){const t=Date.parse(iso);return Number.isFinite(t)?Math.max(0,(now-t)/1000):Infinity;}
export function nextEvent(plan,computedAt,now=Date.now()){const elapsed=Math.max(0,(now-computedAt)/1000),events=[...(plan.path||[]).filter(p=>p.maneuver).map(p=>({...p,eventSeconds:p.maneuverAtSeconds??p.timeSeconds})),...(plan.waypointEtas||plan.legs||[]).map(p=>({...p,eventSeconds:p.etaSeconds})),...(plan.sailEvents||[])].filter(p=>Number.isFinite(p.eventSeconds)&&p.eventSeconds>=elapsed).sort((a,b)=>a.eventSeconds-b.eventSeconds);return events[0]?{event:events[0],remainingSeconds:events[0].eventSeconds-elapsed}:null;}
export function anchorDepth(position,depthM,iso){return {lat:position.lat,lon:position.lon,depthM,radiusM:30,time:iso};}
export function sailEvents(samples,configurations,usedName,baseMs){
 if(!usedName||!samples?.length)return [];
 const events=[];let previous=usedName;
 for(const sample of samples){if(sample.timeMs<baseMs)continue;const matches=configurations.filter(c=>sample.wind.speedKnots>=c.minWindKn&&sample.wind.speedKnots<=c.maxWindKn);if(matches.length!==1)continue;const next=matches[0];if(next.name===previous)continue;const old=configurations.find(c=>c.name===previous);const raise=(next.sails||[]).filter(s=>!old?.sails?.includes(s)),lower=(old?.sails||[]).filter(s=>!next.sails?.includes(s));events.push({type:'zeilcontrole',name:next.name,eventSeconds:(sample.timeMs-baseMs)/1000,message:`Zeilwissel voorbereiden volgens windmodel: ${raise.length?'hijsen '+raise.join(', ')+'. ':''}${lower.length?'strijken '+lower.join(', ')+'. ':''}Kapitein bevestigt.`});previous=next.name;}
 return events;
}
