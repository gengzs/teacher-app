<template>
  <view class="container">
    <view class="theme-page" :class="'theme-' + currentThemeId">
      <view class="page-header">
        <view class="header-icon" :style="{ background: currentTheme.gradient }">
          <text class="icon-text">🎨</text>
        </view>
        <text class="header-title">选择你喜欢的颜色</text>
        <text class="header-desc">为应用选择一个专属主题</text>
      </view>

      <view class="theme-selector">
        <view class="theme-grid">
          <view
            class="theme-item"
            :class="{ active: theme.id === currentThemeId }"
            v-for="theme in themes"
            :key="theme.id"
            @click="selectTheme(theme.id)"
          >
            <view
              class="theme-color-block"
              :style="{ background: theme.gradient }"
            ></view>
            <text class="theme-name">{{theme.name}}</text>
          </view>
        </view>
      </view>

      <view class="preview-section">
        <view class="preview-title">预览效果</view>
        <view class="preview-card">
          <view class="preview-header" :style="{ background: currentTheme.gradient }">
            <text class="preview-header-text" :style="{ color: currentTheme.text }">英语口语助手</text>
          </view>
          <view class="preview-content">
            <view class="preview-btn-primary" :style="{ background: currentTheme.gradient, color: currentTheme.text }">
              主按钮
            </view>
            <view class="preview-btn-secondary" :style="{ borderColor: currentTheme.primary, color: currentTheme.accent }">
              次要按钮
            </view>
            <view class="preview-stat" :style="{ color: currentTheme.accent }">
              <text class="stat-num">85%</text>
              <text class="stat-label">完成率</text>
            </view>
          </view>
        </view>
      </view>

      <view class="action-section">
        <button class="confirm-btn" :style="{ background: currentTheme.gradient, color: currentTheme.text }" @click="confirmTheme">
          应用主题
        </button>
      </view>
    </view>
  </view>
</template>

<script>
const app = getApp();

export default {
  data() {
    return {
      themes: [],
      currentThemeId: 'pink',
      currentTheme: {},
    };
  },

  onLoad() {
    const currentThemeId = app.globalData.currentTheme || 'pink';

    this.currentThemeId = currentThemeId;
    this.themes = app.getAllThemes();

    this.updateCurrentTheme();
  },

  onShow() {
    const theme = app.getTheme();
    uni.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: theme.primary,
    });
  },

  methods: {
    updateCurrentTheme() {
      const themeConfig = app.globalData.themes[this.currentThemeId];
      if (themeConfig) {
        this.currentTheme = themeConfig;
      }
    },

    selectTheme(themeId) {
      this.currentThemeId = themeId;
      this.updateCurrentTheme();
    },

    confirmTheme() {
      const themeId = this.currentThemeId;

      if (app.switchTheme(themeId)) {
        uni.showToast({
          title: '主题已应用',
          icon: 'success',
          duration: 1500,
        });

        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      }
    },
  },
};
</script>

<style scoped>
.theme-page {
  min-height: 100vh;
  padding: 24rpx;
  background: var(--theme-light);
}

.page-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0;
}

.header-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.icon-text {
  font-size: 60rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.header-desc {
  font-size: 28rpx;
  color: #999;
}

.theme-selector {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.theme-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 24rpx;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  border-radius: 16rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  width: 140rpx;
}

.theme-item.active {
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
  transform: scale(1.05);
}

.theme-color-block {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.theme-name {
  font-size: 24rpx;
  color: #333;
}

.theme-item.active .theme-name {
  font-weight: 600;
  color: var(--theme-accent);
}

.preview-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.preview-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.preview-card {
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.preview-header {
  padding: 30rpx;
  text-align: center;
}

.preview-header-text {
  font-size: 32rpx;
  font-weight: 600;
}

.preview-content {
  padding: 30rpx;
  background: #fff;
}

.preview-btn-primary {
  padding: 24rpx;
  border-radius: 24rpx;
  text-align: center;
  font-size: 28rpx;
  margin-bottom: 16rpx;
}

.preview-btn-secondary {
  padding: 24rpx;
  border-radius: 24rpx;
  border: 2rpx solid;
  text-align: center;
  font-size: 28rpx;
  margin-bottom: 24rpx;
}

.preview-stat {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.action-section {
  padding: 24rpx 0;
}

.confirm-btn {
  width: 100%;
  padding: 28rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}

.confirm-btn::after {
  border: none;
}
</style>
