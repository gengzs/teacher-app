<template>
  <view class="container">
    <!-- 班级信息 -->
    <view class="class-banner">
      <text class="banner-title">{{className}}</text>
      <text class="banner-subtitle">班级学习数据统计</text>
    </view>

    <!-- 概览数据 -->
    <view class="overview-grid">
      <view class="overview-card">
        <text class="overview-value">{{stats.totalStudents}}</text>
        <text class="overview-label">班级人数</text>
      </view>
      <view class="overview-card">
        <text class="overview-value">{{stats.totalHomework}}</text>
        <text class="overview-label">布置作业</text>
      </view>
      <view class="overview-card">
        <text class="overview-value">{{stats.completedHomework}}</text>
        <text class="overview-label">完成人次</text>
      </view>
      <view class="overview-card highlight">
        <text class="overview-value">{{stats.avgScore}}</text>
        <text class="overview-label">班级均分</text>
      </view>
    </view>

    <!-- 本周学习趋势 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📈 本周学习趋势</text>
      </view>
      <view class="trend-card">
        <view class="trend-chart">
          <view
            class="trend-bar"
            :style="{ height: (item.score / getMaxScore() * 100) + '%' }"
            v-for="item in weeklyData"
            :key="item.day"
          >
            <view class="bar-fill" v-if="item.score > 0"></view>
            <text class="bar-score" v-if="item.score > 0">{{item.score}}</text>
          </view>
        </view>
        <view class="trend-labels">
          <text class="label-item" v-for="item in weeklyData" :key="item.day">{{item.day}}</text>
        </view>
      </view>
    </view>

    <!-- 学习标兵 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">🏆 学习标兵</text>
      </view>
      <view class="student-list">
        <view
          class="student-item"
          v-for="(item, index) in topStudents"
          :key="index"
          @click="goToStudentDetail(item.name)"
        >
          <view class="rank" :class="{ top: index < 3 }">{{index + 1}}</view>
          <view class="student-info">
            <text class="student-name">{{item.name}}</text>
            <text class="student-meta">完成 {{item.completed}} 次</text>
          </view>
          <view class="student-score">{{item.avgScore}}分</view>
        </view>
      </view>
    </view>

    <!-- 需要关注 -->
    <view class="section" v-if="weakStudents.length > 0">
      <view class="section-header">
        <text class="section-title">⚠️ 需要关注</text>
      </view>
      <view class="student-list warning">
        <view
          class="student-item"
          v-for="(item, index) in weakStudents"
          :key="index"
          @click="goToStudentDetail(item.name)"
        >
          <view class="rank warning-rank">!</view>
          <view class="student-info">
            <text class="student-name">{{item.name}}</text>
            <text class="student-meta">完成 {{item.completed}} 次 · 需跟进</text>
          </view>
          <view class="student-score warning">{{item.avgScore}}分</view>
        </view>
      </view>
    </view>

    <!-- 作业完成情况 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📝 最近作业完成情况</text>
      </view>
      <view class="homework-list">
        <view class="homework-item" v-for="item in recentHomework" :key="item.title">
          <view class="homework-info">
            <text class="homework-title">{{item.title}}</text>
            <view class="homework-progress-bar">
              <view class="progress-fill" :style="{ width: item.submitRate + '%' }"></view>
            </view>
          </view>
          <view class="homework-stats">
            <text class="submit-rate">{{item.submitRate}}%</text>
            <text class="avg-score">均分 {{item.avgScore}}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      classId: '',
      className: '',
      stats: {
        totalStudents: 28,
        activeStudents: 26,
        totalHomework: 15,
        completedHomework: 380,
        avgScore: 85,
        totalTime: '12小时',
      },
      weeklyData: [
        { day: '周一', score: 88, count: 25 },
        { day: '周二', score: 85, count: 28 },
        { day: '周三', score: 92, count: 26 },
        { day: '周四', score: 78, count: 24 },
        { day: '周五', score: 90, count: 27 },
        { day: '周六', score: 0, count: 0 },
        { day: '周日', score: 0, count: 0 },
      ],
      topStudents: [],
      weakStudents: [],
      recentHomework: [],
    };
  },

  onLoad(options) {
    this.classId = options.classId || '';
    this.className = options.className || '';
    this.loadData();
  },

  methods: {
    loadData() {
      this.topStudents = [
        { name: '张小明', avgScore: 96, completed: 15 },
        { name: '李小红', avgScore: 93, completed: 14 },
        { name: '王小强', avgScore: 91, completed: 15 },
        { name: '陈小花', avgScore: 89, completed: 13 },
        { name: '赵小强', avgScore: 88, completed: 14 },
      ];
      this.weakStudents = [
        { name: '周小丽', avgScore: 65, completed: 8 },
        { name: '吴小杰', avgScore: 68, completed: 10 },
        { name: '郑小华', avgScore: 72, completed: 9 },
      ];
      this.recentHomework = [
        { title: 'Unit 1 跟读练习', submitRate: 89, avgScore: 85 },
        { title: '第二单元单词带背', submitRate: 100, avgScore: 88 },
        { title: '语音打卡任务', submitRate: 93, avgScore: 82 },
      ];
    },

    getMaxScore() {
      const scores = this.weeklyData.map((d) => d.score);
      return Math.max(...scores, 1);
    },

    goToStudentDetail(studentName) {
      uni.navigateTo({
        url: `/pages/teacher/records/records/records?classId=${this.classId}&name=${encodeURIComponent(studentName)}`,
      });
    },
  },
};
</script>

