// 检查 join_requests 集合
const axios = require('axios');

const APPID = 'wx6e674f131e6a1b4d';
const SECRET = 'b09e294177871c7734fafd30de44456b';
const ENV_ID = 'cloud1-7gqabu9mb7db2ae9';

async function main() {
  const tokenRes = await axios.get(
    'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + APPID + '&secret=' + SECRET
  );
  const token = tokenRes.data.access_token;

  const collections = ['join_requests'];

  for (const coll of collections) {
    const res = await axios.post(
      'https://api.weixin.qq.com/tcb/databasequery?access_token=' + token,
      { env: ENV_ID, query: "db.collection('" + coll + "').limit(10).get()" },
      { timeout: 15000 }
    );

    if (res.data.errcode !== 0) {
      console.log('[' + coll + '] errcode=' + res.data.errcode, 'errmsg=' + res.data.errmsg);
      continue;
    }

    const raw = res.data.data || [];
    console.log('[' + coll + '] 共 ' + raw.length + ' 条:\n');
    for (const item of raw) {
      const obj = JSON.parse(item);
      console.log('  ', JSON.stringify(obj).substring(0, 200));
    }
    console.log('');
  }
}

main().catch(console.error);
