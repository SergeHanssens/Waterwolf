/** Race decision support. Coordinates WGS84 degrees; wind speed knots/from; current knots/to.
 * Polar points are skipper-supplied speeds at absolute true-wind angles, not vessel facts.
 * Paths are approximate spherical routes, never certified navigation or chart clearance.
 */
const R=6371008.8, NM=1852, rad=x=>x*Math.PI/180, deg=x=>x*180/Math.PI;
export const normalizeDeg=x=>((x%360)+360)%360;
const delta=(a,b)=>((a-b+540)%360)-180;
const valid=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180;
export function distanceNm(a,b){const p=rad(b.lat-a.lat),l=rad(b.lon-a.lon);const h=Math.sin(p/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(l/2)**2;return 2*R*Math.asin(Math.sqrt(Math.min(1,h)))/NM;}
export function bearingDeg(a,b){const l=rad(b.lon-a.lon),x=Math.sin(l)*Math.cos(rad(b.lat)),y=Math.cos(rad(a.lat))*Math.sin(rad(b.lat))-Math.sin(rad(a.lat))*Math.cos(rad(b.lat))*Math.cos(l);return normalizeDeg(deg(Math.atan2(x,y)));}
export function destination(p,bearing,distance){const d=distance*NM/R,b=rad(bearing),a=rad(p.lat),l=rad(p.lon);const lat=Math.asin(Math.sin(a)*Math.cos(d)+Math.cos(a)*Math.sin(d)*Math.cos(b));return {lat:deg(lat),lon:((deg(l+Math.atan2(Math.sin(b)*Math.sin(d)*Math.cos(a),Math.cos(d)-Math.sin(a)*Math.sin(lat)))+540)%360)-180};}
function polarSpeed(polar,twa,wind){if(!Number.isFinite(wind)||wind<=0)return 0;
if(polar?.tables?.length){const tables=[...polar.tables].sort((a,b)=>a.windKnots-b.windKnots);if(wind<tables[0].windKnots)return polarSpeed({points:tables[0].points},twa,wind)*wind/tables[0].windKnots;for(let i=1;i<tables.length;i++)if(wind<=tables[i].windKnots){const a=tables[i-1],b=tables[i],f=(wind-a.windKnots)/(b.windKnots-a.windKnots);return polarSpeed({points:a.points},twa,wind)*(1-f)+polarSpeed({points:b.points},twa,wind)*f;}return polarSpeed({points:tables.at(-1).points},twa,wind);}
if(typeof polar?.speedAt==='function')return Math.max(0,Number(polar.speedAt(twa,wind))||0);const pts=(polar?.points||[]).filter(p=>Number.isFinite(p.twa)&&Number.isFinite(p.speedKnots)&&p.speedKnots>=0).sort((a,b)=>a.twa-b.twa);if(!pts.length)return 0;if(twa<pts[0].twa)return 0;for(let i=1;i<pts.length;i++)if(twa<=pts[i].twa){const a=pts[i-1],b=pts[i];return a.speedKnots+(b.speedKnots-a.speedKnots)*(twa-a.twa)/(b.twa-a.twa||1);}return pts.at(-1).speedKnots;}
export function evaluateHeading(heading,wind,current,polar){const relative=delta(heading,wind.fromDeg),twa=Math.abs(relative),speedKnots=polarSpeed(polar,twa,wind.speedKnots);const east=speedKnots*Math.sin(rad(heading))+(current?.speedKnots||0)*Math.sin(rad(current?.toDeg||0)),north=speedKnots*Math.cos(rad(heading))+(current?.speedKnots||0)*Math.cos(rad(current?.toDeg||0));return {heading:normalizeDeg(heading),twa,speedKnots,sogKnots:Math.hypot(east,north),cogDeg:normalizeDeg(deg(Math.atan2(east,north))),east,north,tack:relative>=0?'port':'starboard'};}

// Find current-compensated headings whose ground vector lies on the target bearing.
function correctedHeadings(bearing,wind,current,polar){
 if(!current?.speedKnots)return [];
 const cross=h=>{const e=evaluateHeading(normalizeDeg(h),wind,current,polar);return {e,value:e.east*Math.cos(rad(bearing))-e.north*Math.sin(rad(bearing))};},roots=[];
 for(let h=0;h<360;h+=10){let lo=h,hi=h+10,A=cross(lo),B=cross(hi);if(A.e.speedKnots<=0||B.e.speedKnots<=0||A.value*B.value>0)continue;for(let j=0;j<12;j++){const mid=(lo+hi)/2,M=cross(mid);if(A.value*M.value<=0)hi=mid;else{lo=mid;A=M;}}const heading=(lo+hi)/2,{e,value}=cross(heading);if(e.speedKnots>0&&Math.abs(value)<.01&&e.east*Math.sin(rad(bearing))+e.north*Math.cos(rad(bearing))>0)roots.push(normalizeDeg(heading));}
 return roots;
}

function inside(p,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if(((a.lat>p.lat)!==(b.lat>p.lat))&&(p.lon<(b.lon-a.lon)*(p.lat-a.lat)/(b.lat-a.lat)+a.lon))yes=!yes;}return yes;}
function intersects(a,b,c,d){const cross=(p,q,r)=>(q.lon-p.lon)*(r.lat-p.lat)-(q.lat-p.lat)*(r.lon-p.lon);const x=cross(a,b,c),y=cross(a,b,d),u=cross(c,d,a),v=cross(c,d,b);return x*y<=0&&u*v<=0&&Math.max(a.lon,b.lon)>=Math.min(c.lon,d.lon)&&Math.max(c.lon,d.lon)>=Math.min(a.lon,b.lon)&&Math.max(a.lat,b.lat)>=Math.min(c.lat,d.lat)&&Math.max(c.lat,d.lat)>=Math.min(a.lat,b.lat);}
function segmentCheck(a,b,o){for(const poly of o.exclusions||[]){if(poly.length<3)continue;if(inside(a,poly)||inside(b,poly)||poly.some((p,i)=>intersects(a,b,p,poly[(i+1)%poly.length])))return {blocked:true,unknown:false};}let unknown=false;const n=Math.max(1,Math.ceil(distanceNm(a,b)*NM/50));for(let i=0;i<=n;i++){const p=destination(a,bearingDeg(a,b),distanceNm(a,b)*i/n),samples=(o.depthSamples||[]).filter(s=>distanceNm(p,s)*NM<=(s.radiusM||50));const modeled=typeof o.depthAt==='function'?o.depthAt(p):null,knownModel=Number.isFinite(modeled);if(!samples.length&&!knownModel)unknown=true;else if(samples.some(s=>s.depthM<(o.draftM||0)+(o.clearanceM||0))||knownModel&&modeled<(o.draftM||0)+(o.clearanceM||0))return {blocked:true,unknown};}return {blocked:false,unknown};}
function at(source,p,t,fallback){return typeof source==='function'?source(p,t):source||fallback;}
/** Bounded beam search in heading/time space. Unknown depths remain explicitly unverified.
 * options: position, ordered waypoints, wind, current, polar, exclusions, depthSamples,
 * draftM, clearanceM, stepSeconds (120), maxSteps (180), beamWidth (36), arrivalNm (.04).
 */
