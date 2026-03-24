<template>
  <view class="recite-page">
    <!-- ========== 筛词模式 ========== -->
    <view v-if="mode === 'filtering'" class="filtering-mode">
      <!-- 顶部 -->
      <view class="filter-header">
        <view class="header-info">
          <text class="set-name">{{setName || '单词带背'}}</text>
          <text class="progress-text">已标记 {{knownCount + unknownCount}} / 共 {{totalCount}} 词</text>
        </view>
        <view class="header-actions">
          <view class="text-btn" @click="goChooseWordSet">换词库</view>
          <view class="text-btn" @click="exit">退出</view>
        </view>
      </view>

      <!-- 进度条 -->
      <view class="progress-bar">
        <view class="progress-known" :style="{ width: totalCount > 0 ? (knownCount / totalCount) * 100 + '%' : '0%' }"></view>
        <view class="progress-unknown" :style="{ width: totalCount > 0 ? (unknownCount / totalCount) * 100 + '%' : '0%' }"></view>
      </view>

      <!-- 统计标签 -->
      <view class="progress-labels">
        <text class="label known">✓ 认识 {{knownCount}}</text>
        <text class="label unknown">✗ 待学习 {{unknownCount}}</text>
      </view>

      <!-- 单词列表 -->
      <scroll-view class="filter-scroll" scroll-y>
        <view
          class="filter-row"
          :class="{ 'row-known': item.filterStatus === 'known', 'row-unknown': item.filterStatus === 'unknown' }"
          v-for="(item, index) in allWords"
          :key="item._id"
        >
          <view class="filter-row-main">
            <text class="filter-word">{{item.word}}</text>
            <text class="filter-sub" v-if="item.phonetic">{{item.phonetic}}</text>
          </view>
          <view class="filter-row-actions">
            <view
              class="row-btn known-btn"
              :class="{ active: item.filterStatus === 'known' }"
              @click="markKnownAt(index)"
            >✓</view>
            <view
              class="row-btn unknown-btn"
              :class="{ active: item.filterStatus === 'unknown' }"
              @click="markUnknownAt(index)"
            >✗</view>
          </view>
        </view>
        <!-- 底部留白 -->
        <view class="filter-scroll-spacer"></view>
      </scroll-view>

      <!-- 底部固定：分组学习入口 -->
      <view class="start-learning-bar">
        <view class="start-learning-hint" v-if="unknownCount === 0">请先点右侧 ✗ 标记不认识的词</view>
        <view
          class="start-learning-btn"
          :class="{ disabled: unknownCount <= 0 }"
          @click="onStartLearningTap"
        >
          {{unknownCount > 0 ? '进入分组学习（' + unknownCount + ' 个待学）›' : '进入分组学习'}}
        </view>
      </view>
    </view>

    <!-- ========== 结果页 ========== -->
    <view v-if="mode === 'result'" class="result-mode">
      <view class="result-icon">🎉</view>
      <text class="result-title">筛选完成！</text>
      <text class="result-subtitle">{{setName}}</text>

      <view class="result-stats">
        <view class="stat-card known-card">
          <text class="stat-value">{{knownCount}}</text>
          <text class="stat-label">认识</text>
        </view>
        <view class="stat-card unknown-card">
          <text class="stat-value">{{unknownCount}}</text>
          <text class="stat-label">不认识</text>
        </view>
        <view class="stat-card total-card">
          <text class="stat-value">{{totalCount}}</text>
          <text class="stat-label">总单词</text>
        </view>
      </view>

      <view class="accuracy-display" v-if="totalCount > 0">
        <text class="accuracy-value">{{accuracyPercent}}%</text>
        <text class="accuracy-label">认识占比</text>
      </view>

      <view class="result-actions">
        <view class="result-btn outline" @click="goBack">词库管理</view>
        <view class="result-btn primary" @click="restart">再来一次</view>
      </view>
    </view>
  </view>
</template>

<script>
const LAST_WORD_SET_KEY = 'teacher_last_word_set';
const UNKNOWN_WORDS_KEY = 'teacher_unknown_words';
const WORD_CACHE_KEY = 'teacher_word_cache_';
const CACHE_TTL = 30 * 60 * 1000;

function saveLastWordSet(setId, setName) {
  if (!setId) return;
  try {
    uni.setStorageSync(LAST_WORD_SET_KEY, { setId, setName: setName || '' });
  } catch (e) {
    console.warn('saveLastWordSet', e);
  }
}

function getLastWordSet() {
  try {
    return uni.getStorageSync(LAST_WORD_SET_KEY) || null;
  } catch (e) {
    return null;
  }
}

