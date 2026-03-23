/**
 * 解析单词Excel文件云函数
 * 功能：
 * - 接收Excel文件内容
 * - 解析 A列=英文, B列=中文, C列=音标
 * - 保存到词库集合
 */
const cloud = require('wx-server-sdk');
const xlsx = require('xlsx');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 云函数入口
exports.main = async (event, context) => {
  const { fileContent, fileName, wordSetName } = event;

  try {
    // 解析Excel
    const words = parseExcel(fileContent);

    if (words.length === 0) {
      return { code: -1, msg: 'Excel中没有找到有效的单词数据' };
    }

    // 自动生成词库名称
    const name = wordSetName || fileName.replace(/\.(xlsx|xls)$/i, '') || '未命名词库';

    // 创建词库
    const setResult = await db.collection('wordSets').add({
      data: {
        name,
        wordCount: 0,
        createdAt: db.serverDate(),
        lastUsed: null,
      },
    });

    const setId = setResult._id;

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
      // 微信云数据库：单次 add 传入数组时，实际最多约写入 100 条，必须分批循环插入
      const batchSize = 100;
      for (let i = 0; i < insertData.length; i += batchSize) {
        const batch = insertData.slice(i, i + batchSize);
        await db.collection('words').add({ data: batch });
      }

      // 更新词库的单词数量
      await db.collection('wordSets').doc(setId).update({
        data: {
          wordCount: insertData.length,
        },
      });
    }

    return {
      code: 0,
      msg: '解析成功',
      data: {
        setId,
        name,
        wordCount: insertData.length,
      },
    };
  } catch (e) {
    console.error('解析Excel失败', e);
    return { code: -1, msg: '解析失败：' + (e.message || '未知错误') };
  }
};

/**
 * 解析Excel文件内容
 * @param {string} fileContent - Base64编码的文件内容
 * @returns {Array} 单词数组
 */
function parseExcel(fileContent) {
  // 将base64转换为buffer
  const buffer = Buffer.from(fileContent, 'base64');

  // 解析Excel
  const workbook = xlsx.read(buffer, { type: 'buffer' });

  // 获取第一个工作表
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 转换为JSON
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // 解析单词数据（跳过表头）
  const words = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // A列：英文单词（第0列）
    const word = String(row[0] || '').trim();

    // B列：中文翻译（第1列）
    const translation = String(row[1] || '').trim();

    // C列：音标（第2列，可选）
    const phonetic = String(row[2] || '').trim();

    // 只添加有效的单词
    if (word && translation) {
      words.push({
        word,
        translation,
        phonetic: phonetic || '',
      });
    }
  }

  return words;
}
