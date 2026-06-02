import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, '..', 'public', 'toefl_listening_app.html');
const outPath = path.join(__dirname, '..', 'src', 'data', 'longmanListeningPretest.ts');

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
if (depth !== 0) { console.error('Failed to find matching brace for DATA'); process.exit(1); }
const dataCode = text.slice(start, i);
const sandbox = {};
vm.createContext(sandbox);
try {
  vm.runInContext(dataCode + '\nthis._DATA = DATA;', sandbox);
} catch (err) {
  console.error('Eval error:', err); process.exit(1); }
const DATA = sandbox._DATA;

const part = DATA['part_a_test'];
if (!part || !Array.isArray(part.qs)) { console.error('part_a_test not found or no qs'); process.exit(1); }

// Convert qs to Question[] shape
const outQs = part.qs.map((q, idx) => {
  const opts = q.opts ?? [];
  const correct = typeof q.ans === 'number' ? q.ans : Number(q.ans ?? 0);
  // For audio-based questions, set audio to a placeholder file name
  return {
    q: q.q ?? q.d?.map(dd=>dd.l).join(' ') ?? `Question ${idx+1}`,
    a: opts,
    correct,
    audio: 'part_a_test.m4a',
    part: part.label ?? 'Part A — TOEFL Test',
    instruction: part.note ?? undefined,
    audioSeekMinute: 0,
  };
});

const header = `import type { Question } from '@/data/questions';\n\n`;
const body = `export const LONGMAN_LISTENING_PRETEST_SECTION = {\n  title: 'TOEFL Part A — 30 Questions (Pretest)',\n  audioFile: 'part_a_test.m4a',\n  questionOffset: 0,\n  audioOffset: 0,\n  questions: ${JSON.stringify(outQs, null, 2)}\n};\n\nexport const LONGMAN_LISTENING_PRETEST_QUESTIONS: Question[] = LONGMAN_LISTENING_PRETEST_SECTION.questions;\n\nexport default LONGMAN_LISTENING_PRETEST_SECTION;\n`;
fs.writeFileSync(outPath, header + body, 'utf8');
console.log('Wrote', outPath, 'with', outQs.length, 'questions');
