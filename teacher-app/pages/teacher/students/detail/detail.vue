<template>
  <view class="container">
    <!-- 学生信息头部 -->
    <view class="student-header">
      <view class="student-avatar">{{studentInfo.name ? studentInfo.name[0] : '?'}}</view>
      <view class="student-info">
        <text class="student-name">{{studentInfo.name || '加载中...'}}</text>
        <text class="student-class">{{studentInfo.className || '未分班'}}</text>
      </view>
      <view class="student-stats">
        <view class="stat-item">
          <text class="stat-value">{{learnDays}}</text>
          <text class="stat-label">学习天数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{masterRate}}%</text>
          <text class="stat-label">掌握率</text>
        </view>
      </view>
    </view>

    <!-- 学习操作区 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📖 学习</text>
      </view>
      <view class="learn-grid">
        <view class="learn-card primary" @click="startRecite">
          <view class="learn-icon">🎯</view>
          <text class="learn-title">开始背单词</text>
          <text class="learn-desc">选词库进行学习</text>
        </view>
        <view class="learn-card" @click="startReview">
          <view class="learn-icon">🔄</view>
          <text class="learn-title">抗遗忘复习</text>
          <text class="learn-desc">根据遗忘曲线</text>
        </view>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📊 学习数据</text>
        <text class="section-more" @click="exportData">导出 ›</text>
      </view>
      <view class="stats-card">
        <view class="stats-row">
          <view class="stats-item">
            <view class="stats-icon">📚</view>
            <view class="stats-content">
              <text class="stats-value">{{totalWords}}</text>
              <text class="stats-label">已学单词</text>
            </view>
          </view>
          <view class="stats-item">
            <view class="stats-icon">✅</view>
            <view class="stats-content">
              <text class="stats-value">{{masteredWords}}</text>
              <text class="stats-label">已掌握</text>
            </view>
          </view>
          <view class="stats-item">
            <view class="stats-icon">⏰</view>
            <view class="stats-content">
              <text class="stats-value">{{reviewCount}}</text>
              <text class="stats-label">待复习</text>
            </view>
          </view>
        </view>

        <!-- 进度条 -->
        <view class="progress-section">
          <view class="progress-header">
            <text class="progress-title">整体进度</text>
            <text class="progress-percent">{{progressPercent}}%</text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill" :style="{width: progressPercent + '%'}"></view>
          </view>
          <view class="progress-legend">
            <view class="legend-item">
              <view class="legend-dot" style="background: #4CAF50;"></view>
              <text>已掌握 {{masteredWords}}</text>
            </view>
            <view class="legend-item">
              <view class="legend-dot" style="background: #FFC107;"></view>
              <text>学习中 {{learningWords}}</text>
            </view>
            <view class="legend-item">
              <view class="legend-dot" style="background: #E0E0E0;"></view>
              <text>未开始 {{notStartedWords}}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 词汇量测试 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">🎤 词汇测试</text>
      </view>
      <view class="test-card" @click="startTest">
        <view class="test-icon">📝</view>
        <view class="test-content">
          <text class="test-title">词汇量测试</text>
          <text class="test-desc">测试学生当前词汇量水平</text>
        </view>
        <text class="test-arrow">›</text>
      </view>
    </view>

    <!-- 最近学习记录 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📜 学习记录</text>
      </view>
      <view class="records-list" v-if="records.length > 0">
        <view class="record-item" v-for="item in records" :key="item._id">
          <view class="record-icon" :class="item.type">
            <text>{{item.type === 'recite' ? '🎯' : item.type === 'review' ? '🔄' : '📝'}}</text>
          </view>
          <view class="record-info">
            <text class="record-title">{{item.title}}</text>
            <text class="record-date">{{item.date}}</text>
          </view>
          <view class="record-result" v-if="item.score">
            <text class="result-score">{{item.score}}分</text>
          </view>
          <view class="record-result" v-if="item.wordCount">
            <text class="result-count">{{item.wordCount}}词</text>
          </view>
        </view>
      </view>
      <view class="empty-records" v-else>
        <text class="empty-text">暂无学习记录</text>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-actions">
      <view class="action-btn" @click="removeFromClass">
        <text>移出班级</text>
      </view>
    </view>
  </view>
</template>

<script>
const app = getApp();

