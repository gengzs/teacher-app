// Test: how to replace backslash with \u005c in JS
const s = 'a\\b'; // source: a\b = a + \ + b
console.log('s:', JSON.stringify(s), 'len:', s.length);

// Regex /\\\\/g in source = matches single \ character
// Replacement '\\u005c' in source = 6-char string: \u005c
const r1 = s.replace(/\\\\/g, '\\u005c');
console.log('r1:', JSON.stringify(r1), 'len:', r1.length);
console.log('r1 chars:', [...r1].map(c => c.charCodeAt(0).toString(16)));

// Verify JSON.stringify outputs \\u005c
const final = JSON.stringify(r1);
console.log('final JSON:', final);
console.log('final JSON bytes:', Buffer.from(final).toString('hex'));

// After JSON.parse on the other side
const parsed = JSON.parse(final);
console.log('parsed:', JSON.stringify(parsed), 'len:', parsed.length);
console.log('parsed bytes:', Buffer.from(parsed).toString('hex'));

// Full end-to-end: query string with content
const content = '\n\n你好\n\n'; // actual newlines
const wrapped = "'" + JSON.stringify(r1.replace(/\\\\/g, '\\u005c')).slice(1,-1) + "'";
// no wait, that's for a different test. Let me just test the function:
function tcbSqUnicodeFixed(str) {
  const raw = String(str ?? '');
  const escaped = raw.replace(/\\\\/g, '\\u005c');
  const inner = JSON.stringify(escaped).slice(1, -1);
  return "'" + inner + "'";
}

const result = tcbSqUnicodeFixed(content);
console.log('\ntcbSqUnicodeFixed result:', result);
const query = "db.collection('notes').doc('id').update({data: {content: " + result + "}})";
console.log('query:', query);

// Simulate axios + TCB JSON.parse
const payload = { query: query };
const jsonBody = JSON.stringify(payload);
const parsedQuery = JSON.parse(jsonBody).query;
console.log('after parse:', parsedQuery);
console.log('query bytes:', Buffer.from(parsedQuery).toString('hex'));
