/**
 * 班级详情
 */
const app = getApp();
const CLASS_LIST_CACHE_KEY = 'class_list_cache';
const DETAIL_CACHE_TTL = 60 * 1000; // 详情缓存1分钟内不重复请求

Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    classId: '',
    classInfo: {},
    students: [],
    activeStudents: [],
    pendingRequests: 0,
    recentHomework: [],
    stats: {
      totalStudents: 0,
      activeStudents: 0,
      homeworkDone: 0,
      avgScore: 0,
    },
    showAddModal: false,
    addName: '',
    addPhone: '',
    addLoading: false,
    newStudentResult: null,
  },

  onLoad(options) {
    const classId = options.id || '';
    this.setData({ classId });
    this._load(classId);
  },

  onShow() {
    // 仅当缓存超过1分钟才静默刷新，避免每次返回都重新请求
    const cached = app.globalData.detailCache[this.data.classId];
    if (cached && Date.now() - cached._ts < DETAIL_CACHE_TTL) return;
    if (this.data.classId) this.loadData({ silent: true });
  },

  _load(classId) {
    // 1. 优先本地缓存 → 瞬间渲染
    this._renderFromCache(classId);
    // 2. 同步写入全局缓存（如果 Shell 还没写入）
    const globalCache = app.globalData.classCache[classId];
    if (globalCache && !app.globalData.detailCache[classId]) {
      app.globalData.detailCache[classId] = {
        classInfo: globalCache,
        _ts: 0, // 强制下次刷新
      };
    }
    // 3. 后台拉最新数据
    this.loadData({ silent: false });
  },

  _renderFromCache(classId) {
    const cache = app.globalData.detailCache[classId];
    if (cache && cache._ts > 0) {
      const { classInfo, students, activeStudents, pendingRequests, recentHomework, stats } = cache;
      if (classInfo) this.setData({ classInfo, students, activeStudents, pendingRequests, recentHomework, stats });
      return true;
    }
    // 兜底：class list 缓存
    try {
      const listCache = wx.getStorageSync(CLASS_LIST_CACHE_KEY) || [];
      const item = listCache.find(c => c._id === classId);
      if (item) this.setData({ classInfo: item });
    } catch (e) {}
    return false;
  },

  async loadData(opts = {}) {
    const { silent = false } = opts;
    try {
      const res = await wx.cloud.callFunction({
        name: 'class',
        data: {
          action: 'detail',
          classId: this.data.classId,
        },
      });

      const result = res.result;
      if (!result || result.code !== 0) {
        if (!silent) wx.showToast({ title: result?.msg || '加载失败', icon: 'none' });
        return;
      }

      const data = result.data || {};
      const students = Array.isArray(data.students) ? data.students : [];
      const activeStudents = students.filter((s) => s.status === 'active');

      const classInfo = {
        _id: data._id || this.data.classId,
        name: data.name || '未命名班级',
        studentCount: activeStudents.length,
        inviteCode: data.inviteCode || '',
      };

      const recentHomework = [
        { _id: '1', title: 'Unit 1 跟读练习', deadline: '2024-01-20', submitCount: 25, totalCount: 28 },
        { _id: '2', title: '第二单元单词带背', deadline: '2024-01-18', submitCount: 28, totalCount: 28 },
      ];

      const stats = {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        homeworkDone: 45,
        avgScore: 87,
      };

      this.setData({ classInfo, students, activeStudents, pendingRequests: data.pendingRequests || 0, recentHomework, stats });

      // 写入全局缓存，子页面直接读
      app.globalData.detailCache[this.data.classId] = {
        classInfo,
        students,
        activeStudents,
        pendingRequests: data.pendingRequests || 0,
        recentHomework,
        stats,
        _ts: Date.now(),
      };
    } catch (e) {
      console.error('加载班级详情失败', e);
      if (!silent) wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  // ========== 邀请码操作 ==========
  copyInviteCode() {
    wx.setClipboardData({
      data: this.data.classInfo.inviteCode,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },

  regenerateInviteCode() {
    wx.showModal({
      title: '重新生成邀请码',
      content: '确定要重新生成邀请码吗？原邀请码将失效。',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const result = await wx.cloud.callFunction({
            name: 'class',
            data: { action: 'generateInviteCode', classId: this.data.classId },
          });
          if (result.result.code === 0) {
            wx.showToast({ title: '已生成新邀请码', icon: 'success' });
            this.setData({ 'classInfo.inviteCode': result.result.data.inviteCode });
          } else {
            wx.showToast({ title: result.result.msg, icon: 'none' });
          }
        } catch (e) {
          wx.showToast({ title: '生成失败', icon: 'none' });
        }
      },
    });
  },

  // ========== 班级成员 ==========
  goToStudents() {
    wx.navigateTo({ url: `/pages/teacher/students/list/list?classId=${this.data.classId}` });
  },

  goToJoinRequests() {
    wx.navigateTo({
      url: `/pages/teacher/students/requests/requests?classId=${this.data.classId}&className=${encodeURIComponent(this.data.classInfo.name)}`,
    });
  },

  // ========== 班级资料库 ==========
  goToLibrary() {
    wx.navigateTo({
      url: `/pages/teacher/class/library/library?classId=${this.data.classId}&className=${encodeURIComponent(this.data.classInfo.name)}`,
    });
  },

  // ========== 上课 ==========
  startClass() {
    wx.navigateTo({
      url: `/pages/teacher/recite/recite?classId=${this.data.classId}&className=${encodeURIComponent(this.data.classInfo.name)}`,
    });
  },

  // ========== 布置作业 ==========
  assignHomework() {
    wx.navigateTo({
      url: `/pages/teacher/homework/create/create?classId=${this.data.classId}&className=${encodeURIComponent(this.data.classInfo.name)}`,
    });
  },

  goToHomeworkDetail(e) {
    wx.navigateTo({ url: `/pages/teacher/homework/detail/detail?id=${e.currentTarget.dataset.id}` });
  },

  // ========== 班级统计 ==========
  goToStats() {
    wx.navigateTo({
      url: `/pages/teacher/class/stats/stats?classId=${this.data.classId}&className=${encodeURIComponent(this.data.classInfo.name)}`,
    });
  },

  // ========== 手动添加学生 ==========
  showAddStudentModal() {
    this.setData({ showAddModal: true, addName: '', addPhone: '', newStudentResult: null });
  },

  hideAddModal() {
    this.setData({ showAddModal: false });
  },

  onAddNameInput(e) { this.setData({ addName: e.detail.value }); },
  onAddPhoneInput(e) { this.setData({ addPhone: e.detail.value }); },

  async submitAddStudent() {
    const { addName, addPhone, classId } = this.data;
    if (!addName?.trim()) {
      wx.showToast({ title: '请输入学生姓名', icon: 'none' });
      return;
    }
    this.setData({ addLoading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'class',
        data: { action: 'addStudentManual', classId, name: addName.trim(), phone: addPhone.trim() },
      });
      if (res.result.code === 0) {
        this.setData({ newStudentResult: res.result.data });
        this.loadData();
      } else {
        wx.showToast({ title: res.result.msg, icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '添加失败', icon: 'none' });
    } finally {
      this.setData({ addLoading: false });
    }
  },

  copyAccountInfo() {
    const r = this.data.newStudentResult;
    if (!r) return;
    wx.setClipboardData({
      data: `姓名：${r.name}\n手机：${r.phone || '未填写'}\n初始密码：${r.tempPassword}`,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },

  continueAdd() {
    this.setData({ newStudentResult: null });
  },
});
