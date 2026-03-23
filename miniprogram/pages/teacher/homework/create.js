/**
 * 创建作业
 */
Page({
  behaviors: [require('../../../behaviors/themeVars')],
  data: {
    currentStep: 1,
    homeworkType: '',
    classList: [],
    selectedClassId: '',
    selectedClassName: '',
    homeworkTitle: '',
    contentLines: [],
    deadline: '',
  },
  onLoad() { this.loadClasses(); },
  loadClasses() {
    this.setData({
      classList: [
        { _id: '1', name: '三年级一班', studentCount: 28 },
        { _id: '2', name: '三年级二班', studentCount: 30 },
      ],
    });
  },
  selectType(e) { this.setData({ homeworkType: e.currentTarget.dataset.type }); },
  selectClass(e) {
    const classId = e.currentTarget.dataset.id;
    const classItem = this.data.classList.find(item => item._id === classId);
    this.setData({ selectedClassId: classId, selectedClassName: classItem ? classItem.name : '' });
  },
  nextStep() {
    const step = this.data.currentStep;
    if (step === 1 && !this.data.homeworkType) { wx.showToast({ title: '请选择作业类型', icon: 'none' }); return; }
    if (step === 2) {
      if (!this.data.selectedClassId) { wx.showToast({ title: '请选择班级', icon: 'none' }); return; }
      if (!this.data.homeworkTitle.trim()) { wx.showToast({ title: '请输入标题', icon: 'none' }); return; }
    }
    this.setData({ currentStep: step + 1 });
  },
  prevStep() { this.setData({ currentStep: this.data.currentStep - 1 }); },
  onTitleInput(e) { this.setData({ homeworkTitle: e.detail.value }); },
  onContentInput(e) {
    const content = e.detail.value;
    this.setData({ contentLines: content.split('\n').filter(line => line.trim()) });
  },
  onDeadlineChange(e) { this.setData({ deadline: e.detail.value }); },
  publishHomework() {
    if (!this.data.deadline) { wx.showToast({ title: '请选择截止时间', icon: 'none' }); return; }
    wx.showLoading({ title: '发布中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({ title: '发布成功', content: '作业已成功布置', showCancel: false, success: () => { wx.redirectTo({ url: '/pages/teacher/homework/list' }); } });
    }, 1500);
  },
});
