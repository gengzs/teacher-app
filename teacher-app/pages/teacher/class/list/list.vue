<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-title">班级</text>
    </view>

    <!-- 班级列表 -->
    <view class="class-list" v-if="classes.length > 0">
      <view
        v-for="(item, index) in classes"
        :key="item._id"
        class="class-item"
        :class="{ 'item-dragging': dragging && dragIndex === index }"
        @click="onClassItemTap(item._id)"
        @longpress="onItemLongPress(index)"
        @touchmove="onItemTouchMove"
        @touchend="onItemTouchEnd"
        @touchcancel="onItemTouchEnd"
      >
        <!-- 头像 -->
        <view class="class-avatar">{{item.name[0]}}</view>

        <!-- 班级信息 -->
        <view class="class-info">
          <text class="class-name">{{item.name}}</text>
          <text class="class-count">{{item.studentCount || 0}}名学生</text>
        </view>

        <!-- 邀请码 -->
        <view class="invite-code-box" @click.stop="copyInviteCode(item.inviteCode)">
          <text class="invite-label">邀请码</text>
          <text class="invite-value">{{item.inviteCode}}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && classes.length === 0">
      <text class="icon">🏫</text>
      <text class="text">暂无班级</text>
      <text class="sub-text">去「我的」创建第一个班级</text>
    </view>

    <custom-tabbar currentTab="class" :themeAccent="tabThemeAccent" @switch="onTabSwitch" />
  </view>
</template>

<script>
const app = getApp();
const CLASSES_ORDER_KEY = 'teacher_classes_order';
const CACHE_KEY = 'class_list_cache';
const CACHE_TTL = 5 * 60 * 1000;
const SWAP_THRESHOLD_PX = 52;

export default {
  data() {
    return {
      classes: [],
      loading: false,
      dragging: false,
      dragIndex: -1,
      _lastY: 0,
      _accDy: 0,
      _didSwap: false,
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
      const g = getApp();
      const themeId = g.globalData.currentTheme || 'pink';
      const t = g.globalData.themes && g.globalData.themes[themeId];
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
          const classes = this._applyOrder(cached.data);
          this.classes = classes;
          this._dataLoaded = true;
        }
      } catch (e) {}
    },

    async _refreshCloud() {
      try {
        const res = await app.callFunction('class', { action: 'list' });

        if (res.code === 0) {
          let classes = res.data || [];
          uni.setStorageSync(CACHE_KEY, { data: classes, timestamp: Date.now() });
          // 写入全局缓存，供详情页秒开
          classes.forEach(c => { app.globalData.classCache[c._id] = c; });
          classes = this._applyOrder(classes);
          this.classes = classes;
          this._dataLoaded = true;
        }
      } catch (e) {
        if (!this._dataLoaded) {
          this.classes = [
            { _id: '1', name: '三年级一班', studentCount: 28, inviteCode: 'A1234' },
            { _id: '2', name: '三年级二班', studentCount: 30, inviteCode: 'B5678' },
            { _id: '3', name: '四年级一班', studentCount: 26, inviteCode: 'C9012' },
          ];
          this._dataLoaded = true;
        }
      }
    },

    _applyOrder(classes) {
      const savedOrder = uni.getStorageSync(CLASSES_ORDER_KEY) || [];
      if (!savedOrder.length) return classes;
      const orderMap = {};
      savedOrder.forEach((id, i) => { orderMap[id] = i; });
      return [...classes].sort((a, b) => {
        const ai = orderMap[a._id];
        const bi = orderMap[b._id];
        if (ai === undefined) return 1;
        if (bi === undefined) return -1;
        return ai - bi;
      });
    },

    // ========== 普通点击：进入班级详情 ==========
    onClassItemTap(classId) {
      if (this.dragging) return;
      const classData = this.classes.find(c => c._id === classId);
      if (classData) app.globalData.classCache[classId] = classData;
      uni.navigateTo({ url: `/pages/teacher/class/detail/detail?id=${classId}` });
    },

    // ========== 长按卡片：进入拖动模式 ==========
    onItemLongPress(index) {
      if (this.loading || this.classes.length < 2) return;
      if (Number.isNaN(index)) return;

      this._lastY = 0;
      this._accDy = 0;
      this._didSwap = false;

      this.dragging = true;
      this.dragIndex = index;
      uni.vibrateShort({ type: 'medium' });
    },

    // ========== 拖动中滑动：与相邻卡片交换位置 ==========
    onItemTouchMove(e) {
      if (!this.dragging) return;

      const touch = e.touches[0];
      const delta = touch.pageY - this._lastY;
      this._lastY = touch.pageY;
      this._accDy += delta;

      let idx = this.dragIndex;
      const classes = [...this.classes];
      let changed = false;

      while (this._accDy > SWAP_THRESHOLD_PX && idx < classes.length - 1) {
        [classes[idx], classes[idx + 1]] = [classes[idx + 1], classes[idx]];
        idx += 1;
        this._accDy -= SWAP_THRESHOLD_PX;
        changed = true;
      }
      while (this._accDy < -SWAP_THRESHOLD_PX && idx > 0) {
        [classes[idx], classes[idx - 1]] = [classes[idx - 1], classes[idx]];
        idx -= 1;
        this._accDy += SWAP_THRESHOLD_PX;
        changed = true;
      }

      if (changed) {
        this._didSwap = true;
        uni.vibrateShort({ type: 'light' });
        this.classes = classes;
        this.dragIndex = idx;
      }
    },

    // ========== 松手：退出拖动模式并保存顺序 ==========
    onItemTouchEnd() {
      if (this.dragging) {
        if (this._didSwap) {
          try {
            const ids = this.classes.map(c => c._id);
            uni.setStorageSync(CLASSES_ORDER_KEY, ids);
          } catch (err) {}
        }
        this.dragging = false;
        this.dragIndex = -1;
      }
      this._didSwap = false;
      this._accDy = 0;
    },

    // ========== 复制邀请码 ==========
    copyInviteCode(code) {
      uni.setClipboardData({
        data: code,
        success: () => uni.showToast({ title: '已复制邀请码', icon: 'success' }),
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

.page-header {
  margin-bottom: 24rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

.class-list {
  display: flex;
  flex-direction: column;
}

.class-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.class-item.item-dragging {
  transform: scale(1.02);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  opacity: 0.9;
}

.class-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  background: var(--theme-gradient);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.class-info {
  flex: 1;
}

.class-name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.class-count {
  font-size: 26rpx;
  color: #999;
}

.invite-code-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--theme-light);
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
}

.invite-label {
  font-size: 20rpx;
  color: var(--theme-text);
  margin-bottom: 4rpx;
}

.invite-value {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--theme-accent);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-state .icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-state .text {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 12rpx;
}

.empty-state .sub-text {
  font-size: 26rpx;
  color: #999;
}
</style>
