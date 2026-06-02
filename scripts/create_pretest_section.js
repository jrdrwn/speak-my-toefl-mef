import fs from 'fs';
import path from 'path';

const filePath = path.join('src','data','longmanListening.ts');
let text = fs.readFileSync(filePath,'utf8');

const marker = 'export const LONGMAN_LISTENING_SECTIONS';
const idx = text.indexOf(marker);
if(idx === -1) throw new Error('sections marker not found');
const arrStart = text.indexOf('[', idx);
if(arrStart === -1) throw new Error('array start not found');
// find matching closing bracket
let depth = 0; let i = arrStart; let arrEnd = -1;
for(; i<text.length; i++){
  const ch = text[i];
  if(ch === '[') depth++;
  else if(ch === ']') { depth--; if(depth === 0){ arrEnd = i; break; } }
}
if(arrEnd === -1) throw new Error('array end not found');
const arrText = text.slice(arrStart, arrEnd+1);
let sections = JSON.parse(arrText);

if(!Array.isArray(sections) || sections.length === 0) throw new Error('no sections parsed');
// assume first section contains pretest merged at front
const firstSection = sections[0];
if(!Array.isArray(firstSection.questions)) throw new Error('first section has no questions');
if(firstSection.questions.length < 30) throw new Error('first section has less than 30 questions; aborting');

const preQs = firstSection.questions.slice(0,30);
const restQs = firstSection.questions.slice(30);

// build new pretest section
const preSection = {
  title: 'Part A — Pretest',
  audioFile: '',
  questionOffset: 0,
  audioOffset: 0,
  questions: preQs
};

// update first section's questions and offsets
sections[0].questions = restQs;
sections[0].questionOffset = (Number(sections[0].questionOffset) || 0) + 30;
sections[0].audioOffset = (Number(sections[0].audioOffset) || 0) + 30;

// add 30 to all remaining sections offsets (index >=1)
for(let s=1;s<sections.length;s++){
  sections[s].questionOffset = (Number(sections[s].questionOffset) || 0) + 30;
  sections[s].audioOffset = (Number(sections[s].audioOffset) || 0) + 30;
}

// prepend preSection
sections.unshift(preSection);

const newArrText = JSON.stringify(sections, null, 2);
const newText = text.slice(0, arrStart) + newArrText + text.slice(arrEnd+1);
fs.writeFileSync(filePath, newText, 'utf8');
console.log('Inserted new pretest section and adjusted offsets.');
