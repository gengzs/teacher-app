<template>
  <view class="container">
    <!-- 头部 -->
    <view class="header">
      <view class="welcome">
        <text class="welcome-text">老师您好</text>
        <text class="welcome-date">{{currentDate}}</text>
      </view>
    </view>

    <!-- 统计数据 -->
    <view class="stats-row">
      <view class="stat-card" @click="goToClassList">
        <view class="stat-num">{{stats.classCount}}</view>
        <view class="stat-label">班级</view>
      </view>
      <view class="stat-card" @click="goToStudents">
        <view class="stat-num">{{stats.studentCount}}</view>
        <view class="stat-label">学生</view>
      </view>
      <view class="stat-card" @click="goToHomework">
        <view class="stat-num">{{stats.taskCount}}</view>
        <view class="stat-label">待交</view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="quick-btn primary" @click="goToCreateHomework">
        <view class="quick-icon">📝</view>
        <text class="quick-text">布置作业</text>
      </view>
      <view class="quick-btn" @click="goToRecite">
        <view class="quick-icon">📖</view>
        <text class="quick-text">单词带背</text>
      </view>
      <view class="quick-btn" @click="goToClassList">
        <view class="quick-icon">🏫</view>
        <text class="quick-text">班级管理</text>
      </view>
    </view>

    <!-- 今日课程 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">今日课程</text>
        <text class="more" @click="goToSchedule">全部 ›</text>
      </view>
      <view class="schedule-list" v-if="todaySchedule.length > 0">
        <view
          class="schedule-item"
          v-for="(item, index) in todaySchedule"
          :key="index"
          @click="goToClassDetail(item.classId)"
        >
          <view class="schedule-time-box">
            <text class="schedule-time">{{item.time}}</text>
          </view>
          <view class="schedule-dot"></view>
          <view class="schedule-info">
            <text class="schedule-class">{{item.className}}</text>
            <text class="schedule-subject">{{item.subject}}</text>
          </view>
          <view class="schedule-action">上课 ›</view>
        </view>
      </view>
      <view class="empty-state" v-if="todaySchedule.length === 0">
        <text class="icon">📅</text>
        <text class="text">今日无课</text>
      </view>
    </view>

    <!-- 底部 Tab 提示 -->
    <view class="tab-tip">
      <text>👆 使用下方 Tab 栏快速访问各功能</text>
    </view>

    <custom-tabbar currentTab="home" :themeAccent="tabThemeAccent" @switch="onTabSwitch" />
  </view>
</template>

<script>
const CACHE_KEY = 'home_data_cache';
const CACHE_TTL = 5 * 60 * 1000; // 缓存5分钟

