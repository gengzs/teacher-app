<template>
  <view class="container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input
        class="search-input"
        placeholder="搜索文章"
        v-model="searchKey"
      />
      <view class="search-icon">🔍</view>
    </view>

    <!-- 分类标签 -->
    <scroll-view scroll-x class="category-scroll">
      <view class="category-list">
        <view
          class="category-item"
          :class="{ active: currentCategory === item.key }"
          v-for="item in categories"
          :key="item.key"
          @click="selectCategory(item.key)"
        >{{item.label}}</view>
      </view>
    </scroll-view>

    <!-- 操作栏 -->
    <view class="action-bar">
      <view class="action-btn" @click="selectAll">全选</view>
      <view class="action-btn" @click="clearSelection">清空</view>
      <text class="selection-count">已选 {{selectedArticles.length}} 篇</text>
    </view>

    <!-- 文章列表 -->
    <view class="article-list">
      <view
        class="article-item"
        :class="{ selected: isSelected(item._id) }"
        v-for="item in getFilteredArticles()"
        :key="item._id"
        @click="toggleArticle(item._id)"
      >
        <view class="article-checkbox">
          <view class="checkbox" :class="{ checked: isSelected(item._id) }">
            <text v-if="isSelected(item._id)">✓</text>
          </view>
        </view>
        <view class="article-content" @click.stop="previewArticle(item._id)">
          <view class="article-header">
            <text class="article-title">{{item.title}}</text>
            <view class="article-meta">
              <text class="level">⭐{{item.level}}</text>
              <text class="word-count">{{item.wordCount}}词</text>
            </view>
          </view>
          <text class="article-preview">{{item.preview}}</text>
          <view class="article-footer">
            <text class="category-tag">{{getCategoryName(item.category)}}</text>
            <text class="duration">🕐 {{item.duration}}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部发送按钮 -->
    <view class="bottom-bar" :class="{ show: selectedArticles.length > 0 }">
      <view class="send-btn" @click="sendToHomework">
        <text>发送至作业</text>
        <text class="send-count" v-if="selectedArticles.length > 0">({{selectedArticles.length}}篇)</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      classId: '',
      className: '',
      categories: [
        { key: 'all', label: '全部' },
        { key: 'textbook', label: '教材配套' },
        { key: 'story', label: '故事绘本' },
        { key: 'dialogue', label: '日常对话' },
        { key: 'exam', label: '考试专项' },
      ],
      currentCategory: 'all',
      articles: [],
      selectedArticles: [],
      searchKey: '',
    };
  },

  onLoad(options) {
    this.classId = options.classId || '';
    this.className = options.className || '';
    this.loadArticles();
  },

  methods: {
    loadArticles() {
      this.articles = [
        { _id: '1', title: 'Unit 1 Hello!', category: 'textbook', level: 3, wordCount: 50, duration: '5分钟', preview: 'This is a dialogue about greeting friends...' },
        { _id: '2', title: 'My Family', category: 'textbook', level: 3, wordCount: 40, duration: '4分钟', preview: 'Meet the members of a typical family...' },
        { _id: '3', title: 'The Little Red Hen', category: 'story', level: 2, wordCount: 60, duration: '6分钟', preview: 'A classic story about teamwork and sharing...' },
        { _id: '4', title: 'At the Zoo', category: 'textbook', level: 2, wordCount: 35, duration: '4分钟', preview: 'Let\'s visit the animals at the zoo...' },
        { _id: '5', title: 'Shopping Dialogue', category: 'dialogue', level: 4, wordCount: 45, duration: '5分钟', preview: 'Practice buying things at a store...' },
        { _id: '6', title: 'Unit 2 Colors', category: 'textbook', level: 1, wordCount: 30, duration: '3分钟', preview: 'Learn to describe colors around you...' },
        { _id: '7', title: 'The Three Little Pigs', category: 'story', level: 3, wordCount: 80, duration: '8分钟', preview: 'A popular fairy tale about three pig brothers...' },
        { _id: '8', title: 'Past Tense Review', category: 'exam', level: 5, wordCount: 55, duration: '6分钟', preview: 'Key grammar points for exams...' },
      ];
    },

    selectCategory(key) {
      this.currentCategory = key;
    },

    toggleArticle(articleId) {
      if (this.selectedArticles.includes(articleId)) {
        this.selectedArticles = this.selectedArticles.filter(id => id !== articleId);
      } else {
        this.selectedArticles.push(articleId);
      }
    },

    getFilteredArticles() {
      let articles = this.articles;

      if (this.currentCategory !== 'all') {
        articles = articles.filter((a) => a.category === this.currentCategory);
      }

      if (this.searchKey) {
        const kw = this.searchKey.toLowerCase();
        articles = articles.filter(
          (a) =>
            a.title.toLowerCase().includes(kw) ||
            a.preview.toLowerCase().includes(kw)
        );
      }

      return articles;
    },

    isSelected(articleId) {
      return this.selectedArticles.includes(articleId);
    },

    previewArticle(articleId) {
      const article = this.articles.find((a) => a._id === articleId);
      if (!article) return;

      uni.showModal({
        title: article.title,
        content: `${article.preview}\n\n难度：${'⭐'.repeat(article.level)}\n单词数：${article.wordCount}个\n预计时长：${article.duration}`,
        showCancel: true,
        confirmText: '选择此文',
        cancelText: '关闭',
        success: (res) => {
          if (res.confirm) {
            this.toggleArticle(articleId);
          }
        }
      });
    },

    sendToHomework() {
      if (this.selectedArticles.length === 0) {
        uni.showToast({ title: '请先选择文章', icon: 'none' });
        return;
      }

      const articleIds = this.selectedArticles.join(',');
      uni.navigateTo({
        url: `/pages/teacher/homework/create/create?classId=${this.classId}&className=${encodeURIComponent(this.className)}&articleIds=${articleIds}`,
      });
    },

    selectAll() {
      const filtered = this.getFilteredArticles();
      const allIds = filtered.map((a) => a._id);
      this.selectedArticles = allIds;
    },

    clearSelection() {
      this.selectedArticles = [];
    },

    getCategoryName(category) {
      const map = {
        textbook: '教材配套',
        story: '故事绘本',
        dialogue: '日常对话',
        exam: '考试专项',
      };
      return map[category] || category;
    },
  },
};
</script>

