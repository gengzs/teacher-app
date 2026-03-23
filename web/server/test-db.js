// 直接查数据库测试
const axios = require('axios');

const APPID = 'wx6e674f131e6a1b4d';
const SECRET = 'b09e294177871c7734fafd30de44456b';
const ENV_ID = 'cloud1-7gqabu9mb7db2ae9';

async function main() {
  // 1. 获取 token
  const tokenRes = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`
  );
  const token = tokenRes.data.access_token;
  console.log('Token OK');

  const collections = ['classes', 'students', 'wordSets', 'homeworks'];

  for (const coll of collections) {
    try {
      const res = await axios.post(
        `https://api.weixin.qq.com/tcb/databasequery?access_token=${token}`,
        { env: ENV_ID, query: `db.collection('${coll}').limit(5).get()` },
        { timeout: 15000 }
      );
      const data = res.data;
      if (data.errcode === 0) {
        let items = [];
        try {
          items = JSON.parse(data.data || '[]');
          if (!Array.isArray(items)) items = [items];
        } catch (e) {
          console.log(`  解析 data 失败: ${e.message}, raw: ${JSON.stringify(data.data)?.substring(0, 200)}`);
        }
        const total = data.pager?.Total || items.length;
        console.log(`\n[${coll}] 共 ${total} 条，显示前 ${items.length} 条:`);
        items.forEach((item, i) => {
          const obj = typeof item === 'string' ? JSON.parse(item) : item;
          console.log(`  ${i + 1}. ${JSON.stringify(obj).substring(0, 120)}`);
        });
      } else {
        console.log(`\n[${coll}] errcode=${data.errcode} errmsg=${data.errmsg}`);
      }
    } catch (e) {
      console.log(`\n[${coll}] 请求失败:`, e.message);
    }
  }
}

main().catch(console.error);
