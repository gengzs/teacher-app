// 调试 students 查询
const axios = require('axios');

const APPID = 'wx6e674f131e6a1b4d';
const SECRET = 'b09e294177871c7734fafd30de44456b';
const ENV_ID = 'cloud1-7gqabu9mb7db2ae9';

async function main() {
  const tokenRes = await axios.get(
    'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + APPID + '&secret=' + SECRET
  );
  const token = tokenRes.data.access_token;

  // 不加 status 过滤
  const res1 = await axios.post(
    'https://api.weixin.qq.com/tcb/databasequery?access_token=' + token,
    { env: ENV_ID, query: "db.collection('students').limit(3).get()" },
    { timeout: 15000 }
  );
  console.log('[无过滤] errcode:', res1.data.errcode, 'data:', JSON.stringify(res1.data.data || []));

  // 加 status:active
  const res2 = await axios.post(
    'https://api.weixin.qq.com/tcb/databasequery?access_token=' + token,
    { env: ENV_ID, query: "db.collection('students').where({status:'active'}).limit(3).get()" },
    { timeout: 15000 }
  );
  console.log('[status:active] errcode:', res2.data.errcode, 'data:', JSON.stringify(res2.data.data || []));
}

main().catch(console.error);
