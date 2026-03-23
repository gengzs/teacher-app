/**
 * 全局学生列表
 */
const app = getApp();

Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    searchKey: '',
    students: [],
    filteredStudents: [],
    showLeftStudents: false,
    loading: false,
  },

  onLoad() {
    this.loadStudents();
  },

  onShow() {
    this.loadStudents();
  },

  async loadStudents() {
    this.setData({ loading: true });

    try {
      const res = await wx.cloud.callFunction({
        name: 'class',
        data: {
          action: 'getAllStudents',
          status: this.data.showLeftStudents ? 'all' : 'active',
        },
      });

      if (res.result.code === 0) {
        this.setData({
          students: res.result.data,
          filteredStudents: res.result.data,
        });
      } else {
        wx.showToast({ title: res.result.msg, icon: 'none' });
      }
    } catch (e) {
      console.error('加载学生列表失败', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSearch(e) {
    const keyword = e.detail.value || '';
    this.setData({ searchKey: keyword });
    this.filterStudents(keyword);
  },

  filterStudents(keyword) {
    if (!keyword) {
      this.setData({ filteredStudents: this.students });
      return;
    }

    const kw = keyword.toLowerCase();
    const filtered = this.data.students.filter(
      (s) =>
        s.name.toLowerCase().includes(kw) ||
        (s.className && s.className.toLowerCase().includes(kw))
    );
    this.setData({ filteredStudents: filtered });
  },

  toggleShowLeft() {
    this.setData({ showLeftStudents: !this.data.showLeftStudents });
    this.loadStudents();
  },

  goToStudentDetail(e) {
    const studentId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/teacher/records/records?id=${studentId}&name=${encodeURIComponent(e.currentTarget.dataset.name)}`,
    });
  },

  removeStudent(e) {
    const studentId = e.currentTarget.dataset.id;
    const studentName = e.currentTarget.dataset.name;
    const classId = e.currentTarget.dataset.classid;

    wx.showModal({
      title: '移除学生',
      content: `确定要将「${studentName}」从班级移除吗？移除后历史记录会保留。`,
      confirmText: '移除',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'class',
              data: {
                action: 'removeStudent',
                classId,
                studentId,
              },
            });

            if (result.result.code === 0) {
              wx.showToast({ title: '已移除', icon: 'success' });
              this.loadStudents();
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

  onShareAppMessage() {
    return {
      title: '学生管理',
      path: '/pages/teacher/home/home',
    };
  },

  goToClassList() {
    wx.switchTab({ url: '/pages/teacher/shell/shell' });
  },
});
