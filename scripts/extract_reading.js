import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, '..', 'public', 'toefl_reading_app.html');
const outPath = path.join(__dirname, '..', 'src', 'data', 'longmanReading.ts');

const text = fs.readFileSync(htmlPath, 'utf8');
const start = text.indexOf('const DATA = {');
if (start === -1) {
  console.error('DATA start not found');
  process.exit(1);
}

// find matching closing brace for the DATA object
let i = start + 'const DATA = {'.length;
let depth = 1;
while (i < text.length && depth > 0) {
  const ch = text[i];
  if (ch === '{') depth++;
  else if (ch === '}') depth--;
  i++;
}
if (depth !== 0) {
  console.error('Failed to find matching brace for DATA');
  process.exit(1);
}
const dataCode = text.slice(start, i); // includes 'const DATA = { ... }'

// evaluate the DATA object safely
const sandbox = {};
vm.createContext(sandbox);
try {
  vm.runInContext(dataCode + '\nthis._DATA = DATA;', sandbox);
} catch (err) {
  console.error('Eval error:', err);
  process.exit(1);
}
const DATA = sandbox._DATA;

// helper: convert passages to Question[]
const out = [];
const KEYS = ['pretest','ex1','ex2','ex3','ex4','ex5','ex6','ex7','ex8','ex9','ex10','ex11','ex12','ex13','ex14'];
for (const key of KEYS) {
  const group = DATA[key];
  if (!group || !Array.isArray(group.passages)) continue;
  const partLabel = group.label ?? `Reading — ${key}`;
  for (const passage of group.passages) {
    const passageText = passage.text ?? passage.title ?? '';
    const qs = passage.qs ?? [];
    for (const q of qs) {
      const opts = q.opts ?? q.a ?? [];
      const correct = typeof q.ans === 'number' ? q.ans : Number(q.ans ?? 0);
      out.push({
        q: q.q,
        a: opts,
        correct,
        audio: null,
        part: partLabel,
        passage: passageText,
      });
    }
  }
}

const header = `import type { Question } from '@/data/questions';\n\n`;
const body = `export const LONGMAN_READING_QUESTIONS: Question[] = ${JSON.stringify(out, null, 2)};\n\nexport default LONGMAN_READING_QUESTIONS;\n`;
fs.writeFileSync(outPath, header + body, 'utf8');
console.log('Wrote', outPath, 'with', out.length, 'questions');
