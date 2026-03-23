/**
 * Shell 页面 —— 所有 Tab 内容常驻，切换即时响应
 * 详情/资料库也做成覆盖层，彻底消除页面冷启动
 */
const CLASSES_ORDER_KEY = 'teacher_classes_order';
const CACHE_TTL = 5 * 60 * 1000;

Page({
  behaviors: [require('../../../behaviors/themeVars')],
  data: {
    currentTab: 'home',

    // ============ 覆盖层（详情/资料库/布置作业）============
    overlayPage: '',   // '' | 'detail' | 'library' | 'homework'
    detailData: {},    // 班级详情数据
    libraryData: {},   // 资料库数据
    homeworkData: {    // 布置作业数据
      currentStep: 1,
      homeworkType: '',
      homeworkTitle: '',
      homeworkContent: '',
      contentLines: [],
      selectedClassId: '',
      selectedClassName: '',
      selectedArticles: [],
      deadline: '',
      minDate: '',
    },

    // ============ 首页 ============
    currentDate: '',
    stats: { classCount: 0, studentCount: 0, taskCount: 0 },
    todaySchedule: [],

    // ============ 班级 ============
    classes: [],
    dragging: false,
    dragIndex: -1,

    // ============ 课表 ============
    viewMode: 'day',
    weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    currentWeekday: 0,
    scheduleList: [],
    currentDaySchedule: [],
    weekSchedule: [],

    // ============ 作业 ============
    currentFilter: 'all',
    filterOptions: [
      { key: 'all', label: '全部' },
      { key: 'voice', label: '语音朗读' },
      { key: 'word', label: '单词带背' },
    ],
    homeworkList: [],

    // ============ 我的 ============
    userInfo: { name: '张老师', school: '某某小学' },
    currentThemeId: 'pink',
    theme: {
      id: 'pink',
      name: '樱花粉',
      primary: '#F9E2E6',
      dark: '#F5D0D8',
      accent: '#C47786',
      text: '#8B6B75',
      light: '#FDF6F8',
      gradient: 'linear-gradient(135deg, #F9E2E6 0%, #F5D0D8 100%)',
    },
    profileGroups: [
      {
        title: '班级管理',
        items: [
          { id: 'createClass', icon: '🏫', title: '创建班级', subtitle: '新建班级并获取邀请码' },
          { id: 'students', icon: '👥', title: '学生管理', subtitle: '查看全部学生' },
        ],
      },
      {
        title: '学习工具',
        items: [
          { id: 'words', icon: '📖', title: '单词复习', subtitle: '设置抗遗忘复习计划' },
          { id: 'schedule', icon: '📅', title: '排课管理', subtitle: '管理课程表' },
          { id: 'stats', icon: '📊', title: '学习统计', subtitle: '查看学生数据' },
          { id: 'records', icon: '📝', title: '学习记录', subtitle: '学生完成情况' },
        ],
      },
      {
        title: '系统',
        items: [
          { id: 'theme', icon: '🎨', title: '主题设置', subtitle: '更换应用配色' },
          { id: 'settings', icon: '⚙️', title: '设置', subtitle: '账号和偏好设置' },
        ],
      },
    ],

    // ============ 布置作业静态数据 ============
    homeworkTypes: [
      { key: 'voice', icon: '🎤', label: '语音朗读', desc: '输入句子，学生跟读并录音' },
      { key: 'article', icon: '📄', label: '资料库选文', desc: '从班级资料库选择文章布置' },
    ],
  },

  // ============================================================
  // 生命周期
  // ============================================================
  onLoad() {
    this._initWeekday();
    this._loadAllData();
  },

  onShow() {
    // 每次显示页面时刷新主题
    this._applyTheme();
  },

  // 应用主题
  _applyTheme() {
    const app = getApp();
    const theme = app.getTheme();
    this.setData({
      theme,
      currentThemeId: app.globalData.currentTheme,
    });
    // 更新导航栏
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: theme.primary,
    });
  },

  // ============================================================
  // 一次性加载所有数据
  // ============================================================
  _loadAllData() {
    this._initFromCache('home');
    this._initFromCache('class');
    this._initFromCache('schedule');
    this._initFromCache('homework');
    this._setCurrentDate();
    this._refreshAllCloud();
  },

  _initWeekday() {
    const today = new Date().getDay();
    this.setData({ currentWeekday: today === 0 ? 6 : today - 1 });
  },

  _setCurrentDate() {
    const now = new Date();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    this.setData({ currentDate: `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}` });
  },

  // ============================================================
  // 缓存读取
  // ============================================================
  _initFromCache(tab) {
    const map = {
      home:     { key: 'home_data_cache',  apply: '_applyHomeCache' },
      class:    { key: 'class_list_cache', apply: '_applyClassCache' },
      schedule: { key: 'schedule_cache',   apply: '_applyScheduleCache' },
      homework: { key: 'homework_cache',   apply: '_applyHomeworkCache' },
    };
    const cfg = map[tab];
    if (!cfg) return;
    try {
      const cached = wx.getStorageSync(cfg.key);
      if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
        this[cfg.apply](cached.data);
        this[`_${tab}_loaded`] = true;
      }
    } catch (e) {}
  },

  _applyHomeCache(data) {
    this.setData({
      stats: data.stats || this.data.stats,
      todaySchedule: data.todaySchedule || [],
    });
  },

  _applyClassCache(classes) {
    classes.forEach(c => { getApp().globalData.classCache[c._id] = c; });
    this.setData({ classes: this._applyOrder(classes) });
  },

  _applyScheduleCache(scheduleList) {
    this.setData({ scheduleList });
    this.updateCurrentDaySchedule();
    this.updateWeekSchedule();
  },

  _applyHomeworkCache(list) {
    this.setData({ homeworkList: list });
  },

  _applyOrder(classes) {
    const savedOrder = wx.getStorageSync(CLASSES_ORDER_KEY) || [];
    if (!savedOrder.length) return classes;
    const orderMap = {};
    savedOrder.forEach((id, i) => { orderMap[id] = i; });
    return [...classes].sort((a, b) => {
      const ai = orderMap[a._id];
      const bi = orderMap[b._id];
      if (ai === undefined) return 1;
      if (bi === undefined) return -1;
      return ai - bi;
    });
  },

  // ============================================================
  // 批量云函数请求
  // ============================================================
  _refreshAllCloud() {
    Promise.allSettled([
      this._refreshHomeCloud(),
      this._refreshClassCloud(),
      this._refreshScheduleCloud(),
      this._refreshHomeworkCloud(),
    ]);
  },

  async _refreshHomeCloud() {
    try {
      const res = await wx.cloud.callFunction({ name: 'class', data: { action: 'list' } });
      if (res.result && res.result.code === 0) {
        const classes = res.result.data || [];
        let totalStudents = 0;
        classes.forEach(c => { totalStudents += c.studentCount || 0; });
        const data = {
          stats: { classCount: classes.length, studentCount: totalStudents, taskCount: 0 },
          todaySchedule: [
            { time: '08:00-08:40', className: '三年级一班', subject: '英语', classId: '1' },
            { time: '10:00-10:40', className: '三年级二班', subject: '英语', classId: '2' },
          ],
        };
        wx.setStorageSync('home_data_cache', { data, timestamp: Date.now() });
        if (!this._home_loaded) {
          this.setData(data);
          this._home_loaded = true;
        }
      }
    } catch (e) {
      if (!this._home_loaded) {
        this.setData({ stats: { classCount: 3, studentCount: 86, taskCount: 12 } });
        this._home_loaded = true;
      }
    }
  },

  async _refreshClassCloud() {
    try {
      const res = await wx.cloud.callFunction({ name: 'class', data: { action: 'list' } });
      if (res.result && res.result.code === 0) {
        const classes = res.result.data || [];
        wx.setStorageSync('class_list_cache', { data: classes, timestamp: Date.now() });
        // 写入全局缓存，详情页直接读，跳过网络请求
        classes.forEach(c => { getApp().globalData.classCache[c._id] = c; });
        const ordered = this._applyOrder(classes);
        if (!this._class_loaded) {
          this.setData({ classes: ordered });
          this._class_loaded = true;
        } else {
          this.setData({ classes: ordered });
        }
      }
    } catch (e) {
      if (!this._class_loaded) {
        this.setData({
          classes: [
            { _id: '1', name: '三年级一班', studentCount: 28, inviteCode: 'A1234' },
            { _id: '2', name: '三年级二班', studentCount: 30, inviteCode: 'B5678' },
            { _id: '3', name: '四年级一班', studentCount: 26, inviteCode: 'C9012' },
          ],
        });
        this._class_loaded = true;
      }
    }
  },

  async _refreshScheduleCloud() {
    try {
      const res = await wx.cloud.callFunction({ name: 'schedule', data: { action: 'list' } });
      if (res.result && res.result.code === 0) {
        const scheduleList = res.result.data || [];
        wx.setStorageSync('schedule_cache', { data: scheduleList, timestamp: Date.now() });
        if (!this._schedule_loaded) {
          this.setData({ scheduleList });
          this.updateCurrentDaySchedule();
          this.updateWeekSchedule();
          this._schedule_loaded = true;
        } else {
          this.setData({ scheduleList });
          this.updateCurrentDaySchedule();
          this.updateWeekSchedule();
        }
      }
    } catch (e) {
      if (!this._schedule_loaded) {
        this.setData({
          scheduleList: [
            { day: 0, time: '08:00-08:40', className: '三年级一班', subject: '英语', classId: '1' },
          ],
        });
        this.updateCurrentDaySchedule();
        this.updateWeekSchedule();
        this._schedule_loaded = true;
      }
    }
  },

  async _refreshHomeworkCloud() {
    try {
      const res = await wx.cloud.callFunction({ name: 'homework', data: { action: 'list' } });
      if (res.result && res.result.code === 0) {
        const list = res.result.data || [];
        wx.setStorageSync('homework_cache', { data: list, timestamp: Date.now() });
        if (!this._homework_loaded) {
          this.setData({ homeworkList: list });
          this._homework_loaded = true;
        } else {
          this.setData({ homeworkList: list });
        }
      }
    } catch (e) {
      if (!this._homework_loaded) {
        this.setData({
          homeworkList: [
            { _id: '1', title: 'Unit 1 跟读练习', className: '三年级一班', deadline: '2024-01-20', submitCount: 25, totalCount: 28, type: 'voice', status: 'ongoing' },
            { _id: '2', title: '第二单元单词带背', className: '三年级二班', deadline: '2024-01-22', submitCount: 30, totalCount: 30, type: 'word', status: 'completed' },
            { _id: '3', title: '第三单元朗读', className: '三年级一班', deadline: '2024-01-25', submitCount: 12, totalCount: 28, type: 'voice', status: 'ongoing' },
          ],
        });
        this._homework_loaded = true;
      }
    }
  },

  // ============================================================
  // Tab 切换
  // ============================================================
  switchTab(e) {
    const tab = e.detail.tab;
    if (tab === this.data.currentTab) return;
    // 直接 setData 切换，Shell 实例不销毁，丝滑切换
    this.setData({ currentTab: tab });
  },

  // ============================================================
  // 首页
  // ============================================================
  goToClassList()    { this.setData({ currentTab: 'class' }); },
  goToSchedule()     { this.setData({ currentTab: 'schedule' }); },
  goToHomework()     { this.setData({ currentTab: 'homework' }); },
  goToClassDetail(e) {
    const classId = e.currentTarget.dataset.id;
    this._openDetail(classId);
  },
  goToCreateHomework(){ this._openHomework(); },
  goToRecite()       { wx.navigateTo({ url: '/pages/teacher/recite/recite' }); },
  goToStudents()     { wx.navigateTo({ url: '/pages/teacher/students/list/list' }); },

  // ============================================================
  // 班级 —— 拖拽排序
  // ============================================================
  onClassItemTap(e) {
    if (this.data.dragging) return;
    const classId = e.currentTarget.dataset.id;
    this._openDetail(classId);
  },

  onItemLongPress(e) {
    if (this.data.classes.length < 2) return;
    const index = parseInt(e.currentTarget.dataset.index, 10);
    if (Number.isNaN(index)) return;
    this._lastY = e.touches[0].pageY;
    this._accDy = 0;
    this._didSwap = false;
    this.setData({ dragging: true, dragIndex: index });
    wx.vibrateShort({ type: 'medium' });
  },

  onItemTouchMove(e) {
    if (!this.data.dragging) return;
    const delta = e.touches[0].pageY - this._lastY;
    this._lastY = e.touches[0].pageY;
    this._accDy += delta;
    let idx = this.data.dragIndex;
    const classes = [...this.data.classes];
    const THRESHOLD = 52;

    while (this._accDy > THRESHOLD && idx < classes.length - 1) {
      [classes[idx], classes[idx + 1]] = [classes[idx + 1], classes[idx]];
      idx += 1;
      this._accDy -= THRESHOLD;
    }
    while (this._accDy < -THRESHOLD && idx > 0) {
      [classes[idx], classes[idx - 1]] = [classes[idx - 1], classes[idx]];
      idx -= 1;
      this._accDy += THRESHOLD;
    }
    if (idx !== this.data.dragIndex) {
      wx.vibrateShort({ type: 'light' });
      this.setData({ classes, dragIndex: idx });
      this._didSwap = true;
    }
  },

  onItemTouchEnd() {
    if (!this.data.dragging) return;
    if (this._didSwap) {
      try {
        wx.setStorageSync(CLASSES_ORDER_KEY, this.data.classes.map(c => c._id));
      } catch (err) {}
    }
    this.setData({ dragging: false, dragIndex: -1 });
    this._didSwap = false;
    this._accDy = 0;
  },

  copyInviteCode(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.code,
      success: () => wx.showToast({ title: '已复制邀请码', icon: 'success' }),
    });
  },

  // ============================================================
  // 覆盖层 —— 班级详情 / 资料库
  // ============================================================
  _openDetail(classId) {
    const app = getApp();
    const globalDetail = app.globalData.detailCache[classId];
    const globalClass = app.globalData.classCache[classId];

    // 优先用全局缓存的完整详情数据（最快路径）
    if (globalDetail && globalDetail._ts > 0) {
      this.setData({
        overlayPage: 'detail',
        detailData: globalDetail,
      });
      return;
    }

    // 用 classCache 兜底（Shell 已有数据）
    const classData = this.data.classes.find(c => c._id === classId) || globalClass || {};
    const detailData = {
      classInfo: classData,
      students: [],
      activeStudents: [],
      pendingRequests: classData.pendingRequests || 0,
      recentHomework: [],
      stats: {
        totalStudents: classData.studentCount || 0,
        activeStudents: classData.studentCount || 0,
        homeworkDone: 0,
        avgScore: 0,
      },
    };
    this.setData({ overlayPage: 'detail', detailData });
    // 后台加载完整详情
    this._loadDetailFromCloud(classId);
  },

  async _loadDetailFromCloud(classId) {
    try {
      const res = await wx.cloud.callFunction({ name: 'class', data: { action: 'detail', classId } });
      const result = res.result;
      if (result && result.code === 0) {
        const data = result.data || {};
        const students = Array.isArray(data.students) ? data.students : [];
        const activeStudents = students.filter(s => s.status === 'active');
        const classInfo = {
          _id: data._id || classId,
          name: data.name || '未命名班级',
          studentCount: activeStudents.length,
          inviteCode: data.inviteCode || '',
        };
        const detailData = {
          classInfo,
          students,
          activeStudents,
          pendingRequests: data.pendingRequests || 0,
          recentHomework: [
            { _id: '1', title: 'Unit 1 跟读练习', deadline: '2024-01-20', submitCount: 25, totalCount: 28 },
            { _id: '2', title: '第二单元单词带背', deadline: '2024-01-18', submitCount: 28, totalCount: 28 },
          ],
          stats: {
            totalStudents: students.length,
            activeStudents: activeStudents.length,
            homeworkDone: 45,
            avgScore: 87,
          },
        };
        getApp().globalData.detailCache[classId] = { ...detailData, _ts: Date.now() };
        // 只在当前还是详情页时更新
        if (this.data.overlayPage === 'detail' && this.data.detailData.classInfo._id === classId) {
          this.setData({ detailData });
        }
      }
    } catch (e) { console.error('加载详情失败', e); }
  },

  _openLibrary() {
    const app = getApp();
    if (this.data.libraryData.articles?.length > 0) {
      this.setData({ overlayPage: 'library' });
      this._updateLibFiltered();
      return;
    }
    const arts = [
      { _id: '1', title: 'Unit 1 Hello!', category: 'textbook', level: 3, wordCount: 50, duration: '5分钟', preview: 'This is a dialogue about greeting friends...' },
      { _id: '2', title: 'My Family', category: 'textbook', level: 3, wordCount: 40, duration: '4分钟', preview: 'Meet the members of a typical family...' },
      { _id: '3', title: 'The Little Red Hen', category: 'story', level: 2, wordCount: 60, duration: '6分钟', preview: 'A classic story about teamwork and sharing...' },
      { _id: '4', title: 'At the Zoo', category: 'textbook', level: 2, wordCount: 35, duration: '4分钟', preview: 'Let\'s visit the animals at the zoo...' },
      { _id: '5', title: 'Shopping Dialogue', category: 'dialogue', level: 4, wordCount: 45, duration: '5分钟', preview: 'Practice buying things at a store...' },
      { _id: '6', title: 'Unit 2 Colors', category: 'textbook', level: 1, wordCount: 30, duration: '3分钟', preview: 'Learn to describe colors around you...' },
      { _id: '7', title: 'The Three Little Pigs', category: 'story', level: 3, wordCount: 80, duration: '8分钟', preview: 'A popular fairy tale about three pig brothers...' },
      { _id: '8', title: 'Past Tense Review', category: 'exam', level: 5, wordCount: 55, duration: '6分钟', preview: 'Key grammar points for exams...' },
    ];
    this.setData({
      overlayPage: 'library',
      libraryData: {
        currentCategory: 'all',
        articles: arts,
        filteredArticles: arts,
        selectedArticles: [],
      },
    });
  },

  // 资料库方法
  libSelectCategory(e) {
    const cat = e.currentTarget.dataset.key;
    this.setData({ 'libraryData.currentCategory': cat });
    this._updateLibFiltered();
  },

  _updateLibFiltered() {
    const arts = this.data.libraryData.articles;
    const cat = this.data.libraryData.currentCategory;
    const filtered = cat === 'all' ? arts : arts.filter(a => a.category === cat);
    this.setData({ 'libraryData.filteredArticles': filtered });
  },

  libToggleArticle(e) {
    const id = e.currentTarget.dataset.id;
    const sel = this.data.libraryData.selectedArticles;
    if (sel.includes(id)) {
      this.setData({ 'libraryData.selectedArticles': sel.filter(x => x !== id) });
    } else {
      this.setData({ 'libraryData.selectedArticles': [...sel, id] });
    }
  },
  libSelectAll() {
    const allIds = this.data.libraryData.articles.map(a => a._id);
    this.setData({ 'libraryData.selectedArticles': allIds });
  },
  libClearSelection() {
    this.setData({ 'libraryData.selectedArticles': [] });
  },
  libSendToHomework() {
    if (!this.data.libraryData.selectedArticles.length) return;
    wx.showToast({ title: `已选择${this.data.libraryData.selectedArticles.length}篇`, icon: 'success' });
  },
  libGetFilteredArticles() {
    let arts = this.data.libraryData.articles;
    const cat = this.data.libraryData.currentCategory;
    if (cat !== 'all') arts = arts.filter(a => a.category === cat);
    return arts;
  },

  closeOverlay() {
    this.setData({ overlayPage: '' });
  },

  // 详情页内导航
  detailGoToStudents() {
    this.closeOverlay();
    wx.navigateTo({ url: `/pages/teacher/students/list/list?classId=${this.data.detailData.classInfo._id}` });
  },
  detailGoToJoinRequests() {
    this.closeOverlay();
    wx.navigateTo({
      url: `/pages/teacher/students/requests/requests?classId=${this.data.detailData.classInfo._id}&className=${encodeURIComponent(this.data.detailData.classInfo.name)}`,
    });
  },
  detailCopyInviteCode() {
    wx.setClipboardData({ data: this.data.detailData.classInfo.inviteCode, success: () => wx.showToast({ title: '已复制', icon: 'success' }) });
  },
  detailRegenerateInviteCode() {
    wx.showModal({
      title: '重新生成邀请码', content: '确定要重新生成邀请码吗？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const r = await wx.cloud.callFunction({ name: 'class', data: { action: 'generateInviteCode', classId: this.data.detailData.classInfo._id } });
          if (r.result.code === 0) {
            wx.showToast({ title: '已生成新邀请码', icon: 'success' });
            const updated = { ...this.data.detailData, classInfo: { ...this.data.detailData.classInfo, inviteCode: r.result.data.inviteCode } };
            this.setData({ detailData: updated });
          }
        } catch (e) { wx.showToast({ title: '生成失败', icon: 'none' }); }
      },
    });
  },
  detailStartClass() {
    wx.navigateTo({ url: `/pages/teacher/recite/recite?classId=${this.data.detailData.classInfo._id}&className=${encodeURIComponent(this.data.detailData.classInfo.name)}` });
  },
  detailAssignHomework() {
    this._openHomework();
  },
  detailGoToStats() {
    wx.navigateTo({ url: `/pages/teacher/class/stats/stats?classId=${this.data.detailData.classInfo._id}&className=${encodeURIComponent(this.data.detailData.classInfo.name)}` });
  },
  detailGoToHomeworkDetail(e) {
    this.closeOverlay();
    wx.navigateTo({ url: `/pages/teacher/homework/detail/detail?id=${e.currentTarget.dataset.id}` });
  },

  // ============================================================
  // 覆盖层 —— 布置作业
  // ============================================================
  _openHomework() {
    const today = new Date();
    const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const deadline = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() + 7).padStart(2, '0')}`;
    this.setData({
      overlayPage: 'homework',
      homeworkData: {
        currentStep: 1,
        homeworkType: '',
        homeworkTitle: '',
        homeworkContent: '',
        contentLines: [],
        selectedClassId: this.data.detailData?.classInfo?._id || '',
        selectedClassName: this.data.detailData?.classInfo?.name || '',
        selectedArticles: [],
        minDate,
        deadline,
      },
    });
  },

  hwSelectType(e) {
    this.setData({ 'homeworkData.homeworkType': e.currentTarget.dataset.type });
  },

  hwSelectClass(e) {
    const cls = this.data.classes.find(c => c._id === e.currentTarget.dataset.id);
    if (cls) this.setData({
      'homeworkData.selectedClassId': cls._id,
      'homeworkData.selectedClassName': cls.name,
    });
  },

  hwOnTitleInput(e) { this.setData({ 'homeworkData.homeworkTitle': e.detail.value }); },

  hwOnContentInput(e) {
    const content = e.detail.value;
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    this.setData({ 'homeworkData.homeworkContent': content, 'homeworkData.contentLines': lines });
  },

  hwGoToLibrary() {
    // 先关闭作业层，打开资料库（资料库选完后回写到 homeworkData.selectedArticles）
    this.setData({ overlayPage: 'library' });
  },

  hwPrevStep() {
    const step = this.data.homeworkData.currentStep;
    if (step <= 1) return;
    this.setData({ 'homeworkData.currentStep': step - 1 });
  },

  hwNextStep() {
    const { currentStep, homeworkType, homeworkTitle, selectedClassId } = this.data.homeworkData;
    if (currentStep === 1 && !homeworkType) { wx.showToast({ title: '请选择作业类型', icon: 'none' }); return; }
    if (currentStep === 2 && !selectedClassId) { wx.showToast({ title: '请选择班级', icon: 'none' }); return; }
    if (currentStep === 2 && !homeworkTitle.trim()) { wx.showToast({ title: '请输入标题', icon: 'none' }); return; }
    this.setData({ 'homeworkData.currentStep': currentStep + 1 });
  },

  hwOnDateChange(e) { this.setData({ 'homeworkData.deadline': e.detail.value }); },

  hwPublish() {
    const { homeworkTitle, homeworkType, selectedClassId, selectedClassName, contentLines, deadline } = this.data.homeworkData;
    if (!homeworkTitle.trim()) { wx.showToast({ title: '请输入标题', icon: 'none' }); return; }
    wx.showLoading({ title: '发布中...', mask: true });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '发布成功', icon: 'success' });
      this.setData({ overlayPage: '' });
    }, 1200);
  },

  // ============================================================
  // 课表
  // ============================================================
  toggleViewMode() {
    this.setData({ viewMode: this.data.viewMode === 'day' ? 'week' : 'day' });
  },

  selectDay(e) {
    const day = parseInt(e.currentTarget.dataset.day, 10);
    this.setData({ currentWeekday: day });
    this.updateCurrentDaySchedule();
  },

  updateCurrentDaySchedule() {
    this.setData({
      currentDaySchedule: this.data.scheduleList.filter(item => item.day === this.data.currentWeekday),
    });
  },

  updateWeekSchedule() {
    const week = this.data.weekDays.map((label, i) => {
      const daySchedule = this.data.scheduleList.filter(item => item.day === i);
      return { day: i, label, hasClass: daySchedule.length > 0, count: daySchedule.length, classes: daySchedule };
    });
    this.setData({ weekSchedule: week });
  },

  formatDate(dayIndex) {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntil = (dayIndex + 1) - (currentDay === 0 ? 7 : currentDay);
    const d = new Date(today);
    d.setDate(today.getDate() + daysUntil);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  },

  goToClass(e) {
    this._openDetail(e.currentTarget.dataset.classid);
  },

  addSchedule() {
    wx.showModal({
      title: '添加课程',
      editable: true,
      placeholderText: '格式：时间|班级|科目\n例如：08:00-08:40|三年级一班|英语',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.showToast({ title: '添加成功', icon: 'success' });
        }
      },
    });
  },

  // ============================================================
  // 作业
  // ============================================================
  switchFilter(e) {
    this.setData({ currentFilter: e.currentTarget.dataset.type });
  },

  goToHomeworkDetail(e) {
    wx.navigateTo({ url: `/pages/teacher/homework/detail/detail?id=${e.currentTarget.dataset.id}` });
  },

  // ============================================================
  // 我的
  // ============================================================
  goToPage(e) {
    const id = e.currentTarget.dataset.id;
    if (id === 'theme') {
      wx.navigateTo({ url: '/pages/theme/theme' });
      return;
    }
    if (id === 'createClass') {
      wx.showModal({
        title: '创建班级',
        editable: true,
        placeholderText: '请输入班级名称',
        success: async (res) => {
          if (res.confirm && res.content) {
            try {
              const result = await wx.cloud.callFunction({ name: 'class', data: { action: 'create', name: res.content } });
              if (result.result && result.result.code === 0) {
                wx.showToast({ title: '创建成功', icon: 'success' });
                this._refreshClassCloud();
              } else {
                wx.showToast({ title: result.result ? result.result.msg : '创建失败', icon: 'none' });
              }
            } catch (e2) {
              wx.showToast({ title: '创建失败', icon: 'none' });
            }
          }
        },
      });
      return;
    }
    const routes = {
      words:    '/pages/teacher/recite/recite',
      schedule: '/pages/teacher/schedule/schedule',
      stats:    '/pages/teacher/stats/stats/stats',
      records:  '/pages/teacher/records/records/records',
      students: '/pages/teacher/students/list/list',
    };
    if (routes[id]) wx.navigateTo({ url: routes[id] });
  },

  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '英语口语助手 v1.0.0\n帮助教师高效布置口语作业',
      showCancel: false,
    });
  },
});
