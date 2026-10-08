// Official RWS Inland ENC portrayal service. This PWA is not certified ECDIS.
export const NAUTICAL_WMS='https://geo.rijkswaterstaat.nl/arcgis/rest/services/ENC/mcs_inland/MapServer/exts/MaritimeChartService/WMSServer';
export const NAUTICAL_SOURCE='https://www.vaarweginformatie.nl/frp/page/infra_enc';
export async function discoverNauticalChart({fetcher=fetch,now=Date.now()}={}){
 const r=await fetcher(NAUTICAL_WMS+'?SERVICE=WMS&REQUEST=GetCapabilities',{cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('RWS ENC-kaartservice niet beschikbaar');
 const xml=await r.text();
 if(!xml.includes('MaritimeChartService')||!xml.includes('Buoys, beacons')||!xml.includes('image/png'))throw Error('Onverwachte nautische kaartservice');
 return {source:NAUTICAL_SOURCE,wms:NAUTICAL_WMS,checkedAt:new Date(now).toISOString(),editionAt:null,kind:'official-enc-portrayal',coverageVerified:['ijsselmeer-near-de-kreupel'],notice:'Officiële RWS ENC-weergave online. Editiedatum per kaartcel niet bevestigd; controleer scheepvaartberichten en actuele boordkaart.'};
}
export function nauticalChartURL({bboxEPSG3857array,bbox,width=700,height=510}={}){
 const b=bboxEPSG3857array||bbox;
 if(!Array.isArray(b)||b.length!==4||b.some(x=>!Number.isFinite(x))||b[0]>=b[2]||b[1]>=b[3])throw Error('Ongeldige kaartgrenzen');
 // Layer 0 chart-display information and 10 overscale warning obscure the map
 // at race overview scale. The chart is information support; zoom for detail.
 const p=new URLSearchParams({SERVICE:'WMS',VERSION:'1.3.0',REQUEST:'GetMap',LAYERS:'1,2,3,4,5,6,7,8,9',STYLES:'',CRS:'EPSG:3857',BBOX:b.join(','),WIDTH:String(Math.min(2048,Math.max(1,Math.round(width)))),HEIGHT:String(Math.min(2048,Math.max(1,Math.round(height)))),FORMAT:'image/png',TRANSPARENT:'TRUE'});
 return NAUTICAL_WMS+'?'+p;
}
export const discover=discoverNauticalChart;
export const getmapurl=nauticalChartURL;
