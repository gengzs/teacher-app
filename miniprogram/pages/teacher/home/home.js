/**
 * 教师端首页
 */
const CACHE_KEY = 'home_data_cache';
const CACHE_TTL = 5 * 60 * 1000; // 缓存5分钟

Page({
  behaviors: [require('../../../behaviors/themeVars')],
  data: {
    currentDate: '',
    stats: { classCount: 0, studentCount: 0, taskCount: 0 },
    todaySchedule: [],
    pendingHomework: 0,
    pendingRequests: 0,
  },

  onLoad() {
    this.setCurrentDate();
    this._initFromCache();
    this._refreshCloud();
  },

  onShow() {
    // 每次切回来都静默刷新，不阻塞用户
    this._refreshCloud();
  },

  setCurrentDate() {
    const now = new Date();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    this.setData({ currentDate: `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}` });
  },

  _initFromCache() {
    try {
      const cached = wx.getStorageSync(CACHE_KEY);
      if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
        this.setData(cached.data);
        this._dataLoaded = true;
      }
    } catch (e) {}
  },

  async _refreshCloud() {
    try {
      const classRes = await wx.cloud.callFunction({
        name: 'class',
        data: { action: 'list' },
      });

      if (classRes.result.code === 0) {
        const classes = classRes.result.data || [];
        let totalStudents = 0;
        classes.forEach((c) => { totalStudents += c.studentCount || 0; });

        const data = {
          stats: { classCount: classes.length, studentCount: totalStudents, taskCount: 0 },
          todaySchedule: [
            { time: '08:00-08:40', className: '三年级一班', subject: '英语', classId: '1' },
            { time: '10:00-10:40', className: '三年级二班', subject: '英语', classId: '2' },
          ],
        };

        wx.setStorageSync(CACHE_KEY, { data, timestamp: Date.now() });

        if (!this._dataLoaded) {
          this.setData(data);
          this._dataLoaded = true;
        }
      }
    } catch (e) {
      if (!this._dataLoaded) {
        this.setData({ stats: { classCount: 3, studentCount: 86, taskCount: 12 } });
        this._dataLoaded = true;
      }
    }
  },

  goToClassList() {
    wx.switchTab({ url: '/pages/teacher/class/list/list' });
  },

  goToSchedule() {
    wx.switchTab({ url: '/pages/teacher/schedule/schedule' });
  },

  goToHomework() {
    wx.switchTab({ url: '/pages/teacher/homework/homework' });
  },

  goToClassDetail(e) {
    const classId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/teacher/class/detail/detail?id=${classId}` });
  },

  goToCreateHomework() {
    wx.navigateTo({ url: '/pages/teacher/homework/create/create' });
  },

  goToRecite() {
    wx.navigateTo({ url: '/pages/teacher/recite/recite' });
  },

  goToStudents() {
    wx.navigateTo({ url: '/pages/teacher/students/list/list' });
  },

  // 跳转到主题选择页面
  goToTheme() {
    wx.navigateTo({ url: '/pages/theme/theme' });
  },
});
