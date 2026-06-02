const ts = require('typescript');
const fs = require('fs');

const listeningFile = 'd:\\other\\toapk\\speak-my-toefl-mef\\src\\data\\longmanListening.ts';
const readingFile = 'd:\\other\\toapk\\speak-my-toefl-mef\\src\\data\\longmanReading.ts';
const questionsFile = 'd:\\other\\toapk\\speak-my-toefl-mef\\src\\data\\questions.ts';

const jsListening = ts.transpileModule(fs.readFileSync(listeningFile, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
}).outputText;

const jsReading = ts.transpileModule(fs.readFileSync(readingFile, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
}).outputText;

const jsQuestions = ts.transpileModule(fs.readFileSync(questionsFile, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
}).outputText;

const tL = 'd:\\other\\toapk\\speak-my-toefl-mef\\t_l.cjs';
const tR = 'd:\\other\\toapk\\speak-my-toefl-mef\\t_r.cjs';
const tQ = 'd:\\other\\toapk\\speak-my-toefl-mef\\t_q.cjs';

fs.writeFileSync(tL, jsListening, 'utf-8');
fs.writeFileSync(tR, jsReading, 'utf-8');
fs.writeFileSync(tQ, jsQuestions, 'utf-8');

try {
  const { LONGMAN_LISTENING_QUESTIONS, LONGMAN_LISTENING_SECTIONS } = require(tL);
  const LONGMAN_READING_QUESTIONS = require(tR).default;
  const { QUESTIONS } = require(tQ);

  console.log('--- QUESTIONS COUNTS ---');
  console.log('LONGMAN_LISTENING_QUESTIONS:', LONGMAN_LISTENING_QUESTIONS.length);
  console.log('QUESTIONS.structure:', QUESTIONS.structure.length);
  console.log('QUESTIONS.reading:', QUESTIONS.reading.length);
  console.log('LONGMAN_READING_QUESTIONS:', LONGMAN_READING_QUESTIONS.length);

  // Let's analyze how buildExamFlow builds stages
  // Stages for listening:
  let totalListeningInStages = 0;
  LONGMAN_LISTENING_SECTIONS.forEach((sec, idx) => {
    totalListeningInStages += sec.questions.length;
  });
  console.log('\nListening questions in stages:', totalListeningInStages);

  // Stages for structure:
  // 4 sections of 10 questions = 40 questions
  console.log('Structure questions in stages (4 * 10): 40');
  
  // Stages for reading:
  // 5 sections of 10 questions = 50 questions
  console.log('Reading questions in stages (5 * 10): 50');

} catch (err) {
  console.error('Error:', err);
} finally {
  fs.unlinkSync(tL);
  fs.unlinkSync(tR);
  fs.unlinkSync(tQ);
}
