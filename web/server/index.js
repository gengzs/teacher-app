/**
 * Teacher App Web Server
 * 微信云开发 HTTP API 代理服务
 * 策略：优先直连数据库（云函数 HTTP API 对 JS 保留字函数名不兼容）
 */

const path = require('path');
const fs = require('fs');

const _embeddedEnvPath = process.env.TEACHER_SERVER_ENV_PATH;
const _localEnvPath = path.join(__dirname, '.env');
const _dotenvPath =
  _embeddedEnvPath && fs.existsSync(_embeddedEnvPath) ? _embeddedEnvPath : _localEnvPath;
require('dotenv').config({ path: _dotenvPath });

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
const FRONTEND_DIST =
  process.env.TEACHER_FRONTEND_DIST || path.join(__dirname, '../frontend/dist');
const IS_PROD = NODE_ENV === 'production';
const TEACHER_ELECTRON = process.env.TEACHER_ELECTRON === '1';

const app = express();
const PORT = Number(process.env.PORT) || 3010;

// API 基础地址
const TCB_API_BASE = 'https://api.weixin.qq.com/tcb';

// access_token 缓存（getStableAccessToken 有效期 30 天）
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

/** 微信 invokecloudfunction 要求 req_data 为 JSON 字符串，传对象会触发 INVALID_PARAM（如 function name format invalid） */
function tcbInvokeReqData(data) {
  if (data == null || data === '') return '{}';
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data);
  } catch {
    return '{}';
  }
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
  // getStableAccessToken 有效期约 30 天，缓存足够长
  if (accessTokenCache.token && Date.now() < accessTokenCache.expiresAt) {
    return accessTokenCache.token;
  }

  if (!WECHAT_APPID || !WECHAT_SECRET) {
    throw Object.assign(new Error('缺少微信配置，请检查 .env 里的 WECHAT_APPID 和 WECHAT_SECRET'), { code: 'NO_CREDENTIALS' });
  }

  // 第一步：获取 stable_access_token（长期有效）
  const stableUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(WECHAT_APPID)}&secret=${encodeURIComponent(WECHAT_SECRET)}&type=1`;
  const stableRes = await axios.get(stableUrl, { timeout: 10000 });

  if (tcbFailed(stableRes.data)) {
    const err = new Error(`微信 stable_access_token 错误: ${stableRes.data.errmsg}`);
    err.code = stableRes.data.errcode;
    throw err;
  }

  if (!stableRes.data.access_token) {
    throw new Error('微信未返回 stable_access_token');
  }

  // 缓存 30 天（微信实际有效期更长，但保守起见）
  const TTL_MS = 30 * 24 * 60 * 60 * 1000;
  accessTokenCache.token = stableRes.data.access_token;
  accessTokenCache.expiresAt = Date.now() + TTL_MS;
  console.log('[Token] 刷新成功（getStableAccessToken），有效期 30 天');

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
    info.message = '已连接微信云开发数据库（stable_access_token 长期有效）';
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
 * 获取学生详情（含统计数据） GET /api/students/:id/stats
 */
app.get('/api/students/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await dbQuery(
      `db.collection('students').where({_id:'${id}'}).limit(1).get()`
    );
    if (!student || student.length === 0) {
      return res.status(404).json({ code: -1, error: '学生不存在' });
    }
    const s = student[0];
    // 查询该学生的单词笔记，统计掌握情况
    const notes = await dbQuery(
      `db.collection('wordNotes').where({studentId:'${id}'}).get()`
    );
    const totalWords = notes.length;
    const masteredWords = notes.filter(n => n.status === 'mastered').length;
    const learningWords = notes.filter(n => n.status === 'learning').length;
    const notStartedWords = 0;
    // 待复习：距上次复习超过1天的
    const oneDayAgo = Date.now() - 86400000;
    const reviewCount = notes.filter(n => {
      const lastReview = n.lastReviewTime || n.createdAt || 0;
      return lastReview < oneDayAgo;
    }).length;
    res.json({
      code: 0,
      data: {
        _id: s._id,
        name: s.name,
        className: s.className || '',
        classId: s.classId || '',
        totalWords,
        masteredWords,
        learningWords,
        notStartedWords,
        reviewCount,
        learnDays: s.learnDays || 0,
        masterRate: totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0
      }
    });
  } catch (err) {
    console.error('❌ /api/students/:id/stats 错误:', err.message);
    res.status(500).json({ code: -1, error: err.message });
  }
});

/**
 * 获取学生列表 GET /api/students
 * students 集合目前无 classId 关联，学生归属需通过小程序「邀请码→审批」流程建立
 * 暂返回空列表，等流程完善后再接入
 */
app.get('/api/students', async (req, res) => {
  try {
    const students = await dbQuery(`db.collection('students').limit(1000).get()`);
    // 补全 joinSource 字段（默认为 manual）
    const data = (students || []).map(s => ({ ...s, joinSource: s.joinSource || 'manual', status: s.status || 'active' }));
    res.json({ code: 0, data });
  } catch (err) {
    console.error('获取学生列表失败:', err);
    res.status(500).json({ code: -1, error: '获取学生列表失败' });
  }
});

/**
 * 词库列表 GET /api/word-sets（直连数据库，避免 HTTP 调云函数对 req_data 格式限制）
 */
app.get('/api/word-sets', async (req, res) => {
  try {
    const list = await dbQuery(
      `db.collection('wordSets').orderBy('createdAt', 'desc').limit(200).get()`
    );
    res.json({ code: 0, source: 'wechat_db', data: list });
  } catch (err) {
    console.error('❌ /api/word-sets 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

/**
 * 某词库下的单词 GET /api/word-sets/:id/words
 * 微信云数据库单次 .limit() 上限为 100（再大报 MgoLimit 校验失败）
 * 用多路并发 skip 拉取，比原先串行 100 条一轮快很多
 */
app.get('/api/word-sets/:id/words', async (req, res) => {
  const setId = req.params.id || '';
  if (!/^[a-zA-Z0-9_-]+$/.test(setId)) {
    return res.status(400).json({ code: -1, source: 'error', error: '无效的词库 ID' });
  }

  try {
    const sets = await dbQuery(`db.collection('wordSets').doc('${setId}').get()`);
    if (!sets.length) {
      return res.status(404).json({ code: -1, source: 'error', error: '词库不存在' });
    }

    const PAGE = 100;
    const CONCURRENCY = 10;
    const allWords = [];
    let baseSkip = 0;

    for (;;) {
      const offsets = Array.from({ length: CONCURRENCY }, (_, i) => baseSkip + i * PAGE);
      const batches = await Promise.all(
        offsets.map((sk) =>
          dbQuery(
            `db.collection('words').where({setId:'${setId}'}).orderBy('index', 'asc').skip(${sk}).limit(${PAGE}).get()`
          )
        )
      );

      let done = false;
      for (const batch of batches) {
        allWords.push(...batch);
        if (batch.length < PAGE) {
          done = true;
          break;
        }
      }
      if (done) break;
      baseSkip += CONCURRENCY * PAGE;
    }

    res.json({ code: 0, source: 'wechat_db', data: allWords });
  } catch (err) {
    console.error('❌ /api/word-sets/:id/words 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

/**
 * 获取某学生的单词笔记列表 GET /api/word-notes?studentId=xxx
 */
app.get('/api/word-notes', async (req, res) => {
  const { studentId } = req.query || {};
  if (!studentId) {
    return res.status(400).json({ code: -1, source: 'error', error: '缺少 studentId 参数' });
  }
  try {
    const notes = await dbQuery(
      `db.collection('wordNotes').where({studentId:'${studentId}'}).get()`
    );
    res.json({ code: 0, source: 'wechat_db', data: notes });
  } catch (err) {
    console.error('❌ /api/word-notes 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
});

/**
 * 保存/更新单词笔记 POST /api/word-notes
 */
app.post('/api/word-notes', async (req, res) => {
  const { studentId, wordId, word, note } = req.body || {};
  if (!studentId || !wordId) {
    return res.status(400).json({ code: -1, source: 'error', error: '缺少 studentId 或 wordId' });
  }
  try {
    const existing = await dbQuery(
      `db.collection('wordNotes').where({studentId:'${studentId}',wordId:'${wordId}'}).limit(1).get()`
    );
    if (existing.length > 0) {
      const docId = existing[0]._id;
      await dbQueryEncoded('/databaseupdate', `
        db.collection('wordNotes').doc('${docId}').update({
          data: {
            note: ${tcbSqUnicode(String(note ?? ''))},
            updateTime: ${Date.now()}
          }
        })`
      );
      res.json({ code: 0, source: 'wechat_db', data: { _id: docId, note } });
    } else {
      const r = await dbQueryEncoded('/databaseadd', `
        db.collection('wordNotes').add({
          data: {
            studentId: ${tcbSqUnicode(studentId)},
            wordId: ${tcbSqUnicode(wordId)},
            word: ${tcbSqUnicode(String(word || ''))},
            note: ${tcbSqUnicode(String(note ?? ''))},
            createTime: ${Date.now()},
            updateTime: ${Date.now()}
          }
        })`
      );
      res.json({ code: 0, source: 'wechat_db', data: { _id: r.id, note } });
    }
  } catch (err) {
    console.error('❌ /api/word-notes POST 错误:', err.message);
    res.status(500).json({ code: -1, source: 'error', error: err.message });
  }
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
      req_data: tcbInvokeReqData(data)
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
 * 生成真实测试数据 POST /api/seed
 * 调用后向微信云数据库写入词库、单词、班级、学生记录
 */
app.post('/api/seed', async (req, res) => {
  async function addDoc(collection, data) {
    const payload = { env: WECHAT_ENV_ID, query: `db.collection('${collection}').add({data: ${JSON.stringify(data)}})` };
    const r = await axios.post(tcbUrl('/databaseadd', await getAccessToken()), payload, { timeout: 15000 });
    if (tcbFailed(r.data)) throw new Error(`${collection} 添加失败: ${r.data.errmsg}`);
    return r.data.id_list?.[0] || r.data._id;
  }

  try {
    const now = Date.now();

    // ── 1. 词库 1：人教版七上核心词 ───────────────────────────────
    const ws1Id = await addDoc('wordSets', {
      name: '人教版七年级上册',
      description: '人教版英语七年级上册核心词汇',
      wordCount: 0,
      createdAt: now,
      updateTime: now
    });

    const unit1Words = [
      { word: 'good morning', phonetic: '/ɡʊd ˈmɔːnɪŋ/', translation: '早上好' },
      { word: 'good afternoon', phonetic: '/ɡʊd ˌæftəˈnuːn/', translation: '下午好' },
      { word: 'good evening', phonetic: '/ɡʊd ˈiːvnɪŋ/', translation: '晚上好' },
      { word: 'good night', phonetic: '/ɡʊd naɪt/', translation: '晚安' },
      { word: 'how', phonetic: '/haʊ/', translation: '怎样；如何' },
      { word: 'are', phonetic: '/ɑː(r)/', translation: '是（be 动词复数）' },
      { word: 'you', phonetic: '/juː/', translation: '你；你们' },
      { word: 'I', phonetic: '/aɪ/', translation: '我' },
      { word: 'am', phonetic: '/æm/', translation: '是（be 动词）' },
      { word: 'fine', phonetic: '/faɪn/', translation: '好的；健康的' },
      { word: 'thanks', phonetic: '/θæŋks/', translation: '谢谢' },
      { word: 'hello', phonetic: '/həˈləʊ/', translation: '你好' },
      { word: 'teacher', phonetic: '/ˈtiːtʃə(r)/', translation: '教师' },
      { word: 'book', phonetic: '/bʊk/', translation: '书' },
      { word: 'pen', phonetic: '/pen/', translation: '钢笔' },
      { word: 'ruler', phonetic: '/ˈruːlə(r)/', translation: '尺子' },
      { word: 'eraser', phonetic: '/ɪˈreɪzə(r)/', translation: '橡皮' },
      { word: 'bag', phonetic: '/bæɡ/', translation: '包；书包' },
      { word: 'map', phonetic: '/mæp/', translation: '地图' },
      { word: 'cup', phonetic: '/kʌp/', translation: '杯子' },
      { word: 'key', phonetic: '/kiː/', translation: '钥匙' },
      { word: 'orange', phonetic: '/ˈɒrɪndʒ/', translation: '橙子；橙色' },
      { word: 'egg', phonetic: '/eɡ/', translation: '蛋；鸡蛋' },
      { word: 'ice', phonetic: '/aɪs/', translation: '冰' },
      { word: 'jacket', phonetic: '/ˈdʒækɪt/', translation: '夹克衫' },
      { word: 'T-shirt', phonetic: '/ˈtiːʃɜːt/', translation: 'T恤衫' },
      { word: 'color', phonetic: '/ˈkʌlə(r)/', translation: '颜色' },
      { word: 'red', phonetic: '/red/', translation: '红色' },
      { word: 'blue', phonetic: '/bluː/', translation: '蓝色' },
      { word: 'yellow', phonetic: '/ˈjeləʊ/', translation: '黄色' },
      { word: 'green', phonetic: '/ɡriːn/', translation: '绿色' },
      { word: 'white', phonetic: '/waɪt/', translation: '白色' },
      { word: 'black', phonetic: '/blæk/', translation: '黑色' },
      { word: 'brown', phonetic: '/braʊn/', translation: '棕色' },
      { word: 'friend', phonetic: '/frend/', translation: '朋友' },
      { word: 'name', phonetic: '/neɪm/', translation: '名字' },
      { word: 'school', phonetic: '/skuːl/', translation: '学校' },
      { word: 'class', phonetic: '/klɑːs/', translation: '班级；课' },
      { word: 'number', phonetic: '/ˈnʌmbə(r)/', translation: '数字；号码' },
      { word: 'phone', phonetic: '/fəʊn/', translation: '电话' },
    ];

    const unit2Words = [
      { word: 'mother', phonetic: '/ˈmʌðə(r)/', translation: '母亲；妈妈' },
      { word: 'father', phonetic: '/ˈfɑːðə(r)/', translation: '父亲；爸爸' },
      { word: 'brother', phonetic: '/ˈbrʌðə(r)/', translation: '兄；弟' },
      { word: 'sister', phonetic: '/ˈsɪstə(r)/', translation: '姐；妹' },
      { word: 'grandmother', phonetic: '/ˈɡrænmʌðə(r)/', translation: '祖母；外祖母' },
      { word: 'grandfather', phonetic: '/ˈɡrænfɑːðə(r)/', translation: '祖父；外祖父' },
      { word: 'parent', phonetic: '/ˈpeərənt/', translation: '父（母）亲' },
      { word: 'family', phonetic: '/ˈfæməli/', translation: '家庭' },
      { word: 'this', phonetic: '/ðɪs/', translation: '这；这个' },
      { word: 'that', phonetic: '/ðæt/', translation: '那；那个' },
      { word: 'she', phonetic: '/ʃiː/', translation: '她' },
      { word: 'he', phonetic: '/hiː/', translation: '他' },
      { word: 'who', phonetic: '/huː/', translation: '谁' },
      { word: 'is', phonetic: '/ɪz/', translation: '是' },
      { word: 'it', phonetic: '/ɪt/', translation: '它' },
      { word: 'photo', phonetic: '/ˈfəʊtəʊ/', translation: '照片' },
      { word: 'here', phonetic: '/hɪə(r)/', translation: '这里；在这里' },
      { word: 'they', phonetic: '/ðeɪ/', translation: '他们；她们；它们' },
      { word: 'have', phonetic: '/hæv/', translation: '有' },
      { word: 'two', phonetic: '/tuː/', translation: '二' },
      { word: 'three', phonetic: '/θriː/', translation: '三' },
      { word: 'four', phonetic: '/fɔː(r)/', translation: '四' },
      { word: 'five', phonetic: '/faɪv/', translation: '五' },
      { word: 'six', phonetic: '/sɪks/', translation: '六' },
      { word: 'seven', phonetic: '/ˈsevn/', translation: '七' },
      { word: 'eight', phonetic: '/eɪt/', translation: '八' },
      { word: 'nine', phonetic: '/naɪn/', translation: '九' },
      { word: 'ten', phonetic: '/ten/', translation: '十' },
    ];

    const allSet1Words = [...unit1Words, ...unit2Words];
    for (let i = 0; i < allSet1Words.length; i++) {
      await addDoc('words', {
        setId: ws1Id,
        word: allSet1Words[i].word,
        phonetic: allSet1Words[i].phonetic,
        translation: allSet1Words[i].translation,
        index: i,
        createdAt: now
      });
    }

    // ── 2. 词库 2：中考高频词 ────────────────────────────────────
    const ws2Id = await addDoc('wordSets', {
      name: '中考英语高频词',
      description: '中考英语常考高频词汇精选',
      wordCount: 0,
      createdAt: now,
      updateTime: now
    });

    const zkWords = [
      { word: 'abandon', phonetic: '/əˈbændən/', translation: '放弃；遗弃' },
      { word: 'ability', phonetic: '/əˈbɪləti/', translation: '能力' },
      { word: 'able', phonetic: '/ˈeɪbl/', translation: '能够的；有能力的' },
      { word: 'about', phonetic: '/əˈbaʊt/', translation: '关于；大约' },
      { word: 'above', phonetic: '/əˈbʌv/', translation: '在…上面' },
      { word: 'abroad', phonetic: '/əˈbrɔːd/', translation: '到（在）国外' },
      { word: 'accept', phonetic: '/əkˈsept/', translation: '接受' },
      { word: 'accident', phonetic: '/ˈæksɪdənt/', translation: '事故；意外' },
      { word: 'according', phonetic: '/əˈkɔːdɪŋ/', translation: '根据；按照' },
      { word: 'achieve', phonetic: '/əˈtʃiːv/', translation: '实现；达到' },
      { word: 'across', phonetic: '/əˈkrɒs/', translation: '穿过；横过' },
      { word: 'act', phonetic: '/ækt/', translation: '行动；表演' },
      { word: 'action', phonetic: '/ˈækʃn/', translation: '行动' },
      { word: 'active', phonetic: '/ˈæktɪv/', translation: '积极的；活跃的' },
      { word: 'activity', phonetic: '/ækˈtɪvəti/', translation: '活动' },
      { word: 'address', phonetic: '/əˈdres/', translation: '地址' },
      { word: 'advantage', phonetic: '/ədˈvɑːntɪdʒ/', translation: '优势；好处' },
      { word: 'advice', phonetic: '/ədˈvaɪs/', translation: '建议；劝告' },
      { word: 'afford', phonetic: '/əˈfɔːd/', translation: '负担得起' },
      { word: 'afraid', phonetic: '/əˈfreɪd/', translation: '害怕的' },
      { word: 'agree', phonetic: '/əˈɡriː/', translation: '同意' },
      { word: 'allow', phonetic: '/əˈlaʊ/', translation: '允许' },
      { word: 'almost', phonetic: '/ˈɔːlməʊst/', translation: '几乎；差不多' },
      { word: 'alone', phonetic: '/əˈləʊn/', translation: '单独的' },
      { word: 'already', phonetic: '/ɔːlˈredi/', translation: '已经' },
      { word: 'also', phonetic: '/ˈɔːlsəʊ/', translation: '也；而且' },
      { word: 'although', phonetic: '/ɔːlˈðəʊ/', translation: '虽然；尽管' },
      { word: 'always', phonetic: '/ˈɔːlweɪz/', translation: '总是；永远' },
      { word: 'among', phonetic: '/əˈmʌŋ/', translation: '在…之中' },
      { word: 'enough', phonetic: '/ɪˈnʌf/', translation: '足够的' },
      { word: 'environment', phonetic: '/ɪnˈvaɪərənmənt/', translation: '环境' },
      { word: 'especially', phonetic: '/ɪˈspeʃəli/', translation: '特别；尤其' },
      { word: 'ever', phonetic: '/ˈevə(r)/', translation: '曾经；在任何时候' },
      { word: 'every', phonetic: '/ˈevri/', translation: '每个；每一' },
      { word: 'everyone', phonetic: '/ˈevriwʌn/', translation: '每个人' },
      { word: 'everything', phonetic: '/ˈevriθɪŋ/', translation: '每件事' },
      { word: 'exactly', phonetic: '/ɪɡˈzæktli/', translation: '精确地；恰好' },
      { word: 'example', phonetic: '/ɪɡˈzɑːmpl/', translation: '例子；榜样' },
      { word: 'expect', phonetic: '/ɪkˈspekt/', translation: '期望；预料' },
      { word: 'experience', phonetic: '/ɪkˈspɪəriəns/', translation: '经验；经历' },
      { word: 'important', phonetic: '/ɪmˈpɔːtnt/', translation: '重要的' },
      { word: 'improve', phonetic: '/ɪmˈpruːv/', translation: '改进；提高' },
      { word: 'include', phonetic: '/ɪnˈkluːd/', translation: '包含；包括' },
      { word: 'increase', phonetic: '/ɪnˈkriːs/', translation: '增加；增长' },
      { word: 'indeed', phonetic: '/ɪnˈdiːd/', translation: '确实；实际上' },
      { word: 'influence', phonetic: '/ˈɪnfluəns/', translation: '影响' },
      { word: 'information', phonetic: '/ˌɪnfəˈmeɪʃn/', translation: '信息' },
      { word: 'instead', phonetic: '/ɪnˈsted/', translation: '代替；反而' },
      { word: 'interest', phonetic: '/ˈɪntrəst/', translation: '兴趣；关注' },
      { word: 'knowledge', phonetic: '/ˈnɒlɪdʒ/', translation: '知识' },
      { word: 'language', phonetic: '/ˈlæŋɡwɪdʒ/', translation: '语言' },
      { word: 'later', phonetic: '/ˈleɪtə(r)/', translation: '后来；较晚' },
      { word: 'least', phonetic: '/liːst/', translation: '最少；最小' },
      { word: 'leave', phonetic: '/liːv/', translation: '离开；留下' },
      { word: 'lend', phonetic: '/lend/', translation: '借给' },
      { word: 'less', phonetic: '/les/', translation: '较少的' },
      { word: 'let', phonetic: '/let/', translation: '让；允许' },
      { word: 'level', phonetic: '/ˈlevl/', translation: '水平；级别' },
      { word: 'lie', phonetic: '/laɪ/', translation: '躺；位于；说谎' },
      { word: 'life', phonetic: '/laɪf/', translation: '生活；生命' },
      { word: 'lift', phonetic: '/lɪft/', translation: '举起；抬起' },
      { word: 'light', phonetic: '/laɪt/', translation: '光；灯；轻的' },
      { word: 'likely', phonetic: '/ˈlaɪkli/', translation: '可能的' },
      { word: 'line', phonetic: '/laɪn/', translation: '线；排；行' },
      { word: 'list', phonetic: '/lɪst/', translation: '列表；清单' },
      { word: 'listen', phonetic: '/ˈlɪsn/', translation: '听' },
      { word: 'little', phonetic: '/ˈlɪtl/', translation: '小的；少的' },
      { word: 'live', phonetic: '/lɪv/', translation: '生活；居住' },
      { word: 'local', phonetic: '/ˈləʊkl/', translation: '当地的；本地的' },
      { word: 'look', phonetic: '/lʊk/', translation: '看；看起来' },
      { word: 'lose', phonetic: '/luːz/', translation: '失去；丢失' },
      { word: 'love', phonetic: '/lʌv/', translation: '爱；热爱' },
      { word: 'low', phonetic: '/ləʊ/', translation: '低的；矮的' },
      { word: 'main', phonetic: '/meɪn/', translation: '主要的' },
      { word: 'make', phonetic: '/meɪk/', translation: '使；制造' },
      { word: 'manage', phonetic: '/ˈmænɪdʒ/', translation: '管理；设法' },
      { word: 'many', phonetic: '/ˈmeni/', translation: '许多；大量' },
      { word: 'mark', phonetic: '/mɑːk/', translation: '标记；分数' },
      { word: 'market', phonetic: '/ˈmɑːkɪt/', translation: '市场' },
      { word: 'material', phonetic: '/məˈtɪəriəl/', translation: '材料；物质' },
      { word: 'matter', phonetic: '/ˈmætə(r)/', translation: '事情；物质；重要' },
      { word: 'maybe', phonetic: '/ˈmeɪbi/', translation: '也许；大概' },
      { word: 'mean', phonetic: '/miːn/', translation: '意思是；意味着' },
      { word: 'measure', phonetic: '/ˈmeʒə(r)/', translation: '测量；衡量' },
      { word: 'meet', phonetic: '/miːt/', translation: '遇见；满足' },
      { word: 'member', phonetic: '/ˈmembə(r)/', translation: '成员' },
      { word: 'memory', phonetic: '/ˈmeməri/', translation: '记忆；回忆' },
      { word: 'mention', phonetic: '/ˈmenʃn/', translation: '提到；说起' },
      { word: 'method', phonetic: '/ˈmeθəd/', translation: '方法' },
      { word: 'might', phonetic: '/maɪt/', translation: '可能；也许' },
      { word: 'mind', phonetic: '/maɪnd/', translation: '头脑；介意' },
      { word: 'minute', phonetic: '/ˈmɪnɪt/', translation: '分钟；一会儿' },
      { word: 'miss', phonetic: '/mɪs/', translation: '想念；错过' },
      { word: 'model', phonetic: '/ˈmɒdl/', translation: '模型；模范' },
      { word: 'modern', phonetic: '/ˈmɒdn/', translation: '现代的' },
      { word: 'moment', phonetic: '/ˈməʊmənt/', translation: '时刻；瞬间' },
      { word: 'money', phonetic: '/ˈmʌni/', translation: '钱；货币' },
      { word: 'month', phonetic: '/mʌnθ/', translation: '月；月份' },
      { word: 'more', phonetic: '/mɔː(r)/', translation: '更多的；更多' },
      { word: 'morning', phonetic: '/ˈmɔːnɪŋ/', translation: '早晨；上午' },
      { word: 'most', phonetic: '/məʊst/', translation: '最多；大多数' },
      { word: 'mother', phonetic: '/ˈmʌðə(r)/', translation: '母亲' },
      { word: 'move', phonetic: '/muːv/', translation: '移动；搬家' },
      { word: 'much', phonetic: '/mʌtʃ/', translation: '许多；非常' },
      { word: 'must', phonetic: '/mʌst/', translation: '必须；一定' },
      { word: 'nation', phonetic: '/ˈneɪʃn/', translation: '国家；民族' },
      { word: 'national', phonetic: '/ˈnæʃnəl/', translation: '国家的；民族的' },
      { word: 'nature', phonetic: '/ˈneɪtʃə(r)/', translation: '自然；性质' },
      { word: 'necessary', phonetic: '/ˈnesəsəri/', translation: '必要的；必需的' },
      { word: 'need', phonetic: '/niːd/', translation: '需要；必要' },
      { word: 'never', phonetic: '/ˈnevə(r)/', translation: '从不；永不' },
    ];

    for (let i = 0; i < zkWords.length; i++) {
      await addDoc('words', {
        setId: ws2Id,
        word: zkWords[i].word,
        phonetic: zkWords[i].phonetic,
        translation: zkWords[i].translation,
        index: i,
        createdAt: now
      });
    }

    // ── 3. 班级 ──────────────────────────────────────────────────
    const classId1 = await addDoc('classes', {
      name: '七年级一班',
      description: '七年级一班英语教学班',
      grade: '七年级',
      status: 'active',
      createTime: now
    });

    const classId2 = await addDoc('classes', {
      name: '七年级二班',
      description: '七年级二班英语教学班',
      grade: '七年级',
      status: 'active',
      createTime: now
    });

    // ── 4. 学生 ──────────────────────────────────────────────────
    const studentsData = [
      { name: '张小明', phone: '13812340001', classId: classId1 },
      { name: '李婷婷', phone: '13812340002', classId: classId1 },
      { name: '王浩然', phone: '13812340003', classId: classId1 },
      { name: '刘思琪', phone: '13812340004', classId: classId1 },
      { name: '陈子轩', phone: '13812340005', classId: classId1 },
      { name: '赵雨萱', phone: '13812340006', classId: classId2 },
      { name: '孙浩宇', phone: '13812340007', classId: classId2 },
      { name: '周雅静', phone: '13812340008', classId: classId2 },
      { name: '吴俊杰', phone: '13812340009', classId: classId2 },
      { name: '郑诗涵', phone: '13812340010', classId: classId2 },
    ];

    const studentIds = [];
    for (const s of studentsData) {
      const sid = await addDoc('students', {
        name: s.name,
        phone: s.phone,
        classId: s.classId,
        joinSource: 'manual',
        status: 'active',
        createTime: now
      });
      studentIds.push(sid);
    }

    res.json({
      code: 0,
      source: 'wechat_db',
      message: '真实数据已全部写入微信云数据库',
      data: {
        wordSets: [
          { _id: ws1Id, name: '人教版七年级上册', wordCount: allSet1Words.length },
          { _id: ws2Id, name: '中考英语高频词', wordCount: zkWords.length },
        ],
        classes: [
          { _id: classId1, name: '七年级一班' },
          { _id: classId2, name: '七年级二班' },
        ],
        students: studentsData.map((s, i) => ({ _id: studentIds[i], name: s.name }))
      }
    });
  } catch (err) {
    console.error('❌ /api/seed 错误:', err.message);
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

// 生产环境：必须在所有 /api 路由之后注册，否则会拦截 API 请求（Electron 内嵌时由壳加载 dist，不挂静态）
if (IS_PROD && !TEACHER_ELECTRON) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// ============================================================
// 启动
// ============================================================

function startTeacherServer() {
  accessTokenCache.token = null;
  accessTokenCache.expiresAt = 0;

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, async () => {
      try {
        await getAccessToken();
        console.log('[Server] Token 获取成功（长期有效）');
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
      resolve(server);
    });
    server.on('error', reject);
  });
}

module.exports = { app, startTeacherServer, PORT };

if (require.main === module) {
  startTeacherServer().catch((err) => {
    console.error('[Server] 启动失败:', err);
    process.exit(1);
  });
}
