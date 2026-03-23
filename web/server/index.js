/**
 * Teacher App Web Server
 * 微信云开发 HTTP API 代理服务
 * 策略：优先直连数据库（云函数 HTTP API 对 JS 保留字函数名不兼容）
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');

// 微信云开发配置
const WECHAT_APPID = process.env.WECHAT_APPID;
const WECHAT_ENV_ID = process.env.WECHAT_ENV_ID || 'cloud1-7gqabu9mb7db2ae9';
const WECHAT_SECRET = process.env.WECHAT_SECRET;

// 前后端分离部署配置（开发环境：前端 dev server 代理；生产环境：自己托管静态文件）
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
const IS_PROD = NODE_ENV === 'production';

const app = express();
const PORT = Number(process.env.PORT) || 3010;

// 生产环境：托管前端静态文件 + 解决 SPA 路由（所有路径都返回 index.html）
if (IS_PROD) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// API 基础地址
const TCB_API_BASE = 'https://api.weixin.qq.com/tcb';

// access_token 缓存
let accessTokenCache = { token: null, expiresAt: 0 };

/** 拼接到微信 URL 的 access_token（避免特殊字符被截断） */
function tcbUrl(apiPath, token) {
  return `${TCB_API_BASE}${apiPath}?access_token=${encodeURIComponent(token)}`;
}

/** 微信云开发 HTTP 返回：errcode 为 0 或 '0' 表示成功；仅用 truthy 判断会把字符串 "0" 误判为失败 */
function tcbFailed(resData) {
  if (!resData || resData.errcode == null) return false;
  return Number(resData.errcode) !== 0;
}

/**
 * 单引号字符串字面量，供 query body 使用。
 * 顺序：先转义字面 \\ → \\u005c，再转义换行 → \\u000a、回车 → \\u000d（不可先用 \\u000a 再转 \\，否则会破坏已插入的 \\u）。
 * \\u000a 经 TCB DSL 解析为真正换行；若用 \\u005c+n 则库里会变成字面「\\n」两个字符。
 */
function tcbSqUnicode(str) {
  const raw = String(str ?? '');
  const escaped = raw
    .replace(/\\\\/g, '\\u005c')
    .replace(/\n/g, '\\u000a')
    .replace(/\r/g, '\\u000d');
  const inner = JSON.stringify(escaped).slice(1, -1);
  return "'" + inner + "'";
}

/** 生成笔记 data 对象字面量（无引号键，与微信文档一致）；字符串值用单引号 + \\uXXXX */
function tcbNoteDataLiteral(obj) {
  const tags = (obj.tags || []).map((t) => tcbSqUnicode(String(t))).join(', ');
  const linksJson = JSON.stringify(obj.links || []);
  let s = '{';
  s += 'title: ' + tcbSqUnicode(obj.title);
  s += ', content: ' + tcbSqUnicode(obj.content ?? '');
  s += ', tags: [' + tags + ']';
  s += ', links: ' + linksJson;
  if (obj.createTime != null) s += ', createTime: ' + Number(obj.createTime);
  s += ', updateTime: ' + Number(obj.updateTime);
  s += '}';
  return s;
}

// 中间件
app.use(cors());
app.use(express.json());

// ============================================================
// 微信 API 调用
// ============================================================

