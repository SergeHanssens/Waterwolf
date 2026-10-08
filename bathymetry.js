/** Historical RWS bottom model. Depth = fresh local NAP water level minus conservative model bottom.
 * This estimates clearance; it does not certify current charts, survey coverage or safe navigation.
 */
let model=null,loading=null,refreshLoading=null;
export function wgs84ToRD({lat,lon}){const p=.36*(lat-52.15517440),l=.36*(lon-5.38720621);return {x:155000+190094.945*l-11832.228*p*l-114.221*p*p*l-32.391*l**3-.705*p-.608*p**3*l-.008*l*l+.148*p*l**3,y:463000+309056.544*p+3638.893*l*l+73.077*p*p-157.984*p*l*l+59.788*p**3+.433*l-6.439*p*p*l*l-.032*p*l+.092*l**4-.054*p**4};}
/** Production reads raw data so validated dataset commits are visible without a Pages rebuild. */
export function bathymetryDataUrl(name,hostname=globalThis.location?.hostname){return hostname?.toLowerCase()==='sergehanssens.github.io'?new URL(`https://raw.githubusercontent.com/SergeHanssens/Waterwolf/main/data/${name}`):new URL(`./data/${name}`,import.meta.url);}
function freshUrl(name){const url=bathymetryDataUrl(name);url.searchParams.set('checked',String(Math.floor(Date.now()/60000)));return url;}
async function fetchGrid(url){const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error('Historische bodemkaart niet beschikbaar.');if(!globalThis.DecompressionStream)throw new Error('Toestel kan de compacte bodemkaart niet openen.');return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();}
async function fetchMetadata(){const response=await fetch(freshUrl('bathymetry-metadata.json'),{cache:'no-store'});if(!response.ok)throw new Error('Nieuwe bodemkaartcontrole niet beschikbaar.');return response.json();}
export async function loadBathymetry(url=bathymetryDataUrl('bathymetry-ijsselmeer.json.gz')){
 if(model)return model;if(loading)return loading;
 loading=(async()=>{const data=await fetchGrid(url),candidate=decodeBathymetry(data);try{const latest=await fetchMetadata();if(latest.sourceSHA256===candidate.metadata.sourceSHA256)candidate.metadata={...candidate.metadata,...latest};}catch{}model=candidate;return model;})();
 try{return await loading;}catch(e){loading=null;throw e;}
}
/** Refresh metadata every call; replace the model only after matching-source grid validation.
 * A failed refresh throws and preserves the prior grid and its last successful checkedAt.
 */
