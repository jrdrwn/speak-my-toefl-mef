import fs from 'fs';
import path from 'path';
const filePath = path.join('src','data','longmanListening.ts');
let text = fs.readFileSync(filePath,'utf8');
const before = '"q": ""';
const after = '"q": "(Transkrip tidak tersedia)"';
const count = (text.match(new RegExp(before, 'g')) || []).length;
if(count===0){ console.log('No empty q found'); process.exit(0); }
text = text.split(before).join(after);
fs.writeFileSync(filePath, text, 'utf8');
console.log('Replaced', count, 'empty q entries.');
