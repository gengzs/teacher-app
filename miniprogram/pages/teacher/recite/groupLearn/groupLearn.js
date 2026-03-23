/**
 * 分组学习页
 * 每组5个单词
 * - 点击整行：第一次播放发音，再点一次（不限间隔）显示释义
 * - 右侧笔记按钮：弹出输入框保存笔记
 * - 完成学习 → 自动跳转到检测页
 */
const UNKNOWN_WORDS_KEY = 'teacher_unknown_words';
const GROUP_SIZE = 5;

Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    setName: '',
    totalCount: 0,
    totalGroups: 0,
    currentGroupIndex: 0,
    currentGroup: [],   // 每项含 heardOnce、showMeaning、note

    // 笔记弹窗
    showNoteModal: false,
    noteTargetIndex: -1,
    noteTargetWord: '',
    noteContent: '',
  },

  onLoad(options) {
    const setName = options.setName ? decodeURIComponent(options.setName) : '';

    let allWords = [];
    try {
      allWords = wx.getStorageSync(UNKNOWN_WORDS_KEY) || [];
    } catch (e) {
      console.warn('读取生词失败', e);
    }

    if (allWords.length === 0) {
      wx.showToast({ title: '无生词可学', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }

    const totalGroups = Math.ceil(allWords.length / GROUP_SIZE);

    this.setData({
      setName,
      totalCount: allWords.length,
      totalGroups,
      _allWords: allWords,
    }, () => {
      this._renderGroup(0);
    });
  },

  // 渲染指定组
  _renderGroup(groupIndex) {
    const { _allWords } = this.data;
    const start = groupIndex * GROUP_SIZE;
    const words = _allWords.slice(start, start + GROUP_SIZE);
    // heardOnce：是否已点过「听发音」；showMeaning：是否已展开释义
    const currentGroup = words.map(w => ({
      ...w,
      heardOnce: false,
      showMeaning: false,
      note: w.note || '',
    }));
    const progressPercent = Math.round(((groupIndex + 1) / this.data.totalGroups) * 100);

    this.setData({
      currentGroupIndex: groupIndex,
      currentGroup,
      progressPercent,
    });
  },

  // 播放发音（不弹 Toast，只播放音频）
  _playAudio(word) {
    const audio = wx.createInnerAudioContext();
    audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
    audio.play();
    audio.onError(() => audio.destroy());
    audio.onPlay(() => setTimeout(() => audio.destroy(), 3000));
  },

  // 点击单词行：第1次播放发音 → 第2次展开音标+释义 → 再点收起（toggle）
  onWordTap(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    if (Number.isNaN(idx)) return;
    const word = this.data.currentGroup[idx];
    if (!word) return;

    const group = [...this.data.currentGroup];

    if (word.showMeaning) {
      // 已展开 → 收起
      group[idx] = { ...group[idx], showMeaning: false };
      this.setData({ currentGroup: group });
      return;
    }

    if (!word.heardOnce) {
      group[idx] = { ...group[idx], heardOnce: true };
      this.setData({ currentGroup: group });
      this._playAudio(word.word);
      return;
    }

    group[idx] = { ...group[idx], showMeaning: true };
    this.setData({ currentGroup: group });
  },

  // ========== 笔记功能 ==========
  openNoteInput(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    if (Number.isNaN(idx)) return;
    const word = this.data.currentGroup[idx];
    this.setData({
      showNoteModal: true,
      noteTargetIndex: idx,
      noteTargetWord: word.word,
      noteContent: word.note || '',
    });
  },

  closeNoteModal() {
    this.setData({ showNoteModal: false });
  },

  onNoteInput(e) {
    this.setData({ noteContent: e.detail.value });
  },

  saveNote() {
    const { noteTargetIndex, noteContent, currentGroup, _allWords, currentGroupIndex } = this.data;
    if (noteTargetIndex < 0) return;

    // 更新当前组显示
    currentGroup[noteTargetIndex] = { ...currentGroup[noteTargetIndex], note: noteContent };

    // 同步回全局单词数组（按全局索引）
    const globalIndex = currentGroupIndex * GROUP_SIZE + noteTargetIndex;
    _allWords[globalIndex] = { ..._allWords[globalIndex], note: noteContent };

    this.setData({ currentGroup, _allWords, showNoteModal: false });

    // 保存到本地
    try {
      wx.setStorageSync(UNKNOWN_WORDS_KEY, _allWords);
    } catch (e) {}

    wx.showToast({ title: '笔记已保存', icon: 'success', duration: 800 });
  },

  // ========== 翻组 ==========
  prevGroup() {
    const { currentGroupIndex } = this.data;
    if (currentGroupIndex <= 0) return;
    this._renderGroup(currentGroupIndex - 1);
  },

  nextGroup() {
    const { currentGroupIndex, totalGroups, _allWords } = this.data;
    if (currentGroupIndex < totalGroups - 1) {
      this._renderGroup(currentGroupIndex + 1);
    } else {
      // 最后一组点"完成学习" → 跳转到检测页
      wx.showToast({ title: '学习完成，即将开始检测', icon: 'none' });
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/teacher/recite/groupTest/groupTest?setName=${encodeURIComponent(this.data.setName)}`,
        });
      }, 1200);
    }
  },

  goBack() {
    wx.navigateBack();
  },
});
