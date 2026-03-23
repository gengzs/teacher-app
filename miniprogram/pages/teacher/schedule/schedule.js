/**
 * 排课管理
 */
const CACHE_KEY = 'schedule_cache';
const CACHE_TTL = 5 * 60 * 1000;

Page({
  behaviors: [require('../../../behaviors/themeVars')],
  data: {
    viewMode: 'day',
    weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    currentWeekday: 0,
    scheduleList: [],
    currentDaySchedule: [],
    weekSchedule: [],
    loading: false,
  },

  onLoad() {
    const today = new Date().getDay();
    const weekday = today === 0 ? 6 : today - 1;
    this.setData({ currentWeekday: weekday });

    this._initFromCache();
    this._refreshCloud();
  },

  onShow() {
    this._refreshCloud();
  },

  _initFromCache() {
    try {
      const cached = wx.getStorageSync(CACHE_KEY);
      if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
        this._applyData(cached.data);
        this._dataLoaded = true;
      }
    } catch (e) {}
  },

  async _refreshCloud() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'schedule',
        data: { action: 'list' },
      });

      if (res.result.code === 0) {
        wx.setStorageSync(CACHE_KEY, { data: res.result.data, timestamp: Date.now() });
        if (!this._dataLoaded) {
          this._applyData(res.result.data);
          this._dataLoaded = true;
        } else {
          this.setData({ scheduleList: res.result.data });
          this.updateCurrentDaySchedule();
          this.updateWeekSchedule();
        }
      }
    } catch (e) {
      if (!this._dataLoaded) {
        this._applyData([
          { day: 0, time: '08:00-08:40', className: '三年级一班', subject: '英语', classId: '1' },
        ]);
        this._dataLoaded = true;
      }
    }
  },

  _applyData(scheduleList) {
    this.setData({ scheduleList });
    this.updateCurrentDaySchedule();
    this.updateWeekSchedule();
  },

  updateCurrentDaySchedule() {
    const schedule = this.data.scheduleList.filter(
      (item) => item.day === this.data.currentWeekday
    );
    this.setData({ currentDaySchedule: schedule });
  },

  updateWeekSchedule() {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const daySchedule = this.data.scheduleList.filter((item) => item.day === i);
      week.push({
        day: i,
        label: this.data.weekDays[i],
        hasClass: daySchedule.length > 0,
        count: daySchedule.length,
        classes: daySchedule,
      });
    }
    this.setData({ weekSchedule: week });
  },

  toggleViewMode() {
    const mode = this.data.viewMode === 'day' ? 'week' : 'day';
    this.setData({ viewMode: mode });
  },

  selectDay(e) {
    const day = e.currentTarget.dataset.day;
    this.setData({ currentWeekday: day });
    this.updateCurrentDaySchedule();
  },

  formatDate(dayIndex) {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilTarget = (dayIndex + 1) - (currentDay === 0 ? 7 : currentDay);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
  },

  goToClass(e) {
    const classId = e.currentTarget.dataset.classid;
    wx.navigateTo({ url: `/pages/teacher/class/detail/detail?id=${classId}` });
  },

  addSchedule() {
    wx.showModal({
      title: '添加课程',
      editable: true,
      placeholderText: '格式：时间|班级|科目\n例如：08:00-08:40|三年级一班|英语',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.showToast({ title: '添加成功', icon: 'success' });
          this._refreshCloud();
        }
      },
    });
  },
});
