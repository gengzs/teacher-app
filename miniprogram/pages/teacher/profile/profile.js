/**
 * 我的页面 - TabBar页面
 */
Page({
  behaviors: [require('../../../behaviors/themeVars')],
  data: {
    userInfo: {
      name: '张老师',
      school: '某某小学',
      avatar: '',
    },
    stats: {
      classCount: 3,
      studentCount: 86,
      taskCount: 12,
    },
    menuItems: [
      { id: 'theme', icon: '🎨', title: '主题设置', subtitle: '自定义应用外观' },
      { id: 'createClass', icon: '🏫', title: '创建班级', subtitle: '新建班级并获取邀请码' },
      { id: 'words', icon: '📖', title: '单词复习', subtitle: '设置抗遗忘复习计划' },
      { id: 'schedule', icon: '📅', title: '排课管理', subtitle: '管理课程表' },
      { id: 'stats', icon: '📊', title: '学习统计', subtitle: '查看学生数据' },
      { id: 'records', icon: '📝', title: '学习记录', subtitle: '学生完成情况' },
      { id: 'students', icon: '👥', title: '学生管理', subtitle: '查看全部学生' },
      { id: 'settings', icon: '⚙️', title: '设置', subtitle: '账号和偏好设置' },
    ],
  },

  onLoad() {
  },

  onShow() { },

  goToPage(e) {
    const id = e.currentTarget.dataset.id;
    if (id === 'createClass') {
      this.createClass();
      return;
    }
    if (id === 'theme') {
      wx.navigateTo({ url: '/pages/theme/theme' });
      return;
    }
    const routes = {
      words: '/pages/teacher/recite/recite',
      schedule: '/pages/teacher/schedule/schedule',
      stats: '/pages/teacher/stats/stats/stats',
      records: '/pages/teacher/records/records/records',
      students: '/pages/teacher/students/list/list',
    };
    if (routes[id]) {
      wx.navigateTo({ url: routes[id] });
    }
  },

  // 创建班级
  createClass() {
    wx.showModal({
      title: '创建班级',
      editable: true,
      placeholderText: '请输入班级名称',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'class',
              data: { action: 'create', name: res.content },
            });
            if (result.result.code === 0) {
              wx.showToast({ title: '创建成功', icon: 'success' });
            } else {
              wx.showToast({ title: result.result.msg || '创建失败', icon: 'none' });
            }
          } catch (e) {
            wx.showToast({ title: '创建失败', icon: 'none' });
          }
        }
      },
    });
  },

  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '英语口语助手 v1.0.0\n帮助教师高效布置口语作业',
      showCancel: false,
    });
  },
});
