/**
 * 创建作业 - 多步骤表单
 */
Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    currentStep: 1,
    steps: [
      { num: 1, label: '选择类型' },
      { num: 2, label: '填写内容' },
      { num: 3, label: '设置时间' },
    ],

    // 类型选择
    homeworkType: '',
    typeOptions: [
      { key: 'voice', label: '语音朗读', icon: '🎤', desc: '学生录制音频朗读' },
      { key: 'word', label: '单词带背', icon: '📖', desc: '学生完成抗遗忘复习' },
      { key: 'article', label: '资料库文章', icon: '📄', desc: '从班级资料库选择文章' },
    ],

    // 班级选择
    classList: [],
    selectedClassId: '',
    selectedClassName: '',

    // 从资料库选择的文章
    selectedArticles: [],
    selectedArticleDetails: [],

    // 内容填写
    homeworkTitle: '',
    homeworkContent: '',
    contentLines: [],

    // 时间设置
    deadline: '',
    minDate: '',
  },

  onLoad(options) {
    this.setMinDate();
    this.loadClasses();

    // 接收班级参数
    if (options.classId && options.className) {
      this.setData({
        selectedClassId: options.classId,
        selectedClassName: decodeURIComponent(options.className),
        currentStep: 2,
      });
    }

    // 接收资料库文章参数
    if (options.articleIds) {
      const articleIds = options.articleIds.split(',');
      this.loadSelectedArticles(articleIds);
    }
  },

  setMinDate() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const minDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    this.setData({ minDate });
  },

  loadClasses() {
    const classList = [
      { _id: '1', name: '三年级一班', studentCount: 28 },
      { _id: '2', name: '三年级二班', studentCount: 30 },
      { _id: '3', name: '四年级一班', studentCount: 26 },
    ];
    this.setData({ classList });
  },

  loadSelectedArticles(articleIds) {
    // 模拟加载文章详情
    const allArticles = [
      { _id: '1', title: 'Unit 1 Hello!', category: 'textbook', wordCount: 50 },
      { _id: '2', title: 'My Family', category: 'textbook', wordCount: 40 },
      { _id: '3', title: 'The Little Red Hen', category: 'story', wordCount: 60 },
      { _id: '4', title: 'At the Zoo', category: 'textbook', wordCount: 35 },
      { _id: '5', title: 'Shopping Dialogue', category: 'dialogue', wordCount: 45 },
    ];

    const selected = allArticles.filter((a) => articleIds.includes(a._id));
    this.setData({
      selectedArticles: articleIds,
      selectedArticleDetails: selected,
      homeworkType: 'article',
    });
  },

  // 步骤1：选择类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ homeworkType: type });
  },

  // 步骤2：选择班级
  selectClass(e) {
    const classId = e.currentTarget.dataset.id;
    const classItem = this.data.classList.find(item => item._id === classId);
    this.setData({
      selectedClassId: classId,
      selectedClassName: classItem ? classItem.name : ''
    });
  },

  // 去资料库选择文章
  goToLibrary() {
    wx.navigateTo({
      url: `/pages/teacher/class/library/library?classId=${this.data.selectedClassId}&className=${encodeURIComponent(this.data.selectedClassName)}`,
    });
  },

  // 步骤2：输入标题
  onTitleInput(e) {
    this.setData({ homeworkTitle: e.detail.value });
  },

  // 步骤2：输入内容
  onContentInput(e) {
    const content = e.detail.value;
    const lines = content.split('\n').filter(line => line.trim());
    this.setData({ 
      homeworkContent: content,
      contentLines: lines 
    });
  },

  // 步骤3：选择截止日期
  onDateChange(e) {
    this.setData({ deadline: e.detail.value });
  },

  // 下一步
  nextStep() {
    const step = this.data.currentStep;
    
    if (step === 1 && !this.data.homeworkType) {
      wx.showToast({ title: '请选择作业类型', icon: 'none' });
      return;
    }
    
    if (step === 2) {
      if (!this.data.selectedClassId) {
        wx.showToast({ title: '请选择班级', icon: 'none' });
        return;
      }
      if (!this.data.homeworkTitle.trim()) {
        wx.showToast({ title: '请输入作业标题', icon: 'none' });
        return;
      }
    }
    
    this.setData({ currentStep: step + 1 });
  },

  // 上一步
  prevStep() {
    this.setData({ currentStep: this.data.currentStep - 1 });
  },

  // 发布作业
  publishHomework() {
    if (!this.data.deadline) {
      wx.showToast({ title: '请选择截止时间', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中...' });
    
    // 模拟发布
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '发布成功',
        content: '作业已成功布置，学生将收到通知',
        showCancel: false,
        success: () => {
          wx.redirectTo({ url: '/pages/teacher/homework/homework' });
        }
      });
    }, 1500);
  },
});
