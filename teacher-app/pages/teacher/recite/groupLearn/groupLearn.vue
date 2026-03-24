<template>
  <view class="learn-page">
    <!-- 顶部 -->
    <view class="learn-header">
      <view class="header-center">
        <text class="header-sub">第 {{currentGroupIndex + 1}} / {{totalGroups}} 组 · 共 {{totalCount}} 词</text>
      </view>
    </view>

    <!-- 进度条 -->
    <view class="learn-progress">
      <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
    </view>

    <!-- 单词列表 -->
    <scroll-view class="learn-scroll" scroll-y>
      <view class="word-list">
        <view
          class="word-row"
          :class="{ showed: item.showMeaning }"
          v-for="(item, index) in currentGroup"
          :key="item._id"
        >
          <view
            class="word-main"
            @click="onWordTap(index)"
          >
            <text class="word-text">{{item.word}}</text>
            <view class="word-meaning" v-if="item.showMeaning">
              <text class="word-phonetic">{{item.phonetic}}</text>
              <text class="word-translation">{{item.translation}}</text>
            </view>
            <text class="word-hint" v-if="!item.showMeaning && !item.heardOnce">点1次：听发音</text>
            <text class="word-hint hint-step2" v-if="!item.showMeaning && item.heardOnce">点2次：显示释义</text>
            <text class="word-hint hint-step3" v-if="item.showMeaning">点3次：收起</text>
          </view>

          <view
            class="note-btn"
            :class="{ 'has-note': item.note }"
            @click="openNoteInput(index)"
          >
            <text class="note-icon">{{item.note ? '📝' : '✏️'}}</text>
          </view>
        </view>
      </view>

      <view class="group-tip" v-if="totalGroups > 1">
        <text class="tip-line"></text>
        <text class="tip-text">学完本组后点「下一组」继续</text>
        <text class="tip-line"></text>
      </view>

      <view class="scroll-bottom-spacer"></view>
    </scroll-view>

    <!-- 底部导航栏 -->
    <view class="learn-footer">
      <view
        class="nav-btn prev"
        :class="{ disabled: currentGroupIndex === 0 }"
        @click="prevGroup"
      >‹ 上一组</view>

      <view class="nav-dots">
        <view
          class="dot"
          :class="{ active: idx === currentGroupIndex }"
          v-for="(item, idx) in totalGroups"
          :key="idx"
        ></view>
      </view>

      <view
        class="nav-btn next"
        :class="{ finish: currentGroupIndex === totalGroups - 1 }"
        @click="nextGroup"
      >{{currentGroupIndex === totalGroups - 1 ? '完成学习 ›' : '下一组 ›'}}</view>
    </view>

    <!-- 笔记输入弹窗 -->
    <view class="note-modal-mask" :class="{ show: showNoteModal }" @click="closeNoteModal"></view>
    <view class="note-modal" :class="{ show: showNoteModal }">
      <view class="note-modal-header">
        <text class="note-modal-title">📝 为「{{noteTargetWord}}」添加笔记</text>
        <view class="note-modal-close" @click="closeNoteModal">✕</view>
      </view>
      <view class="note-modal-body">
        <textarea
          class="note-textarea"
          placeholder="记录这个单词的记忆技巧、例句、联想等..."
          v-model="noteContent"
          maxlength="200"
          auto-focus
        ></textarea>
        <text class="note-char-count">{{noteContent.length}} / 200</text>
      </view>
      <view class="note-modal-footer">
        <view class="note-btn-cancel" @click="closeNoteModal">取消</view>
        <view class="note-btn-save" @click="saveNote">保存笔记</view>
      </view>
    </view>
  </view>
</template>

<script>
const UNKNOWN_WORDS_KEY = 'teacher_unknown_words';
const STUDENT_INFO_KEY = 'teacher_student_info';
const GROUP_SIZE = 5;

