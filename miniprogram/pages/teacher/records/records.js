/**
 * 学生学习记录
 */
Page({
  behaviors: [require('../../../behaviors/themeVars')],
  data: { records: [] },
  onLoad() { this.loadData(); },
  loadData() {
    this.setData({
      records: [
        { _id: '1', title: 'Unit 1 跟读练习', date: '2024-01-18', score: 92, type: 'voice' },
        { _id: '2', title: 'Unit 1 核心词汇', date: '2024-01-17', wordCount: 50, type: 'word' },
      ],
    });
  },
});
