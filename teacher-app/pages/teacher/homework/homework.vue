<template>
  <view class="container">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view
        class="filter-item"
        :class="{ active: currentFilter === item.key }"
        v-for="item in filterOptions"
        :key="item.key"
        @click="switchFilter(item.key)"
      >
        {{item.label}}
      </view>
    </view>

    <!-- 作业列表 -->
    <view class="card">
      <view class="homework-list" v-if="homeworkList.length > 0">
        <view
          class="homework-item"
          v-for="item in homeworkList"
          :key="item._id"
          v-if="currentFilter === 'all' || item.type === currentFilter"
          @click="goToDetail(item._id)"
        >
          <view class="homework-main">
            <view class="homework-icon" :class="item.type">
              <text>{{item.type === 'voice' ? '🎤' : '📖'}}</text>
            </view>
            <view class="homework-info">
              <text class="homework-title">{{item.title}}</text>
              <text class="homework-meta">{{item.className}} · {{item.deadline}}</text>
            </view>
            <view class="homework-status" :class="item.status">
              <text>{{item.status === 'ongoing' ? '进行中' : '已结束'}}</text>
            </view>
          </view>
          <view class="homework-progress">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: (item.submitCount / item.totalCount) * 100 + '%' }"></view>
            </view>
            <text class="progress-text">{{item.submitCount}}/{{item.totalCount}}</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="homeworkList.length === 0">
        <text class="icon">📋</text>
        <text class="text">{{emptyState.message}}</text>
      </view>
    </view>

    <!-- 底部按钮（抬高，避免与自定义 Tab 重叠） -->
    <view class="bottom-action">
      <view class="btn-primary" @click="goToCreateHomework">
        <text class="btn-icon">+</text>
        <text>布置作业</text>
      </view>
    </view>

    <custom-tabbar currentTab="homework" :themeAccent="tabThemeAccent" @switch="onTabSwitch" />
  </view>
</template>

<script>
const CACHE_KEY = 'homework_cache';
const CACHE_TTL = 5 * 60 * 1000;

export default {
  data() {
    return {
      currentFilter: 'all',
      filterOptions: [
        { key: 'all', label: '全部' },
        { key: 'voice', label: '语音朗读' },
        { key: 'word', label: '单词带背' },
      ],
      homeworkList: [],
      emptyState: { show: false, message: '暂无作业' },
      _dataLoaded: false,
    };
  },

  onLoad() {
    this._initFromCache();
    this._refreshCloud();
  },

  onShow() {
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
    _initFromCache() {
      try {
        const cached = uni.getStorageSync(CACHE_KEY);
        if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
          this.homeworkList = cached.data;
          this._dataLoaded = true;
        }
      } catch (e) {}
    },

    async _refreshCloud() {
      try {
        const app = getApp();
        const res = await app.callFunction('homework', { action: 'list' });

        if (res.code === 0) {
          const list = res.data || [];
          uni.setStorageSync(CACHE_KEY, { data: list, timestamp: Date.now() });
          this.homeworkList = list;
          this._dataLoaded = true;
        }
      } catch (e) {
        if (!this._dataLoaded) {
          this.homeworkList = [
            { _id: '1', title: 'Unit 1 跟读练习', className: '三年级一班', deadline: '2024-01-20', submitCount: 25, totalCount: 28, type: 'voice', status: 'ongoing' },
            { _id: '2', title: '第二单元单词带背', className: '三年级二班', deadline: '2024-01-22', submitCount: 30, totalCount: 30, type: 'word', status: 'completed' },
            { _id: '3', title: '第三单元朗读', className: '三年级一班', deadline: '2024-01-25', submitCount: 12, totalCount: 28, type: 'voice', status: 'ongoing' },
          ];
          this._dataLoaded = true;
        }
      }
    },

    switchFilter(type) {
      this.currentFilter = type;
    },

    goToCreateHomework() {
      uni.navigateTo({ url: '/pages/teacher/homework/create/create' });
    },

    goToDetail(id) {
      uni.navigateTo({ url: `/pages/teacher/homework/detail/detail?id=${id}` });
    },

    getFilteredList() {
      if (this.currentFilter === 'all') return this.homeworkList;
      return this.homeworkList.filter(item => item.type === this.currentFilter);
    },
  },
};
</script>

<style scoped>
.container {
  padding: 24rpx;
  padding-bottom: 140rpx;
}

.filter-bar {
  display: flex;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
}

.filter-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666666;
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.filter-item.active {
  color: #ffffff;
  background: var(--theme-gradient);
  font-weight: 600;
}

.homework-list {
  display: flex;
  flex-direction: column;
}

.homework-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.homework-item:last-child {
  border-bottom: none;
}

.homework-main {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.homework-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.homework-icon.voice {
  background-color: #E8F4FF;
}

.homework-icon.word {
  background-color: var(--theme-light);
}

.homework-icon text {
  font-size: 36rpx;
}

.homework-info {
  flex: 1;
  min-width: 0;
}

.homework-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.homework-meta {
  font-size: 26rpx;
  color: #999999;
}

.homework-status {
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  flex-shrink: 0;
}

.homework-status.ongoing {
  background-color: #E6F7FF;
  color: #1890FF;
}

.homework-status.completed {
  background-color: #F5F5F5;
  color: #999999;
}

.homework-progress {
  display: flex;
  align-items: center;
  padding-left: 88rpx;
}

.progress-bar {
  flex: 1;
  height: 8rpx;
  background-color: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
  margin-right: 16rpx;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-primary) 0%, var(--theme-dark) 100%);
  border-radius: 4rpx;
}

.progress-text {
  font-size: 24rpx;
  color: var(--theme-primary);
  font-weight: 500;
  width: 80rpx;
  text-align: right;
}

.bottom-action {
  position: fixed;
  /* 自定义 Tab 栏高度约 100rpx + 安全区 */
  bottom: calc(100rpx + env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  padding: 20rpx 24rpx;
  padding-bottom: 20rpx;
  background-color: var(--theme-light);
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-gradient);
  color: #ffffff;
  border-radius: 44rpx;
  padding: 28rpx 48rpx;
  font-size: 32rpx;
  font-weight: 500;
}

.btn-primary:active {
  opacity: 0.85;
}

.btn-icon {
  font-size: 40rpx;
  margin-right: 8rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.empty-state .icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-state .text {
  font-size: 28rpx;
  color: #999999;
}
</style>