function loadFromCache(setId) {
  try {
    const cached = uni.getStorageSync(WORD_CACHE_KEY + setId);
    if (cached && cached.timestamp > Date.now() - CACHE_TTL) return cached.words;
  } catch (e) {}
  return null;
}

function saveToCache(setId, words) {
  try {
    uni.setStorageSync(WORD_CACHE_KEY + setId, { words, timestamp: Date.now() });
  } catch (e) {}
}

export default {
  data() {
    return {
      setId: '',
      setName: '',
      mode: 'filtering',
      allWords: [],
      knownCount: 0,
      unknownCount: 0,
      totalCount: 0,
      accuracyPercent: 0,
    };
  },

  onLoad(options) {
    const setId = options.setId || '';
    const setName = options.setName ? decodeURIComponent(options.setName) : '';

    // 保存学生信息到本地，供学习时使用
    if (options.studentId) {
      try {
        uni.setStorageSync('teacher_student_info', {
          studentId: options.studentId,
          studentName: options.studentName ? decodeURIComponent(options.studentName) : ''
        });
      } catch (e) {}
    }

    this.setId = setId;
    this.setName = setName;

    if (setId) {
      saveLastWordSet(setId, setName);
      this.loadWordSet(setId);
      return;
    }

    const last = getLastWordSet();
    if (last && last.setId) {
      this.setId = last.setId;
      this.setName = last.setName || '';
      this.loadWordSet(last.setId);
      return;
    }

    uni.showToast({ title: '请先在词库管理点「开始学习」', icon: 'none' });
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/teacher/words/words' });
    }, 1200);
  },

  methods: {
    // ========== 换词库 ==========
    goChooseWordSet() {
      uni.navigateTo({ url: '/pages/teacher/words/words' });
    },

    // ========== 加载词库 ==========
    loadWordSet(setId) {
      const cached = loadFromCache(setId);
      if (cached) {
        this._initWords(cached);
        this._fetchAndCache(setId);
        return;
      }
      this._fetchAndCache(setId);
    },

    async _fetchAndCache(setId, silent) {
      if (!silent) uni.showLoading({ title: '加载中...' });
      try {
        const app = getApp();
        const res = await app.callFunction('wordset', { action: 'getWords', setId });
        if (!silent) uni.hideLoading();

        if (res.code === 0 && res.data && res.data.length > 0) {
          this._initWords(res.data);
          saveToCache(setId, res.data);
        } else if (!silent) {
          uni.showToast({ title: '词库为空', icon: 'none' });
          setTimeout(() => {
            uni.redirectTo({ url: '/pages/teacher/words/words' });
          }, 1200);
        }
      } catch (e) {
        if (!silent) uni.hideLoading();
        console.error('加载单词失败', e);
        if (!silent) this._initWords([]);
      }
    },

    _initWords(words) {
      const allWords = words.map(w => ({ ...w, filterStatus: 'none' }));
      this.allWords = allWords;
      this.totalCount = allWords.length;
      this.knownCount = 0;
      this.unknownCount = 0;
      this.mode = 'filtering';
    },

    // ========== 标记认识 ==========
    markKnownAt(index) {
      const words = this.allWords;
      if (index < 0 || index >= words.length) return;
      const current = words[index].filterStatus;
      const next = current === 'known' ? 'none' : 'known';
      this.allWords[index].filterStatus = next;
      
      let known = this.knownCount, unknown = this.unknownCount;
      if (current === 'known') known--;
      else if (current === 'unknown') unknown--;
      if (next === 'known') known++;
      else if (next === 'unknown') unknown++;
      
      this.knownCount = known;
      this.unknownCount = unknown;
    },

    // ========== 标记不认识 ==========
    markUnknownAt(index) {
      const words = this.allWords;
      if (index < 0 || index >= words.length) return;
      const current = words[index].filterStatus;
      const next = current === 'unknown' ? 'none' : 'unknown';
      this.allWords[index].filterStatus = next;
      
      let known = this.knownCount, unknown = this.unknownCount;
      if (current === 'known') known--;
      else if (current === 'unknown') unknown--;
      if (next === 'known') known++;
      else if (next === 'unknown') unknown++;
      
      this.knownCount = known;
      this.unknownCount = unknown;
    },

    // ========== 开始学习 ==========
    onStartLearningTap() {
      if (this.unknownCount <= 0) {
        uni.showToast({ title: '请先点 ✗ 标记不认识的词', icon: 'none' });
        return;
      }
      this.startLearning();
    },

    startLearning() {
      const unknownWords = this.allWords
        .filter(w => w.filterStatus === 'unknown')
        .map(({ _id, word, phonetic, translation, index }) =>
          ({ _id, word, phonetic, translation, index })
        );

      if (unknownWords.length === 0) return;

      try {
        uni.setStorageSync(UNKNOWN_WORDS_KEY, unknownWords);
      } catch (e) {
        console.warn('save unknown words', e);
      }

      // 获取学生信息
      let studentInfo = null;
      try {
        studentInfo = uni.getStorageSync('teacher_student_info') || null;
      } catch (e) {}

      // 构建跳转URL，传递学生信息
      let url = `/pages/teacher/recite/groupLearn/groupLearn?count=${unknownWords.length}&setName=${encodeURIComponent(this.setName)}`;

      if (studentInfo && studentInfo.studentId) {
        url += `&studentId=${studentInfo.studentId}&studentName=${encodeURIComponent(studentInfo.studentName || '')}`;
      }

      uni.navigateTo({ url });
    },

    // ========== 显示结果 ==========
    showResult() {
      const { knownCount, totalCount } = this;
      const accuracyPercent = totalCount > 0 ? Math.round((knownCount / totalCount) * 100) : 0;
      this.mode = 'result';
      this.accuracyPercent = accuracyPercent;
    },

    // ========== 重新开始 ==========
    restart() {
      if (this.setId) {
        this.loadWordSet(this.setId);
      }
    },

    // ========== 返回 ==========
    goBack() {
      uni.reLaunch({ url: '/pages/teacher/shell/shell?tab=homework' });
    },

    exit() {
      uni.reLaunch({ url: '/pages/teacher/shell/shell?tab=homework' });
    },
  },
};
</script>

