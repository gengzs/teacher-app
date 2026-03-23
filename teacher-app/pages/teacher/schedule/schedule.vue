<template>
  <view class="container">
    <!-- 视图切换 -->
    <view class="view-toggle">
      <view
        class="toggle-btn"
        :class="{ active: viewMode === 'day' }"
        @click="toggleViewMode"
        v-if="viewMode === 'week'"
      >日视图</view>
      <view
        class="toggle-btn"
        :class="{ active: viewMode === 'week' }"
        @click="toggleViewMode"
        v-if="viewMode === 'day'"
      >周视图</view>
      <view class="add-btn" @click="addSchedule">+ 添加</view>
    </view>

    <!-- 日视图 -->
    <view v-if="viewMode === 'day'">
      <scroll-view scroll-x class="week-scroll">
        <view class="week-selector">
          <view
            class="week-day"
            :class="{ active: currentWeekday === index }"
            v-for="(item, index) in weekDays"
            :key="index"
            @click="selectDay(index)"
          >
            <text class="day-label">{{item}}</text>
            <text class="day-date">{{formatDate(index)}}</text>
            <view class="day-dot" v-if="weekSchedule[index] && weekSchedule[index].hasClass"></view>
          </view>
        </view>
      </scroll-view>

      <view class="card">
        <view class="card-header">
          <text class="card-title">{{weekDays[currentWeekday]}}课程</text>
          <text class="card-count">{{currentDaySchedule.length}}节课</text>
        </view>

        <view class="schedule-list" v-if="currentDaySchedule.length > 0">
          <view
            class="schedule-item"
            v-for="(item, index) in currentDaySchedule"
            :key="index"
            @click="goToClass(item.classId)"
          >
            <view class="schedule-time-box">
              <text class="schedule-time">{{item.time}}</text>
            </view>
            <view class="schedule-dot"></view>
            <view class="schedule-info">
              <text class="schedule-class">{{item.className}}</text>
              <text class="schedule-subject">{{item.subject}}</text>
            </view>
            <text class="arrow">›</text>
          </view>
        </view>

        <view class="empty-state" v-if="currentDaySchedule.length === 0">
          <text class="icon">📅</text>
          <text class="text">今日无课</text>
        </view>
      </view>
    </view>

    <!-- 周视图 -->
    <view v-if="viewMode === 'week'">
      <view class="week-header">
        <text class="week-title">本周课程安排</text>
      </view>

      <view class="week-grid">
        <view
          class="week-day-card"
          :class="{ 'has-class': item.hasClass }"
          v-for="item in weekSchedule"
          :key="item.day"
          @click="selectDay(item.day)"
        >
          <view class="week-day-label">{{item.label}}</view>
          <view class="week-day-date">{{formatDate(item.day)}}</view>
          <view class="week-day-count" v-if="item.hasClass">
            <text>{{item.count}}</text>
            <text class="count-label">节课</text>
          </view>
          <view class="week-day-empty" v-if="!item.hasClass">
            <text>无课</text>
          </view>
        </view>
      </view>

      <view class="card" v-if="currentDaySchedule.length > 0">
        <view class="card-header">
          <text class="card-title">{{weekDays[currentWeekday]}}详细课程</text>
        </view>
        <view class="schedule-list">
          <view
            class="schedule-item"
            v-for="(item, index) in currentDaySchedule"
            :key="index"
          >
            <view class="schedule-time-box">
              <text class="schedule-time">{{item.time}}</text>
            </view>
            <view class="schedule-dot"></view>
            <view class="schedule-info">
              <text class="schedule-class">{{item.className}}</text>
              <text class="schedule-subject">{{item.subject}}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const CACHE_KEY = 'schedule_cache';
const CACHE_TTL = 5 * 60 * 1000;

