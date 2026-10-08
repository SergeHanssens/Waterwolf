// Rijkswaterstaat DDAPI20. Water level is elevation relative to NAP, never water depth.
export const WATER_LEVEL_SOURCE='https://rijkswaterstaatdata.nl/waterdata/';
const API='https://ddapi20-waterwebservices.rijkswaterstaat.nl/ONLINEWAARNEMINGENSERVICES/OphalenWaarnemingen';
export const WATER_STATIONS=[
 {code:'krabbersgat.ijsselmeer',name:'Enkhuizen · Krabbersgat IJsselmeer',lat:52.694,lon:5.284,basin:'ijsselmeer'},
 {code:'stavoren.ijsselmeer',name:'Stavoren · IJsselmeer',lat:52.853469,lon:5.32634,basin:'ijsselmeer'},
 {code:'urk.havenhoofdnoord',name:'Urk · havenhoofd noord',lat:52.655397,lon:5.60445,basin:'ijsselmeer'},
 {code:'lemmer.ijsselmeer',name:'Lemmer · IJsselmeer',lat:52.838,lon:5.71,basin:'ijsselmeer'},
 {code:'houtribdijk.ijsselmeer',name:'Houtribdijk · IJsselmeer',lat:52.608956,lon:5.486766,basin:'ijsselmeer'},
 {code:'krabbersgat.markermeer',name:'Enkhuizen · Krabbersgat Markermeer',lat:52.691226,lon:5.279974,basin:'markermeer'},
 {code:'lelystad.haven',name:'Lelystad · haven',lat:52.505689,lon:5.376159,basin:'markermeer'},
 {code:'marken.vuurtoren',name:'Marken · vuurtoren',lat:52.459596,lon:5.139289,basin:'markermeer'}
];
export function parseWaterLevel(response,station,now=Date.now()){
 const candidates=[];
 for(const series of response?.WaarnemingenLijst||[]){
  const m=series.AquoMetadata||series.AquoPlusWaarnemingMetadata?.AquoMetadata;
  if(series.Locatie?.Code!==station.code||m?.Grootheid?.Code!=='WATHTE'||m?.Hoedanigheid?.Code!=='NAP'||m?.ProcesType!=='meting'||!['cm','m'].includes(m?.Eenheid?.Code))continue;
  if(m.WaardeBewerkingsMethode?.Code&&m.WaardeBewerkingsMethode.Code!=='NVT')continue;
  for(const measurement of series.MetingenLijst||[]){
   const value=measurement.Meetwaarde?.Waarde_Numeriek,time=Date.parse(measurement.Tijdstip),q=String(measurement.WaarnemingMetadata?.Kwaliteitswaardecode??'').padStart(2,'0');
   if(!Number.isFinite(value)||Math.abs(value)>10000||!Number.isFinite(time)||time>now+60000||!['00','10','20','25','30','40'].includes(q))continue;
   candidates.push({levelM:value/(m.Eenheid.Code==='cm'?100:1),timestamp:measurement.Tijdstip,qualityCode:q,ageSeconds:Math.max(0,(now-time)/1000)});
  }
 }
 candidates.sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
 const latest=candidates[0];
 return {...station,levelM:latest?.levelM??null,timestamp:latest?.timestamp??null,qualityCode:latest?.qualityCode??null,ageSeconds:latest?.ageSeconds??null,stale:!latest||latest.ageSeconds>1800,datum:'NAP',kind:'measurement',source:WATER_LEVEL_SOURCE,...(!latest?{error:'Geen bruikbare recente NAP-meting beschikbaar.'}:{})};
}
export async function fetchWaterLevels({mode=typeof window==='undefined'?'live':'snapshot',url=typeof location!=='undefined'&&location.hostname==='sergehanssens.github.io'?'https://raw.githubusercontent.com/SergeHanssens/Waterwolf/main/data/water-levels-latest.json?t='+Math.floor(Date.now()/60000):'./data/water-levels-latest.json',fetcher=fetch,now=Date.now(),endpoint=API}={}){
 if(mode==='snapshot'){
  const r=await fetcher(url,{cache:'no-store'});if(!r.ok)throw Error('Waterstanden niet beschikbaar');const d=await r.json();
  if(!Array.isArray(d.stations)||!Number.isFinite(Date.parse(d.fetchedAt)))throw Error('Ongeldig waterstandenbestand');
  return {...d,stations:d.stations.map(s=>{const age=(now-Date.parse(s.timestamp))/1000;return {...s,ageSeconds:Number.isFinite(age)?Math.max(0,age):null,stale:!Number.isFinite(age)||age>1800||Date.parse(s.timestamp)>now+60000};})};
 }
 const stations=await Promise.all(WATER_STATIONS.map(async station=>{
  try{
   const body={Locatie:{Code:station.code},AquoPlusWaarnemingMetadata:{AquoMetadata:{Compartiment:{Code:'OW'},Grootheid:{Code:'WATHTE'},Hoedanigheid:{Code:'NAP'},ProcesType:'meting'},WaarnemingMetadata:{KwaliteitswaardecodeLijst:['00','10','20','25','30','40']}},Periode:{Begindatumtijd:new Date(now-6*3600000).toISOString(),Einddatumtijd:new Date(now).toISOString()}};
   const r=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
   if(r.status===204)return parseWaterLevel(null,station,now);if(!r.ok)throw Error('RWS HTTP '+r.status);
   const d=await r.json();if(d.Succesvol===false)throw Error('RWS kon de aanvraag niet verwerken');return parseWaterLevel(d,station,now);
  }catch(e){return {...parseWaterLevel(null,station,now),error:String(e.message)};}
 }));
 return {stations,fetchedAt:new Date(now).toISOString(),source:WATER_LEVEL_SOURCE,notice:'Waterhoogte tegenover NAP; geen waterdiepte. Ontbrekende of oude stations geven geen actueel vaaradvies.'};
}
