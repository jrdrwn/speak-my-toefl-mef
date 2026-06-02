import fs from 'fs';
import path from 'path';
const filePath = path.join('src','data','longmanListening.ts');
const text = fs.readFileSync(filePath,'utf8');
const marker = 'export const LONGMAN_LISTENING_SECTIONS';
const idx = text.indexOf(marker);
const arrStart = text.indexOf('[', idx);
let depth=0,i=arrStart,arrEnd=-1;
for(;i<text.length;i++){const ch=text[i]; if(ch==='[') depth++; else if(ch===']'){depth--; if(depth===0){arrEnd=i;break;}}}
const arrText = text.slice(arrStart,arrEnd+1);
const sections = JSON.parse(arrText);
console.log('sections:', sections.length);
for(let s=0;s<Math.min(3,sections.length);s++){
  const sec = sections[s];
  console.log('section', s, sec.title, 'questions', sec.questions.length);
  for(let q=0;q<Math.min(5, sec.questions.length); q++){
    console.log('q', s, q, JSON.stringify(sec.questions[q].q));
  }
}
