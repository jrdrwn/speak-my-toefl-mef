import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.join(__dirname, '..', 'public', 'toefl_listening_app.html');
const outPath = path.join(__dirname, '..', 'src', 'data', 'longmanListening.ts');
const existingPath = outPath;

const text = fs.readFileSync(htmlPath, 'utf8');
const start = text.indexOf('const DATA = {');
if (start === -1) { console.error('DATA start not found'); process.exit(1); }
let i = start + 'const DATA = {'.length;
let depth = 1;
while (i < text.length && depth > 0) {
  const ch = text[i];
  if (ch === '{') depth++; else if (ch === '}') depth--;
  i++;
}
const dataCode = text.slice(start, i);
const sandbox = {};
vm.createContext(sandbox);
try {
  vm.runInContext(dataCode + '\nthis._DATA = DATA;\nthis._KEYS = typeof KEYS!=="undefined"?KEYS:null;', sandbox);
} catch (err) { console.error('Eval error:', err); process.exit(1); }
const DATA = sandbox._DATA;
const KEYS = sandbox._KEYS || Object.keys(DATA);

// Try load existing to preserve audio filenames
let existingSectionsMap = new Map();
if (fs.existsSync(existingPath)){
  const existingText = fs.readFileSync(existingPath,'utf8');
  const marker = 'export const LONGMAN_LISTENING_SECTIONS';
  const idx = existingText.indexOf(marker);
  if(idx!==-1){
    const arrStart = existingText.indexOf('[', idx);
    let depth2=0,j=arrStart,arrEnd=-1;
    for(;j<existingText.length;j++){const ch=existingText[j]; if(ch==='[') depth2++; else if(ch===']'){depth2--; if(depth2===0){arrEnd=j;break;}}}
    if(arrEnd!==-1){
      const arrText = existingText.slice(arrStart, arrEnd+1);
      try{ const secs = JSON.parse(arrText); secs.forEach(s=>existingSectionsMap.set(s.title, s)); }catch(e){/* ignore */}
    }
  }
}

const sections = [];
let globalQuestionIndex = 0;
for(const key of KEYS){
  const sec = DATA[key];
  if(!sec || !Array.isArray(sec.qs)) continue;
  const title = sec.label || key;
  const existing = existingSectionsMap.get(title);
  const questions = [];
  for(const q of sec.qs){
    // build question text from d if present
    let qtext = '';
    if(Array.isArray(q.d) && q.d.length>0){
      const narrator = q.d.find(dd=>dd.q) || q.d[0];
      if(narrator){ qtext = narrator.l || ''; }
    }
    // fallback empty
    if(!qtext) qtext = '';
    const opts = q.opts || [];
    const correct = typeof q.ans === 'number' ? q.ans : Number(q.ans || 0);
    // try to reuse audio from existing by matching index in existing section
    let audio = null;
    if(existing && Array.isArray(existing.questions)){
      const matchIdx = existing.questions.findIndex((eq)=>eq.a && JSON.stringify(eq.a)===JSON.stringify(opts));
      if(matchIdx!==-1){ audio = existing.questions[matchIdx].audio ?? null; }
    }
    const instruction = sec.note || q.exp || undefined;
    questions.push({ q: qtext, a: opts, correct, audio, part: title, instruction, audioSeekMinute: 0 });
  }
  sections.push({ title, audioFile: existing?.audioFile || '', questionOffset: 0, audioOffset: 0, questions });
}

// compute offsets sequentially
let qOffset = 0;
for(const s of sections){ s.questionOffset = qOffset; s.audioOffset = qOffset; qOffset += s.questions.length; }

// write TS module
const header = `import type { Question } from '@/data/questions';\n\nexport type LongmanListeningSection = {\n  title: string;\n  audioFile: string;\n  questionOffset: number;\n  audioOffset: number;\n  questions: Question[];\n};\n\n`;
const body = `export const LONGMAN_LISTENING_SECTIONS: LongmanListeningSection[] = ${JSON.stringify(sections, null, 2)};\n\nexport const LONGMAN_LISTENING_QUESTIONS: Question[] = LONGMAN_LISTENING_SECTIONS.flatMap((section) => section.questions);\n\nexport default LONGMAN_LISTENING_SECTIONS;\n`;
fs.writeFileSync(outPath, header + body, 'utf8');
console.log('Wrote', outPath, 'with', sections.length, 'sections and', qOffset, 'questions');