export async function refreshBathymetry(){
 if(refreshLoading)return refreshLoading;
 refreshLoading=(async()=>{if(loading&&!model)await loading;const latest=await fetchMetadata();if(model&&latest.sourceSHA256===model.metadata.sourceSHA256){model.metadata={...model.metadata,...latest};return model;}
  const data=await fetchGrid(freshUrl('bathymetry-ijsselmeer.json.gz'));
  if(data.sourceSHA256!==latest.sourceSHA256)throw new Error('Bodemkaart en controlestand verschillen; bestaande kaart behouden.');
  const candidate=decodeBathymetry(data);candidate.metadata={...candidate.metadata,...latest};model=candidate;return model;
 })();
 try{return await refreshLoading;}finally{refreshLoading=null;}
}
function decodeBathymetry(data){if(data.horizontalCRS!=='EPSG:28992'||data.verticalCRS!=='EPSG:5709'||data.cellSizeM!==100||data.encoding!=='int16-little-endian-base64'||data.valueScale!==.01||data.nodata!==32767||!Number.isInteger(data.width)||!Number.isInteger(data.height)||data.width<1||data.height<1||data.width*data.height>5000000||!Number.isFinite(data.originX)||!Number.isFinite(data.originY))throw new Error('Onbekend bodemkaartformaat.');const binary=atob(data.data),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));if(bytes.length!==data.width*data.height*2)throw new Error('Onvolledige bodemkaart.');const view=new DataView(bytes.buffer),values=new Int16Array(data.width*data.height);for(let i=0;i<values.length;i++)values[i]=view.getInt16(i*2,true);const {data:omit,...metadata}=data;return {metadata,values};}
/** Also usable in tests or workers with already-loaded serializable payload. */
export function setBathymetry(data){const candidate=decodeBathymetry(data);model=candidate;return model;}
export const getBathymetryMetadata=()=>model?.metadata||null;
export function bottomAt(point,{positionBufferM=3}={}){
 const unknown=reason=>({unknown:true,bottomNapM:null,reason});if(!model)return unknown('Historische bodemkaart nog niet geladen.');if(!point||!Number.isFinite(point.lat)||!Number.isFinite(point.lon)||point.lat<50.5||point.lat>54||point.lon<3||point.lon>8)return unknown('Positie buiten het ondersteunde gebied.');
 const {metadata:m,values}=model,rd=wgs84ToRD(point),col=(rd.x-m.originX)/m.cellSizeM,row=(m.originY-rd.y)/m.cellSizeM;const minCol=Math.floor(col-positionBufferM/m.cellSizeM),maxCol=Math.floor(col+positionBufferM/m.cellSizeM),minRow=Math.floor(row-positionBufferM/m.cellSizeM),maxRow=Math.floor(row+positionBufferM/m.cellSizeM);let bottom=-Infinity;
 for(let y=minRow;y<=maxRow;y++)for(let x=minCol;x<=maxCol;x++){if(x<0||y<0||x>=m.width||y>=m.height)return unknown('Positie buiten de historische bodemkaart.');const value=values[y*m.width+x];if(value===m.nodata)return unknown('Bodemdekking onbekend of onvolledig bij deze cel.');bottom=Math.max(bottom,value*m.valueScale);}
 return {unknown:false,bottomNapM:bottom,surveyYear:m.surveyYear,cellSizeM:m.cellSizeM,source:m.sourceUrl,cell:{row:Math.floor(row),col:Math.floor(col)},historical:true};
}
/** Houtribdijk divider; explicit basin tags take precedence for station metadata. */
export function basinAt(point){if(!point||!Number.isFinite(point.lat)||!Number.isFinite(point.lon))return null;const lineLat=52.7048+(point.lon-5.2896)*(52.52375-52.7048)/(5.43118-5.2896);return point.lat>=lineLat?'ijsselmeer':'markermeer';}
function metres(a,b){const lat=(a.lat+b.lat)/2*Math.PI/180;return Math.hypot((a.lat-b.lat)*111195,(a.lon-b.lon)*111195*Math.cos(lat));}
/** waterLevels: fresh records [{lat,lon,valueM,time,station}], values in metres NAP.
 * Uses the lowest fresh station reading within 50 km in the same lake basin, never assumes uniform true lake level.
 * Explicit timestamps are required; historical bottom + current station level remains an estimate.
 */
export function depthAt(point,waterLevels=[],{now=Date.now(),maxAgeSeconds=3600,maxStationDistanceM=50000,...bottomOptions}={}){
 const bottom=bottomAt(point,bottomOptions);if(bottom.unknown)return {...bottom,depthM:null};const records=Array.isArray(waterLevels)?waterLevels:[waterLevels],basin=point.basin||basinAt(point);const levels=records.map(r=>({...r,valueM:r.valueM??r.waterLevelNapM??r.levelM,timeMs:typeof (r.time??r.timestamp)==='number'?(r.time??r.timestamp):Date.parse(r.time??r.timestamp)})).filter(r=>(r.basin||basinAt(r))===basin&&Number.isFinite(r.valueM)&&r.valueM>=-2&&r.valueM<=3&&Number.isFinite(r.lat)&&Number.isFinite(r.lon)&&Number.isFinite(r.timeMs)&&now-r.timeMs>=-60000&&now-r.timeMs<=maxAgeSeconds*1000&&metres(point,r)<=maxStationDistanceM);
 if(!levels.length)return {...bottom,unknown:true,depthM:null,reason:'Geen verse waterstand in meters NAP binnen het gekozen stationsgebied.'};
 const level=levels.reduce((a,b)=>a.valueM<=b.valueM?a:b);return {...bottom,unknown:false,depthM:level.valueM-bottom.bottomNapM,waterLevelNapM:level.valueM,basin,station:level.station||level.name||null,waterLevelTime:new Date(level.timeMs).toISOString(),stationDistanceM:metres(point,level),estimated:true,reason:'Historisch bodemmodel gecombineerd met laagste verse nabije stationswaterstand; lokale opstuwing en latere bodemwijziging blijven onzeker.'};
}