<style scoped>
.recite-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.filtering-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #fff;
}

.header-info {
  flex: 1;
}

.set-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.progress-text {
  font-size: 24rpx;
  color: #999;
}

.header-actions {
  display: flex;
  gap: 16rpx;
}

.text-btn {
  font-size: 26rpx;
  color: var(--theme-accent);
  padding: 8rpx 16rpx;
}

.progress-bar {
  height: 8rpx;
  display: flex;
  background: #e5e5e5;
}

.progress-known {
  height: 100%;
  background: var(--theme-accent);
}

.progress-unknown {
  height: 100%;
  background: #FF6B6B;
}

.progress-labels {
  display: flex;
  justify-content: space-around;
  padding: 16rpx 24rpx;
  background: #fff;
}

.label {
  font-size: 26rpx;
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
}

.label.known {
  background: var(--theme-light);
  color: var(--theme-accent);
}

.label.unknown {
  background: #FFE8E8;
  color: #FF6B6B;
}

.filter-scroll {
  flex: 1;
}

.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #f5f5f5;
}

.filter-row.row-known {
  background: var(--theme-light);
}

.filter-row.row-unknown {
  background: #FFE8E8;
}

.filter-row-main {
  flex: 1;
}

.filter-word {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 6rpx;
}

.filter-sub {
  font-size: 26rpx;
  color: #999;
}

.filter-row-actions {
  display: flex;
  gap: 16rpx;
}

.row-btn {
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

.row-btn.active {
  border: none;
  color: #fff;
}

.known-btn.active {
  background: var(--theme-accent);
}

.unknown-btn.active {
  background: #FF6B6B;
}

.filter-scroll-spacer {
  height: 140rpx;
}

.start-learning-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.start-learning-hint {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.start-learning-btn {
  background: var(--theme-gradient);
  color: #fff;
  text-align: center;
  padding: 24rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
}

.start-learning-btn.disabled {
  background: #e5e5e5;
  color: #999;
}

/* 结果页 */
.result-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.result-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.result-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 12rpx;
}

.result-subtitle {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 48rpx;
}

.result-stats {
  display: flex;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.known-card {
  background: var(--theme-light);
}

.unknown-card {
  background: #FFE8E8;
}

.total-card {
  background: #f5f5f5;
}

.stat-value {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.known-card .stat-value {
  color: var(--theme-accent);
}

.unknown-card .stat-value {
  color: #FF6B6B;
}

.total-card .stat-value {
  color: #666;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.accuracy-display {
  margin-bottom: 48rpx;
}

.accuracy-value {
  display: block;
  font-size: 64rpx;
  font-weight: 700;
  color: var(--theme-accent);
  text-align: center;
}

.accuracy-label {
  display: block;
  font-size: 26rpx;
  color: #999;
  text-align: center;
}

.result-actions {
  display: flex;
  gap: 24rpx;
  width: 100%;
}

.result-btn {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
}

.result-btn.outline {
  background: #fff;
  color: var(--theme-accent);
  border: 2rpx solid var(--theme-primary);
}

.result-btn.primary {
  background: var(--theme-gradient);
  color: #fff;
}
</style>
