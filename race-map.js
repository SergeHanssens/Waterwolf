/** Dependency-free interactive Web Mercator race map. All mutations are delegated to onAction. */

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const valid=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=85.051129&&Math.abs(p.lon)<=180;

export function project(p,zoom){const world=256*2**zoom,lat=clamp(p.lat,-85.051129,85.051129)*Math.PI/180;return {x:(p.lon+180)/360*world,y:(1-Math.log(Math.tan(lat)+1/Math.cos(lat))/Math.PI)/2*world};}

export function unproject(p,zoom){const world=256*2**zoom;return {lat:Math.atan(Math.sinh(Math.PI*(1-2*p.y/world)))*180/Math.PI,lon:((p.x/world*360-180+540)%360)-180};}

export function createRaceMap({getState,getPlan,onAction,getOverlay=()=>[]}){

 const map=document.getElementById('map');if(!map)throw new Error('Kaart ontbreekt.');

 let camera=null,lastPos=null,lastPts=[],markers=[],width=700,height=510,drag=null,pinch=null,changed=false,moving=null;const pointers=new Map();

 map.style.touchAction='none';map.style.cursor='grab';map.tabIndex=0;map.setAttribute('role','region');map.setAttribute('aria-label','Interactieve wedstrijdkaart. Pijltjestoetsen verschuiven, plus en min zoomen, Enter kiest kaartpositie.');

 const dialog=document.createElement('dialog');dialog.id='mapActionDialog';dialog.setAttribute('aria-labelledby','mapActionTitle');dialog.style.cssText='max-width:min(92vw,440px);border:1px solid #dce2df;border-radius:14px;padding:24px;color:#193b49';document.body.append(dialog);

 const moveBar=document.createElement('div');moveBar.className='map-move-bar';moveBar.hidden=true;moveBar.innerHTML='<p id="mapMoveStatus" role="status"></p><button id="mapMoveOK" disabled>OK · verplaatsing bewaren</button><button id="mapMoveCancel">Annuleer verplaatsing</button>';map.before(moveBar);

 const status=moveBar.querySelector('p'),ok=moveBar.querySelector('#mapMoveOK');

 function stopMove(){moving=null;moveBar.hidden=true;draw();}

 moveBar.querySelector('#mapMoveCancel').onclick=stopMove;ok.onclick=()=>{if(!moving?.position)return;const m=moving;if(!m.boat&&getState().race.points[m.index]!==m.original){stopMove();return;}moving=null;moveBar.hidden=true;onAction({type:m.boat?'boat':'movePoint',index:m.index,endpoint:m.endpoint,lat:m.position.lat,lon:m.position.lon});draw();};

 function beginMove(hit){moving={...hit,original:hit.boat?null:getState().race.points[hit.index],position:null};dialog.close();moveBar.hidden=false;ok.disabled=true;status.textContent='Verplaats '+hit.name+': klik op de nieuwe plek op de kaart. Bewaar daarna met OK, of annuleer.';map.focus();}



 function worldAt(x,y){const c=project(camera.center,camera.zoom);return {x:c.x+x-width/2,y:c.y+y-height/2};}

 function xy(p){const m=project(p,camera.zoom),c=project(camera.center,camera.zoom);return {x:m.x-c.x+width/2,y:m.y-c.y+height/2};}

 function rawMarkers(){const state=getState();return lastPts.map((p,index)=>({p,index,raw:state.race.points[index]})).filter(({p,raw})=>raw&&raw.lat!==''&&raw.lat!=null&&raw.lon!==''&&raw.lon!=null&&valid(p));}

 function fit(){const all=[...(getState().demo?getState().historicalReplay?.track||[]:[]).filter(valid),...rawMarkers().map(m=>m.p),...(getPlan()?.path||[]).filter(valid),...(valid(lastPos)?[lastPos]:[])];if(!all.length){camera={center:{lat:52.73,lon:5.32},zoom:11};return;}const xs=all.map(p=>project(p,0).x),ys=all.map(p=>project(p,0).y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const spanX=Math.max(maxX-minX,.002),spanY=Math.max(maxY-minY,.002);const zoom=clamp(Math.floor(Math.log2(Math.min((width-90)/spanX,(height-100)/spanY))),3,17);camera={center:unproject({x:(minX+maxX)/2,y:(minY+maxY)/2},0),zoom};}

 function zoomBy(amount,x=width/2,y=height/2){if(!camera)return;const old=unproject(worldAt(x,y),camera.zoom),next=clamp(camera.zoom+amount,3,18);if(next===camera.zoom)return;camera.zoom=next;const anchor=project(old,next);camera.center=unproject({x:anchor.x-x+width/2,y:anchor.y-y+height/2},next);draw();}

 function pan(dx,dy){const c=project(camera.center,camera.zoom);camera.center=unproject({x:c.x-dx,y:clamp(c.y-dy,0,256*2**camera.zoom)},camera.zoom);draw();}

 function openActions(x,y,forced){if(!camera||dialog.open)return;if(moving){moving.position=unproject(worldAt(x,y),camera.zoom);ok.disabled=false;status.textContent='Nieuwe plek voor '+moving.name+': '+moving.position.lat.toFixed(6)+', '+moving.position.lon.toFixed(6)+'. Klik op OK om te bewaren.';draw();return;}const position=unproject(worldAt(x,y),camera.zoom),state=getState(),hits=(forced?[forced]:markers.filter(m=>Math.hypot(m.x-x,m.y-y)<26)).filter((m,i,all)=>all.findIndex(n=>m.boat?n.boat:!n.boat&&n.index===m.index&&n.endpoint===m.endpoint)===i);let title=hits[0]?.boat?'Waterwolf op de kaart':hits[0]?.name||'Kies deze kaartpositie';dialog.innerHTML=`<h2 id="mapActionTitle">${esc(title)}</h2><p>${position.lat.toFixed(6)}, ${position.lon.toFixed(6)}</p><div id="mapActionChoices" style="display:grid;gap:10px"></div><p style="font-size:12px;color:#68808a">Verwijderen gebeurt alleen met de knop hieronder.</p><button type="button" data-close>Annuleer</button>`;const choices=dialog.querySelector('#mapActionChoices');

  const action=(label,type,index)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>{dialog.close();onAction({type,lat:position.lat,lon:position.lon,...(index!==undefined?{index}:{})});map.focus();};choices.append(button);};

  action('Zet Waterwolf hier','boat');if(state.race.points[state.active])action(`Plaats ${state.race.points[state.active].name||'actief wedstrijdpunt'} hier`,'target',state.active);action('Voeg nieuwe boei / tussenpunt toe','add');

  for(const hit of hits){const move=document.createElement('button');move.textContent='Verplaats '+hit.name+(hit.endpoint===2?' (tweede lijnpunt)':'');move.onclick=()=>beginMove(hit);choices.append(move);if(hit.boat)action('Verwijder scheepspositie','removeBoat');else action(hit.index===0||hit.index===state.race.points.length-1?`Wis coördinaten van ${hit.name}`:`Verwijder ${hit.name}`,'removePoint',hit.index);}

  dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.showModal();choices.querySelector('button')?.focus();

 }

 function draw(){if(!camera)return;const state=getState(),historical=(state.demo?state.historicalReplay?.track||[]:[]).filter(valid),route=(getPlan()?.path||[]).filter(valid),online=document.getElementById('tiles')?.checked,c=project(camera.center,camera.zoom),world=2**camera.zoom;let tiles='';if(online){for(let x=Math.floor((c.x-width/2)/256);x<=Math.floor((c.x+width/2)/256);x++)for(let y=Math.floor((c.y-height/2)/256);y<=Math.floor((c.y+height/2)/256);y++){if(y<0||y>=world)continue;tiles+=`<img alt="" draggable="false" src="https://tile.openstreetmap.org/${camera.zoom}/${((x%world)+world)%world}/${y}.png" style="left:${x*256-c.x+width/2}px;top:${y*256-c.y+height/2}px">`;}}

  markers=[];let marks='',lines='';for(const {p,index,raw} of rawMarkers()){const q=xy(p);markers.push({...q,index,name:p.name||`Punt ${index+1}`});marks+=`<g role="button" tabindex="0" data-marker="${index}" aria-label="${esc(p.name||'Wedstrijdpunt')}: kaartacties"><circle cx="${q.x}" cy="${q.y}" r="9" fill="${index===state.active?'#e77655':'white'}" stroke="#193b49" stroke-width="2"/><text x="${q.x+13}" y="${q.y-12}" font-size="12" fill="#102c3b" paint-order="stroke" stroke="white" stroke-width="3">${esc(p.name)}</text></g>`;if(raw.lat2!==''&&raw.lat2!=null&&raw.lon2!==''&&raw.lon2!=null){const a=xy({lat:Number(raw.lat),lon:Number(raw.lon)}),end={lat:Number(raw.lat2),lon:Number(raw.lon2)};if(valid(end)){const b=xy(end);lines+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#193b49" stroke-width="4"/><circle cx="${a.x}" cy="${a.y}" r="5" fill="white" stroke="#193b49"/><circle cx="${b.x}" cy="${b.y}" r="5" fill="white" stroke="#193b49"/>`;markers.push({...a,index,name:p.name},{...b,index,name:p.name,endpoint:2});}}}

  let boat='';if(valid(lastPos)){const q=xy(lastPos);markers.push({...q,boat:true,name:'Waterwolf'});boat=`<g role="button" tabindex="0" data-boat="true" aria-label="Waterwolf: kaartacties" transform="translate(${q.x},${q.y}) rotate(${Number(state.env.trueHeading??state.env.heading??0)||0})"><path d="M0 -16 L10 13 L0 7 L-10 13 Z" fill="#102c3b" stroke="white" stroke-width="3"/></g>`;}

  const arrows=['wind','current'].map((name,i)=>{const angle=state.env[name==='wind'?'windDir':'currentDir'],speed=state.env[name==='wind'?'windSpeed':'currentSpeed'];if(angle==null||!Number.isFinite(Number(angle)))return '';return `<g transform="translate(${45+i*95},45)"><rect x="-35" y="-31" width="75" height="83" rx="9" fill="white" opacity=".9"/><g transform="rotate(${Number(angle)+(i?0:180)})"><path d="M0 17V-17 M-6 -9L0 -17L6 -9" stroke="${i?'#397daa':'#e77655'}" stroke-width="3" fill="none"/></g><text y="36" text-anchor="middle" font-size="10" fill="#193b49">${i?'Stroom':'Wind'} ${esc(speed??'?')} kn</text></g>`;}).join('');

  const extent=20037508.342789244,scale=256*2**camera.zoom;const bbox=[(c.x-width/2)/scale*2*extent-extent,extent-(c.y+height/2)/scale*2*extent,(c.x+width/2)/scale*2*extent-extent,extent-(c.y-height/2)/scale*2*extent];const overlays=getOverlay({bbox,width:Math.round(width),height:Math.round(height)})||[];map.innerHTML=`<div class="tiles">${tiles}${overlays.map(url=>`<img class="${url.includes('MaritimeChartService')?'nautical-layer':'current-layer'}" alt="${url.includes('MaritimeChartService')?'Officiële RWS nautische kaart':'Officiële RWS-stromingsmodelkaart'}" draggable="false" src="${esc(url)}" style="left:0;top:0;width:${width}px;height:${height}px">`).join('')}</div><svg viewBox="0 0 ${width} ${height}" aria-label="Routekaart"><defs><pattern id="raceMapGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#aac4c2" stroke-opacity=".4"/></pattern></defs>${tiles?'':'<rect width="100%" height="100%" fill="url(#raceMapGrid)"/>'}<polyline aria-label="Opgenomen Waterwolf-track 11 oktober 2025" points="${historical.map(p=>{const q=xy(p);return `${q.x},${q.y}`;}).join(' ')}" fill="none" stroke="#6877c8" stroke-width="3"/>${historical.length?'<text x="12" y="110" font-size="12" fill="#193b49" paint-order="stroke" stroke="white" stroke-width="3">Paars: opgenomen track 2025 · oranje: oefenmodel</text>':''}<polyline points="${route.map(p=>{const q=xy(p);return `${q.x},${q.y}`;}).join(' ')}" fill="none" stroke="#e77655" stroke-width="3" stroke-dasharray="8 5"/>${lines}${marks}${boat}${moving?.position?(()=>{const q=xy(moving.position);return `<g><circle cx="${q.x}" cy="${q.y}" r="15" fill="#e77655" fill-opacity=".5" stroke="#102c3b" stroke-width="3"/><text x="${q.x+20}" y="${q.y}" font-size="13" fill="#102c3b" paint-order="stroke" stroke="white" stroke-width="3">${esc(moving.name)} · nieuwe plek</text></g>`;})():''}${arrows}<text x="${width-12}" y="${height-12}" text-anchor="end" font-size="11" fill="#193b49" paint-order="stroke" stroke="white" stroke-width="3">Zoom ${camera.zoom} · sleep om te verschuiven</text></svg>`;

  const attribution=document.getElementById('mapAttribution');if(attribution)attribution.innerHTML=online?'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap-bijdragers</a> · RWS ENC / stromingsmodel indien ingeschakeld · PWA niet gecertificeerd':(overlays.length?'RWS '+(overlays.some(url=>url.includes('MaritimeChartService'))?'ENC-kaart ':'')+(overlays.some(url=>!url.includes('MaritimeChartService'))?'stromingsmodel':'')+' · PWA niet gecertificeerd':'Schematische kaart · geen navigatiekaart');

 }

 function render(pos,pts){lastPos=pos;lastPts=pts||[];width=map.clientWidth||700;height=map.clientHeight||510;if(!camera)fit();draw();}

 map.addEventListener('wheel',e=>{e.preventDefault();const r=map.getBoundingClientRect();zoomBy(e.deltaY<0?1:-1,e.clientX-r.left,e.clientY-r.top);},{passive:false});

 map.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;map.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};changed=false;}if(pointers.size===2){if(drag&&changed)pan(drag.x-drag.startX,drag.y-drag.startY);const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:camera.zoom};changed=true;}map.style.cursor='grabbing';});

 map.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinch){const[a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y),desired=clamp(pinch.zoom+Math.round(Math.log2(distance/pinch.distance)),3,18),r=map.getBoundingClientRect();zoomBy(desired-camera.zoom,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);return;}if(drag&&pointers.size===1){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)changed=true;if(changed){const tx=e.clientX-drag.startX,ty=e.clientY-drag.startY;map.querySelectorAll('.tiles,svg').forEach(el=>el.style.transform=`translate(${tx}px,${ty}px)`);}drag.x=e.clientX;drag.y=e.clientY;}});

 function end(e,cancel=false){if(!pointers.has(e.pointerId))return;const click=!cancel&&!changed&&pointers.size===1;pointers.delete(e.pointerId);if(map.hasPointerCapture(e.pointerId))map.releasePointerCapture(e.pointerId);if(click){const r=map.getBoundingClientRect();openActions(e.clientX-r.left,e.clientY-r.top);}if(!pointers.size){if(drag&&changed&&!pinch)pan(drag.x-drag.startX,drag.y-drag.startY);drag=null;pinch=null;map.style.cursor='grab';}else{const p=[...pointers.values()][0];drag={...p,startX:p.x,startY:p.y};pinch=null;changed=true;}}

 map.addEventListener('pointerup',e=>end(e));map.addEventListener('pointercancel',e=>end(e,true));

 map.addEventListener('keydown',e=>{const node=e.target.closest?.('[data-marker],[data-boat]');if(node&&(e.key==='Enter'||e.key===' ')){e.preventDefault();const hit=markers.find(m=>node.dataset.boat?m.boat:m.index===Number(node.dataset.marker));if(hit)openActions(hit.x,hit.y,hit);return;}if(e.target!==map)return;const pans={ArrowLeft:[80,0],ArrowRight:[-80,0],ArrowUp:[0,80],ArrowDown:[0,-80]};if(pans[e.key]){e.preventDefault();pan(...pans[e.key]);}else if(e.key==='+'||e.key==='='){e.preventDefault();zoomBy(1);}else if(e.key==='-'){e.preventDefault();zoomBy(-1);}else if(e.key==='Enter'){e.preventDefault();openActions(width/2,height/2);}});

 for(const[id,fn]of [['mapZoomIn',()=>zoomBy(1)],['mapZoomOut',()=>zoomBy(-1)],['mapFit',()=>{fit();draw();}]])document.getElementById(id)?.addEventListener('click',fn);

 if(globalThis.ResizeObserver)new ResizeObserver(()=>render(lastPos,lastPts)).observe(map);

 return {render,fit:()=>{fit();draw();},zoomIn:()=>zoomBy(1),zoomOut:()=>zoomBy(-1)};

}





