// 完整端到端验证 tcbSqUnicode 修复
function tcbSqUnicode(str) {
  const raw = String(str ?? '');
  const escaped = raw.replace(/\\\\/g, '\\u005c');
  const inner = JSON.stringify(escaped).slice(1, -1);
  for (let i = 0; i < inner.length; i++) {
    const c = inner.charCodeAt(i);
    if (c === 10 || c === 13) {
      console.error('[BUG] inner has control char at %d: 0x' + c.toString(16), i);
    }
  }
  return "'" + inner + "'";
}

function tcbNoteDataLiteral(obj) {
  const linksJson = JSON.stringify(obj.links || []);
  let s = '{';
  s += 'title: ' + tcbSqUnicode(obj.title);
  s += ', content: ' + tcbSqUnicode(obj.content ?? '');
  s += ', tags: ' + JSON.stringify(obj.tags || []);
  s += ', links: ' + linksJson;
  s += '}';
  return s;
}

// 测试用例
const tests = [
  { title: '234', content: '\n\n你好\n\n' },
  { title: 'test', content: 'plain text' },
  { title: 'backslash', content: 'has\\backslash' },
  { title: 'double', content: '\\\\' },
  { title: 'empty', content: '' },
];

let allOk = true;
for (const t of tests) {
  const dataLiteral = tcbNoteDataLiteral(t);
  const query = "db.collection('notes').doc('id').update({data: " + dataLiteral + "})";

  // 模拟 axios JSON 序列化
  const payload = { env: 'cloud1-xxx', query: query };
  const jsonBody = JSON.stringify(payload);

  // 模拟 TCB JSON.parse（服务端收到 JSON）
  const serverParsed = JSON.parse(jsonBody);
  const serverQuery = serverParsed.query;

  // 从 serverQuery 中提取 content 字段值
  const m = serverQuery.match(/content: '([^']*)'/);
  const contentValue = m ? m[1] : '(no match)';
  const contentHex = Buffer.from(contentValue).toString('hex');

  // 检查是否包含裸换行
  const hasRawNewline = /(^|[^5c])0a([5c]|$)/.test('x' + contentHex.replace(/5c5c/g, 'XXXX')) || /(^|[^5c])0d/.test('x' + contentHex);
  const status = hasRawNewline ? '⚠️ HAS NEWLINE' : '✓';

  if (hasRawNewline) allOk = false;
  console.log(status, 'input:', JSON.stringify(t.content));
  console.log('  content value:', JSON.stringify(contentValue));
  console.log('  content hex:', contentHex);
  console.log('');
}

console.log(allOk ? '✅ ALL PASS' : '❌ SOME FAILED');
