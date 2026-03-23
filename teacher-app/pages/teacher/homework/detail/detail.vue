<template>
  <view class="container">
    <!-- 作业信息 -->
    <view class="card">
      <view class="homework-header">
        <view class="homework-icon" :class="homeworkInfo.type">
          <text>{{homeworkInfo.type === 'voice' ? '🎤' : '📖'}}</text>
        </view>
        <view class="homework-info">
          <text class="homework-title">{{homeworkInfo.title}}</text>
          <text class="homework-meta">{{homeworkInfo.className}} · {{homeworkInfo.deadline}}</text>
        </view>
        <view class="homework-status" :class="homeworkInfo.status">
          <text>{{homeworkInfo.status === 'ongoing' ? '进行中' : '已结束'}}</text>
        </view>
      </view>
    </view>

    <!-- 作业内容 -->
    <view class="card" v-if="homeworkInfo.type === 'voice'">
      <view class="card-title">跟读内容</view>
      <view class="content-preview">
        <text>{{homeworkInfo.content}}</text>
      </view>
    </view>

    <!-- 提交进度 -->
    <view class="card progress-card">
      <view class="progress-header">
        <text class="progress-title">提交情况</text>
        <text class="progress-count">{{homeworkInfo.submitCount}}/{{homeworkInfo.totalCount}}</text>
      </view>
      <view class="progress-bar-wrapper">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: (homeworkInfo.submitCount / homeworkInfo.totalCount) * 100 + '%' }"></view>
        </view>
        <text class="progress-percent">{{Math.round((homeworkInfo.submitCount / homeworkInfo.totalCount) * 100)}}%</text>
      </view>
    </view>

    <!-- 学生列表 -->
    <view class="card">
      <view class="card-title">学生列表</view>
      <view class="student-list">
        <view
          class="student-item"
          v-for="item in submissions"
          :key="item.studentId"
          @click="viewSubmission(item)"
        >
          <view class="student-avatar" :class="item.status">
            <text>{{item.studentName[0]}}</text>
          </view>
          <view class="student-info">
            <text class="student-name">{{item.studentName}}</text>
            <text class="submit-time" v-if="item.status === 'completed'">提交于 {{item.submitTime}}</text>
            <text class="submit-time pending" v-if="item.status === 'pending'">待提交</text>
          </view>
          <view class="student-score" v-if="item.status === 'completed'">
            <text class="score-num">{{item.score}}</text>
            <text class="score-label">分</text>
          </view>
          <text class="play-icon" v-if="item.status === 'completed'">▶</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      homeworkId: '',
      homeworkInfo: {},
      submissions: [],
    };
  },

  onLoad(options) {
    this.homeworkId = options.id || '';
    this.loadData();
  },

  methods: {
    loadData() {
      const homeworkInfo = {
        title: 'Unit 1 跟读练习',
        className: '三年级一班',
        deadline: '2024-01-20',
        type: 'voice',
        content: 'Good morning.\nHow are you?\nNice to meet you.',
        status: 'ongoing',
        submitCount: 25,
        totalCount: 28,
      };

      const submissions = [
        { studentId: '1', studentName: '张小明', score: 95, submitTime: '14:30', status: 'completed' },
        { studentId: '2', studentName: '李小红', score: 88, submitTime: '15:20', status: 'completed' },
        { studentId: '3', studentName: '王小强', score: 0, submitTime: '', status: 'pending' },
        { studentId: '4', studentName: '陈小花', score: 92, submitTime: '16:10', status: 'completed' },
        { studentId: '5', studentName: '赵小强', score: 0, submitTime: '', status: 'pending' },
      ];

      this.homeworkInfo = homeworkInfo;
      this.submissions = submissions;
    },

    // 查看学生音频
    viewSubmission(student) {
      if (student && student.status === 'completed') {
        uni.showToast({ title: '播放学生录音', icon: 'loading' });
        // 实际项目中应该播放音频
      } else {
        uni.showToast({ title: '学生还未提交', icon: 'none' });
      }
    },
  },
};
</script>

<style scoped>
.container {
  padding: 24rpx;
  padding-bottom: 40rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.homework-header {
  display: flex;
  align-items: center;
}

.homework-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.homework-icon.voice {
  background-color: #E8F4FF;
}

.homework-icon.word {
  background-color: var(--theme-light);
}

.homework-icon text {
  font-size: 40rpx;
}

.homework-info {
  flex: 1;
}

.homework-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.homework-meta {
  font-size: 26rpx;
  color: #999;
}

.homework-status {
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  flex-shrink: 0;
}

.homework-status.ongoing {
  background-color: #E6F7FF;
  color: #1890FF;
}

.homework-status.completed {
  background-color: #F5F5F5;
  color: #999;
}

.content-preview {
  background: #FAFAFA;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
}

.progress-card {
  background: linear-gradient(135deg, var(--theme-light) 0%, #fff 100%);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.progress-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.progress-count {
  font-size: 28rpx;
  color: var(--theme-accent);
  font-weight: 600;
}

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-bar {
  flex: 1;
  height: 12rpx;
  background-color: #E5E5E5;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--theme-gradient);
  border-radius: 6rpx;
}

.progress-percent {
  font-size: 28rpx;
  color: var(--theme-accent);
  font-weight: 600;
  width: 80rpx;
  text-align: right;
}

.student-list {
  display: flex;
  flex-direction: column;
}

.student-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.student-item:last-child {
  border-bottom: none;
}

.student-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--theme-gradient);
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.student-avatar.pending {
  background: #E5E5E5;
  color: #999;
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

.submit-time {
  font-size: 24rpx;
  color: #999;
}

.submit-time.pending {
  color: #FF6B6B;
}

.student-score {
  display: flex;
  align-items: baseline;
  margin-right: 16rpx;
}

.score-num {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--theme-accent);
}

.score-label {
  font-size: 24rpx;
  color: var(--theme-accent);
  margin-left: 4rpx;
}

.play-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: var(--theme-gradient);
  color: #fff;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
