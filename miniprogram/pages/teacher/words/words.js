/**
 * 词库管理 - 导入和查看词库
 */
Page({
  behaviors: [require('../../../behaviors/themeVars')],
  data: {
    wordSets: [],
    currentSet: null,
    words: [],
    showImportModal: false,
    importLoading: false,
    searchKey: '',
    listLoading: false,
  },

  onLoad() {
    this.loadWordSets();
  },

  onShow() {
    // 切回来静默刷新，不重复显示 loading
    this._refreshList();
  },

  async loadWordSets() {
    this.setData({ listLoading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'wordset',
        data: { action: 'list' },
      });

      if (res.result.code === 0) {
        this.setData({ wordSets: res.result.data, listLoading: false });
      } else {
        this.setData({ wordSets: [], listLoading: false });
      }
    } catch (e) {
      console.error('加载词库列表失败', e);
      this.setData({ wordSets: [], listLoading: false });
    }
  },

  async _refreshList() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'wordset',
        data: { action: 'list' },
      });
      if (res.result.code === 0) {
        this.setData({ wordSets: res.result.data });
      }
    } catch (e) {}
  },

  goToClassList() {
    wx.reLaunch({ url: '/pages/teacher/shell/shell?tab=class' });
  },

  // ========== 导入词库 ==========
  showImportModal() {
    this.setData({ showImportModal: true });
  },

  hideImportModal() {
    this.setData({ showImportModal: false });
  },

  async chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls'],
      success: async (res) => {
        const file = res.tempFiles[0];
        wx.showLoading({ title: '解析中...' });

        try {
          const fs = wx.getFileSystemManager();
          const fileContent = fs.readFileSync(file.path, 'base64');

          const result = await wx.cloud.callFunction({
            name: 'parseWordExcel',
            data: {
              fileContent: fileContent,
              fileName: file.name,
            },
          });

          wx.hideLoading();

          if (result.result.code === 0) {
            wx.showToast({ title: '解析成功', icon: 'success' });
            this.loadWordSets();
          } else {
            wx.showToast({ title: result.result.msg || '解析失败', icon: 'none' });
          }
        } catch (e) {
          wx.hideLoading();
          console.error('解析失败', e);
          wx.showToast({ title: '解析失败', icon: 'none' });
        }
      },
      fail: (e) => {
        console.error('选择文件失败', e);
      },
    });
  },

  // ========== 查看词库详情 ==========
  viewWordSet(e) {
    const setId = e.currentTarget.dataset.id;
    const set = this.data.wordSets.find((item) => item._id === setId);
    if (set) {
      try {
        wx.setStorageSync('teacher_last_word_set', { setId, setName: set.name || '' });
      } catch (err) {
        console.warn('teacher_last_word_set', err);
      }
    }
    this.setData({ currentSet: set });
    this.loadWords(setId);
  },

  closeWordSet() {
    this.setData({ currentSet: null, words: [] });
  },

  async loadWords(setId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'wordset',
        data: {
          action: 'getWords',
          setId: setId,
        },
      });

      if (res.result.code === 0) {
        this.setData({ words: res.result.data });
      }
    } catch (e) {
      console.error('加载单词失败', e);
    }
  },

  onSearch(e) {
    this.setData({ searchKey: e.detail.value || '' });
  },

  getFilteredWords() {
    if (!this.data.searchKey) return this.data.words;
    const kw = this.data.searchKey.toLowerCase();
    return this.data.words.filter(
      (w) =>
        w.word.toLowerCase().includes(kw) ||
        w.translation.toLowerCase().includes(kw)
    );
  },

  // ========== 删除词库 ==========
  deleteWordSet(e) {
    const setId = e.currentTarget.dataset.id;
    const setName = e.currentTarget.dataset.name;

    wx.showModal({
      title: '删除词库',
      content: `确定要删除「${setName}」吗？`,
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'wordset',
              data: {
                action: 'delete',
                setId: setId,
              },
            });
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadWordSets();
          } catch (e) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      },
    });
  },

  // ========== 开始学习 ==========
  startLearning(e) {
    const setId = e.currentTarget.dataset.id;
    const setName = e.currentTarget.dataset.name || '';
    try {
      wx.setStorageSync('teacher_last_word_set', { setId, setName });
    } catch (err) {
      console.warn('teacher_last_word_set', err);
    }
    wx.navigateTo({
      url: `/pages/teacher/recite/recite?setId=${setId}&setName=${encodeURIComponent(setName)}`,
    });
  },
});
