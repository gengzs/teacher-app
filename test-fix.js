// 验证裸换行的修复
function tcbSqUnicodeFixed(str) {
  const raw = String(str ?? '');
  const escaped = raw
    .replace(/\\\\/g, '\\u005c')
    .replace(/\n/g, '\\u005cn')
    .replace(/\r/g, '\\u005cr');
  const inner = JSON.stringify(escaped).slice(1, -1);
  return "'" + inner + "'";
}

// 裸换行
const content = '\n\n你好\n\n'; // source: \\n\\n你好\\n\\n = 6 actual newlines
console.log('=== 裸换行测试 ===');
console.log('input len:', content.length, 'bytes:', Buffer.from(content).toString('hex'));
const result = tcbSqUnicodeFixed(content);
console.log('result:', result);
console.log('result hex:', Buffer.from(result).toString('hex'));

// 完整 query 并模拟 axios + TCB JSON.parse
const query = "db.collection('notes').doc('id').update({data: {content: " + result + "}})";
const payload = { query: query };
const jsonBody = JSON.stringify(payload);
const parsedQuery = JSON.parse(jsonBody).query;
console.log('query bytes after parse:', Buffer.from(parsedQuery).toString('hex'));

// 检查 query 里是否有裸换行（0x0a）
const hasNewline = Buffer.from(parsedQuery).includes(0x0a);
console.log('has raw 0x0a in query:', hasNewline);

// 提取 content 字段值
const m = parsedQuery.match(/content: (.+?)[\s,}]/);
if (m) {
  console.log('content value:', JSON.stringify(m[1]));
  console.log('content bytes:', Buffer.from(m[1]).toString('hex'));
}
