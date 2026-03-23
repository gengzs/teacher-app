/**
 * 词库管理云函数
 * 功能：
 * - list: 获取词库列表
 * - getWords: 获取词库中的单词
 * - create: 创建词库
 * - delete: 删除词库
 * - addWords: 添加单词到词库
 */
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, setId, name, words } = event;

  try {
    switch (action) {
      case 'list':
        return await listWordSets();
      case 'getWords':
        return await getWords(setId);
      case 'create':
        return await createWordSet(name);
      case 'delete':
        return await deleteWordSet(setId);
      case 'addWords':
        return await addWords(setId, words);
      default:
        return { code: -1, msg: '未知操作' };
    }
  } catch (e) {
    console.error('云函数错误', e);
    return { code: -1, msg: e.message || '服务器错误' };
  }
};

/**
 * 获取词库列表
 */
async function listWordSets() {
  const result = await db.collection('wordSets')
    .orderBy('createdAt', 'desc')
    .get();

  return {
    code: 0,
    msg: 'success',
    data: result.data,
  };
}

/**
 * 获取词库中的单词
 * 注意：微信云开发单次 .get() 最多返回 100 条，需分页拉全量
 */
async function getWords(setId) {
  const setResult = await db.collection('wordSets').doc(setId).get();

  if (!setResult.data) {
    return { code: -1, msg: '词库不存在' };
  }

  const PAGE = 100;
  const allWords = [];
  let skip = 0;
  let batch;

  do {
    batch = await db
      .collection('words')
      .where({ setId })
      .orderBy('index', 'asc')
      .skip(skip)
      .limit(PAGE)
      .get();

    allWords.push(...batch.data);
    skip += batch.data.length;
  } while (batch.data.length === PAGE);

  return {
    code: 0,
    msg: 'success',
    data: allWords,
  };
}

/**
 * 创建词库
 */
async function createWordSet(name) {
  const result = await db.collection('wordSets').add({
    data: {
      name,
      wordCount: 0,
      createdAt: db.serverDate(),
      lastUsed: null,
    },
  });

  return {
    code: 0,
    msg: 'success',
    data: { _id: result._id },
  };
}

/**
 * 删除词库及其单词
 */
async function deleteWordSet(setId) {
  // 删除词库
  await db.collection('wordSets').doc(setId).remove();

  // 删除词库中的所有单词
  await db.collection('words').where({ setId }).remove();

  return { code: 0, msg: '删除成功' };
}

/**
 * 添加单词到词库
 */
async function addWords(setId, words) {
  if (!words || !Array.isArray(words)) {
    return { code: -1, msg: '单词数据格式错误' };
  }

  // 批量插入单词
  const insertData = words.map((word, index) => ({
    setId,
    word: word.word || '',
    translation: word.translation || '',
    phonetic: word.phonetic || '',
    index,
    createdAt: db.serverDate(),
  }));

  if (insertData.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize);
      await db.collection('words').add({ data: batch });
    }

    // 更新词库的单词数量
    const setResult = await db.collection('wordSets').doc(setId).get();
    if (setResult.data) {
      await db.collection('wordSets').doc(setId).update({
        data: {
          wordCount: db.command.inc(insertData.length),
        },
      });
    }
  }

  return { code: 0, msg: '添加成功', data: { count: insertData.length } };
}
