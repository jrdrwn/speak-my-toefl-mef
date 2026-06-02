const ts = require('typescript');
const fs = require('fs');

const readingFile = 'd:\\other\\toapk\\speak-my-toefl-mef\\src\\data\\longmanReading.ts';
const jsReading = ts.transpileModule(fs.readFileSync(readingFile, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
}).outputText;

const tempFile = 'd:\\other\\toapk\\speak-my-toefl-mef\\temp_verify_reading_parts.cjs';
fs.writeFileSync(tempFile, jsReading, 'utf-8');

try {
  const LONGMAN_READING_QUESTIONS = require(tempFile).default;
  const parts = {};
  LONGMAN_READING_QUESTIONS.forEach((q, idx) => {
    parts[q.part] = (parts[q.part] || 0) + 1;
  });
  console.log('--- READING PARTS AND QUESTION COUNTS ---');
  Object.entries(parts).forEach(([part, count]) => {
    console.log(`- "${part}": ${count} questions`);
  });
} catch (err) {
  console.error('Failed to load:', err);
} finally {
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
}