<style scoped>
.container {
  padding: 24rpx;
  padding-bottom: 40rpx;
}

.class-banner {
  background: var(--theme-gradient);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.banner-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.banner-subtitle {
  font-size: 26rpx;
  color: #666;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.overview-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
}

.overview-card.highlight {
  background: var(--theme-light);
}

.overview-value {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--theme-accent);
  margin-bottom: 8rpx;
}

.overview-label {
  font-size: 24rpx;
  color: #999;
}

.section {
  margin-bottom: 24rpx;
}

.section-header {
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.trend-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200rpx;
  margin-bottom: 16rpx;
}

.trend-bar {
  width: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.bar-fill {
  width: 100%;
  background: var(--theme-gradient);
  border-radius: 8rpx 8rpx 0 0;
  min-height: 4rpx;
}

.bar-score {
  font-size: 22rpx;
  color: var(--theme-accent);
  margin-top: 8rpx;
}

.trend-labels {
  display: flex;
  justify-content: space-around;
}

.label-item {
  font-size: 24rpx;
  color: #999;
}

.student-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.student-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.student-item:last-child {
  border-bottom: none;
}

.rank {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #f0f0f0;
  color: #999;
  font-size: 24rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.rank.top {
  background: var(--theme-gradient);
  color: #fff;
}

.rank.warning-rank {
  background: #FFE8E8;
  color: #FF6B6B;
}

.student-info {
  flex: 1;
}

.student-name {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 6rpx;
}

.student-meta {
  font-size: 24rpx;
  color: #999;
}

.student-score {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-accent);
}

.student-score.warning {
  color: #FF6B6B;
}

.homework-list {
  background: #fff;
  border-radius: 16rpx;
  padding: 0 24rpx;
}

.homework-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.homework-item:last-child {
  border-bottom: none;
}

.homework-info {
  flex: 1;
  margin-right: 20rpx;
}

.homework-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}

.homework-progress-bar {
  height: 8rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--theme-gradient);
  border-radius: 4rpx;
}

.homework-stats {
  text-align: right;
}

.submit-rate {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-accent);
  margin-bottom: 4rpx;
}

.avg-score {
  font-size: 22rpx;
  color: #999;
}
</style>
