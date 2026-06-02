import fs from 'fs';
import path from 'path';
const filePath = path.join('src','data','longmanListening.ts');
const text = fs.readFileSync(filePath,'utf8');
const marker = 'export const LONGMAN_LISTENING_SECTIONS';
const idx = text.indexOf(marker);
const arrStart = text.indexOf('[', idx);
let depth=0,i=arrStart,arrEnd=-1;
for(;i<text.length;i++){const ch=text[i]; if(ch==='[') depth++; else if(ch===']'){depth--; if(depth===0){arrEnd=i; break;}}}
if(arrEnd===-1) throw new Error('array end not found');
const arrText = text.slice(arrStart, arrEnd+1);
const sections = JSON.parse(arrText);
console.log('sections', sections.length);
sections.slice(0, 25).forEach((s, idx)=>console.log(idx+1, s.title, '|', s.questions.length));
