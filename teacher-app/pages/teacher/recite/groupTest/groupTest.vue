<template>
  <view class="test-page">
    <!-- 顶部 -->
    <view class="test-header">
      <view class="header-left" @click="goBack">
        <text class="back-arrow">‹</text>
      </view>
      <view class="header-center">
        <text class="header-title">{{setName || '单词检测'}}</text>
        <text class="header-sub">全部 {{totalCount}} 个词</text>
      </view>
      <view class="header-right">
        <text class="marked-count">{{markedCount}} / {{totalCount}}</text>
      </view>
    </view>

    <!-- 进度条 -->
    <view class="test-progress">
      <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
    </view>

    <!-- 单词列表 -->
    <scroll-view class="test-scroll" scroll-y>
      <view class="test-list">
        <view
          class="test-row"
          :class="{ 'row-right': item.testStatus === 'right', 'row-wrong': item.testStatus === 'wrong' }"
          v-for="(item, index) in allWords"
          :key="item._id"
        >
          <view class="test-left">
            <text class="test-word">{{item.word}}</text>
            <text class="test-hint" v-if="item.testStatus === 'right'">✓ 认识</text>
            <text class="test-hint wrong-hint" v-if="item.testStatus === 'wrong'">✗ 不认识</text>
          </view>

          <view class="test-actions">
            <view
              class="test-btn right-btn"
              :class="{ active: item.testStatus === 'right' }"
              @click.stop="onMarkRight(index)"
            >✓</view>
            <view
              class="test-btn wrong-btn"
              :class="{ active: item.testStatus === 'wrong' }"
              @click.stop="onMarkWrong(index)"
            >✗</view>
          </view>
        </view>
      </view>

      <view class="scroll-spacer"></view>
    </scroll-view>

    <!-- 底部固定 -->
    <view class="test-footer">
      <view class="footer-stats">
        <text class="stat-known">✓ 认识 {{rightCount}}</text>
        <text class="stat-unknown">✗ 不认识 {{wrongCount}}</text>
      </view>
      <view
        class="finish-btn"
        :class="{ disabled: markedCount === 0 }"
        @click="onFinishTest"
      >{{markedCount > 0 ? '查看检测结果' : '请先标记'}}</view>
    </view>

    <!-- 检测结果弹窗 -->
    <view class="result-modal-mask" :class="{ show: showResult }" @click="closeResult"></view>
    <view class="result-modal" :class="{ show: showResult }">
      <view class="result-modal-header">
        <text class="result-modal-title">🎉 检测完成</text>
      </view>

      <view class="result-modal-body">
        <view class="accuracy-circle">
          <text class="accuracy-num">{{accuracyPercent}}%</text>
          <text class="accuracy-label">正确率</text>
        </view>

        <view class="result-cards">
          <view class="result-card right-card">
            <text class="rc-value">{{rightCount}}</text>
            <text class="rc-label">✓ 认识</text>
          </view>
          <view class="result-card wrong-card">
            <text class="rc-value">{{wrongCount}}</text>
            <text class="rc-label">✗ 不认识</text>
          </view>
        </view>

        <view class="result-actions">
          <view class="result-action-btn print-btn" @click="onPrintNotes">
            <text class="action-icon">🖨️</text>
            <text class="action-text">打印笔记 PDF</text>
          </view>
          <view class="result-action-btn" @click="onRetryTest">
            <text class="action-icon">🔄</text>
            <text class="action-text">重新检测</text>
          </view>
          <view class="result-action-btn" @click="onBackToLearn">
            <text class="action-icon">📖</text>
            <text class="action-text">返回学习</text>
          </view>
        </view>
      </view>

      <view class="result-modal-footer">
        <view class="result-done-btn" @click="onFinishAndBack">完成，返回课程</view>
      </view>
    </view>
  </view>
</template>

<script>
const UNKNOWN_WORDS_KEY = 'teacher_unknown_words';
const STUDENT_INFO_KEY = 'teacher_student_info';

