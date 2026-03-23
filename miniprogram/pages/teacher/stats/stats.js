/**
 * 学习统计
 */
Page({
  behaviors: [require('../../../behaviors/themeVars')],
  data: {
    currentTab: 'stats',
    stats: { totalStudents: 86, todayCompleted: 45, avgScore: 85 }, recentRecords: [] },
  onLoad() {
    const lastTab = getApp().globalData.lastTab || 'stats';
    this.setData({ currentTab: lastTab });
    this.loadData();
  },
  loadData() {
    this.setData({
      recentRecords: [
        { studentName: '张小明', wordSet: 'Unit 1 核心词汇', score: 95, date: '今天' },
        { studentName: '李小红', wordSet: 'Unit 1 核心词汇', score: 88, date: '今天' },
        { studentName: '王小强', wordSet: 'Unit 1 核心词汇', score: 78, date: '昨天' },
      ],
    });
  },

  onTabSwitch(e) {
    const tab = e.detail.tab;
    this.setData({ currentTab: tab });
    getApp().globalData.lastTab = tab;
    wx.reLaunch({ url: '/pages/teacher/shell/shell?tab=' + tab });
  },
});
