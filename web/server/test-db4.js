// 调试 students 和 words 集合
const axios = require('axios');

const APPID = 'wx6e674f131e6a1b4d';
const SECRET = 'b09e294177871c7734fafd30de44456b';
const ENV_ID = 'cloud1-7gqabu9mb7db2ae9';

async function main() {
  const tokenRes = await axios.get(
    'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + APPID + '&secret=' + SECRET
  );
  const token = tokenRes.data.access_token;

  // 查询 students 集合（不加任何过滤）
  const res = await axios.post(
    'https://api.weixin.qq.com/tcb/databasequery?access_token=' + token,
    { env: ENV_ID, query: "db.collection('students').limit(3).get()" },
    { timeout: 15000 }
  );

  if (res.data.errcode !== 0) {
    console.log('students 查询失败:', res.data.errmsg);
    return;
  }

  const raw = res.data.data || [];
  console.log('students 共', raw.length, '条');
  for (const item of raw) {
    const obj = JSON.parse(item);
    console.log('  字段:', Object.keys(obj).join(', '));
    console.log('  数据:', JSON.stringify(obj).substring(0, 200));
  }
}

main().catch(console.error);
