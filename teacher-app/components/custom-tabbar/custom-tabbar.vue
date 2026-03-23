<template>
  <view class="tabbar">
    <view
      class="tab-item"
      :class="{ active: currentTab === item.key }"
      v-for="item in tabs"
      :key="item.key"
      @click="onTabTap(item.key)"
    >
      <!-- 使用 emoji，避免依赖 /static/tab 图片（多端可直接显示） -->
      <text class="tab-emoji">{{ currentTab === item.key ? item.activeEmoji : item.emoji }}</text>
      <text class="tab-text" :style="currentTab === item.key ? 'color:' + themeAccent : ''">{{ item.label }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CustomTabbar',
  props: {
    currentTab: {
      type: String,
      default: 'home',
    },
    themeAccent: {
      type: String,
      default: '#C47786',
    },
  },
  data() {
    return {
      tabs: [
        { key: 'home', label: '首页', emoji: '🏠', activeEmoji: '🏡' },
        { key: 'homework', label: '作业', emoji: '📋', activeEmoji: '📝' },
        { key: 'class', label: '班级', emoji: '🏫', activeEmoji: '🎓' },
        { key: 'profile', label: '我的', emoji: '👤', activeEmoji: '👨‍🏫' },
      ],
    };
  },
  methods: {
    onTabTap(key) {
      if (key === this.currentTab) return;
      this.$emit('switch', { tab: key });
    },
  },
};
</script>

<style scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  align-items: stretch;
  height: 100rpx;
  background-color: #FFFBFC;
  border-top: 1rpx solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rpx 0;
}

.tab-emoji {
  font-size: 44rpx;
  line-height: 1;
  margin-bottom: 6rpx;
}

.tab-text {
  font-size: 20rpx;
  color: #9CA3AF;
  line-height: 1;
}
</style>
