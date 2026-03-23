/**
 * 作业页面 - TabBar页面
 */
const CACHE_KEY = 'homework_cache';
const CACHE_TTL = 5 * 60 * 1000;

Page({
  behaviors: [require('../../../behaviors/themeVars')],
  data: {
    currentFilter: 'all',
    filterOptions: [
      { key: 'all', label: '全部' },
      { key: 'voice', label: '语音朗读' },
      { key: 'word', label: '单词带背' },
    ],
    homeworkList: [],
    emptyState: { show: false, message: '暂无作业' },
  },

  onLoad() {
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
        this.setData({ homeworkList: cached.data });
        this._dataLoaded = true;
      }
    } catch (e) {}
  },

  async _refreshCloud() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'homework',
        data: { action: 'list' },
      });

      if (res.result.code === 0) {
        const list = res.result.data || [];
        wx.setStorageSync(CACHE_KEY, { data: list, timestamp: Date.now() });
        if (!this._dataLoaded) {
          this.setData({ homeworkList: list });
          this._dataLoaded = true;
        } else {
          this.setData({ homeworkList: list });
        }
      }
    } catch (e) {
      if (!this._dataLoaded) {
        this.setData({
          homeworkList: [
            { _id: '1', title: 'Unit 1 跟读练习', className: '三年级一班', deadline: '2024-01-20', submitCount: 25, totalCount: 28, type: 'voice', status: 'ongoing' },
            { _id: '2', title: '第二单元单词带背', className: '三年级二班', deadline: '2024-01-22', submitCount: 30, totalCount: 30, type: 'word', status: 'completed' },
            { _id: '3', title: '第三单元朗读', className: '三年级一班', deadline: '2024-01-25', submitCount: 12, totalCount: 28, type: 'voice', status: 'ongoing' },
          ],
        });
        this._dataLoaded = true;
      }
    }
  },

  switchFilter(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ currentFilter: type });
  },

  goToCreateHomework() {
    wx.navigateTo({ url: '/pages/teacher/homework/create/create' });
  },

  goToDetail(e) {
    wx.navigateTo({ url: `/pages/teacher/homework/detail/detail?id=${e.currentTarget.dataset.id}` });
  },

  getFilteredList() {
    if (this.data.currentFilter === 'all') return this.data.homeworkList;
    return this.data.homeworkList.filter(item => item.type === this.data.currentFilter);
  },
});
