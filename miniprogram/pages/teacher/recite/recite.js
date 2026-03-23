/**
 * 单词带背 - 筛词模式
 * 流程：
 * 1. 词库在「词库管理」选好；本页自动沿用上次词库，进入筛词列表
 * 2. 每行：左侧单词，右侧 ✓认识（左） / ✗待学（右）
 * 3. 点 ✓/✗ 只做标记，行不消失；已有标记再点取消
 * 4. 有 ✗ 标记时底部显示「开始学习」按钮
 * 5. 点击「开始学习」→ 进入分组学习页
 */
const LAST_WORD_SET_KEY = 'teacher_last_word_set';
const UNKNOWN_WORDS_KEY  = 'teacher_unknown_words';
const WORD_CACHE_KEY = 'teacher_word_cache_';
const CACHE_TTL = 30 * 60 * 1000; // 词库缓存30分钟

function saveLastWordSet(setId, setName) {
  if (!setId) return;
  try {
    wx.setStorageSync(LAST_WORD_SET_KEY, { setId, setName: setName || '' });
  } catch (e) {
    console.warn('saveLastWordSet', e);
  }
}

function getLastWordSet() {
  try {
    return wx.getStorageSync(LAST_WORD_SET_KEY) || null;
  } catch (e) {
    return null;
  }
}

function loadFromCache(setId) {
  try {
    const cached = wx.getStorageSync(WORD_CACHE_KEY + setId);
    if (cached && cached.timestamp > Date.now() - CACHE_TTL) return cached.words;
  } catch (e) {}
  return null;
}

function saveToCache(setId, words) {
  try {
    wx.setStorageSync(WORD_CACHE_KEY + setId, { words, timestamp: Date.now() });
  } catch (e) {}
}

