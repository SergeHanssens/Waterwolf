export async function loadOfficialMarks(){
 const response=await fetch('./data/klipperrace-2026.json?v=0.6.0');if(!response.ok)throw Error('Boeiposities niet beschikbaar');
 const data=await response.json();return {data,marks:data.marks.filter(m=>Number.isFinite(m.coordinates?.lat)&&Number.isFinite(m.coordinates?.lon))};
}