export default {
  data() {
    return {
      setName: '',
      studentId: '',
      studentName: '',
      totalCount: 0,
      markedCount: 0,
      rightCount: 0,
      wrongCount: 0,
      accuracyPercent: 0,
      progressPercent: 0,
      allWords: [],
      showResult: false,
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
      uni.showToast({ title: '无生词可检测', icon: 'none' });
      setTimeout(() => uni.navigateBack(), 1200);
      return;
    }

    const wordsWithStatus = allWords.map(w => ({
      ...w,
      testStatus: 'none',
    }));

    this.allWords = wordsWithStatus;
    this.totalCount = wordsWithStatus.length;
  },

  methods: {
    _recalc() {
      const words = this.allWords;
      const markedCount = words.filter(w => w.testStatus !== 'none').length;
      const rightCount = words.filter(w => w.testStatus === 'right').length;
      const wrongCount = words.filter(w => w.testStatus === 'wrong').length;
      const accuracyPercent = markedCount > 0 ? Math.round((rightCount / markedCount) * 100) : 0;
      const progressPercent = Math.round((markedCount / this.totalCount) * 100);

      this.markedCount = markedCount;
      this.rightCount = rightCount;
      this.wrongCount = wrongCount;
      this.accuracyPercent = accuracyPercent;
      this.progressPercent = progressPercent;
    },

    onMarkRight(index) {
      const words = [...this.allWords];
      const current = words[index].testStatus;
      words[index] = { ...words[index], testStatus: current === 'right' ? 'none' : 'right' };
      this.allWords = words;
      this._recalc();
    },

    onMarkWrong(index) {
      const words = [...this.allWords];
      const current = words[index].testStatus;
      words[index] = { ...words[index], testStatus: current === 'wrong' ? 'none' : 'wrong' };
      this.allWords = words;
      this._recalc();
    },

    onFinishTest() {
      if (this.markedCount === 0) {
        uni.showToast({ title: '请先标记至少一个词', icon: 'none' });
        return;
      }
      this.showResult = true;
    },

    closeResult() {
      this.showResult = false;
    },

    onPrintNotes() {
      const wordsWithNotes = this.allWords.filter(w => w.note);
      if (wordsWithNotes.length === 0) {
        uni.showToast({ title: '暂无笔记可打印', icon: 'none' });
        return;
      }
      uni.showToast({ title: `准备打印 ${wordsWithNotes.length} 条笔记...`, icon: 'none' });
      console.log('笔记数据：', wordsWithNotes);
    },

    onRetryTest() {
      const words = this.allWords.map(w => ({ ...w, testStatus: 'none' }));
      this.allWords = words;
      this.showResult = false;
      this._recalc();
    },

    onBackToLearn() {
      this.showResult = false;
      uni.navigateBack();
    },

    onFinishAndBack() {
      this.showResult = false;

      // 如果有学生信息，返回学生详情页；否则返回上一页
      if (this.studentId) {
        uni.redirectTo({
          url: `/pages/teacher/students/detail/detail?id=${this.studentId}&name=${encodeURIComponent(this.studentName)}`
        });
      } else {
        uni.navigateBack();
      }
    },

    goBack() {
      // 如果有学生信息，返回学生详情页；否则返回上一页
      if (this.studentId) {
        uni.redirectTo({
          url: `/pages/teacher/students/detail/detail?id=${this.studentId}&name=${encodeURIComponent(this.studentName)}`
        });
      } else {
        uni.navigateBack();
      }
    },
  },
};
</script>

<style scoped>
.test-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.test-header {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #fff;
}

.header-left {
  width: 60rpx;
}

.back-arrow {
  font-size: 48rpx;
  color: var(--theme-accent);
}

.header-center {
  flex: 1;
  text-align: center;
}

.header-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 4rpx;
}

.header-sub {
  font-size: 24rpx;
  color: #999;
}

.header-right {
  width: 100rpx;
  text-align: right;
}

.marked-count {
  font-size: 26rpx;
  color: var(--theme-accent);
  font-weight: 500;
}

.test-progress {
  height: 6rpx;
  background: #e5e5e5;
}

.progress-fill {
  height: 100%;
  background: var(--theme-gradient);
  transition: width 0.3s ease;
}

.test-scroll {
  flex: 1;
}

.test-list {
  background: #fff;
}

.test-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.test-row.row-right {
  background: var(--theme-light);
}

.test-row.row-wrong {
  background: #FFE8E8;
}

.test-left {
  flex: 1;
}

.test-word {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 4rpx;
}

.test-hint {
  font-size: 24rpx;
  color: var(--theme-accent);
}

.test-hint.wrong-hint {
  color: #FF6B6B;
}

.test-actions {
  display: flex;
  gap: 16rpx;
}

.test-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  border: 2rpx solid #e5e5e5;
  color: #999;
}

.test-btn.right-btn.active {
  background: var(--theme-accent);
  border-color: var(--theme-accent);
  color: #fff;
}

.test-btn.wrong-btn.active {
  background: #FF6B6B;
  border-color: #FF6B6B;
  color: #fff;
}

.scroll-spacer {
  height: 180rpx;
}

.test-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.footer-stats {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  margin-bottom: 16rpx;
}

.stat-known {
  font-size: 26rpx;
  color: var(--theme-accent);
}

.stat-unknown {
  font-size: 26rpx;
  color: #FF6B6B;
}

.finish-btn {
  background: var(--theme-gradient);
  color: #fff;
  text-align: center;
  padding: 24rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
}

.finish-btn.disabled {
  background: #e5e5e5;
  color: #999;
}

/* 结果弹窗 */
.result-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.result-modal-mask.show {
  opacity: 1;
  pointer-events: auto;
}

.result-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 1001;
  transform: translateY(100%);
  transition: transform 0.3s;
  max-height: 85vh;
  overflow-y: auto;
}

.result-modal.show {
  transform: translateY(0);
}

.result-modal-header {
  text-align: center;
  padding: 40rpx 30rpx 20rpx;
}

.result-modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.result-modal-body {
  padding: 0 30rpx 30rpx;
}

.accuracy-circle {
  text-align: center;
  padding: 30rpx;
  background: var(--theme-light);
  border-radius: 20rpx;
  margin-bottom: 24rpx;
}

.accuracy-num {
  display: block;
  font-size: 72rpx;
  font-weight: 700;
  color: var(--theme-accent);
  margin-bottom: 8rpx;
}

.accuracy-label {
  font-size: 26rpx;
  color: #666;
}

.result-cards {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.result-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.right-card {
  background: var(--theme-light);
}

.wrong-card {
  background: #FFE8E8;
}

.rc-value {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.right-card .rc-value {
  color: var(--theme-accent);
}

.wrong-card .rc-value {
  color: #FF6B6B;
}

.rc-label {
  font-size: 24rpx;
  color: #666;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.result-action-btn {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 16rpx;
}

.print-btn {
  background: var(--theme-light);
}

.action-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.action-text {
  font-size: 28rpx;
  color: #333;
}

.result-modal-footer {
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
}

.result-done-btn {
  background: var(--theme-gradient);
  color: #fff;
  text-align: center;
  padding: 24rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
}
</style>