function routePoints(o){
const blocked=message=>({status:'blocked',path:[],legs:[],warnings:[message]});
const warnings=['Begrensde koerszoeker: geen bewijs van de snelste route of een reglementair geldige wedstrijdbaan.','Wedstrijdregels, voorrang en kaartdekking worden niet gevalideerd.'];

if(o.polar?.points?.some(p=>!Number.isFinite(p.twa)||p.twa<0||p.twa>180||!Number.isFinite(p.speedKnots)||p.speedKnots<0)||o.polar?.referenceWindKnots!==undefined&&(!Number.isFinite(o.polar.referenceWindKnots)||o.polar.referenceWindKnots<=0))return blocked('Ongeldige polar: hoeken 0–180 graden en niet-negatieve snelheden vereist.');
if(o.polar?.points){const angles=o.polar.points.map(p=>p.twa);if(new Set(angles).size!==angles.length)return blocked('Polar bevat dubbele windhoeken.');warnings.push(`Polar geldt voor één vaste windsterkte${o.polar.referenceWindKnots?` (${o.polar.referenceWindKnots} kn)`:''}; snelheden worden niet aangepast aan veranderende wind.`);}
if(!o.current)warnings.push('Stroming ontbreekt: nulstroming aangenomen, uitsluitend als scenario.');
const vectorValid=v=>v&&Number.isFinite(v.speedKnots)&&v.speedKnots>=0&&Number.isFinite(v.toDeg);
const initialCurrent=at(o.current,o.position,0,{speedKnots:0,toDeg:0});
if(!vectorValid(initialCurrent))return blocked('Ongeldige stroming: richting en niet-negatieve snelheid vereist.');
for(const key of ['draftM','clearanceM','tackCostSeconds','gybeCostSeconds'])if(o[key]!==undefined&&(!Number.isFinite(o[key])||o[key]<0))return blocked('Diepgang, marge en manoeuvrekosten moeten niet-negatief zijn.');
if(o.depthSamples?.some(p=>!valid(p)||!Number.isFinite(p.depthM)||p.radiusM!==undefined&&(!Number.isFinite(p.radiusM)||p.radiusM<=0)))return blocked('Ongeldige dieptemeting.');
if(o.exclusions?.some(poly=>!Array.isArray(poly)||poly.length<3||poly.some(p=>!valid(p))))return blocked('Ongeldig uitsluitingsgebied.');
if(!valid(o.position)||!Array.isArray(o.waypoints)||(!o.waypoints.length&&!o.finishLine)||o.waypoints.some(p=>!valid(p)))return {status:'blocked',path:[],legs:[],warnings:['Ongeldige positie of routepunten.']};if(!o.polar?.points?.length&&!o.polar?.tables?.length&&typeof o.polar?.speedAt!=='function')return {status:'blocked',path:[],legs:[],warnings:['Voer een gevalideerde snelheidspolar in voor koersadvies.']};const initialWind=at(o.wind,o.position,0);if(o.polar?.tables?.length&&initialWind?.speedKnots){const range=o.polar.tables.map(t=>t.windKnots);if(initialWind.speedKnots<Math.min(...range)||initialWind.speedKnots>Math.max(...range))warnings.push('Wind buiten het gemeten polarbereik: lagere wind wordt lineair geschat, hogere wind gebruikt de laatste tabel; prognose niet gevalideerd.');}if(o.polar?.points&&o.polar.referenceWindKnots&&initialWind?.speedKnots&&Math.abs(initialWind.speedKnots-o.polar.referenceWindKnots)>Math.max(2,o.polar.referenceWindKnots*.2))warnings.push('Werkelijke wind wijkt sterk af van de vaste polarwind; snelheidsprognose is niet betrouwbaar.');if(!initialWind||!Number.isFinite(initialWind.fromDeg)||!Number.isFinite(initialWind.speedKnots)||initialWind.speedKnots<=0)return {status:'blocked',path:[],legs:[],warnings:['Positieve windsterkte en geldige windrichting vereist; bij windstilte geen zeiladvies.']};let start={p:o.position,t:0,path:[{...o.position,timeSeconds:0}],heading:Number.isFinite(o.initialHeading)?normalizeDeg(o.initialHeading):null,tack:Number.isFinite(o.initialHeading)?evaluateHeading(o.initialHeading,initialWind,initialCurrent,o.polar).tack:null,unknown:false},legs=[];const dt=Math.max(10,o.stepSeconds||120),limit=Math.max(1,o.maxSteps||180),width=Math.min(120,Math.max(4,o.beamWidth||36));
for(const target of o.waypoints){if(distanceNm(start.p,target)<1e-8){legs.push({name:target.name||('Punt '+(legs.length+1)),from:start.p,to:target,etaSeconds:start.t,durationSeconds:0});continue;}let beam=[start],winner=null;for(let step=0;step<limit&&!winner;step++){const candidates=[];for(const node of beam){const wind=at(o.wind,node.p,node.t),current=at(o.current,node.p,node.t,{speedKnots:0,toDeg:0});if(!wind||!Number.isFinite(wind.fromDeg)||!Number.isFinite(wind.speedKnots)||wind.speedKnots<=0||!vectorValid(current))continue;const direct=bearingDeg(node.p,target),heads=new Set([direct,...Array.from({length:36},(_,i)=>i*10),...correctedHeadings(direct,wind,current,o.polar)]);for(const h of heads){const e=evaluateHeading(h,wind,current,o.polar);if(!Number.isFinite(e.speedKnots)||!Number.isFinite(e.sogKnots)||e.speedKnots<=0||e.sogKnots<.1)continue;let penalty=0,maneuver=null;if(node.tack&&node.tack!==e.tack){const gybe=node.heading!==null&&Math.abs(delta(node.heading,wind.fromDeg))>90&&e.twa>90;maneuver=gybe?'gijpen':'overstag';penalty=gybe?(o.gybeCostSeconds??45):(o.tackCostSeconds??60);}const remaining=distanceNm(node.p,target),stepDt=target.arrivalNm&&remaining<.25?Math.min(dt,20):dt,travel=e.sogKnots*stepDt/3600;let p=destination(node.p,e.cogDeg,travel),elapsed=stepDt;const courseError=Math.abs(delta(e.cogDeg,direct));if(remaining*Math.abs(Math.sin(rad(courseError)))*NM<Math.min(target.arrivalNm||o.arrivalNm||.04,.003)*NM&&courseError<90&&remaining<=travel){p={lat:target.lat,lon:target.lon};elapsed=remaining/e.sogKnots*3600;}const check=segmentCheck(node.p,p,o);if(check.blocked||o.requireKnownDepth&&check.unknown)continue;const t=node.t+elapsed+penalty,next={p,t,heading:h,tack:e.tack,unknown:node.unknown||check.unknown,path:[...node.path,{...p,timeSeconds:t,heading:h,cogDeg:e.cogDeg,sogKnots:e.sogKnots,twa:e.twa,tack:e.tack,maneuver,maneuverAtSeconds:maneuver?node.t:null,maneuverCostSeconds:penalty}]};if(distanceNm(p,target)<(target.arrivalNm||o.arrivalNm||.04)){if(!winner||t<winner.t)winner=next;}else candidates.push({...next,score:t+distanceNm(p,target)/Math.max(.5,e.sogKnots*Math.cos(rad(courseError)))*3600});}}
const cells=new Set();beam=candidates.sort((a,b)=>a.score-b.score).filter(n=>{const scale=target.arrivalNm?20000:1500;const key=`${Math.round(n.p.lat*scale)},${Math.round(n.p.lon*scale)},${n.tack}`;if(cells.has(key))return false;cells.add(key);return true;}).slice(0,width);if(!beam.length&&!winner)break;}
if(!winner)return {status:'incomplete',path:start.path,legs,etaSeconds:null,warnings:[...warnings,'Geen volledige route binnen de zoekgrenzen; controleer obstakels, polar en zoekgebied.','Waterdiepte en vrije doorgang vereisen actuele nautische kaarten.']};legs.push({name:target.name||`Punt ${legs.length+1}`,from:start.p,to:target,etaSeconds:winner.t,durationSeconds:winner.t-start.t});start=winner;}
const first=start.path[1],distance=start.path.slice(1).reduce((s,p,i)=>s+distanceNm(start.path[i],p),0);warnings.push('Koersadvies gebruikt de ingevoerde polar; kalibreer die op de Waterwolf.');if(start.unknown)warnings.push('Waterdiepte onbekend op delen van de route; route is niet op veilige diepte gevalideerd.');return {status:'ok',path:start.path,legs,distanceNm:distance,etaSeconds:start.t,recommendation:first?{heading:first.heading,cogDeg:first.cogDeg,twa:first.twa,tack:first.tack,sogKnots:first.sogKnots}:null,warnings};}

