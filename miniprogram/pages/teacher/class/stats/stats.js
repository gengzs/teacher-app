/**
 * 班级统计
 */
Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    classId: '',
    className: '',
    stats: {
      totalStudents: 28,
      activeStudents: 26,
      totalHomework: 15,
      completedHomework: 380,
      avgScore: 85,
      totalTime: '12小时',
    },
    weeklyData: [
      { day: '周一', score: 88, count: 25 },
      { day: '周二', score: 85, count: 28 },
      { day: '周三', score: 92, count: 26 },
      { day: '周四', score: 78, count: 24 },
      { day: '周五', score: 90, count: 27 },
      { day: '周六', score: 0, count: 0 },
      { day: '周日', score: 0, count: 0 },
    ],
    topStudents: [],
    weakStudents: [],
    recentHomework: [],
  },

  onLoad(options) {
    this.setData({
      classId: options.classId || '',
      className: options.className || '',
    });
    this.loadData();
  },

  loadData() {
    // 模拟数据
    this.setData({
      topStudents: [
        { name: '张小明', avgScore: 96, completed: 15 },
        { name: '李小红', avgScore: 93, completed: 14 },
        { name: '王小强', avgScore: 91, completed: 15 },
        { name: '陈小花', avgScore: 89, completed: 13 },
        { name: '赵小强', avgScore: 88, completed: 14 },
      ],
      weakStudents: [
        { name: '周小丽', avgScore: 65, completed: 8 },
        { name: '吴小杰', avgScore: 68, completed: 10 },
        { name: '郑小华', avgScore: 72, completed: 9 },
      ],
      recentHomework: [
        { title: 'Unit 1 跟读练习', submitRate: 89, avgScore: 85 },
        { title: '第二单元单词带背', submitRate: 100, avgScore: 88 },
        { title: '语音打卡任务', submitRate: 93, avgScore: 82 },
      ],
    });
  },

  getMaxScore() {
    const scores = this.data.weeklyData.map((d) => d.score);
    return Math.max(...scores, 1);
  },

  goToStudentDetail(e) {
    const studentName = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: `/pages/teacher/records/records/records?classId=${this.data.classId}&name=${encodeURIComponent(studentName)}`,
    });
  },
});
