/**
 * 排课管理
 */
Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    currentWeekday: 0,
    scheduleList: [],
    currentDaySchedule: [],
  },

  onLoad() { this.loadData(); },
  onShow() { this.loadData(); },

  loadData() {
    const scheduleList = [
      { day: 0, time: '08:00-08:40', className: '三年级一班', subject: '英语' },
      { day: 0, time: '09:00-09:40', className: '三年级二班', subject: '英语' },
      { day: 1, time: '08:00-08:40', className: '四年级一班', subject: '英语' },
    ];
    this.setData({ scheduleList });
    this.updateCurrentDaySchedule();
  },

  selectDay(e) {
    const day = e.currentTarget.dataset.day;
    this.setData({ currentWeekday: day });
    this.updateCurrentDaySchedule();
  },

  updateCurrentDaySchedule() {
    const schedule = this.data.scheduleList.filter(item => item.day === this.data.currentWeekday);
    this.setData({ currentDaySchedule: schedule });
  },

  addSchedule() {
    wx.showModal({
      title: '添加课程',
      editable: true,
      placeholderText: '格式：时间|班级|科目',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.showToast({ title: '添加成功', icon: 'success' });
          this.loadData();
        }
      },
    });
  },
});