/** Plan physical buoy-clearance arcs and finish-line crossing as ordered constraints.
 * rounding: 'port'/'starboard' (also bakboord/stuurboord). roundingRadiusM defaults 40.
 * These are geometric passage constraints, not proof of compliance with race rules.
 * finishLine: [{lat,lon},{lat,lon}]. startLine is briefing context only.
 */
export function routeRace(o){
 const blocked=message=>({status:'blocked',path:[],legs:[],warnings:[message]});
 if(!valid(o.position)||!Array.isArray(o.waypoints)||(!o.waypoints.length&&!o.finishLine)||o.waypoints.some(p=>!valid(p)))return blocked('Ongeldige positie of routepunten.');
 if(o.finishLine&&(!Array.isArray(o.finishLine)||o.finishLine.length!==2||o.finishLine.some(p=>!valid(p))||distanceNm(...o.finishLine)<.001))return blocked('Finishlijn vereist twee verschillende geldige coördinaten.');
 if(o.initialHeading!==undefined&&!Number.isFinite(o.initialHeading))return blocked('Beginkoers moet een geldig aantal graden zijn.');
 if(o.polar?.tables){const winds=o.polar.tables.map(t=>t.windKnots);if(!winds.length||new Set(winds).size!==winds.length||o.polar.tables.some(t=>!Number.isFinite(t.windKnots)||t.windKnots<=0||!Array.isArray(t.points)||!t.points.length||t.points.some(p=>!Number.isFinite(p.twa)||p.twa<0||p.twa>180||!Number.isFinite(p.speedKnots)||p.speedKnots<0)||new Set(t.points.map(p=>p.twa)).size!==t.points.length))return blocked('Ongeldige windafhankelijke polartabellen.');}
 const expanded=[],exclusions=[...(o.exclusions||[])],roundings=[],originalIndices=[];
 let prev=o.position;
 for(let i=0;i<o.waypoints.length;i++){
  const mark=o.waypoints[i],side=({bakboord:'port',stuurboord:'starboard'})[mark.rounding]||mark.rounding;
  if(side&&side!=='none'&&side!=='port'&&side!=='starboard')return blocked('Onbekende boeirondingszijde.');
  if(side==='port'||side==='starboard'){
   const next=o.waypoints[i+1]||(o.finishLine?midpoint(o.finishLine[0],o.finishLine[1]):null);
   if(!next)return blocked('Een te ronden laatste boei vereist een volgend routepunt of finishlijn.');
   const radius=mark.roundingRadiusM??o.roundingRadiusM??40;
   if(!Number.isFinite(radius)||radius<10||radius>1000)return blocked('Boeivrije radius moet tussen 10 en 1000 meter liggen.');
   const distanceToMarkM=distanceNm(prev,mark)*NM;
   if(distanceToMarkM<=radius+5)return blocked('Positie ligt in de vrije boeizone: stuur eerst buiten de boei of markeer een reeds voltooide passage.');
   if(distanceNm(next,mark)*NM<radius*2)return blocked('Volgend routepunt ligt te dicht bij de vereiste boeironding.');
   const entry=bearingDeg(mark,prev),exit=bearingDeg(mark,next),direction=side==='port'?-1:1;
   let sweep=direction===1?normalizeDeg(exit-entry):normalizeDeg(entry-exit);if(sweep<1)sweep=360;
   const steps=Math.max(2,Math.ceil(sweep/30)),indices=[];
   for(let j=0;j<=steps;j++){
    const point=destination(mark,entry+direction*sweep*j/steps,radius*1.6/NM);
    indices.push(expanded.length);expanded.push({...point,name:`${mark.name||'Boei'} · ${side==='port'?'bakboord':'stuurboord'} ${j+1}/${steps+1}`,arrivalNm:Math.min(.002,radius/NM*.08)});
   }
   exclusions.push(Array.from({length:24},(_,k)=>destination(mark,k*15,radius/Math.cos(Math.PI/24)/NM)));
   roundings.push({mark,side,indices,radiusM:radius,sweep,partialFromPosition:i===0&&distanceToMarkM<radius*2});originalIndices.push({name:mark.name,index:indices.at(-1)});prev=expanded.at(-1);
  }else{expanded.push(mark);originalIndices.push({name:mark.name,index:expanded.length-1});prev=mark;}
 }
 let crossing=null;
 if(o.finishLine){
  const [a,b]=o.finishLine,center=midpoint(a,b),cos=Math.cos(rad(center.lat));
  const xy=p=>({x:(p.lon-center.lon)*cos,y:p.lat-center.lat}),A=xy(a),B=xy(b),P=xy(prev),dx=B.x-A.x,dy=B.y-A.y;
  const fraction=Math.max(.1,Math.min(.9,((P.x-A.x)*dx+(P.y-A.y)*dy)/(dx*dx+dy*dy)));
  const gate={lat:a.lat+(b.lat-a.lat)*fraction,lon:a.lon+(b.lon-a.lon)*fraction};
  if(Math.abs(dx*(P.y-A.y)-dy*(P.x-A.x))/Math.hypot(dx,dy)*rad(1)*R<5)return blocked('Positie ligt op of binnen 5 meter van de finishlijn; kies een ondubbelzinnig aanvaartpunt vóór de lijn.');
  const approach=bearingDeg(prev,gate),offset=Math.max(50,o.finishCrossingOffsetM||80);
  const before=destination(gate,approach+180,offset/NM),after=destination(gate,approach,offset/NM);
  expanded.push({...before,name:'Finishlijn aanvaren',arrivalNm:.002},{...after,name:'Finishlijn gekruist',arrivalNm:.002});crossing={line:o.finishLine,gate,before,after};
 }
 const result=routePoints({...o,waypoints:expanded,exclusions,stepSeconds:o.stepSeconds,maxSteps:o.maxSteps||240});
 result.waypointEtas=originalIndices.map(({name,index})=>({name,etaSeconds:result.legs[index]?.etaSeconds??null}));
 if(o.startLine)result.warnings.push('Startlijn is briefinginformatie; correcte starttijd en startkruising worden niet gevalideerd.');
 result.roundings=roundings.map(({mark,side,radiusM,indices,sweep,partialFromPosition})=>{
  const t0=indices[0]===0?0:result.legs[indices[0]-1]?.etaSeconds,t1=result.legs[indices.at(-1)]?.etaSeconds;
  const portion=result.path.filter(p=>p.timeSeconds>=t0&&p.timeSeconds<=t1);
  let windingDeg=0;for(let j=1;j<portion.length;j++)windingDeg+=delta(bearingDeg(mark,portion[j]),bearingDeg(mark,portion[j-1]));
  const sideVerified=Number.isFinite(t1)&&portion.length>1&&(side==='port'?windingDeg<=-(sweep-20):windingDeg>=sweep-20);
  return {name:mark.name,side,radiusM,windingDeg,sideVerified,partialFromPosition};
 });
 if(result.status==='ok'&&result.roundings.some(r=>!r.sideVerified)){result.status='incomplete';result.etaSeconds=null;result.warnings.push('Rondingsrichting kon niet geometrisch worden bevestigd; route onvolledig.');}
 if(result.roundings.some(r=>r.partialFromPosition))result.warnings.push('Ronding herpland vanaf de huidige positie bij de boei; eerdere passage en voortgang zijn onbekend.');
 if(roundings.length)result.warnings.push('Boeizijde gebruikt verplichte rondingspunten en vrije radius; schipper controleert wedstrijdregels en passage.');
 if(crossing&&result.status==='ok'){
  const [a,b]=crossing.line,sign=p=>(b.lon-a.lon)*(p.lat-a.lat)-(b.lat-a.lat)*(p.lon-a.lon);
  const finalApproachTime=result.legs[result.legs.length-2]?.etaSeconds??Infinity;
  const finalPath=result.path.filter(p=>p.timeSeconds>=finalApproachTime),startSide=sign(crossing.before),endSide=sign(finalPath.at(-1)||crossing.before);
  const crossed=startSide*endSide<0&&finalPath.slice(1).some((p,i)=>sign(finalPath[i])*sign(p)<=0&&intersects(finalPath[i],p,a,b));
  result.finishCrossing={...crossing,crossed};
  if(!crossed){result.status='incomplete';result.etaSeconds=null;result.warnings.push('Finishlijn niet aantoonbaar gekruist; route onvolledig.');}
  else result.warnings.push('Geometrische finishlijnkruising berekend; wedstrijdregels en tijdvenster niet gecontroleerd.');
 }
 return result;
}
function midpoint(a,b){return {lat:(a.lat+b.lat)/2,lon:(a.lon+b.lon)/2};}

/** Compare ordered alternatives (race legality is not validated), e.g. two of three race marks. */
export function chooseWaypointRoutes(o,marks,count=2){const orders=[];function visit(path,left){if(path.length===count){orders.push(path);return;}for(let i=0;i<left.length;i++)visit([...path,left[i]],left.filter((_,j)=>j!==i));}visit([],marks);return orders.map(points=>({waypoints:points,result:routeRace({...o,waypoints:[...points,...(o.finish?[o.finish]:[])]})})).sort((a,b)=>(a.result.etaSeconds??Infinity)-(b.result.etaSeconds??Infinity));}



