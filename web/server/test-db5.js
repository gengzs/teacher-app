// 调试 students 集合结构和 classId
const axios = require('axios');

const APPID = 'wx6e674f131e6a1b4d';
const SECRET = 'b09e294177871c7734fafd30de44456b';
const ENV_ID = 'cloud1-7gqabu9mb7db2ae9';

async function main() {
  const tokenRes = await axios.get(
    'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + APPID + '&secret=' + SECRET
  );
  const token = tokenRes.data.access_token;

  // 查询全部 students
  const res = await axios.post(
    'https://api.weixin.qq.com/tcb/databasequery?access_token=' + token,
    { env: ENV_ID, query: "db.collection('students').limit(20).get()" },
    { timeout: 15000 }
  );

  if (res.data.errcode !== 0) {
    console.log('students 查询失败:', res.data.errmsg);
    return;
  }

  const raw = res.data.data || [];
  console.log('students 共', raw.length, '条\n');
  for (const item of raw) {
    const obj = JSON.parse(item);
    console.log('name:', obj.name, '| grade:', obj.grade, '| classId:', obj.classId, '| libraryName:', obj.libraryName);
  }
}

main().catch(console.error);
