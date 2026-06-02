import fs from 'fs';
import path from 'path';

const pretestPath = path.join('src','data','longmanListeningPretest.ts');
const listeningPath = path.join('src','data','longmanListening.ts');

let preText = fs.readFileSync(pretestPath,'utf8');
let listenText = fs.readFileSync(listeningPath,'utf8');

// extract questions array from pretest
const qStart = preText.indexOf('questions: [');
if(qStart===-1) throw new Error('pretest questions start not found');
const arrStart = preText.indexOf('[', qStart);
let depth = 0; let j = arrStart; let arrEnd = -1;
for(; j<preText.length; j++){ const ch = preText[j]; if(ch==='[') depth++; else if(ch===']'){ depth--; if(depth===0){ arrEnd = j; break; } } }
if(arrEnd===-1) throw new Error('pretest questions end not found');
const arrText = preText.slice(arrStart, arrEnd+1);
const preQs = JSON.parse(arrText);

// remove import line for pretest
listenText = listenText.replace(/import\s+LONGMAN_PRETEST_SECTION[\s\S]*?from '\.\/longmanListeningPretest';\n/, '');

// remove LONGMAN_PRETEST_SECTION from sections array
listenText = listenText.replace(/\[\s*LONGMAN_PRETEST_SECTION,/, '[');

// find first section's questions array start
const sectionsStart = listenText.indexOf('export const LONGMAN_LISTENING_SECTIONS');
if(sectionsStart===-1) throw new Error('sections start not found');
// find first occurrence of 'questions:' after sectionsStart
const qKey = listenText.indexOf('"questions": [', sectionsStart);
if(qKey===-1) throw new Error('first questions key not found');
const firstArrStart = listenText.indexOf('[', qKey);
// find end of that array
depth = 0; j = firstArrStart; let firstArrEnd=-1;
for(; j<listenText.length; j++){ const ch = listenText[j]; if(ch==='[') depth++; else if(ch===']'){ depth--; if(depth===0){ firstArrEnd = j; break; } } }
if(firstArrEnd===-1) throw new Error('first questions array end not found');
const firstArrText = listenText.slice(firstArrStart, firstArrEnd+1);
const firstQs = JSON.parse(firstArrText);

// merge: preQs then firstQs
const merged = [...preQs, ...firstQs];
const mergedText = JSON.stringify(merged, null, 2);

// replace the first questions array with mergedText
listenText = listenText.slice(0, firstArrStart) + mergedText + listenText.slice(firstArrEnd+1);

// set first section offsets to 0
listenText = listenText.replace(/("questionOffset":\s*)\d+/, '$10');
listenText = listenText.replace(/("audioOffset":\s*)\d+/, '$10');

// subtract 30 from subsequent section offsets: questionOffset and audioOffset
listenText = listenText.replace(/("questionOffset":\s*)(\d+)/g, (m,p1,p2,offset,str)=>{
  // if this occurrence is the first section we already set to 0; others subtract 30
  const idx = offset;
  // naive: subtract 30, but avoid negative
  const val = Math.max(0, Number(p2) - 30);
  return p1 + val;
});
listenText = listenText.replace(/("audioOffset":\s*)(\d+)/g, (m,p1,p2)=>{ const val = Math.max(0, Number(p2) - 30); return p1 + val; });

fs.writeFileSync(listeningPath, listenText, 'utf8');
// remove pretest module file
fs.unlinkSync(pretestPath);

console.log('Merged pretest into first section and removed pretest module.');
