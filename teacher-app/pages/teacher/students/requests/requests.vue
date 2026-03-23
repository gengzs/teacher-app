<template>
  <view class="container">
    <!-- 班级信息 -->
    <view class="class-banner">
      <text class="banner-text">{{className}} 的入班申请</text>
    </view>

    <!-- 申请列表 -->
    <view class="request-list" v-if="requests.length > 0">
      <view
        class="request-item"
        v-for="item in requests"
        :key="item._id"
      >
        <view class="request-avatar">{{item.studentName[0]}}</view>
        <view class="request-info">
          <text class="request-name">{{item.studentName}}</text>
          <text class="request-time">申请时间：{{formatTime(item.createTime)}}</text>
        </view>
        <view class="request-actions">
          <view
            class="action-btn reject"
            @click="rejectRequest(item._id, item.studentName)"
          >拒绝</view>
          <view
            class="action-btn approve"
            @click="approveRequest(item._id, item.studentName)"
          >同意</view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && requests.length === 0">
      <text class="icon">📋</text>
      <text class="text">{{emptyText}}</text>
      <view class="tip-text">学生通过邀请码申请加入后，会显示在这里</view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      classId: '',
      className: '',
      requests: [],
      loading: false,
      emptyText: '暂无待审核的入班申请',
    };
  },

  onLoad(options) {
    this.classId = options.classId || '';
    this.className = options.className || '';
  },

  onShow() {
    this.loadRequests();
  },

  methods: {
    async loadRequests() {
      this.loading = true;

      try {
        const app = getApp();
        const res = await app.callFunction('class', {
          action: 'getJoinRequests',
          classId: this.classId,
        });

        if (res.code === 0) {
          this.requests = res.data || [];
        } else {
          uni.showToast({ title: res.msg, icon: 'none' });
        }
      } catch (e) {
        console.error('加载申请列表失败', e);
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },

    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      return `${month}-${day} ${hour}:${minute}`;
    },

    approveRequest(requestId, studentName) {
      uni.showModal({
        title: '同意入班',
        content: `确定同意「${studentName}」加入班级？`,
        confirmText: '同意',
        success: async (res) => {
          if (res.confirm) {
            try {
              const app = getApp();
              const result = await app.callFunction('class', {
                action: 'approveJoinRequest',
                requestId,
                classId: this.classId,
              });

              if (result.code === 0) {
                uni.showToast({ title: '已同意', icon: 'success' });
                this.loadRequests();
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

    rejectRequest(requestId, studentName) {
      uni.showModal({
        title: '拒绝申请',
        content: `确定拒绝「${studentName}」的入班申请？`,
        confirmText: '拒绝',
        confirmColor: '#ff4d4f',
        success: async (res) => {
          if (res.confirm) {
            try {
              const app = getApp();
              const result = await app.callFunction('class', {
                action: 'rejectJoinRequest',
                requestId,
              });

              if (result.code === 0) {
                uni.showToast({ title: '已拒绝', icon: 'success' });
                this.loadRequests();
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
  padding-bottom: 40rpx;
}

.class-banner {
  background: var(--theme-gradient);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.banner-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.request-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.request-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.request-item:last-child {
  border-bottom: none;
}

.request-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
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

.request-info {
  flex: 1;
}

.request-name {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.request-time {
  font-size: 24rpx;
  color: #999;
}

.request-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
}

.action-btn.reject {
  background: #FFE8E8;
  color: #FF6B6B;
}

.action-btn.approve {
  background: var(--theme-light);
  color: var(--theme-accent);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  background: #fff;
  border-radius: 16rpx;
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

.tip-text {
  font-size: 24rpx;
  color: #ccc;
  text-align: center;
}

.loading-state {
  text-align: center;
  padding: 60rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>