export default {
  data() {
    return {
      currentDate: '',
      stats: { classCount: 0, studentCount: 0, taskCount: 0 },
      todaySchedule: [],
      pendingHomework: 0,
      pendingRequests: 0,
      _dataLoaded: false,
    };
  },

  onLoad() {
    this.setCurrentDate();
    this._initFromCache();
    this._refreshCloud();
  },

  onShow() {
    // 每次切回来都静默刷新，不阻塞用户
    this._refreshCloud();
  },

  computed: {
    tabThemeAccent() {
      const app = getApp();
      const themeId = app.globalData.currentTheme || 'pink';
      const t = app.globalData.themes && app.globalData.themes[themeId];
      return (t && t.accent) || '#C47786';
    },
  },

  methods: {
    onTabSwitch({ tab }) {
      const map = {
        home: '/pages/teacher/home/home',
        homework: '/pages/teacher/homework/homework',
        class: '/pages/teacher/class/list/list',
        profile: '/pages/teacher/profile/profile',
      };
      const url = map[tab];
      if (url) uni.switchTab({ url });
    },
    setCurrentDate() {
      const now = new Date();
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      this.currentDate = `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;
    },

    _initFromCache() {
      try {
        const cached = uni.getStorageSync(CACHE_KEY);
        if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
          this.stats = cached.data.stats;
          this.todaySchedule = cached.data.todaySchedule;
          this._dataLoaded = true;
        }
      } catch (e) {}
    },

    async _refreshCloud() {
      try {
        const app = getApp();
        const classRes = await app.callFunction('class', { action: 'list' });

        if (classRes.code === 0) {
          const classes = classRes.data || [];
          let totalStudents = 0;
          classes.forEach((c) => { totalStudents += c.studentCount || 0; });

          const data = {
            stats: { classCount: classes.length, studentCount: totalStudents, taskCount: 0 },
            todaySchedule: [
              { time: '08:00-08:40', className: '三年级一班', subject: '英语', classId: '1' },
              { time: '10:00-10:40', className: '三年级二班', subject: '英语', classId: '2' },
            ],
          };

          uni.setStorageSync(CACHE_KEY, { data, timestamp: Date.now() });

          if (!this._dataLoaded) {
            this.stats = data.stats;
            this.todaySchedule = data.todaySchedule;
            this._dataLoaded = true;
          }
        }
      } catch (e) {
        if (!this._dataLoaded) {
          this.stats = { classCount: 3, studentCount: 86, taskCount: 12 };
          this._dataLoaded = true;
        }
      }
    },

    goToClassList() {
      uni.switchTab({ url: '/pages/teacher/class/list/list' });
    },

    goToSchedule() {
      uni.navigateTo({ url: '/pages/teacher/schedule/schedule' });
    },

    goToHomework() {
      uni.switchTab({ url: '/pages/teacher/homework/homework' });
    },

    goToClassDetail(classId) {
      uni.navigateTo({ url: `/pages/teacher/class/detail/detail?id=${classId}` });
    },

    goToCreateHomework() {
      uni.navigateTo({ url: '/pages/teacher/homework/create/create' });
    },

    goToRecite() {
      uni.navigateTo({ url: '/pages/teacher/recite/recite' });
    },

    goToStudents() {
      uni.navigateTo({ url: '/pages/teacher/students/list/list' });
    },

    // 跳转到主题选择页面
    goToTheme() {
      uni.navigateTo({ url: '/pages/theme/theme' });
    },
  },
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 140rpx;
}

.header {
  margin-bottom: 24rpx;
}

.welcome {
  display: flex;
  flex-direction: column;
}

.welcome-text {
  font-size: 44rpx;
  font-weight: 600;
  color: #333;
}

.welcome-date {
  font-size: 28rpx;
  color: #999;
  margin-top: 8rpx;
}

/* 统计数据 */
.stats-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 16rpx;
  text-align: center;
  margin: 0 6rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.stat-card:first-child {
  margin-left: 0;
}

.stat-card:last-child {
  margin-right: 0;
}

.stat-num {
  font-size: 48rpx;
  font-weight: 700;
  color: var(--theme-accent);
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.quick-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx;
  background: #fff;
  border-radius: 16rpx;
  margin: 0 8rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.quick-btn:first-child {
  margin-left: 0;
}

.quick-btn:last-child {
  margin-right: 0;
}

.quick-btn.primary {
  background: var(--theme-gradient);
}

.quick-btn.primary .quick-text {
  color: var(--theme-accent);
}

.quick-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.quick-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* 卡片 */
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.more {
  font-size: 26rpx;
  color: var(--theme-accent);
}

/* 课程列表 */
.schedule-list {
  margin-top: 10rpx;
}

.schedule-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.schedule-item:last-child {
  border-bottom: none;
}

.schedule-time-box {
  width: 140rpx;
  flex-shrink: 0;
}

.schedule-time {
  font-size: 26rpx;
  color: #666;
}

.schedule-dot {
  width: 12rpx;
  height: 12rpx;
  background: var(--theme-accent);
  border-radius: 50%;
  margin: 0 20rpx;
  flex-shrink: 0;
}

.schedule-info {
  flex: 1;
}

.schedule-class {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 6rpx;
}

.schedule-subject {
  font-size: 24rpx;
  color: #999;
}

.schedule-action {
  font-size: 28rpx;
  color: var(--theme-accent);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.empty-state .icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-state .text {
  font-size: 28rpx;
  color: #999;
}

/* 底部提示 */
.tab-tip {
  text-align: center;
  padding: 30rpx 0;
}

.tab-tip text {
  font-size: 24rpx;
  color: #ccc;
}
</style>
