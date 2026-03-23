<template>
  <view class="container">
    <view class="card">
      <view class="record-list" v-if="records.length > 0">
        <view class="record-item" v-for="item in records" :key="item._id">
          <view class="record-icon" :class="item.type"><text>{{item.type === 'voice' ? '🎤' : '📖'}}</text></view>
          <view class="record-info">
            <text class="record-title">{{item.title}}</text>
            <text class="record-date">{{item.date}}</text>
          </view>
          <view class="record-score" v-if="item.score">
            <text class="score-num">{{item.score}}</text>
            <text class="score-label">分</text>
          </view>
          <view class="record-count" v-if="item.wordCount">
            <text class="count-num">{{item.wordCount}}</text>
            <text class="count-label">词</text>
          </view>
        </view>
      </view>
      <view class="empty-state" v-if="records.length === 0">
        <text class="icon">📝</text>
        <text class="text">暂无记录</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      records: [],
    };
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  methods: {
    loadData() {
      const records = [
        { _id: '1', title: 'Unit 1 跟读练习', date: '2024-01-18', score: 92, type: 'voice' },
        { _id: '2', title: 'Unit 1 核心词汇', date: '2024-01-17', wordCount: 50, type: 'word' },
      ];
      this.records = records;
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
  padding: 24rpx;
}

.record-list {
  display: flex;
  flex-direction: column;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.record-icon.voice {
  background: #E8F4FF;
}

.record-icon.word {
  background: var(--theme-light);
}

.record-icon text {
  font-size: 36rpx;
}

.record-info {
  flex: 1;
}

.record-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 6rpx;
}

.record-date {
  font-size: 24rpx;
  color: #999;
}

.record-score {
  text-align: right;
}

.score-num {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--theme-accent);
}

.score-label {
  font-size: 22rpx;
  color: var(--theme-accent);
}

.record-count {
  text-align: right;
}

.count-num {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--theme-accent);
}

.count-label {
  font-size: 22rpx;
  color: var(--theme-accent);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.empty-state .icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.empty-state .text {
  font-size: 28rpx;
  color: #999;
}
</style>
