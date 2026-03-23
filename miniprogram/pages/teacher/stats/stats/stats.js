/**
 * 学习统计
 */
Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    stats: { totalStudents: 86, todayCompleted: 45, avgScore: 85 },
    recentRecords: [],
  },

  onLoad() {
    this.loadData();
  },

  onShow() { this.loadData(); },

  loadData() {
    const recentRecords = [
      { studentName: '张小明', wordSet: 'Unit 1 核心词汇', score: 95, date: '今天' },
      { studentName: '李小红', wordSet: 'Unit 1 核心词汇', score: 88, date: '今天' },
      { studentName: '王小强', wordSet: 'Unit 1 核心词汇', score: 78, date: '昨天' },
    ];
    this.setData({ recentRecords });
  },
});