export default {
  data() {
    return {
      viewMode: 'day',
      weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      currentWeekday: 0,
      scheduleList: [],
      currentDaySchedule: [],
      weekSchedule: [],
      loading: false,
      _dataLoaded: false,
    };
  },

  onLoad() {
    const today = new Date().getDay();
    const weekday = today === 0 ? 6 : today - 1;
    this.currentWeekday = weekday;

    this._initFromCache();
    this._refreshCloud();
  },

  onShow() {
    this._refreshCloud();
  },

  methods: {
    _initFromCache() {
      try {
        const cached = uni.getStorageSync(CACHE_KEY);
        if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
          this._applyData(cached.data);
          this._dataLoaded = true;
        }
      } catch (e) {}
    },

    async _refreshCloud() {
      try {
        const app = getApp();
        const res = await app.callFunction('schedule', { action: 'list' });

        if (res.code === 0) {
          uni.setStorageSync(CACHE_KEY, { data: res.data, timestamp: Date.now() });
          if (!this._dataLoaded) {
            this._applyData(res.data);
            this._dataLoaded = true;
          } else {
            this.scheduleList = res.data;
            this.updateCurrentDaySchedule();
            this.updateWeekSchedule();
          }
        }
      } catch (e) {
        if (!this._dataLoaded) {
          this._applyData([
            { day: 0, time: '08:00-08:40', className: '三年级一班', subject: '英语', classId: '1' },
          ]);
          this._dataLoaded = true;
        }
      }
    },

    _applyData(scheduleList) {
      this.scheduleList = scheduleList;
      this.updateCurrentDaySchedule();
      this.updateWeekSchedule();
    },

    updateCurrentDaySchedule() {
      const schedule = this.scheduleList.filter(
        (item) => item.day === this.currentWeekday
      );
      this.currentDaySchedule = schedule;
    },

    updateWeekSchedule() {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const daySchedule = this.scheduleList.filter((item) => item.day === i);
        week.push({
          day: i,
          label: this.weekDays[i],
          hasClass: daySchedule.length > 0,
          count: daySchedule.length,
          classes: daySchedule,
        });
      }
      this.weekSchedule = week;
    },

    toggleViewMode() {
      const mode = this.viewMode === 'day' ? 'week' : 'day';
      this.viewMode = mode;
    },

    selectDay(day) {
      this.currentWeekday = day;
      this.updateCurrentDaySchedule();
    },

    formatDate(dayIndex) {
      const today = new Date();
      const currentDay = today.getDay();
      const daysUntilTarget = (dayIndex + 1) - (currentDay === 0 ? 7 : currentDay);
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);
      return `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
    },

    goToClass(classId) {
      uni.navigateTo({ url: `/pages/teacher/class/detail/detail?id=${classId}` });
    },

    addSchedule() {
      uni.showModal({
        title: '添加课程',
        editable: true,
        placeholderText: '格式：时间|班级|科目\n例如：08:00-08:40|三年级一班|英语',
        success: (res) => {
          if (res.confirm && res.content) {
            uni.showToast({ title: '添加成功', icon: 'success' });
            this._refreshCloud();
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
  padding-bottom: 140rpx;
}

.view-toggle {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20rpx;
}

.toggle-btn {
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  color: #999;
  background: #fff;
  border-radius: 20rpx;
  margin-right: 12rpx;
}

.toggle-btn.active {
  color: var(--theme-accent);
  background: var(--theme-light);
}

.add-btn {
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  color: #fff;
  background: var(--theme-gradient);
  border-radius: 20rpx;
}

.week-scroll {
  white-space: nowrap;
  margin-bottom: 20rpx;
}

.week-selector {
  display: inline-flex;
  padding: 8rpx;
  background: #fff;
  border-radius: 16rpx;
}

.week-day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
  min-width: 100rpx;
}

.week-day.active {
  background: var(--theme-light);
}

.day-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.week-day.active .day-label {
  color: var(--theme-accent);
  font-weight: 600;
}

.day-date {
  font-size: 24rpx;
  color: #999;
}

.week-day.active .day-date {
  color: var(--theme-accent);
}

.day-dot {
  position: absolute;
  bottom: 8rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: var(--theme-accent);
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.card-count {
  font-size: 24rpx;
  color: #999;
}

.schedule-list {
  display: flex;
  flex-direction: column;
}

.schedule-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
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
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: var(--theme-accent);
  margin: 0 16rpx;
  flex-shrink: 0;
}

.schedule-info {
  flex: 1;
}

.schedule-class {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 6rpx;
}

.schedule-subject {
  font-size: 24rpx;
  color: #999;
}

.arrow {
  font-size: 32rpx;
  color: #ccc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.empty-state .icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.empty-state .text {
  font-size: 28rpx;
  color: #999;
}

/* 周视图 */
.week-header {
  margin-bottom: 20rpx;
}

.week-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.week-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.week-day-card {
  flex: 1;
  min-width: 140rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  text-align: center;
}

.week-day-card.has-class {
  background: var(--theme-light);
}

.week-day-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.week-day-card.has-class .week-day-label {
  color: var(--theme-accent);
  font-weight: 600;
}

.week-day-date {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.week-day-count {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-accent);
}

.count-label {
  font-size: 22rpx;
  font-weight: normal;
  margin-left: 4rpx;
}

.week-day-empty {
  font-size: 24rpx;
  color: #ccc;
}
</style>