<style scoped>
.container {
  padding: 24rpx;
  padding-bottom: 140rpx;
}

.search-bar {
  position: relative;
  margin-bottom: 20rpx;
}

.search-input {
  width: 100%;
  padding: 20rpx 80rpx 20rpx 30rpx;
  background: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.search-icon {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32rpx;
}

.category-scroll {
  white-space: nowrap;
  margin-bottom: 20rpx;
}

.category-list {
  display: inline-flex;
  padding: 8rpx;
  background: #fff;
  border-radius: 16rpx;
}

.category-item {
  padding: 16rpx 24rpx;
  font-size: 26rpx;
  color: #666;
  border-radius: 12rpx;
  white-space: nowrap;
}

.category-item.active {
  background: var(--theme-light);
  color: var(--theme-accent);
  font-weight: 600;
}

.action-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.action-btn {
  padding: 12rpx 20rpx;
  font-size: 26rpx;
  color: var(--theme-accent);
  margin-right: 12rpx;
}

.selection-count {
  margin-left: auto;
  font-size: 26rpx;
  color: #999;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.article-item {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid transparent;
}

.article-item.selected {
  border-color: var(--theme-accent);
  background: var(--theme-light);
}

.article-checkbox {
  margin-right: 16rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 8rpx;
  border: 2rpx solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #fff;
}

.checkbox.checked {
  background: var(--theme-accent);
  border-color: var(--theme-accent);
}

.article-content {
  flex: 1;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.article-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.article-meta {
  display: flex;
  gap: 12rpx;
}

.level {
  font-size: 22rpx;
  color: var(--theme-accent);
}

.word-count {
  font-size: 22rpx;
  color: #999;
}

.article-preview {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-footer {
  display: flex;
  gap: 16rpx;
}

.category-tag {
  font-size: 22rpx;
  padding: 6rpx 12rpx;
  background: var(--theme-light);
  color: var(--theme-accent);
  border-radius: 8rpx;
}

.duration {
  font-size: 22rpx;
  color: #999;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
  transform: translateY(100%);
  transition: transform 0.3s;
}

.bottom-bar.show {
  transform: translateY(0);
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-gradient);
  color: #fff;
  padding: 24rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
}

.send-count {
  margin-left: 8rpx;
}
</style>
