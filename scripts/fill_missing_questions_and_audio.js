import fs from 'fs';
import path from 'path';

const filePath = path.join('src','data','longmanListening.ts');
const publicAudioDir = path.join('public','listening','longman');
let text = fs.readFileSync(filePath,'utf8');

const marker = 'export const LONGMAN_LISTENING_SECTIONS';
const idx = text.indexOf(marker);
if(idx === -1) throw new Error('sections marker not found');
const arrStart = text.indexOf('[', idx);
if(arrStart === -1) throw new Error('array start not found');
let depth = 0; let i = arrStart; let arrEnd = -1;
for(; i<text.length; i++){
  const ch = text[i];
  if(ch === '[') depth++;
  else if(ch === ']') { depth--; if(depth === 0){ arrEnd = i; break; } }
}
if(arrEnd === -1) throw new Error('array end not found');
const arrText = text.slice(arrStart, arrEnd+1);
let sections;
try{ sections = JSON.parse(arrText); } catch(e){ console.error('JSON parse failed', e); process.exit(1); }

let changed = false;
for(const section of sections){
  if(!Array.isArray(section.questions)) continue;
  for(const q of section.questions){
    if(!('q' in q) || (typeof q.q === 'string' && q.q.trim() === '')){
      q.q = '(Transkrip tidak tersedia)';
      changed = true;
    }
    // normalize audio
    if(typeof q.audio === 'string' && q.audio.trim() !== ''){
      const audioPath = path.join(publicAudioDir, q.audio);
      if(!fs.existsSync(audioPath)){
        q.audio = null;
        q.instruction = (q.instruction ? q.instruction + ' ' : '') + 'Audio: tidak tersedia.';
        changed = true;
      }
    } else {
      if(q.audio !== null){
        q.audio = null;
        q.instruction = (q.instruction ? q.instruction + ' ' : '') + 'Audio: tidak tersedia.';
        changed = true;
      }
    }
  }
}

if(changed){
  const newArrText = JSON.stringify(sections, null, 2);
  const newText = text.slice(0, arrStart) + newArrText + text.slice(arrEnd+1);
  fs.writeFileSync(filePath, newText, 'utf8');
  console.log('Updated', filePath);
} else {
  console.log('No changes needed');
}
