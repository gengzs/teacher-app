<template>
  <view class="container">
    <!-- 步骤指示器 -->
    <view class="step-indicator">
      <view class="step-item" :class="{ active: currentStep >= 1 }">
        <view class="step-dot">{{currentStep > 1 ? '✓' : '1'}}</view>
        <text class="step-label">类型</text>
      </view>
      <view class="step-line" :class="{ active: currentStep >= 2 }"></view>
      <view class="step-item" :class="{ active: currentStep >= 2 }">
        <view class="step-dot">{{currentStep > 2 ? '✓' : '2'}}</view>
        <text class="step-label">内容</text>
      </view>
      <view class="step-line" :class="{ active: currentStep >= 3 }"></view>
      <view class="step-item" :class="{ active: currentStep >= 3 }">
        <view class="step-dot">3</view>
        <text class="step-label">时间</text>
      </view>
    </view>

    <!-- 步骤1：选择类型 -->
    <view v-if="currentStep === 1" class="step-content">
      <view class="card">
        <view class="card-title">选择作业类型</view>
        <view class="type-options">
          <view
            class="type-option"
            :class="{ selected: homeworkType === item.key }"
            v-for="item in typeOptions"
            :key="item.key"
            @click="selectType(item.key)"
          >
            <view class="type-icon">{{item.icon}}</view>
            <view class="type-info">
              <text class="type-label">{{item.label}}</text>
              <text class="type-desc">{{item.desc}}</text>
            </view>
            <view class="type-check" v-if="homeworkType === item.key">✓</view>
          </view>
        </view>
      </view>
      <view class="bottom-btn">
        <view class="btn-primary" @click="nextStep">下一步</view>
      </view>
    </view>

    <!-- 步骤2：填写内容 -->
    <view v-if="currentStep === 2" class="step-content">
      <view class="card">
        <view class="card-title">选择班级</view>
        <view class="class-grid">
          <view
            class="class-option"
            :class="{ selected: selectedClassId === item._id }"
            v-for="item in classList"
            :key="item._id"
            @click="selectClass(item._id)"
          >
            <text class="class-name">{{item.name}}</text>
            <text class="class-count">{{item.studentCount}}人</text>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="card-title">作业标题</view>
        <input
          class="form-input"
          placeholder="请输入作业标题"
          v-model="homeworkTitle"
          @input="onTitleInput"
        />
      </view>

      <view class="card" v-if="homeworkType === 'voice'">
        <view class="card-title">跟读内容（每行一句）</view>
        <textarea
          class="form-textarea"
          placeholder="请输入要跟读的内容"
          v-model="homeworkContent"
          @input="onContentInput"
        />
        <text class="form-hint" v-if="contentLines.length > 0">已输入 {{contentLines.length}} 句</text>
      </view>

      <!-- 资料库文章选择 -->
      <view class="card" v-if="homeworkType === 'article' || selectedArticleDetails.length > 0">
        <view class="card-header-row">
          <view class="card-title">已选文章</view>
          <view class="card-action" @click="goToLibrary">+ 添加</view>
        </view>
        <view class="article-list" v-if="selectedArticleDetails.length > 0">
          <view class="article-item" v-for="item in selectedArticleDetails" :key="item._id">
            <text class="article-icon">📄</text>
            <view class="article-info">
              <text class="article-title">{{item.title}}</text>
              <text class="article-meta">{{item.wordCount}}词</text>
            </view>
          </view>
        </view>
        <view class="empty-articles" v-if="selectedArticleDetails.length === 0">
          <text class="empty-text">未选择文章</text>
          <view class="empty-btn" @click="goToLibrary">去资料库选择</view>
        </view>
      </view>

      <view class="bottom-btns">
        <view class="btn-secondary" @click="prevStep">上一步</view>
        <view class="btn-primary" @click="nextStep">下一步</view>
      </view>
    </view>

    <!-- 步骤3：设置时间 -->
    <view v-if="currentStep === 3" class="step-content">
      <view class="card">
        <view class="card-title">设置截止时间</view>
        <picker mode="date" :value="deadline" :start="minDate" @change="onDateChange">
          <view class="date-picker">
            <text class="date-text" :class="{ placeholder: !deadline }">{{deadline || '请选择日期'}}</text>
            <text class="date-arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="card summary-card">
        <view class="card-title">作业预览</view>
        <view class="summary-item">
          <text class="summary-label">类型</text>
          <text class="summary-value">{{homeworkType === 'voice' ? '语音朗读' : '单词带背'}}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">班级</text>
          <text class="summary-value">{{selectedClassName}}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">标题</text>
          <text class="summary-value">{{homeworkTitle}}</text>
        </view>
        <view class="summary-item" v-if="contentLines.length > 0">
          <text class="summary-label">内容</text>
          <text class="summary-value">{{contentLines.length}}句</text>
        </view>
      </view>

      <view class="bottom-btns">
        <view class="btn-secondary" @click="prevStep">上一步</view>
        <view class="btn-primary" @click="publishHomework">发布作业</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentStep: 1,
      steps: [
        { num: 1, label: '选择类型' },
        { num: 2, label: '填写内容' },
        { num: 3, label: '设置时间' },
      ],

      // 类型选择
      homeworkType: '',
      typeOptions: [
        { key: 'voice', label: '语音朗读', icon: '🎤', desc: '学生录制音频朗读' },
        { key: 'word', label: '单词带背', icon: '📖', desc: '学生完成抗遗忘复习' },
        { key: 'article', label: '资料库文章', icon: '📄', desc: '从班级资料库选择文章' },
      ],

      // 班级选择
      classList: [],
      selectedClassId: '',
      selectedClassName: '',

      // 从资料库选择的文章
      selectedArticles: [],
      selectedArticleDetails: [],

      // 内容填写
      homeworkTitle: '',
      homeworkContent: '',
      contentLines: [],

      // 时间设置
      deadline: '',
      minDate: '',
    };
  },

  onLoad(options) {
    this.setMinDate();
    this.loadClasses();

    // 接收班级参数
    if (options.classId && options.className) {
      this.selectedClassId = options.classId;
      this.selectedClassName = decodeURIComponent(options.className);
      this.currentStep = 2;
    }

    // 接收资料库文章参数
    if (options.articleIds) {
      const articleIds = options.articleIds.split(',');
      this.loadSelectedArticles(articleIds);
    }
  },

  methods: {
    setMinDate() {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      this.minDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    loadClasses() {
      const classList = [
        { _id: '1', name: '三年级一班', studentCount: 28 },
        { _id: '2', name: '三年级二班', studentCount: 30 },
        { _id: '3', name: '四年级一班', studentCount: 26 },
      ];
      this.classList = classList;
    },

    loadSelectedArticles(articleIds) {
      const allArticles = [
        { _id: '1', title: 'Unit 1 Hello!', category: 'textbook', wordCount: 50 },
        { _id: '2', title: 'My Family', category: 'textbook', wordCount: 40 },
        { _id: '3', title: 'The Little Red Hen', category: 'story', wordCount: 60 },
        { _id: '4', title: 'At the Zoo', category: 'textbook', wordCount: 35 },
        { _id: '5', title: 'Shopping Dialogue', category: 'dialogue', wordCount: 45 },
      ];

      const selected = allArticles.filter((a) => articleIds.includes(a._id));
      this.selectedArticles = articleIds;
      this.selectedArticleDetails = selected;
      this.homeworkType = 'article';
    },

    // 步骤1：选择类型
    selectType(type) {
      this.homeworkType = type;
    },

    // 步骤2：选择班级
    selectClass(classId) {
      const classItem = this.classList.find(item => item._id === classId);
      this.selectedClassId = classId;
      this.selectedClassName = classItem ? classItem.name : '';
    },

    // 去资料库选择文章
    goToLibrary() {
      uni.navigateTo({
        url: `/pages/teacher/class/library/library?classId=${this.selectedClassId}&className=${encodeURIComponent(this.selectedClassName)}`,
      });
    },

    // 步骤2：输入标题
    onTitleInput(e) {
      this.homeworkTitle = e.detail.value;
    },

    // 步骤2：输入内容
    onContentInput(e) {
      const content = e.detail.value;
      const lines = content.split('\n').filter(line => line.trim());
      this.homeworkContent = content;
      this.contentLines = lines;
    },

    // 步骤3：选择截止日期
    onDateChange(e) {
      this.deadline = e.detail.value;
    },

    // 下一步
    nextStep() {
      const step = this.currentStep;

      if (step === 1 && !this.homeworkType) {
        uni.showToast({ title: '请选择作业类型', icon: 'none' });
        return;
      }

      if (step === 2) {
        if (!this.selectedClassId) {
          uni.showToast({ title: '请选择班级', icon: 'none' });
          return;
        }
        if (!this.homeworkTitle.trim()) {
          uni.showToast({ title: '请输入作业标题', icon: 'none' });
          return;
        }
      }

      this.currentStep = step + 1;
    },

    // 上一步
    prevStep() {
      this.currentStep = this.currentStep - 1;
    },

    // 发布作业
    publishHomework() {
      if (!this.deadline) {
        uni.showToast({ title: '请选择截止时间', icon: 'none' });
        return;
      }

      uni.showLoading({ title: '发布中...' });

      // 模拟发布
      setTimeout(() => {
        uni.hideLoading();
        uni.showModal({
          title: '发布成功',
          content: '作业已成功布置，学生将收到通知',
          showCancel: false,
          success: () => {
            uni.redirectTo({ url: '/pages/teacher/homework/homework' });
          }
        });
      }, 1500);
    },
  },
};
</script>