Page({
  behaviors: [require('../../../behaviors/themeVars')],
  data: {
    setId: '',
    setName: '',

    // 当前模式：filtering | result
    mode: 'filtering',

    // 单词列表（每项带 filterStatus: none | known | unknown）
    allWords: [],

    // 统计
    knownCount: 0,
    unknownCount: 0,
    totalCount: 0,

    // 结果页正确率
    accuracyPercent: 0,
  },

  onLoad(options) {
    const setId   = options.setId   || '';
    const setName = options.setName ? decodeURIComponent(options.setName) : '';

    this.setData({ setId, setName });

    if (setId) {
      saveLastWordSet(setId, setName);
      this.loadWordSet(setId);
      return;
    }

    const last = getLastWordSet();
    if (last && last.setId) {
      this.setData({ setId: last.setId, setName: last.setName || '' });
      this.loadWordSet(last.setId);
      return;
    }

    wx.showToast({ title: '请先在词库管理点「开始学习」', icon: 'none' });
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/teacher/words/words' });
    }, 1200);
  },

  // ========== 换词库 ==========
  goChooseWordSet() {
    wx.navigateTo({ url: '/pages/teacher/words/words' });
  },

  // ========== 加载词库 ==========
  async loadWordSet(setId) {
    // 先读本地缓存，命中则直接用
    const cached = loadFromCache(setId);
    if (cached) {
      this._initWords(cached);
      // 后台静默拉新数据更新缓存
      this._fetchAndCache(setId);
      return;
    }
    await this._fetchAndCache(setId);
  },

  async _fetchAndCache(setId, silent) {
    if (!silent) wx.showLoading({ title: '加载中...' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'wordset',
        data: { action: 'getWords', setId },
      });
      if (!silent) wx.hideLoading();

      if (res.result.code === 0 && res.result.data.length > 0) {
        this._initWords(res.result.data);
        saveToCache(setId, res.result.data);
      } else if (!silent) {
        wx.showToast({ title: '词库为空', icon: 'none' });
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/teacher/words/words' });
        }, 1200);
      }
    } catch (e) {
      if (!silent) wx.hideLoading();
      console.error('加载单词失败', e);
      if (!silent) this._initWords([]);
    }
  },

  _initWords(words) {
    // 给每个词加 filterStatus 字段
    const allWords = words.map(w => ({ ...w, filterStatus: 'none' }));
    this.setData({
      allWords,
      totalCount: allWords.length,
      knownCount: 0,
      unknownCount: 0,
      mode: 'filtering',
    });
  },

  // ========== 统计（从 allWords 实时计算） ==========
  _recalc() {
    const known   = this.data.allWords.filter(w => w.filterStatus === 'known').length;
    const unknown = this.data.allWords.filter(w => w.filterStatus === 'unknown').length;
    this.setData({ knownCount: known, unknownCount: unknown });
  },

  // ========== 标记认识（可重复点击取消） ==========
  markKnownAt(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    const words = this.data.allWords;
    if (Number.isNaN(idx) || idx < 0 || idx >= words.length) return;
    const current = words[idx].filterStatus;
    const next = current === 'known' ? 'none' : 'known';
    // 用点号路径直接改单个元素，避免重建整个数组导致全量渲染
    this.setData({ [`allWords[${idx}].filterStatus`]: next });
    // 增量更新计数，避免每次遍历整个数组
    let known = this.data.knownCount, unknown = this.data.unknownCount;
    if (current === 'known') known--; else if (current === 'unknown') unknown--;
    if (next === 'known') known++; else if (next === 'unknown') unknown++;
    this.setData({ knownCount: known, unknownCount: unknown });
  },

  // ========== 标记不认识（可重复点击取消） ==========
  markUnknownAt(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    const words = this.data.allWords;
    if (Number.isNaN(idx) || idx < 0 || idx >= words.length) return;
    const current = words[idx].filterStatus;
    const next = current === 'unknown' ? 'none' : 'unknown';
    this.setData({ [`allWords[${idx}].filterStatus`]: next });
    let known = this.data.knownCount, unknown = this.data.unknownCount;
    if (current === 'known') known--; else if (current === 'unknown') unknown--;
    if (next === 'known') known++; else if (next === 'unknown') unknown++;
    this.setData({ knownCount: known, unknownCount: unknown });
  },

  // ========== 底部按钮：无待学词时提示 ==========
  onStartLearningTap() {
    if (this.data.unknownCount <= 0) {
      wx.showToast({ title: '请先点 ✗ 标记不认识的词', icon: 'none' });
      return;
    }
    this.startLearning();
  },

  // ========== 进入分组学习：有 ✗ 标记的单词 ==========
  startLearning() {
    const unknownWords = this.data.allWords
      .filter(w => w.filterStatus === 'unknown')
      .map(({ _id, word, phonetic, translation, index }) =>
        ({ _id, word, phonetic, translation, index })
      );

    if (unknownWords.length === 0) return;

    try {
      wx.setStorageSync(UNKNOWN_WORDS_KEY, unknownWords);
    } catch (e) {
      console.warn('save unknown words', e);
    }

    wx.navigateTo({
      url: `/pages/teacher/recite/groupLearn/groupLearn?count=${unknownWords.length}&setName=${encodeURIComponent(this.data.setName)}`,
    });
  },

  // ========== 显示结果 ==========
  showResult() {
    const { knownCount, totalCount } = this.data;
    const accuracyPercent = totalCount > 0 ? Math.round((knownCount / totalCount) * 100) : 0;
    this.setData({ mode: 'result', accuracyPercent });
  },

  // ========== 重新开始 ==========
  restart() {
    if (this.data.setId) {
      this.loadWordSet(this.data.setId);
    }
  },

  // ========== 返回词库管理 ==========
  goBack() {
    wx.reLaunch({ url: '/pages/teacher/shell/shell?tab=homework' });
  },

  // ========== 退出 ==========
  exit() {
    wx.reLaunch({ url: '/pages/teacher/shell/shell?tab=homework' });
  },
});
