<template>
  <view class="container">
    <!-- 统计概览 -->
    <view class="stats-overview">
      <view class="stat-card">
        <text class="stat-value">{{sessions.length}}</text>
        <text class="stat-label">总课时</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">12</text>
        <text class="stat-label">参与人次</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">86</text>
        <text class="stat-label">平均分</text>
      </view>
    </view>

    <!-- 课程列表 -->
    <view class="session-list">
      <view
        class="session-item"
        v-for="item in sessions"
        :key="item._id"
        @click="goToSessionDetail(item._id)"
      >
        <view class="session-date">
          <text class="date-day">{{item.dateStr}}</text>
          <text class="date-weekday">{{getWeekday(item.date)}}</text>
        </view>

        <view class="session-content">
          <view class="session-header">
            <view class="session-icon">{{item.typeIcon}}</view>
            <view class="session-info">
              <text class="session-type">{{item.typeName}}</text>
              <text class="session-set">{{item.wordSet}}</text>
            </view>
            <view class="session-score">
              <text class="score-value">{{item.avgScore}}</text>
              <text class="score-label">均分</text>
            </view>
          </view>

          <view class="session-footer">
            <view class="session-meta">
              <text class="meta-item">🕐 {{item.time}} · {{item.duration}}</text>
            </view>
            <view class="session-participate">
              <text class="participate-text">参与 {{item.participateCount}}/{{item.studentCount}}人</text>
            </view>
          </view>
        </view>

        <text class="session-arrow">›</text>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="sessions.length === 0">
      <text class="icon">📜</text>
      <text class="text">暂无上课记录</text>
      <text class="hint">开始上课后会显示在这里</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      classId: '',
      className: '',
      sessions: [],
      months: [],
      currentMonth: '',
    };
  },

  onLoad(options) {
    this.classId = options.classId || '';
    this.className = options.className || '';
    this.loadHistory();
  },

  methods: {
    loadHistory() {
      this.sessions = [
        {
          _id: '1',
          date: '2024-01-20',
          dateStr: '01月20日',
          time: '08:00',
          type: 'word_recite',
          typeName: '单词带背',
          typeIcon: '📖',
          wordSet: 'Unit 1 核心词汇',
          duration: '25分钟',
          studentCount: 28,
          participateCount: 26,
          avgScore: 85,
        },
        {
          _id: '2',
          date: '2024-01-18',
          dateStr: '01月18日',
          time: '10:00',
          type: 'word_recite',
          typeName: '单词带背',
          typeIcon: '📖',
          wordSet: 'Unit 1 核心词汇',
          duration: '30分钟',
          studentCount: 28,
          participateCount: 28,
          avgScore: 92,
        },
        {
          _id: '3',
          date: '2024-01-15',
          dateStr: '01月15日',
          time: '14:00',
          type: 'voice_reading',
          typeName: '语音朗读',
          typeIcon: '🎤',
          wordSet: '第一课跟读',
          duration: '20分钟',
          studentCount: 28,
          participateCount: 25,
          avgScore: 78,
        },
        {
          _id: '4',
          date: '2024-01-12',
          dateStr: '01月12日',
          time: '08:00',
          type: 'word_recite',
          typeName: '单词带背',
          typeIcon: '📖',
          wordSet: 'Unit 1 核心词汇',
          duration: '28分钟',
          studentCount: 28,
          participateCount: 27,
          avgScore: 88,
        },
      ];
    },

    goToSessionDetail(sessionId) {
      uni.showToast({ title: '查看课程详情', icon: 'none' });
    },

    formatDate(dateStr) {
      const date = new Date(dateStr);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${month}月${day}日`;
    },

    getWeekday(dateStr) {
      const date = new Date(dateStr);
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekdays[date.getDay()];
    },
  },
};
</script>

<style scoped>
.container {
  padding: 24rpx;
  padding-bottom: 40rpx;
}

.stats-overview {
  display: flex;
  background: var(--theme-gradient);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.stat-card {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.session-item {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  position: relative;
}

.session-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20rpx;
  min-width: 100rpx;
}

.date-day {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 4rpx;
}

.date-weekday {
  font-size: 22rpx;
  color: #999;
}

.session-content {
  flex: 1;
}

.session-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.session-icon {
  font-size: 40rpx;
  margin-right: 12rpx;
}

.session-info {
  flex: 1;
}

.session-type {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 4rpx;
}

.session-set {
  font-size: 24rpx;
  color: #999;
}

.session-score {
  text-align: right;
}

.score-value {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--theme-accent);
}

.score-label {
  font-size: 22rpx;
  color: #999;
}

.session-footer {
  display: flex;
  justify-content: space-between;
}

.session-meta {
  font-size: 24rpx;
  color: #999;
}

.session-participate {
  font-size: 24rpx;
  color: var(--theme-accent);
}

.session-arrow {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 36rpx;
  color: #ccc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-state .icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-state .text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.empty-state .hint {
  font-size: 24rpx;
  color: #ccc;
}
</style>
