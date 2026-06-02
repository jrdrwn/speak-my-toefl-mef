// extract_structure.cjs
// Extracts questions from toefl_structure_writting.html and outputs longmanStructure.ts

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '../public/toefl_structure_writting.html');
const outPath = path.join(__dirname, '../src/data/longmanStructure.ts');

const html = fs.readFileSync(htmlPath, 'utf-8');

// Extract the full script block between <script> and </script>
const scriptMatch = html.match(/<script>([\s\S]+?)<\/script>/);
if (!scriptMatch) {
  console.error('Could not find script block!');
  process.exit(1);
}

const scriptContent = scriptMatch[1];

// Extract just the DATA declaration
const dataStart = scriptContent.indexOf('const DATA = {');
const dataEnd = scriptContent.indexOf('\n    };\n\n    // ─── KEYS');
if (dataStart === -1 || dataEnd === -1) {
  console.error('Could not find DATA boundaries!');
  process.exit(1);
}

const dataCode = scriptContent.substring(dataStart, dataEnd + '\n    };'.length);

// Use vm to safely evaluate DATA
let DATA;
try {
  const context = { DATA: null };
  vm.createContext(context);
  vm.runInContext(dataCode + '\nDATA = DATA;', context);
  DATA = context.DATA;
} catch (e) {
  console.error('Failed to eval DATA:', e.message);
  // Try with Function approach
  try {
    const fn = new Function(`${dataCode}; return DATA;`);
    DATA = fn();
  } catch (e2) {
    console.error('Function approach also failed:', e2.message);
    process.exit(1);
  }
}

if (!DATA) {
  console.error('DATA is null/undefined after eval!');
  process.exit(1);
}

console.log('DATA keys found:', Object.keys(DATA).join(', '));

const questions = [];

// Convert struct questions (MCQ with blank)
function convertStruct(secKey, secData) {
  const partLabel = secData.label;
  for (const q of secData.qs) {
    questions.push({
      q: q.s,
      a: q.opts,
      correct: q.ans,
      audio: null,
      part: partLabel,
      instruction: secData.note,
      explanation: q.exp
    });
  }
}

// Convert written expression questions (error identification)
function convertWritten(secKey, secData) {
  const partLabel = secData.label;
  for (const q of secData.qs) {
    // Build sentence from q.s by stripping pipe markers
    const sentenceText = q.s.replace(/\|[A-D]\|/g, '');
    
    // Build options from parts array (non-empty)
    const parts = q.parts || [];
    const opts = [];
    const letters = ['(A)', '(B)', '(C)', '(D)'];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] && parts[i].trim()) {
        opts.push(`${letters[i]} ${parts[i]}`);
      }
    }
    
    questions.push({
      q: `[Written Expression] ${sentenceText.trim()}`,
      a: opts,
      correct: q.ans,
      audio: null,
      part: partLabel,
      instruction: secData.note,
      explanation: q.exp,
      fix: q.fix
    });
  }
}

// Convert C/I (Correct/Incorrect) questions
function convertCI(secKey, secData) {
  const partLabel = secData.label;
  for (const q of secData.qs) {
    questions.push({
      q: q.s,
      a: ['Correct (C)', 'Incorrect (I)'],
      correct: q.ans === 'C' ? 0 : 1,
      audio: null,
      part: partLabel,
      instruction: secData.note,
      explanation: q.exp,
      tip: secData.tip
    });
  }
}

// Process all sections in order
const KEYS_STRUCT = ['pretest_struct', 'ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6', 'ex7', 'ex8', 'ex9', 'ex10'];
const KEYS_WE = ['pretest_we', 'ex11', 'ex12', 'ex13', 'ex14', 'ex15', 'ex16', 'ex17', 'ex18', 'ex19', 'ex20', 'ex21', 'ex22', 'ex23', 'ex24', 'ex25'];

for (const key of KEYS_STRUCT) {
  const sec = DATA[key];
  if (!sec) { console.warn('Missing section:', key); continue; }
  if (sec.type === 'struct') convertStruct(key, sec);
  else if (sec.type === 'ci') convertCI(key, sec);
}

for (const key of KEYS_WE) {
  const sec = DATA[key];
  if (!sec) { console.warn('Missing section:', key); continue; }
  if (sec.type === 'written') convertWritten(key, sec);
  else if (sec.type === 'ci') convertCI(key, sec);
}

console.log(`Total questions extracted: ${questions.length}`);

// Generate TypeScript file
const tsLines = [
  `import type { Question } from '@/data/questions';`,
  ``,
  `export interface StructureQuestion extends Question {`,
  `  explanation?: string;`,
  `  fix?: string;`,
  `  tip?: string;`,
  `}`,
  ``,
  `export const LONGMAN_STRUCTURE_QUESTIONS: StructureQuestion[] = [`
];

for (const q of questions) {
  const obj = {};
  if (q.q !== undefined) obj.q = q.q;
  if (q.a !== undefined) obj.a = q.a;
  if (q.correct !== undefined) obj.correct = q.correct;
  obj.audio = null;
  if (q.part !== undefined) obj.part = q.part;
  if (q.instruction) obj.instruction = q.instruction;
  if (q.explanation) obj.explanation = q.explanation;
  if (q.fix) obj.fix = q.fix;
  if (q.tip) obj.tip = q.tip;

  tsLines.push(`  ${JSON.stringify(obj)},`);
}

tsLines.push(`];`);
tsLines.push(``);

fs.writeFileSync(outPath, tsLines.join('\n'), 'utf-8');
console.log(`Written to: ${outPath}`);
