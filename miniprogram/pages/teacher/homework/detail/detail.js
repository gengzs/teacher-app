/**
 * 作业详情
 */
Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    homeworkId: '',
    homeworkInfo: {},
    submissions: [],
  },

  onLoad(options) {
    this.setData({ homeworkId: options.id || '' });
    this.loadData();
  },

  loadData() {
    const homeworkInfo = {
      title: 'Unit 1 跟读练习',
      className: '三年级一班',
      deadline: '2024-01-20',
      type: 'voice',
      content: 'Good morning.\nHow are you?\nNice to meet you.',
      status: 'ongoing',
      submitCount: 25,
      totalCount: 28,
    };

    const submissions = [
      { studentId: '1', studentName: '张小明', score: 95, submitTime: '14:30', status: 'completed' },
      { studentId: '2', studentName: '李小红', score: 88, submitTime: '15:20', status: 'completed' },
      { studentId: '3', studentName: '王小强', score: 0, submitTime: '', status: 'pending' },
      { studentId: '4', studentName: '陈小花', score: 92, submitTime: '16:10', status: 'completed' },
      { studentId: '5', studentName: '赵小强', score: 0, submitTime: '', status: 'pending' },
    ];

    this.setData({ homeworkInfo, submissions });
  },

  // 查看学生音频
  viewSubmission(e) {
    const student = this.data.submissions.find(s => s.studentId === e.currentTarget.dataset.id);
    if (student && student.status === 'completed') {
      wx.showToast({ title: '播放学生录音', icon: 'loading' });
      // 实际项目中应该播放音频
    } else {
      wx.showToast({ title: '学生还未提交', icon: 'none' });
    }
  },
});
