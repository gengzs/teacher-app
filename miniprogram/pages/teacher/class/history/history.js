/**
 * 上课历史记录
 */
Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    classId: '',
    className: '',
    sessions: [],
    months: [],
    currentMonth: '',
  },

  onLoad(options) {
    this.setData({
      classId: options.classId || '',
      className: options.className || '',
    });
    this.loadHistory();
  },

  loadHistory() {
    // 模拟历史课程数据
    const now = new Date();
    this.setData({
      sessions: [
        {
          _id: '1',
          date: '2024-01-20',
          dateStr: '01月20日',
          time: '08:00',
          type: 'word_recite',
          typeName: '单词带背',
          typeIcon: '📖',
          wordSet: 'Unit 1 核心词汇',
          duration: '25分钟',
          studentCount: 28,
          participateCount: 26,
          avgScore: 85,
        },
        {
          _id: '2',
          date: '2024-01-18',
          dateStr: '01月18日',
          time: '10:00',
          type: 'word_recite',
          typeName: '单词带背',
          typeIcon: '📖',
          wordSet: 'Unit 1 核心词汇',
          duration: '30分钟',
          studentCount: 28,
          participateCount: 28,
          avgScore: 92,
        },
        {
          _id: '3',
          date: '2024-01-15',
          dateStr: '01月15日',
          time: '14:00',
          type: 'voice_reading',
          typeName: '语音朗读',
          typeIcon: '🎤',
          wordSet: '第一课跟读',
          duration: '20分钟',
          studentCount: 28,
          participateCount: 25,
          avgScore: 78,
        },
        {
          _id: '4',
          date: '2024-01-12',
          dateStr: '01月12日',
          time: '08:00',
          type: 'word_recite',
          typeName: '单词带背',
          typeIcon: '📖',
          wordSet: 'Unit 1 核心词汇',
          duration: '28分钟',
          studentCount: 28,
          participateCount: 27,
          avgScore: 88,
        },
      ],
      currentMonth: '2024-01',
    });
  },

  goToSessionDetail(e) {
    const sessionId = e.currentTarget.dataset.id;
    wx.showToast({ title: '查看课程详情', icon: 'none' });
    // TODO: 跳转到课程详情页
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}月${day}日`;
  },

  getWeekday(dateStr) {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  },
});