export default {
  data() {
    return {
      setName: '',
      studentId: '',
      studentName: '',
      totalCount: 0,
      totalGroups: 0,
      currentGroupIndex: 0,
      currentGroup: [],
      progressPercent: 0,
      _allWords: [],

      // 笔记弹窗
      showNoteModal: false,
      noteTargetIndex: -1,
      noteTargetWord: '',
      noteContent: '',
    };
  },

  onLoad(options) {
    const setName = options.setName ? decodeURIComponent(options.setName) : '';
    this.setName = setName;

    // 接收学生信息
    if (options.studentId) {
      this.studentId = options.studentId;
      this.studentName = options.studentName ? decodeURIComponent(options.studentName) : '';
      try {
        uni.setStorageSync(STUDENT_INFO_KEY, {
          studentId: this.studentId,
          studentName: this.studentName
        });
      } catch (e) {}
    } else {
      try {
        const info = uni.getStorageSync(STUDENT_INFO_KEY) || {};
        this.studentId = info.studentId || '';
        this.studentName = info.studentName || '';
      } catch (e) {}
    }

    let allWords = [];
    try {
      allWords = uni.getStorageSync(UNKNOWN_WORDS_KEY) || [];
    } catch (e) {
      console.warn('读取生词失败', e);
    }

    if (allWords.length === 0) {
      uni.showToast({ title: '无生词可学', icon: 'none' });
      setTimeout(() => uni.navigateBack(), 1200);
      return;
    }

    const totalGroups = Math.ceil(allWords.length / GROUP_SIZE);

    this.totalCount = allWords.length;
    this.totalGroups = totalGroups;
    this._allWords = allWords;

    this._renderGroup(0);
  },

  methods: {
    // 渲染指定组
    _renderGroup(groupIndex) {
      const start = groupIndex * GROUP_SIZE;
      const words = this._allWords.slice(start, start + GROUP_SIZE);
      const currentGroup = words.map(w => ({
        ...w,
        heardOnce: false,
        showMeaning: false,
        note: w.note || '',
      }));
      const progressPercent = Math.round(((groupIndex + 1) / this.totalGroups) * 100);

      this.currentGroupIndex = groupIndex;
      this.currentGroup = currentGroup;
      this.progressPercent = progressPercent;
    },

    // 播放发音
    _playAudio(word) {
      // #ifdef MP-WEIXIN
      const audio = wx.createInnerAudioContext();
      audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
      audio.play();
      audio.onError(() => audio.destroy());
      audio.onPlay(() => setTimeout(() => audio.destroy(), 3000));
      // #endif
    },

    // 点击单词行
    onWordTap(index) {
      const word = this.currentGroup[index];
      if (!word) return;

      if (word.showMeaning) {
        this.currentGroup[index].showMeaning = false;
        return;
      }

      if (!word.heardOnce) {
        this.currentGroup[index].heardOnce = true;
        this._playAudio(word.word);
        return;
      }

      this.currentGroup[index].showMeaning = true;
    },

    // 笔记功能
    openNoteInput(index) {
      const word = this.currentGroup[index];
      this.showNoteModal = true;
      this.noteTargetIndex = index;
      this.noteTargetWord = word.word;
      this.noteContent = word.note || '';
    },

    closeNoteModal() {
      this.showNoteModal = false;
    },

    saveNote() {
      if (this.noteTargetIndex < 0) return;

      this.currentGroup[this.noteTargetIndex].note = this.noteContent;

      const globalIndex = this.currentGroupIndex * GROUP_SIZE + this.noteTargetIndex;
      this._allWords[globalIndex].note = this.noteContent;

      this.showNoteModal = false;

      try {
        uni.setStorageSync(UNKNOWN_WORDS_KEY, this._allWords);
      } catch (e) {}

      uni.showToast({ title: '笔记已保存', icon: 'success', duration: 800 });
    },

    // 翻组
    prevGroup() {
      if (this.currentGroupIndex <= 0) return;
      this._renderGroup(this.currentGroupIndex - 1);
    },

    nextGroup() {
      if (this.currentGroupIndex < this.totalGroups - 1) {
        this._renderGroup(this.currentGroupIndex + 1);
      } else {
        uni.showToast({ title: '学习完成，即将开始检测', icon: 'none' });

        // 构建跳转URL，传递学生信息
        let url = `/pages/teacher/recite/groupTest/groupTest?setName=${encodeURIComponent(this.setName)}`;

        if (this.studentId) {
          url += `&studentId=${this.studentId}&studentName=${encodeURIComponent(this.studentName)}`;
        }

        setTimeout(() => {
          uni.navigateTo({ url });
        }, 1200);
      }
    },

    goBack() {
      uni.navigateBack();
    },
  },
};
</script>

<style scoped>
.learn-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.learn-header {
  padding: 24rpx;
  background: #fff;
  text-align: center;
}

.header-center {
  display: flex;
  justify-content: center;
}

.header-sub {
  font-size: 28rpx;
  color: #666;
}

.learn-progress {
  height: 6rpx;
  background: #e5e5e5;
}

.progress-fill {
  height: 100%;
  background: var(--theme-gradient);
  transition: width 0.3s ease;
}

.learn-scroll {
  flex: 1;
}

.word-list {
  background: #fff;
}

.word-row {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.word-row.showed {
  background: var(--theme-light);
}

.word-main {
  flex: 1;
}

.word-text {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.word-meaning {
  margin-top: 8rpx;
}

.word-phonetic {
  display: block;
  font-size: 26rpx;
  color: var(--theme-accent);
  margin-bottom: 4rpx;
}

.word-translation {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.word-hint {
  display: inline-block;
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.hint-step2 {
  background: var(--theme-light);
  color: var(--theme-accent);
}

.hint-step3 {
  background: #FFE8E8;
  color: #FF6B6B;
}

.note-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.note-btn.has-note {
  opacity: 1;
}

.note-icon {
  font-size: 32rpx;
}

.group-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
}

.tip-line {
  flex: 1;
  height: 1rpx;
  background: #e5e5e5;
  margin: 0 20rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #999;
}

.scroll-bottom-spacer {
  height: 120rpx;
}

.learn-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.nav-btn {
  font-size: 28rpx;
  color: var(--theme-accent);
  padding: 16rpx 24rpx;
}

.nav-btn.disabled {
  color: #ccc;
}

.nav-btn.finish {
  background: var(--theme-gradient);
  color: #fff;
  border-radius: 32rpx;
}

.nav-dots {
  display: flex;
  gap: 8rpx;
}

.dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #e5e5e5;
}

.dot.active {
  background: var(--theme-accent);
  width: 24rpx;
}

/* 笔记弹窗 */
.note-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.note-modal-mask.show {
  opacity: 1;
  pointer-events: auto;
}

.note-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  z-index: 1001;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.note-modal.show {
  transform: translateY(0);
}

.note-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.note-modal-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.note-modal-close {
  font-size: 40rpx;
  color: #ccc;
}

.note-modal-body {
  padding: 30rpx;
}

.note-textarea {
  width: 100%;
  height: 200rpx;
  padding: 20rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.note-char-count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 12rpx;
}

.note-modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.note-btn-cancel {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 24rpx;
  font-size: 28rpx;
  color: #666;
}

.note-btn-save {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  background: var(--theme-gradient);
  border-radius: 24rpx;
  font-size: 28rpx;
  color: #fff;
}
</style>
