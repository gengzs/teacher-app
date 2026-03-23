/**
 * 入班申请审核页面
 */
Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    classId: '',
    className: '',
    requests: [],
    loading: false,
    emptyText: '暂无待审核的入班申请',
  },

  onLoad(options) {
    this.setData({
      classId: options.classId || '',
      className: options.className || '',
    });
  },

  onShow() {
    this.loadRequests();
  },

  async loadRequests() {
    this.setData({ loading: true });

    try {
      const res = await wx.cloud.callFunction({
        name: 'class',
        data: {
          action: 'getJoinRequests',
          classId: this.data.classId,
        },
      });

      if (res.result.code === 0) {
        this.setData({ requests: res.result.data });
      } else {
        wx.showToast({ title: res.result.msg, icon: 'none' });
      }
    } catch (e) {
      console.error('加载申请列表失败', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hour}:${minute}`;
  },

  approveRequest(e) {
    const requestId = e.currentTarget.dataset.id;
    const studentName = e.currentTarget.dataset.name;

    wx.showModal({
      title: '同意入班',
      content: `确定同意「${studentName}」加入班级？`,
      confirmText: '同意',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'class',
              data: {
                action: 'approveJoinRequest',
                requestId,
                classId: this.data.classId,
              },
            });

            if (result.result.code === 0) {
              wx.showToast({ title: '已同意', icon: 'success' });
              this.loadRequests();
            } else {
              wx.showToast({ title: result.result.msg, icon: 'none' });
            }
          } catch (e) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      },
    });
  },

  rejectRequest(e) {
    const requestId = e.currentTarget.dataset.id;
    const studentName = e.currentTarget.dataset.name;

    wx.showModal({
      title: '拒绝申请',
      content: `确定拒绝「${studentName}」的入班申请？`,
      confirmText: '拒绝',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'class',
              data: {
                action: 'rejectJoinRequest',
                requestId,
              },
            });

            if (result.result.code === 0) {
              wx.showToast({ title: '已拒绝', icon: 'success' });
              this.loadRequests();
            } else {
              wx.showToast({ title: result.result.msg, icon: 'none' });
            }
          } catch (e) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      },
    });
  },

  onTabSwitch(e) {
    const tab = e.detail.tab;
    this.setData({ currentTab: tab });
    getApp().globalData.lastTab = tab;
    wx.reLaunch({ url: '/pages/teacher/shell/shell?tab=' + tab });
  },
});