export default {
  data() {
    return {
      studentId: '',
      studentInfo: {},
      learnDays: 0,
      masterRate: 0,
      totalWords: 0,
      masteredWords: 0,
      learningWords: 0,
      notStartedWords: 0,
      reviewCount: 0,
      progressPercent: 0,
      records: [],
    };
  },

  onLoad(options) {
    this.studentId = options.id || '';
    const name = decodeURIComponent(options.name || '');
    const classId = options.classId || '';
    const className = decodeURIComponent(options.className || '');

    this.studentInfo = {
      name,
      classId,
      className,
    };

    this.loadData();
  },

  methods: {
    async loadData() {
      // TODO: 从后端加载真实数据
      // 目前使用模拟数据
      this.totalWords = 120;
      this.masteredWords = 45;
      this.learningWords = 35;
      this.notStartedWords = 40;
      this.reviewCount = 12;
      this.learnDays = 28;
      this.masterRate = Math.round((this.masteredWords / this.totalWords) * 100);
      this.progressPercent = Math.round((this.masteredWords / this.totalWords) * 100);

      this.records = [
        { _id: '1', title: 'Unit 5 核心词汇', date: '今天 14:30', score: 92, type: 'recite' },
        { _id: '2', title: '抗遗忘复习', date: '今天 10:15', score: 88, type: 'review' },
        { _id: '3', title: 'Unit 4 核心词汇', date: '昨天 15:20', score: 85, type: 'recite' },
        { _id: '4', title: '词汇量测试', date: '3天前', score: null, wordCount: 50, type: 'test' },
      ];
    },

    startRecite() {
      // 跳转到词库管理页面，带上学生信息
      uni.navigateTo({
        url: `/pages/teacher/words/words?mode=student&studentId=${this.studentId}&studentName=${encodeURIComponent(this.studentInfo.name)}`,
      });
    },

    startReview() {
      // 跳转到词库管理页面，带上学生信息和复习模式
      uni.navigateTo({
        url: `/pages/teacher/words/words?mode=review&studentId=${this.studentId}&studentName=${encodeURIComponent(this.studentInfo.name)}`,
      });
    },

    exportData() {
      uni.showActionSheet({
        itemList: ['导出为 Excel', '导出为 PDF', '发送到邮箱'],
        success: (res) => {
          if (res.tapIndex === 0) {
            uni.showToast({ title: '正在生成...', icon: 'loading' });
            // TODO: 调用导出接口
            setTimeout(() => {
              uni.showToast({ title: '导出成功', icon: 'success' });
            }, 1500);
          }
        },
      });
    },

    startTest() {
      uni.navigateTo({
        url: `/pages/teacher/recite/groupTest/groupTest?studentId=${this.studentId}&studentName=${encodeURIComponent(this.studentInfo.name)}`,
      });
    },

    removeFromClass() {
      if (!this.studentInfo.classId) {
        uni.showToast({ title: '该学生未分班', icon: 'none' });
        return;
      }

      uni.showModal({
        title: '移出班级',
        content: `确定要将「${this.studentInfo.name}」移出「${this.studentInfo.className}」吗？`,
        confirmText: '移出',
        confirmColor: '#ff4d4f',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await app.callFunction('class', {
                action: 'removeStudent',
                classId: this.studentInfo.classId,
                studentId: this.studentId,
              });

              if (result.code === 0) {
                uni.showToast({ title: '已移出', icon: 'success' });
                setTimeout(() => {
                  uni.navigateBack();
                }, 1500);
              } else {
                uni.showToast({ title: result.msg, icon: 'none' });
              }
            } catch (e) {
              uni.showToast({ title: '操作失败', icon: 'none' });
            }
          }
        },
      });
    },
  },
};
</script>

<style scoped>
.container {
  padding: 24rpx;
  padding-bottom: 120rpx;
}

/* 学生头部 */
.student-header {
  display: flex;
  align-items: center;
  background: var(--theme-gradient);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.student-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: var(--theme-accent);
  font-size: 40rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.student-info {
  flex: 1;
}

.student-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 8rpx;
}

.student-class {
  font-size: 26rpx;
  color: #666;
}

.student-stats {
  display: flex;
  gap: 24rpx;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: var(--theme-accent);
  margin-bottom: 4rpx;
}

.stat-label {
  font-size: 20rpx;
  color: #666;
}

/* 区块 */
.section {
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.section-more {
  font-size: 26rpx;
  color: var(--theme-accent);
}

/* 学习卡片 */
.learn-grid {
  display: flex;
  gap: 16rpx;
}

.learn-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 20rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.learn-card:active {
  transform: scale(0.98);
}

.learn-card.primary {
  background: var(--theme-gradient);
}

.learn-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.learn-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 6rpx;
}

.learn-card.primary .learn-title {
  color: #fff;
}

.learn-desc {
  font-size: 22rpx;
  color: #999;
}

.learn-card.primary .learn-desc {
  color: rgba(255, 255, 255, 0.8);
}

/* 统计卡片 */
.stats-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.stats-row {
  display: flex;
  margin-bottom: 24rpx;
}

.stats-item {
  flex: 1;
  display: flex;
  align-items: center;
}

.stats-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.stats-value {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: var(--theme-accent);
}

.stats-label {
  font-size: 22rpx;
  color: #999;
}

/* 进度条 */
.progress-section {
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.progress-title {
  font-size: 26rpx;
  color: #666;
}

.progress-percent {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--theme-accent);
}

.progress-bar {
  height: 16rpx;
  background: #E0E0E0;
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #66BB6A);
  border-radius: 8rpx;
  transition: width 0.3s ease;
}

.progress-legend {
  display: flex;
  justify-content: space-between;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 22rpx;
  color: #666;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 8rpx;
}

/* 测试卡片 */
.test-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.test-card:active {
  transform: scale(0.98);
}

.test-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.test-content {
  flex: 1;
}

.test-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 6rpx;
}

.test-desc {
  font-size: 24rpx;
  color: #999;
}

.test-arrow {
  font-size: 40rpx;
  color: #ccc;
}

/* 学习记录 */
.records-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.record-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.record-icon text {
  font-size: 32rpx;
}

.record-icon.recite {
  background: #FFF3E0;
}

.record-icon.review {
  background: #E8F5E6;
}

.record-icon.test {
  background: #E3F2FD;
}

.record-info {
  flex: 1;
}

.record-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 6rpx;
}

.record-date {
  font-size: 24rpx;
  color: #999;
}

.record-result {
  text-align: right;
}

.result-score {
  font-size: 32rpx;
  font-weight: 700;
  color: #4CAF50;
}

.result-count {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-accent);
}

.empty-records {
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 底部操作 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.action-btn {
  text-align: center;
  padding: 24rpx;
  background: #FFE8E8;
  border-radius: 24rpx;
  font-size: 28rpx;
  color: #FF6B6B;
}
</style>
