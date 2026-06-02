const ts = require('typescript');
const fs = require('fs');

const readingFile = 'd:\\other\\toapk\\speak-my-toefl-mef\\src\\data\\longmanReading.ts';
const jsReading = ts.transpileModule(fs.readFileSync(readingFile, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
}).outputText;

const tempFile = 'd:\\other\\toapk\\speak-my-toefl-mef\\temp_verify_reading.cjs';
fs.writeFileSync(tempFile, jsReading, 'utf-8');

try {
  const LONGMAN_READING_QUESTIONS = require(tempFile).default;
  console.log(`Successfully loaded LONGMAN_READING_QUESTIONS. Count: ${LONGMAN_READING_QUESTIONS.length}`);
  if (LONGMAN_READING_QUESTIONS.length > 0) {
    console.log('First question:', LONGMAN_READING_QUESTIONS[0]);
    console.log('Last question:', LONGMAN_READING_QUESTIONS[LONGMAN_READING_QUESTIONS.length - 1]);
  }
} catch (err) {
  console.error('Failed to load:', err);
} finally {
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
}
