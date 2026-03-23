/**
 * 班级资料库 - 文章列表
 */
Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    classId: '',
    className: '',
    categories: [
      { key: 'all', label: '全部' },
      { key: 'textbook', label: '教材配套' },
      { key: 'story', label: '故事绘本' },
      { key: 'dialogue', label: '日常对话' },
      { key: 'exam', label: '考试专项' },
    ],
    currentCategory: 'all',
    articles: [],
    selectedArticles: [],
    searchKey: '',
  },

  onLoad(options) {
    this.setData({
      classId: options.classId || '',
      className: options.className || '',
    });
    this.loadArticles();
  },

  loadArticles() {
    // 模拟文章数据
    this.setData({
      articles: [
        { _id: '1', title: 'Unit 1 Hello!', category: 'textbook', level: 3, wordCount: 50, duration: '5分钟', preview: 'This is a dialogue about greeting friends...' },
        { _id: '2', title: 'My Family', category: 'textbook', level: 3, wordCount: 40, duration: '4分钟', preview: 'Meet the members of a typical family...' },
        { _id: '3', title: 'The Little Red Hen', category: 'story', level: 2, wordCount: 60, duration: '6分钟', preview: 'A classic story about teamwork and sharing...' },
        { _id: '4', title: 'At the Zoo', category: 'textbook', level: 2, wordCount: 35, duration: '4分钟', preview: 'Let\'s visit the animals at the zoo...' },
        { _id: '5', title: 'Shopping Dialogue', category: 'dialogue', level: 4, wordCount: 45, duration: '5分钟', preview: 'Practice buying things at a store...' },
        { _id: '6', title: 'Unit 2 Colors', category: 'textbook', level: 1, wordCount: 30, duration: '3分钟', preview: 'Learn to describe colors around you...' },
        { _id: '7', title: 'The Three Little Pigs', category: 'story', level: 3, wordCount: 80, duration: '8分钟', preview: 'A popular fairy tale about three pig brothers...' },
        { _id: '8', title: 'Past Tense Review', category: 'exam', level: 5, wordCount: 55, duration: '6分钟', preview: 'Key grammar points for exams...' },
      ],
    });
  },

  onSearch(e) {
    this.setData({ searchKey: e.detail.value || '' });
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.key;
    this.setData({ currentCategory: category });
  },

  toggleArticle(e) {
    const articleId = e.currentTarget.dataset.id;
    const selected = this.data.selectedArticles;

    if (selected.includes(articleId)) {
      this.setData({ selectedArticles: selected.filter((id) => id !== articleId) });
    } else {
      this.setData({ selectedArticles: [...selected, articleId] });
    }
  },

  getFilteredArticles() {
    let articles = this.data.articles;

    if (this.data.currentCategory !== 'all') {
      articles = articles.filter((a) => a.category === this.data.currentCategory);
    }

    if (this.data.searchKey) {
      const kw = this.data.searchKey.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(kw) ||
          a.preview.toLowerCase().includes(kw)
      );
    }

    return articles;
  },

  isSelected(articleId) {
    return this.data.selectedArticles.includes(articleId);
  },

  previewArticle(e) {
    const articleId = e.currentTarget.dataset.id;
    const article = this.data.articles.find((a) => a._id === articleId);
    if (!article) return;

    wx.showModal({
      title: article.title,
      content: `${article.preview}\n\n难度：${'⭐'.repeat(article.level)}\n单词数：${article.wordCount}个\n预计时长：${article.duration}`,
      showCancel: true,
      confirmText: '选择此文',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          this.toggleArticle({ currentTarget: { dataset: { id: articleId } } });
        }
      },
    });
  },

  sendToHomework() {
    if (this.data.selectedArticles.length === 0) {
      wx.showToast({ title: '请先选择文章', icon: 'none' });
      return;
    }

    const articleIds = this.data.selectedArticles.join(',');
    wx.navigateTo({
      url: `/pages/teacher/homework/create/create?classId=${this.data.classId}&className=${encodeURIComponent(this.data.className)}&articleIds=${articleIds}`,
    });
  },

  selectAll() {
    const filtered = this.getFilteredArticles();
    const allIds = filtered.map((a) => a._id);
    this.setData({ selectedArticles: allIds });
  },

  clearSelection() {
    this.setData({ selectedArticles: [] });
  },
});
