/**
 * 单词检测页
 * - 列出所有生词，每行一个单词，右侧 ✓/✗
 * - 点 ✓/✗ 标记，标记后行变色
 * - 全部标记后点「查看检测结果」弹出结果弹窗
 * - 结果弹窗含：打印笔记PDF、重新检测、返回学习
 */
const UNKNOWN_WORDS_KEY = 'teacher_unknown_words';

Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    setName: '',
    totalCount: 0,
    markedCount: 0,
    rightCount: 0,
    wrongCount: 0,
    accuracyPercent: 0,
    progressPercent: 0,

    allWords: [],   // 每项含 testStatus: 'none' | 'right' | 'wrong'

    showResult: false,
  },

  onLoad(options) {
    const setName = options.setName ? decodeURIComponent(options.setName) : '';

    let allWords = [];
    try {
      allWords = wx.getStorageSync(UNKNOWN_WORDS_KEY) || [];
    } catch (e) {
      console.warn('读取生词失败', e);
    }

    if (allWords.length === 0) {
      wx.showToast({ title: '无生词可检测', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }

    const wordsWithStatus = allWords.map(w => ({
      ...w,
      testStatus: 'none',
    }));

    this.setData({
      setName,
      allWords: wordsWithStatus,
      totalCount: wordsWithStatus.length,
    });
  },

  _recalc() {
    const words = this.data.allWords;
    const markedCount = words.filter(w => w.testStatus !== 'none').length;
    const rightCount = words.filter(w => w.testStatus === 'right').length;
    const wrongCount = words.filter(w => w.testStatus === 'wrong').length;
    const accuracyPercent = markedCount > 0 ? Math.round((rightCount / markedCount) * 100) : 0;
    const progressPercent = Math.round((markedCount / this.data.totalCount) * 100);

    this.setData({ markedCount, rightCount, wrongCount, accuracyPercent, progressPercent });
  },

  onMarkRight(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    if (Number.isNaN(idx)) return;
    const words = [...this.data.allWords];
    const current = words[idx].testStatus;
    words[idx] = { ...words[idx], testStatus: current === 'right' ? 'none' : 'right' };
    this.setData({ allWords: words });
    this._recalc();
  },

  onMarkWrong(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    if (Number.isNaN(idx)) return;
    const words = [...this.data.allWords];
    const current = words[idx].testStatus;
    words[idx] = { ...words[idx], testStatus: current === 'wrong' ? 'none' : 'wrong' };
    this.setData({ allWords: words });
    this._recalc();
  },

  onFinishTest() {
    if (this.data.markedCount === 0) {
      wx.showToast({ title: '请先标记至少一个词', icon: 'none' });
      return;
    }
    this.setData({ showResult: true });
  },

  closeResult() {
    this.setData({ showResult: false });
  },

  // 打印笔记 PDF（后续接入真实PDF生成）
  onPrintNotes() {
    const wordsWithNotes = this.data.allWords.filter(w => w.note);
    if (wordsWithNotes.length === 0) {
      wx.showToast({ title: '暂无笔记可打印', icon: 'none' });
      return;
    }
    // TODO: 接入 PDF 生成云函数，传入 wordsWithNotes
    wx.showToast({ title: `准备打印 ${wordsWithNotes.length} 条笔记...`, icon: 'none' });
    console.log('笔记数据：', wordsWithNotes);
  },

  onRetryTest() {
    const words = this.data.allWords.map(w => ({ ...w, testStatus: 'none' }));
    this.setData({ allWords: words, showResult: false });
    this._recalc();
  },

  onBackToLearn() {
    this.setData({ showResult: false });
    wx.navigateBack();
  },

  onFinishAndBack() {
    this.setData({ showResult: false });
    // 完成后返回上一页（课程）
    wx.navigateBack();
  },

  goBack() {
    wx.navigateBack();
  },
});
