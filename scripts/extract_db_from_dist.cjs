const fs = require('fs');
const path = require('path');
const distPath = path.resolve(__dirname, '..', 'dist', 'assets', 'index-DPslWbLe.js');
const outPath = path.resolve(__dirname, '..', 'src', 'data', 'database.js');

const content = fs.readFileSync(distPath, 'utf8');
const idx = content.indexOf('Au=');
if (idx === -1) {
  console.error('Au= not found');
  process.exit(1);
}
const start = content.indexOf('{', idx);
let i = start;
let depth = 0;
let end = -1;
for (; i < content.length; i++) {
  const ch = content[i];
  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth === 0) { end = i; break; }
  }
}
if (end === -1) { console.error('matching brace not found'); process.exit(1); }
const objStr = content.slice(start, end + 1);
// Convert backtick strings to normal quoted strings for safe eval
const safeStr = objStr.replace(/`([^`]*)`/g, (m, g1) => JSON.stringify(g1));
// Evaluate
let obj;
try {
  obj = Function('return ' + safeStr)();
} catch (e) {
  console.error('eval failed', e);
  process.exit(1);
}
const dbCode = `export const moods = [
  { id: 'trending', label: 'Trending', emoji: '📈', theme: 'trending' },
  { id: 'party', label: 'Party', emoji: '🎉', theme: 'energetic' },
  { id: 'romantic', label: 'Romantic', emoji: '❤️', theme: 'romantic' },
  { id: 'sad', label: 'Sad', emoji: '💔', theme: 'sad' },
  { id: 'chill', label: 'Chill & Relax', emoji: '☕', theme: 'sad' },
  { id: 'workout', label: 'Workout', emoji: '💪', theme: 'energetic' },
  { id: 'devotional', label: 'Devotional', emoji: '🙏', theme: 'romantic' },
  { id: 'focus', label: 'Focus & Study', emoji: '📚', theme: 'trending' },
];

const songData = ${JSON.stringify(obj, null, 2)};

export const getSongs = (moodId) => {
  return songData[moodId] || songData['trending'];
};
`;
fs.writeFileSync(outPath, dbCode, 'utf8');
console.log('Restored', outPath);
