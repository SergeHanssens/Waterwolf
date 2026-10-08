import {fetchWaterLevels} from '../water-levels.js';
import {mkdir,writeFile} from 'node:fs/promises';
const data=await fetchWaterLevels({mode:'live'});
await mkdir(new URL('../data/',import.meta.url),{recursive:true});
await writeFile(new URL('../data/water-levels-latest.json',import.meta.url),JSON.stringify(data,null,2)+'\n');
console.log(data.stations.map(s=>`${s.code}: ${s.levelM===null?'geen actuele meting':s.levelM+' m NAP · '+s.timestamp}`).join('\n'));
if(data.stations.every(s=>s.levelM===null))process.exitCode=1;
