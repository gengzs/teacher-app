// 快速测试脚本：直接调用微信 invokecloudfunction
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
  console.log('Token OK:', token.substring(0, 10) + '...');

  // 2. 测试 wordset（不是保留字）
  console.log('\n--- 测试 wordset ---');
  const wordsetRes = await axios.post(
    `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${token}`,
    { env: ENV_ID, name: 'wordset', req_data: JSON.stringify({ action: 'list' }) },
    { timeout: 15000 }
  );
  console.log('wordset resp_data:', wordsetRes.data.resp_data);

  // 3. 测试 parseWordExcel（不是保留字）
  console.log('\n--- 测试 parseWordExcel ---');
  try {
    const parseRes = await axios.post(
      `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${token}`,
      { env: ENV_ID, name: 'parseWordExcel', req_data: JSON.stringify({ action: 'test' }) },
      { timeout: 15000 }
    );
    console.log('parseWordExcel resp_data:', parseRes.data.resp_data);
  } catch(e) {
    console.log('parseWordExcel error:', e.response?.data || e.message);
  }

  // 4. 测试 class（JS 保留字）
  console.log('\n--- 测试 class ---');
  const classRes = await axios.post(
    `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${token}`,
    { env: ENV_ID, name: 'class', req_data: JSON.stringify({ action: 'list' }) },
    { timeout: 15000 }
  );
  console.log('class errcode:', classRes.data.errcode, 'errmsg:', classRes.data.errmsg);
  console.log('class resp_data:', classRes.data.resp_data);
}

main().catch(console.error);
