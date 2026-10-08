// Public Rijkswaterstaat RWsOS D-Flow FM forecasts. Map image, not observed vectors.
export const CURRENT_WMS='https://rwsos.rws.nl/matroos-open/wms';
export const CURRENT_SOURCE='https://rwsos.rws.nl/';
let cached=null;
export function parseCurrentCapabilities(xml,now=Date.now()){
 const models=[];
 for(const basin of ['ijsselmeer','markermeer']){
  const prefix=`-${basin}_fm_harmonie--stroom--`;
  const runs=[...xml.matchAll(/<Name>([^<]+)<\/Name>/g)].map(m=>m[1]).filter(n=>n.startsWith(prefix)&&Number.isFinite(Date.parse(n.slice(prefix.length)))).sort((a,b)=>Date.parse(b.slice(prefix.length))-Date.parse(a.slice(prefix.length)));
  if(!runs.length)continue;
  const layer=runs[0],start=xml.indexOf(`<Name>${layer}</Name>`),end=xml.indexOf('</Layer>',start),block=xml.slice(start,end);
  const times=(block.match(/<Dimension[^>]*name="time"[^>]*>([^<]+)<\/Dimension>/)?.[1]||'').split(',').filter(t=>Number.isFinite(Date.parse(t)));
  const closest=times.reduce((best,t)=>!best||Math.abs(Date.parse(t)-now)<Math.abs(Date.parse(best)-now)?t:best,null);
  const runAt=layer.slice(prefix.length),runAgeSeconds=(now-Date.parse(runAt))/1000;
  models.push({basin,name:basin==='ijsselmeer'?'IJsselmeer':'Markermeer',layer,runAt,times,validAt:closest,runAgeSeconds,stale:runAgeSeconds>18*3600||runAgeSeconds<0||!closest||Math.abs(Date.parse(closest)-now)>3600000,style:'Stroomsnelheid.laag',source:CURRENT_SOURCE,kind:'forecast',numericVectorsAvailable:false});
 }
 if(!models.length)throw Error('Geen IJsselmeer/Markermeer-stromingslagen gevonden.');
 return {models,fetchedAt:new Date(now).toISOString(),source:CURRENT_SOURCE,notice:'Officiële modelverwachting; geen stromingsmeting. Kaartlaag wordt niet als numerieke stroomcorrectie gebruikt.'};
}
export async function discoverCurrentModel({fetcher=fetch,now=Date.now(),force=false}={}){
 if(!force&&cached&&now-Date.parse(cached.fetchedAt)<10*60000)return cached;
 const r=await fetcher(CURRENT_WMS+'?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities',{cache:'no-store',signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw Error('RWS-stromingsmodel niet beschikbaar');
 cached=parseCurrentCapabilities(await r.text(),now);return cached;
}
export function overlayURLs(model,{bboxEPSG3857array,bbox,width=700,height=510,time=Date.now()}={}){
 const bounds=bboxEPSG3857array||bbox;
 if(!Array.isArray(bounds)||bounds.length!==4||bounds.some(x=>!Number.isFinite(x))||bounds[0]>=bounds[2]||bounds[1]>=bounds[3])throw Error('Ongeldige kaartgrenzen');
 const models=Array.isArray(model)?model:model?.models||[];
 return models.filter(m=>!m.stale).map(m=>{
  const now=typeof time==='string'?Date.parse(time):time;
  const validAt=m.times.reduce((best,t)=>!best||Math.abs(Date.parse(t)-now)<Math.abs(Date.parse(best)-now)?t:best,null);
  if(!validAt||Math.abs(Date.parse(validAt)-now)>3600000)return null;
  const params=new URLSearchParams({SERVICE:'WMS',VERSION:'1.3.0',REQUEST:'GetMap',LAYERS:m.layer,STYLES:m.style,CRS:'EPSG:3857',BBOX:bounds.join(','),WIDTH:String(Math.min(2048,Math.max(1,Math.round(width)))),HEIGHT:String(Math.min(2048,Math.max(1,Math.round(height)))),FORMAT:'image/png',TRANSPARENT:'TRUE',TIME:validAt});
  return CURRENT_WMS+'?'+params;
 }).filter(Boolean);
}
export async function getCurrent(point){
 // Actual capabilities advertise GetMap and GetCapabilities only. GetFeatureInfo
 // returns InvalidRequest. Never infer vector values from coloured image pixels.
 return {lat:point?.lat,lon:point?.lon,speedKnots:null,toDeg:null,kind:'unknown',source:CURRENT_SOURCE,reason:'RWS biedt via deze openbare WMS een modelkaart, maar geen numerieke puntvector. Geen automatische stroomcorrectie.'};
}
