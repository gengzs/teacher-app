<template>
  <view class="container">
    <!-- 导入提示 -->
    <view class="import-tip">
      <view class="tip-icon">💡</view>
      <view class="tip-content">
        <text class="tip-title">导入格式说明</text>
        <text class="tip-text">Excel 文件应包含 3 列：\n第1列：英文单词\n第2列：中文翻译\n第3列：音标（可选）</text>
      </view>
    </view>

    <!-- 导入按钮 -->
    <view class="import-btn" @click="showImportModal">
      <text class="btn-icon">📤</text>
      <text class="btn-text">导入词库</text>
    </view>

    <!-- 词库列表 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">我的词库</text>
        <text class="card-count">{{wordSets.length}}个</text>
      </view>

      <view class="word-set-list" v-if="wordSets.length > 0">
        <view
          class="word-set-item"
          v-for="item in wordSets"
          :key="item._id"
          @click="viewWordSet(item._id)"
        >
          <view class="set-icon">📖</view>
          <view class="set-content">
            <text class="set-name">{{item.name}}</text>
            <view class="set-meta">
              <text class="meta-item">{{item.wordCount}}个单词</text>
              <text class="meta-item" v-if="item.lastUsed">上次使用：{{item.lastUsed}}</text>
              <text class="meta-item new" v-if="!item.lastUsed">新建</text>
            </view>
          </view>
          <view class="set-actions">
            <view
              class="action-btn study"
              @click.stop="startLearning(item._id, item.name)"
            >开始</view>
            <view
              class="action-btn delete"
              @click.stop="deleteWordSet(item._id, item.name)"
            >删除</view>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="wordSets.length === 0">
        <text class="icon">📚</text>
        <text class="text">暂无词库</text>
        <text class="hint">点击上方按钮导入 Excel 文件</text>
      </view>
    </view>

    <!-- 导入弹窗 -->
    <view class="modal-mask" :class="{ show: showImportModal }" @click="hideImportModal"></view>
    <view class="modal" :class="{ show: showImportModal }">
      <view class="modal-header">
        <text class="modal-title">导入词库</text>
        <view class="modal-close" @click="hideImportModal">✕</view>
      </view>
      <view class="modal-body">
        <view class="file-select" @click="chooseFile">
          <text class="file-icon">📁</text>
          <text class="file-text">选择 Excel 文件</text>
          <text class="file-hint">支持 .xlsx 和 .xls 格式</text>
        </view>

        <view class="format-guide">
          <text class="guide-title">Excel 格式要求：</text>
          <view class="guide-row">
            <text class="guide-col">A列</text>
            <text class="guide-desc">英文单词</text>
          </view>
          <view class="guide-row">
            <text class="guide-col">B列</text>
            <text class="guide-desc">中文翻译</text>
          </view>
          <view class="guide-row">
            <text class="guide-col">C列</text>
            <text class="guide-desc">音标（可选）</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 词库详情弹窗 -->
    <view class="detail-modal" :class="{ show: currentSet }">
      <view class="detail-mask" @click="closeWordSet"></view>
      <view class="detail-content">
        <view class="detail-header">
          <view class="detail-title">
            <text class="title-text">{{currentSet ? currentSet.name : ''}}</text>
            <text class="title-count">{{words.length}}个单词</text>
          </view>
          <view class="detail-close" @click="closeWordSet">✕</view>
        </view>

        <view class="detail-search">
          <input
            class="search-input"
            placeholder="搜索单词"
            v-model="searchKey"
          />
        </view>

        <scroll-view scroll-y class="word-list">
          <view
            class="word-item"
            v-for="item in getFilteredWords()"
            :key="item._id"
          >
            <view class="word-info">
              <text class="word-text">{{item.word}}</text>
              <text class="word-phonetic">{{item.phonetic}}</text>
            </view>
            <text class="word-translation">{{item.translation}}</text>
          </view>
          <view class="list-empty" v-if="getFilteredWords().length === 0">
            <text>未找到匹配的单词</text>
          </view>
        </scroll-view>

        <view class="detail-footer">
          <view
            class="start-btn"
            @click="startLearning(currentSet._id, currentSet.name)"
          >
            开始学习
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      wordSets: [],
      currentSet: null,
      words: [],
      showImportModal: false,
      importLoading: false,
      searchKey: '',
      listLoading: false,
    };
  },

  onLoad() {
    this.loadWordSets();
  },

  onShow() {
    this._refreshList();
  },

  methods: {
    async loadWordSets() {
      this.listLoading = true;
      try {
        const app = getApp();
        const res = await app.callFunction('wordset', { action: 'list' });

        if (res.code === 0) {
          this.wordSets = res.data || [];
        } else {
          this.wordSets = [];
        }
      } catch (e) {
        console.error('加载词库列表失败', e);
        this.wordSets = [];
      } finally {
        this.listLoading = false;
      }
    },

    async _refreshList() {
      try {
        const app = getApp();
        const res = await app.callFunction('wordset', { action: 'list' });
        if (res.code === 0) {
          this.wordSets = res.data || [];
        }
      } catch (e) {}
    },

    goToClassList() {
      uni.reLaunch({ url: '/pages/teacher/shell/shell?tab=class' });
    },

    // ========== 导入词库 ==========
    showImportModal() {
      this.showImportModal = true;
    },

    hideImportModal() {
      this.showImportModal = false;
    },

    async chooseFile() {
      // #ifdef MP-WEIXIN
      uni.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['xlsx', 'xls'],
        success: async (res) => {
          const file = res.tempFiles[0];
          uni.showLoading({ title: '解析中...' });

          try {
            const fs = uni.getFileSystemManager();
            const fileContent = fs.readFileSync(file.path, 'base64');

            const app = getApp();
            const result = await app.callFunction('parseWordExcel', {
              fileContent: fileContent,
              fileName: file.name,
            });

            uni.hideLoading();

            if (result.code === 0) {
              uni.showToast({ title: '解析成功', icon: 'success' });
              this.loadWordSets();
            } else {
              uni.showToast({ title: result.msg || '解析失败', icon: 'none' });
            }
          } catch (e) {
            uni.hideLoading();
            console.error('解析失败', e);
            uni.showToast({ title: '解析失败', icon: 'none' });
          }
        },
        fail: (e) => {
          console.error('选择文件失败', e);
        },
      });
      // #endif
    },

    // ========== 查看词库详情 ==========
    viewWordSet(setId) {
      const set = this.wordSets.find((item) => item._id === setId);
      if (set) {
        try {
          uni.setStorageSync('teacher_last_word_set', { setId, setName: set.name || '' });
        } catch (err) {
          console.warn('teacher_last_word_set', err);
        }
      }
      this.currentSet = set;
      this.loadWords(setId);
    },

    closeWordSet() {
      this.currentSet = null;
      this.words = [];
    },

    async loadWords(setId) {
      try {
        const app = getApp();
        const res = await app.callFunction('wordset', {
          action: 'getWords',
          setId: setId,
        });

        if (res.code === 0) {
          this.words = res.data || [];
        }
      } catch (e) {
        console.error('加载单词失败', e);
      }
    },

    getFilteredWords() {
      if (!this.searchKey) return this.words;
      const kw = this.searchKey.toLowerCase();
      return this.words.filter(
        (w) =>
          w.word.toLowerCase().includes(kw) ||
          w.translation.toLowerCase().includes(kw)
      );
    },

    // ========== 删除词库 ==========
    deleteWordSet(setId, setName) {
      uni.showModal({
        title: '删除词库',
        content: `确定要删除「${setName}」吗？`,
        confirmColor: '#ff4d4f',
        success: async (res) => {
          if (res.confirm) {
            try {
              const app = getApp();
              await app.callFunction('wordset', {
                action: 'delete',
                setId: setId,
              });
              uni.showToast({ title: '已删除', icon: 'success' });
              this.loadWordSets();
            } catch (e) {
              uni.showToast({ title: '删除失败', icon: 'none' });
            }
          }
        },
      });
    },

    // ========== 开始学习 ==========
    startLearning(setId, setName) {
      setName = setName || '';
      try {
        uni.setStorageSync('teacher_last_word_set', { setId, setName });
      } catch (err) {
        console.warn('teacher_last_word_set', err);
      }
      uni.navigateTo({
        url: `/pages/teacher/recite/recite?setId=${setId}&setName=${encodeURIComponent(setName)}`,
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

.import-tip {
  display: flex;
  background: #FFF9E6;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.tip-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.tip-content {
  flex: 1;
}

.tip-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #8B5A00;
  margin-bottom: 8rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #8B5A00;
  line-height: 1.6;
}

.import-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-gradient);
  color: #fff;
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.btn-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.btn-text {
  font-size: 30rpx;
  font-weight: 500;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
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

.word-set-list {
  display: flex;
  flex-direction: column;
}

.word-set-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.word-set-item:last-child {
  border-bottom: none;
}

.set-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.set-content {
  flex: 1;
}

.set-name {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.set-meta {
  display: flex;
  gap: 16rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #999;
}

.meta-item.new {
  color: var(--theme-accent);
}

.set-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
}

.action-btn.study {
  background: var(--theme-light);
  color: var(--theme-accent);
}

.action-btn.delete {
  background: #FFE8E8;
  color: #FF6B6B;
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
  margin-bottom: 8rpx;
}

.empty-state .hint {
  font-size: 24rpx;
  color: #ccc;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.modal-mask.show {
  opacity: 1;
  pointer-events: auto;
}

.modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  z-index: 1001;
  transform: translateY(100%);
  transition: transform 0.3s;
}

.modal.show {
  transform: translateY(0);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.modal-close {
  font-size: 40rpx;
  color: #ccc;
}

.modal-body {
  padding: 30rpx;
}

.file-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
  border: 2rpx dashed #e5e5e5;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.file-icon {
  font-size: 60rpx;
  margin-bottom: 12rpx;
}

.file-text {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.file-hint {
  font-size: 24rpx;
  color: #999;
}

.format-guide {
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 20rpx;
}

.guide-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.guide-row {
  display: flex;
  padding: 8rpx 0;
}

.guide-col {
  width: 80rpx;
  font-size: 24rpx;
  color: var(--theme-accent);
}

.guide-desc {
  flex: 1;
  font-size: 24rpx;
  color: #666;
}

/* 详情弹窗 */
.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.detail-modal.show {
  opacity: 1;
  pointer-events: auto;
}

.detail-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.detail-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 80vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.detail-title {
  flex: 1;
}

.title-text {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 4rpx;
}

.title-count {
  font-size: 24rpx;
  color: #999;
}

.detail-close {
  font-size: 40rpx;
  color: #ccc;
}

.detail-search {
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.search-input {
  width: 100%;
  padding: 16rpx 20rpx;
  background: #f5f5f5;
  border-radius: 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.word-list {
  flex: 1;
  max-height: 400rpx;
}

.word-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.word-info {
  flex: 1;
}

.word-text {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 4rpx;
}

.word-phonetic {
  font-size: 24rpx;
  color: var(--theme-accent);
}

.word-translation {
  font-size: 26rpx;
  color: #666;
}

.list-empty {
  padding: 60rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}

.detail-footer {
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
}

.start-btn {
  width: 100%;
  padding: 24rpx;
  background: var(--theme-gradient);
  color: #fff;
  text-align: center;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
}
</style>