async function getAccessToken() {
  if (accessTokenCache.token && Date.now() < accessTokenCache.expiresAt) {
    return accessTokenCache.token;
  }

  if (!WECHAT_APPID || !WECHAT_SECRET) {
    throw Object.assign(new Error('缺少微信配置，请检查 .env 里的 WECHAT_APPID 和 WECHAT_SECRET'), { code: 'NO_CREDENTIALS' });
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(WECHAT_APPID)}&secret=${encodeURIComponent(WECHAT_SECRET)}`;
  const res = await axios.get(url, { timeout: 10000 });

  if (tcbFailed(res.data)) {
    const err = new Error(`微信 access_token 错误: ${res.data.errmsg}`);
    err.code = res.data.errcode;
    throw err;
  }

  if (!res.data.access_token) {
    throw new Error('微信未返回 access_token');
  }

  accessTokenCache.token = res.data.access_token;
  accessTokenCache.expiresAt = Date.now() + (res.data.expires_in - 200) * 1000;
  console.log('[Token] 刷新成功，有效期', res.data.expires_in, '秒');
  return accessTokenCache.token;
}

/**
 * 直连数据库查询（云函数 HTTP API 对 JS 保留字函数名不兼容，故直接查库）
 */
async function dbQuery(queryStr) {
  const token = await getAccessToken();
  const res = await axios.post(
    tcbUrl('/databasequery', token),
    { env: WECHAT_ENV_ID, query: queryStr },
    { timeout: 15000 }
  );

  if (tcbFailed(res.data)) {
    const err = new Error(`数据库查询错误: ${res.data.errmsg}`);
    err.code = res.data.errcode;
    throw err;
  }

  // axios 自动把 JSON 解析了：data 是数组，每项是 JSON 字符串
  const records = (res.data.data || []).map(item => {
    try { return JSON.parse(item); } catch { return null; }
  }).filter(Boolean);

  return records;
}

/**
 * 通过 axios POST JSON body 发送 query。query 字符串由 tcbSqUnicode / tcbNoteDataLiteral
 * 预先转义（四反斜杠 \\\\u），axios JSON 序列化后变为 \\\\u，服务器 JSON.parse 还原为 \\u，微信正确解析。
 * @param {string} apiPath  微信 API 路径
 * @param {string} queryStr  完整查询字符串
 * @returns {Promise<object>} 微信返回的 JSON body
 */
async function dbQueryEncoded(apiPath, queryStr) {
  const token = await getAccessToken();
  const payload = { env: WECHAT_ENV_ID, query: queryStr };
  const res = await axios.post(tcbUrl(apiPath, token), payload, { timeout: 15000 });

  if (tcbFailed(res.data)) {
    const err = new Error(`数据库操作错误[${apiPath}]: ${res.data.errmsg}`);
    err.code = res.data.errcode;
    throw err;
  }
  return res.data;
}

// ============================================================
// API 路由
// ============================================================

/**
 * 健康检查 /api/health
 */
app.get('/api/health', async (req, res) => {
  const info = {
    status: 'ok',
    appid: WECHAT_APPID ? WECHAT_APPID.slice(0, 6) + '***' + WECHAT_APPID.slice(-4) : null,
    envId: WECHAT_ENV_ID,
    hasSecret: !!WECHAT_SECRET,
    port: PORT,
  };

  if (!WECHAT_APPID || !WECHAT_SECRET) {
    info.mode = 'NO_CREDENTIALS';
    return res.json(info);
  }

  try {
    await getAccessToken();
    info.mode = 'REAL';
    info.message = '已连接微信云开发数据库（真实数据）';
  } catch (err) {
    info.mode = 'API_ERROR';
    info.error = err.message;
  }

  res.json(info);
});

/**
 * 教师登录 POST /api/teacher/login
 */
app.post('/api/teacher/login', (req, res) => {
  const password = req.body && req.body.password;
  const correctPassword = process.env.TEACHER_PASSWORD || '123456';

  if (password === correctPassword) {
    res.json({
      success: true,
      token: 'teacher_token_' + Date.now(),
      teacherId: 'web_teacher_001',
      name: '教师用户',
      source: 'local'
    });
  } else {
    res.status(401).json({ success: false, message: '密码错误' });
  }
});

/**
 * 获取统计数据 GET /api/stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    // students 集合无 status 字段，直接查全量
    const [classes, students] = await Promise.all([
      dbQuery(`db.collection('classes').where({status:'active'}).get()`),
      dbQuery(`db.collection('students').limit(1000).get()`),
    ]);

    res.json({
      code: 0,
      source: 'wechat_db',
      data: {
        classCount: classes.length,
        studentCount: students.length,
        pendingHomework: 0,
        completedHomework: 0
      }
    });
  } catch (err) {
    console.error('❌ /api/stats 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

/**
 * 获取班级列表 GET /api/classes
 */
app.get('/api/classes', async (req, res) => {
  try {
    const classes = await dbQuery(
      `db.collection('classes').where({status:'active'}).orderBy('createTime','desc').get()`
    );
    res.json({ code: 0, source: 'wechat_db', data: classes });
  } catch (err) {
    console.error('❌ /api/classes 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

/**
 * 获取班级详情 GET /api/classes/:id
 */
app.get('/api/classes/:id', async (req, res) => {
  try {
    const classes = await dbQuery(
      `db.collection('classes').doc('${req.params.id}').get()`
    );
    const cls = classes[0] || null;

    if (!cls) {
      return res.status(404).json({ code: -1, source: 'error', error: '班级不存在' });
    }

    // 获取班级学生
    const students = await dbQuery(
      `db.collection('students').where({classId:'${req.params.id}',status:'active'}).get()`
    );

    res.json({
      code: 0,
      source: 'wechat_db',
      data: { ...cls, students }
    });
  } catch (err) {
    console.error('❌ /api/classes/:id 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

/**
 * 获取作业列表 GET /api/homework
 */
app.get('/api/homework', async (req, res) => {
  // 数据库中没有 homeworks 集合，作业功能需后续扩展
  res.json({ code: 0, source: 'empty', data: [], note: '暂无作业数据' });
});

/**
 * 获取学生列表 GET /api/students
 * students 集合目前无 classId 关联，学生归属需通过小程序「邀请码→审批」流程建立
 * 暂返回空列表，等流程完善后再接入
 */
app.get('/api/students', async (req, res) => {
  // 先返回空，等 classId 关联建立后再启用
  res.json({ code: 0, source: 'pending', data: [], note: '学生列表需小程序完成邀请码审批流程后才可用' });
});

/**
 * 通用云函数调用 POST /api/call-function
 * （注：JS 保留字函数名如 class/homework 通过 HTTP API 会报错，请优先用直连数据库接口）
 */
app.post('/api/call-function', async (req, res) => {
  const { name, data } = req.body || {};
  if (!name) {
    return res.status(400).json({ code: -1, message: '缺少参数 name' });
  }

  const token = await getAccessToken();
  const url = tcbUrl('/invokecloudfunction', token);

  try {
    const res2 = await axios.post(url, {
      env: WECHAT_ENV_ID,
      name: name,
      req_data: data || {}
    }, { timeout: 15000 });

    if (tcbFailed(res2.data)) {
      const err = new Error(`${name}: ${res2.data.errmsg}`);
      err.code = res2.data.errcode;
      return res.status(400).json({ code: -1, source: 'error', error: err.message });
    }

    let result = res2.data;
    if (result.resp_data) {
      try { result = JSON.parse(result.resp_data); } catch {}
    }
    res.json({ code: 0, source: 'wechat', data: result });
  } catch (err) {
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

/**
 * 云函数「名称」列表 GET /api/functions
 */
app.get('/api/functions', async (req, res) => {
  const raw = process.env.WECHAT_CLOUD_FUNCTIONS || '';
  const names = raw.split(',').map(s => s.trim()).filter(Boolean);
  const data = names.map(name => ({ name, status: 'Configured' }));
  res.json({
    code: 0,
    source: 'config',
    envId: WECHAT_ENV_ID,
    data,
    note: '数据通过直连微信数据库获取（非云函数 HTTP API）'
  });
});

// ============================================================
// 笔记管理 API (Notes)
// ============================================================

/**
 * 获取笔记列表 GET /api/notes
 */
app.get('/api/notes', async (req, res) => {
  try {
    const orderBy = req.query.sort === 'update' ? 'updateTime' : 'createTime';
    const notes = await dbQuery(
      `db.collection('notes').orderBy('${orderBy}', 'desc').limit(200).get()`
    );
    res.json({ code: 0, source: 'wechat_db', data: notes });
  } catch (err) {
    console.error('❌ /api/notes 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

/**
 * 搜索笔记 GET /api/notes/search?q=关键词
 * （必须在 /api/notes/:id 之前注册，否则 "search" 会被当成 id）
 */
app.get('/api/notes/search', async (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) {
    return res.json({ code: 0, source: 'wechat_db', data: [] });
  }

  try {
    const notes = await dbQuery(
      `db.collection('notes').where({title: db.RegExp({regexp: '${q}', options: 'i'})}).orderBy('updateTime', 'desc').limit(50).get()`
    );
    res.json({ code: 0, source: 'wechat_db', data: notes });
  } catch (err) {
    const notes = await dbQuery(
      `db.collection('notes').orderBy('updateTime', 'desc').limit(200).get()`
    );
    const filtered = notes.filter(n =>
      n.title?.toLowerCase().includes(q.toLowerCase()) ||
      n.content?.toLowerCase().includes(q.toLowerCase())
    );
    res.json({ code: 0, source: 'wechat_db', data: filtered });
  }
});

/**
 * 获取单个笔记 GET /api/notes/:id
 */
app.get('/api/notes/:id', async (req, res) => {
  try {
    const notes = await dbQuery(
      `db.collection('notes').doc('${req.params.id}').get()`
    );
    const note = notes[0] || null;

    if (!note) {
      return res.status(404).json({ code: -1, source: 'error', error: '笔记不存在' });
    }

    // 获取反向链接
    const backlinks = await dbQuery(
      `db.collection('notes').where({links: '${req.params.id}'}).field({title: true}).get()`
    );

    res.json({
      code: 0,
      source: 'wechat_db',
      data: { ...note, backlinks }
    });
  } catch (err) {
    console.error('❌ /api/notes/:id 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

/**
 * 创建笔记 POST /api/notes
 */
app.post('/api/notes', async (req, res) => {
  const { title, content, tags } = req.body || {};

  if (!title?.trim()) {
    return res.status(400).json({ code: -1, message: '笔记标题不能为空' });
  }

  try {
    const token = await getAccessToken();
    const now = Date.now();

    // 解析内容中的双链，提取关联的笔记ID
    const linkedNoteIds = [];
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    let match;
    while ((match = wikiLinkRegex.exec(content || '')) !== null) {
      const linkTitle = match[1].trim();
      // 查找目标笔记（按标题匹配）
      const targetNotes = await dbQuery(
        "db.collection('notes').where({title: " + tcbSqUnicode(linkTitle) + "}).field({_id: true}).limit(1).get()"
      );
      if (targetNotes.length > 0) {
        linkedNoteIds.push(targetNotes[0]._id);
      }
    }

    const noteData = {
      title: title.trim(),
      content: content || '',
      tags: tags || [],
      links: linkedNoteIds,
      createTime: now,
      updateTime: now
    };

    const res2 = await dbQueryEncoded(
      '/databaseadd',
      "db.collection('notes').add({data: " + tcbNoteDataLiteral(noteData) + "})"
    );

    if (tcbFailed(res2)) {
      throw new Error(res2.errmsg);
    }

    res.json({
      code: 0,
      source: 'wechat_db',
      data: {
        _id: res2.id_list?.[0] || res2._id,
        ...noteData
      }
    });
  } catch (err) {
    console.error('❌ POST /api/notes 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

/**
 * 更新笔记 PUT /api/notes/:id
 */
app.put('/api/notes/:id', async (req, res) => {
  const { title, content, tags } = req.body || {};

  if (!title?.trim()) {
    return res.status(400).json({ code: -1, message: '笔记标题不能为空' });
  }

  try {
    const token = await getAccessToken();

    // 重新解析双链
    const linkedNoteIds = [];
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    let match;
    while ((match = wikiLinkRegex.exec(content || '')) !== null) {
      const linkTitle = match[1].trim();
      const targetNotes = await dbQuery(
        "db.collection('notes').where({title: " + tcbSqUnicode(linkTitle) + "}).field({_id: true}).limit(1).get()"
      );
      if (targetNotes.length > 0) {
        linkedNoteIds.push(targetNotes[0]._id);
      }
    }

    const updateData = {
      title: title.trim(),
      content: content || '',
      tags: tags || [],
      links: linkedNoteIds,
      updateTime: Date.now()
    };

    const noteLiteral = tcbNoteDataLiteral(updateData);
    const res2 = await dbQueryEncoded(
      '/databaseupdate',
      "db.collection('notes').doc('" + req.params.id + "').update({data: " + noteLiteral + "})"
    );

    if (tcbFailed(res2.data)) {
      throw new Error(res2.data.errmsg);
    }

    res.json({
      code: 0,
      source: 'wechat_db',
      data: { _id: req.params.id, ...updateData }
    });
  } catch (err) {
    console.error('❌ PUT /api/notes/:id 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

/**
 * 删除笔记 DELETE /api/notes/:id
 */
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const token = await getAccessToken();

    const res2 = await axios.post(
      tcbUrl('/databasedelete', token),
      {
        env: WECHAT_ENV_ID,
        query: `db.collection('notes').doc('${req.params.id}').remove()`
      },
      { timeout: 15000 }
    );

    if (tcbFailed(res2.data)) {
      throw new Error(res2.data.errmsg);
    }

    res.json({ code: 0, source: 'wechat_db', data: { deleted: true } });
  } catch (err) {
    console.error('❌ DELETE /api/notes/:id 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

// ============================================================
// 启动
// ============================================================

accessTokenCache.token = null;
accessTokenCache.expiresAt = 0;

app.listen(PORT, async () => {
  try {
    await getAccessToken();
    console.log('[Server] Token 获取成功');
  } catch (err) {
    console.log('[Server] Token 获取失败:', err.message);
  }
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   Teacher Web Server  已启动                          ║
║   地址: http://localhost:${PORT}                          ║
║   AppID: ${(WECHAT_APPID || '❌ 未配置').slice(0, 22)}          ║
║   环境: ${WECHAT_ENV_ID}                   ║
║   数据源: 微信云开发数据库（直连）                   ║
╠═══════════════════════════════════════════════════════╣
║   API 端点:                                            ║
║   • GET  /api/health       - 健康检查               ║
║   • GET  /api/functions    - 云函数名列表            ║
║   • POST /api/call-function - 调用云函数              ║
║   • POST /api/teacher/login - 教师登录               ║
║   • GET  /api/stats        - 统计数据               ║
║   • GET  /api/classes     - 班级列表（直连DB）     ║
║   • GET  /api/classes/:id - 班级详情（直连DB）     ║
║   • GET  /api/homework    - 作业列表               ║
║   • GET  /api/students    - 学生列表（直连DB）     ║
╚═══════════════════════════════════════════════════════╝
  `);
});
