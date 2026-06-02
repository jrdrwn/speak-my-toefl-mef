import fs from 'fs';
import path from 'path';

const filePath = path.join('src','data','longmanListening.ts');
let text = fs.readFileSync(filePath,'utf8');

const qKey = '"questions": [';
const qIdx = text.indexOf(qKey);
if(qIdx === -1) throw new Error('questions key not found');
const arrStart = text.indexOf('[', qIdx);
let depth = 0; let i = arrStart; let arrEnd = -1;
for(; i<text.length; i++){
  const ch = text[i];
  if(ch==='[') depth++;
  else if(ch===']'){ depth--; if(depth===0){ arrEnd = i; break; } }
}
if(arrEnd===-1) throw new Error('questions array end not found');
const arrText = text.slice(arrStart, arrEnd+1);
let questions;
try{ questions = JSON.parse(arrText); }catch(e){ console.error('JSON parse failed', e); process.exit(1); }
if(!Array.isArray(questions) || questions.length < 30) throw new Error('not enough questions in first section to extract pretest');

const preQs = questions.slice(0,30);
const restQs = questions.slice(30);

// replace the first questions array with restQs
const restText = JSON.stringify(restQs, null, 2);
text = text.slice(0, arrStart) + restText + text.slice(arrEnd+1);

// find start of the first section object to insert before
// locate the "title" key before arrStart
const titleIdx = text.lastIndexOf('"title":', arrStart);
if(titleIdx === -1) throw new Error('title key before questions not found');
// find the '{' that starts the section object
const braceIdx = text.lastIndexOf('{', titleIdx);
if(braceIdx === -1) throw new Error('opening brace for first section not found');

const preSection = {
  title: 'Part A — Pretest',
  audioFile: '',
  questionOffset: 0,
  audioOffset: 0,
  questions: preQs
};
const preText = JSON.stringify(preSection, null, 2);
// insert preText followed by a comma and newline
text = text.slice(0, braceIdx) + preText + ',' + text.slice(braceIdx);

// now increment all offsets by 30 (so sections after pretest shift)
text = text.replace(/("questionOffset"\s*:\s*)(\d+)/g, (_m,p1,p2)=> p1 + (Number(p2)+30));
text = text.replace(/("audioOffset"\s*:\s*)(\d+)/g, (_m,p1,p2)=> p1 + (Number(p2)+30));

// but presection (we just inserted) should be 0; set its occurrences back to 0
// find first occurrence of our presection title and then set the following offsets to 0
const preTitleIdx = text.indexOf('Part A — Pretest');
if(preTitleIdx !== -1){
  // find questionOffset after this index
  const qoIdx = text.indexOf('"questionOffset"', preTitleIdx);
  const aoIdx = text.indexOf('"audioOffset"', preTitleIdx);
  if(qoIdx !== -1){
    text = text.slice(0, qoIdx) + '"questionOffset": 0' + text.slice(text.indexOf('\n', qoIdx)+1);
  }
  if(aoIdx !== -1){
    // replace the first audioOffset after title
    const aoLineStart = text.indexOf('"audioOffset"', preTitleIdx);
    if(aoLineStart !== -1){
      // replace the line up to newline
      const lineEnd = text.indexOf('\n', aoLineStart);
      text = text.slice(0, aoLineStart) + '"audioOffset": 0' + text.slice(lineEnd);
    }
  }
}

fs.writeFileSync(filePath, text, 'utf8');
console.log('Pretest section created and offsets adjusted.');
