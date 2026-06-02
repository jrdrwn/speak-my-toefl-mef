import fs from 'fs';
import path from 'path';

const filePath = path.join('src','data','longmanListeningPretest.ts');
let text = fs.readFileSync(filePath,'utf8');
const startMarker = 'questions: [';
const start = text.indexOf(startMarker);
if(start===-1) { console.error('start marker not found'); process.exit(1); }
let i = start + startMarker.length - 1;
let depth = 0;
let end = -1;
for(let j=i;j<text.length;j++){
  const ch = text[j];
  if(ch==='[') depth++;
  else if(ch===']') { if(depth===0){ end = j; break; } else depth--; }
}
// simpler: find the end by locating ']\n};\n\nexport const'
const endMarker = ']\n};\n\nexport const';
const endIdx = text.indexOf(endMarker, start);
if(endIdx===-1){ console.error('end marker not found'); process.exit(1); }
const arrText = text.slice(start + 'questions: '.length, endIdx + 1); // include closing ]
let qs;
try{ qs = JSON.parse(arrText); }catch(e){ console.error('JSON parse failed', e); process.exit(1); }

// Map indices: 0-12 -> file 1-04... 13-25 -> 1-05... 26-29 -> 1-06...
const map = (idx)=>{
  if(idx<=12) return '1-04 Part A, Conversations 1-13.m4a';
  if(idx<=25) return '1-05 Part A Conversations 14-26.m4a';
  return '1-06 Part A, Conversatons 27-30.m4a';
}

qs.forEach((q,idx)=>{ q.audio = map(idx); q.audioSeekMinute = 0; });

const newArrText = JSON.stringify(qs, null, 2);
const newText = text.slice(0, start + 'questions: '.length) + newArrText + text.slice(endIdx + endMarker.length - '\n\nexport const'.length);
fs.writeFileSync(filePath, newText, 'utf8');
console.log('Updated', filePath);
