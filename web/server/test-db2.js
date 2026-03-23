// 调试数据库返回格式
const axios = require('axios');

const APPID = 'wx6e674f131e6a1b4d';
const SECRET = 'b09e294177871c7734fafd30de44456b';
const ENV_ID = 'cloud1-7gqabu9mb7db2ae9';

async function main() {
  const tokenRes = await axios.get(
    'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + APPID + '&secret=' + SECRET
  );
  const token = tokenRes.data.access_token;

  const res = await axios.post(
    'https://api.weixin.qq.com/tcb/databasequery?access_token=' + token,
    { env: ENV_ID, query: "db.collection('classes').where({status:'active'}).get()" },
    { timeout: 15000 }
  );

  console.log('Full response:', JSON.stringify(res.data, null, 2));
  console.log('\nres.data.data type:', typeof res.data.data);
  console.log('res.data.data:', res.data.data);
  console.log('Is array?', Array.isArray(res.data.data));
  if (typeof res.data.data === 'string') {
    console.log('Length:', res.data.data.length);
    console.log('Contains newline?', res.data.data.includes('\n'));
    console.log('First 500 chars:', res.data.data.substring(0, 500));
  }
}

main().catch(console.error);