<style scoped>
.container {
  padding: 24rpx;
  padding-bottom: 140rpx;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-dot {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: #E5E5E5;
  color: #999;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.step-item.active .step-dot {
  background: var(--theme-gradient);
  color: #fff;
}

.step-label {
  font-size: 24rpx;
  color: #999;
}

.step-item.active .step-label {
  color: var(--theme-accent);
}

.step-line {
  width: 100rpx;
  height: 4rpx;
  background-color: #E5E5E5;
  margin: 0 16rpx;
  margin-bottom: 40rpx;
}

.step-line.active {
  background: var(--theme-gradient);
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.card-action {
  color: var(--theme-accent);
  font-size: 28rpx;
}

.type-options {
  display: flex;
  flex-direction: column;
}

.type-option {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border: 2rpx solid #E5E5E5;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}

.type-option:last-child {
  margin-bottom: 0;
}

.type-option.selected {
  border-color: var(--theme-accent);
  background-color: var(--theme-light);
}

.type-icon {
  font-size: 48rpx;
  margin-right: 16rpx;
}

.type-info {
  flex: 1;
}

.type-label {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.type-desc {
  font-size: 24rpx;
  color: #999;
}

.type-check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: var(--theme-gradient);
  color: #fff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.class-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.class-option {
  flex: 1;
  min-width: 200rpx;
  padding: 24rpx;
  border: 2rpx solid #E5E5E5;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.class-option.selected {
  border-color: var(--theme-accent);
  background-color: var(--theme-light);
}

.class-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.class-count {
  font-size: 24rpx;
  color: #999;
}

.form-input {
  width: 100%;
  padding: 24rpx;
  border: 2rpx solid #E5E5E5;
  border-radius: 12rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 200rpx;
  padding: 24rpx;
  border: 2rpx solid #E5E5E5;
  border-radius: 12rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-hint {
  font-size: 24rpx;
  color: var(--theme-accent);
  margin-top: 12rpx;
}

.article-list {
  display: flex;
  flex-direction: column;
}

.article-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.article-item:last-child {
  border-bottom: none;
}

.article-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.article-info {
  flex: 1;
}

.article-title {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 6rpx;
}

.article-meta {
  font-size: 24rpx;
  color: #999;
}

.empty-articles {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.empty-btn {
  padding: 16rpx 32rpx;
  background: var(--theme-gradient);
  color: #fff;
  border-radius: 32rpx;
  font-size: 28rpx;
}

.date-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border: 2rpx solid #E5E5E5;
  border-radius: 12rpx;
}

.date-text {
  font-size: 28rpx;
  color: #333;
}

.date-text.placeholder {
  color: #999;
}

.date-arrow {
  font-size: 32rpx;
  color: #999;
}

.summary-card {
  background: #FAFAFA;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #E5E5E5;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  font-size: 28rpx;
  color: #666;
}

.summary-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.bottom-btn {
  margin-top: 40rpx;
}

.bottom-btns {
  display: flex;
  gap: 24rpx;
  margin-top: 40rpx;
}

.btn-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-gradient);
  color: #fff;
  border-radius: 44rpx;
  padding: 28rpx;
  font-size: 32rpx;
  font-weight: 500;
}

.btn-secondary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: var(--theme-accent);
  border: 2rpx solid var(--theme-primary);
  border-radius: 44rpx;
  padding: 28rpx;
  font-size: 32rpx;
  font-weight: 500;
}
</style>
