<template>
  <view class="container">
    <!-- 班级信息头部 -->
    <view class="class-header">
      <view class="class-avatar">{{classInfo.name ? classInfo.name[0] : '班'}}</view>
      <view class="class-info">
        <text class="class-name">{{classInfo.name}}</text>
        <text class="class-count">
          {{activeStudents.length}}名在班学生
          <text class="pending-badge" v-if="pendingRequests > 0" @click="goToJoinRequests">{{pendingRequests}}人待审核</text>
        </text>
      </view>
      <view class="invite-code-box" @click="copyInviteCode">
        <text class="invite-label">邀请码</text>
        <text class="invite-value">{{classInfo.inviteCode}}</text>
      </view>
    </view>

    <!-- 功能模块入口 -->
    <view class="module-grid">
      <!-- 班级成员 -->
      <view class="module-card members-card" @click="goToStudents">
        <view class="members-header">
          <view class="module-icon">👥</view>
          <view class="module-content">
            <text class="module-title">班级成员</text>
            <text class="module-desc">{{activeStudents.length}}人在班</text>
          </view>
          <text class="module-arrow">›</text>
        </view>
        <view class="members-actions">
          <view class="member-btn primary" @click.stop="showAddStudentModal">
            <view class="btn-icon">+</view>
            <text>添加学生</text>
          </view>
          <view class="member-btn" @click.stop="goToJoinRequests">
            <text>入班申请</text>
            <view class="member-badge" v-if="pendingRequests > 0">{{pendingRequests}}</view>
          </view>
        </view>
      </view>

      <!-- 班级资料库 -->
      <view class="module-card" @click="goToLibrary">
        <view class="module-icon">📚</view>
        <view class="module-content">
          <text class="module-title">班级资料库</text>
          <text class="module-desc">文章列表，可选几篇发送</text>
        </view>
        <text class="module-arrow">›</text>
      </view>
    </view>

    <!-- 上课模块 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📖 上课</text>
      </view>
      <view class="action-row">
        <view class="action-card primary" @click="startClass">
          <view class="action-icon">🎯</view>
          <text class="action-title">单词带背</text>
          <text class="action-desc">抗遗忘复习</text>
        </view>
        <view class="action-card" @click="goToClassHistory">
          <view class="action-icon">📜</view>
          <text class="action-title">历史课程</text>
          <text class="action-desc">查看上课记录</text>
        </view>
      </view>
    </view>

    <!-- 布置作业模块 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📝 布置作业</text>
      </view>
      <view class="action-row">
        <view class="action-card primary" @click="assignHomework">
          <view class="action-icon">📝</view>
          <text class="action-title">选资料库文章</text>
          <text class="action-desc">语音打卡</text>
        </view>
        <view class="action-card" @click="assignHomework">
          <view class="action-icon">🎤</view>
          <text class="action-title">其他作业</text>
          <text class="action-desc">自由布置</text>
        </view>
      </view>

      <!-- 最近作业 -->
      <view class="homework-list" v-if="recentHomework.length > 0">
        <view
          class="homework-item"
          v-for="item in recentHomework"
          :key="item._id"
          @click="goToHomeworkDetail(item._id)"
        >
          <view class="homework-icon">📄</view>
          <view class="homework-info">
            <text class="homework-title">{{item.title}}</text>
            <text class="homework-meta">截止 {{item.deadline}}</text>
          </view>
          <view class="homework-progress">
            <text class="progress-text">{{item.submitCount}}/{{item.totalCount}}</text>
            <text class="progress-label">已交</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 班级统计 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📊 班级统计</text>
        <text class="section-more" @click="goToStats">详情 ›</text>
      </view>
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-value">{{stats.totalStudents}}</text>
          <text class="stat-label">总人数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{stats.homeworkDone}}</text>
          <text class="stat-label">作业完成</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{stats.avgScore}}</text>
          <text class="stat-label">平均分</text>
        </view>
      </view>
    </view>

    <!-- 手动添加学生弹窗 -->
    <view class="modal-overlay" v-if="showAddModal" @click="hideAddModal"></view>
    <view class="add-modal" :class="{ show: showAddModal }">
      <!-- 输入表单 -->
      <view class="modal-view" v-if="!newStudentResult">
        <view class="modal-header">
          <view class="header-icon">🎓</view>
          <text class="header-title">添加学生</text>
          <view class="close-btn" @click="hideAddModal">✕</view>
        </view>

        <view class="modal-body">
          <view class="input-group">
            <view class="input-label">
              <text class="label-icon">👤</text>
              <text>学生姓名</text>
            </view>
            <input
              class="modal-input"
              placeholder="请输入学生姓名"
              placeholder-class="placeholder"
              v-model="addName"
              maxlength="20"
            />
          </view>

          <view class="input-group">
            <view class="input-label">
              <text class="label-icon">📱</text>
              <text>手机号</text>
              <text class="optional">（选填）</text>
            </view>
            <input
              class="modal-input"
              type="number"
              placeholder="用于绑定微信账号"
              placeholder-class="placeholder"
              v-model="addPhone"
              maxlength="11"
            />
          </view>

          <view class="tips-box">
            <text class="tips-icon">💡</text>
            <text class="tips-text">添加成功后系统将生成临时账号，可发送给家长绑定微信</text>
          </view>
        </view>

        <view class="modal-footer">
          <view class="btn-cancel" @click="hideAddModal">取消</view>
          <view class="btn-confirm" :class="{ disabled: !addName.trim() }" @click="submitAddStudent">
            <text v-if="!addLoading">确认添加</text>
            <text v-else class="loading-text">添加中...</text>
          </view>
        </view>
      </view>

      <!-- 添加成功结果 -->
      <view class="modal-view result-view" v-if="newStudentResult">
        <view class="result-header">
          <view class="result-check">✓</view>
          <text class="result-title">添加成功</text>
        </view>

        <view class="result-body">
          <view class="result-card">
            <view class="result-item">
              <text class="result-label">学生姓名</text>
              <text class="result-value">{{newStudentResult.name}}</text>
            </view>
            <view class="result-item" v-if="newStudentResult.phone">
              <text class="result-label">手机号码</text>
              <text class="result-value">{{newStudentResult.phone}}</text>
            </view>
            <view class="result-item">
              <text class="result-label">初始密码</text>
              <text class="result-value highlight">{{newStudentResult.tempPassword}}</text>
            </view>
          </view>

          <view class="warning-box">
            <text class="warning-icon">⚠️</text>
            <text class="warning-text">请将此账号信息发给家长或学生</text>
          </view>
        </view>

        <view class="modal-footer">
          <view class="btn-secondary" @click="copyAccountInfo">
            <text>复制信息</text>
          </view>
          <view class="btn-confirm" @click="continueAdd">
            <text>继续添加</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const app = getApp();
const CLASS_LIST_CACHE_KEY = 'class_list_cache';
const DETAIL_CACHE_TTL = 60 * 1000;

export default {
  data() {
    return {
      classId: '',
      classInfo: {},
      students: [],
      activeStudents: [],
      pendingRequests: 0,
      recentHomework: [],
      stats: {
        totalStudents: 0,
        activeStudents: 0,
        homeworkDone: 0,
        avgScore: 0,
      },
      showAddModal: false,
      addName: '',
      addPhone: '',
      addLoading: false,
      newStudentResult: null,
    };
  },

  onLoad(options) {
    const classId = options.id || '';
    this.classId = classId;
    this._load(classId);
  },

  onShow() {
    // 仅当缓存超过1分钟才静默刷新
    const cached = app.globalData.detailCache[this.classId];
    if (cached && Date.now() - cached._ts < DETAIL_CACHE_TTL) return;
    if (this.classId) this.loadData({ silent: true });
  },

  methods: {
    _load(classId) {
      // 1. 优先本地缓存
      this._renderFromCache(classId);
      // 2. 后台拉最新数据
      this.loadData({ silent: false });
    },

    _renderFromCache(classId) {
      const cache = app.globalData.detailCache[classId];
      if (cache && cache._ts > 0) {
        const { classInfo, students, activeStudents, pendingRequests, recentHomework, stats } = cache;
        if (classInfo) {
          this.classInfo = classInfo;
          this.students = students;
          this.activeStudents = activeStudents;
          this.pendingRequests = pendingRequests;
          this.recentHomework = recentHomework;
          this.stats = stats;
        }
        return true;
      }
      // 兜底：class list 缓存
      try {
        const listCache = uni.getStorageSync(CLASS_LIST_CACHE_KEY) || [];
        const item = listCache.find(c => c._id === classId);
        if (item) this.classInfo = item;
      } catch (e) {}
      return false;
    },

    async loadData(opts = {}) {
      const { silent = false } = opts;
      try {
        const res = await app.callFunction('class', {
          action: 'detail',
          classId: this.classId,
        });

        const result = res;
        if (!result || result.code !== 0) {
          if (!silent) uni.showToast({ title: result?.msg || '加载失败', icon: 'none' });
          return;
        }

        const data = result.data || {};
        const students = Array.isArray(data.students) ? data.students : [];
        const activeStudents = students.filter((s) => s.status === 'active');

        const classInfo = {
          _id: data._id || this.classId,
          name: data.name || '未命名班级',
          studentCount: activeStudents.length,
          inviteCode: data.inviteCode || '',
        };

        const recentHomework = [
          { _id: '1', title: 'Unit 1 跟读练习', deadline: '2024-01-20', submitCount: 25, totalCount: 28 },
          { _id: '2', title: '第二单元单词带背', deadline: '2024-01-18', submitCount: 28, totalCount: 28 },
        ];

        const stats = {
          totalStudents: students.length,
          activeStudents: activeStudents.length,
          homeworkDone: 45,
          avgScore: 87,
        };

        this.classInfo = classInfo;
        this.students = students;
        this.activeStudents = activeStudents;
        this.pendingRequests = data.pendingRequests || 0;
        this.recentHomework = recentHomework;
        this.stats = stats;

        // 写入全局缓存
        app.globalData.detailCache[this.classId] = {
          classInfo,
          students,
          activeStudents,
          pendingRequests: data.pendingRequests || 0,
          recentHomework,
          stats,
          _ts: Date.now(),
        };
      } catch (e) {
        console.error('加载班级详情失败', e);
        if (!silent) uni.showToast({ title: '网络异常', icon: 'none' });
      }
    },

    // ========== 邀请码操作 ==========
    copyInviteCode() {
      uni.setClipboardData({
        data: this.classInfo.inviteCode,
        success: () => uni.showToast({ title: '已复制', icon: 'success' }),
      });
    },

    regenerateInviteCode() {
      uni.showModal({
        title: '重新生成邀请码',
        content: '确定要重新生成邀请码吗？原邀请码将失效。',
        success: async (res) => {
          if (!res.confirm) return;
          try {
            const result = await app.callFunction('class', {
              action: 'generateInviteCode',
              classId: this.classId,
            });
            if (result.code === 0) {
              uni.showToast({ title: '已生成新邀请码', icon: 'success' });
              this.classInfo.inviteCode = result.data.inviteCode;
            } else {
              uni.showToast({ title: result.msg, icon: 'none' });
            }
          } catch (e) {
            uni.showToast({ title: '生成失败', icon: 'none' });
          }
        },
      });
    },

    // ========== 班级成员 ==========
    goToStudents() {
      uni.navigateTo({ url: `/pages/teacher/students/list/list?classId=${this.classId}` });
    },

    goToJoinRequests() {
      uni.navigateTo({
        url: `/pages/teacher/students/requests/requests?classId=${this.classId}&className=${encodeURIComponent(this.classInfo.name)}`,
      });
    },

    // ========== 班级资料库 ==========
    goToLibrary() {
      uni.navigateTo({
        url: `/pages/teacher/class/library/library?classId=${this.classId}&className=${encodeURIComponent(this.classInfo.name)}`,
      });
    },

    // ========== 上课 ==========
    startClass() {
      uni.navigateTo({
        url: `/pages/teacher/recite/recite?classId=${this.classId}&className=${encodeURIComponent(this.classInfo.name)}`,
      });
    },

    // ========== 布置作业 ==========
    assignHomework() {
      uni.navigateTo({
        url: `/pages/teacher/homework/create/create?classId=${this.classId}&className=${encodeURIComponent(this.classInfo.name)}`,
      });
    },

    goToHomeworkDetail(id) {
      uni.navigateTo({ url: `/pages/teacher/homework/detail/detail?id=${id}` });
    },

    goToClassHistory() {
      uni.navigateTo({
        url: `/pages/teacher/class/history/history?classId=${this.classId}&className=${encodeURIComponent(this.classInfo.name)}`,
      });
    },

    // ========== 班级统计 ==========
    goToStats() {
      uni.navigateTo({
        url: `/pages/teacher/class/stats/stats?classId=${this.classId}&className=${encodeURIComponent(this.classInfo.name)}`,
      });
    },

    // ========== 手动添加学生 ==========
    showAddStudentModal() {
      this.showAddModal = true;
      this.addName = '';
      this.addPhone = '';
      this.newStudentResult = null;
    },

    hideAddModal() {
      this.showAddModal = false;
    },

    async submitAddStudent() {
      const { addName, addPhone, classId } = this;
      if (!addName?.trim()) {
        uni.showToast({ title: '请输入学生姓名', icon: 'none' });
        return;
      }
      this.addLoading = true;
      try {
        const res = await app.callFunction('class', {
          action: 'addStudentManual',
          classId,
          name: addName.trim(),
          phone: addPhone.trim(),
        });
        if (res.code === 0) {
          this.newStudentResult = res.data;
          this.loadData();
        } else {
          uni.showToast({ title: res.msg, icon: 'none' });
        }
      } catch (e) {
        uni.showToast({ title: '添加失败', icon: 'none' });
      } finally {
        this.addLoading = false;
      }
    },

    copyAccountInfo() {
      const r = this.newStudentResult;
      if (!r) return;
      uni.setClipboardData({
        data: `姓名：${r.name}\n手机：${r.phone || '未填写'}\n初始密码：${r.tempPassword}`,
        success: () => uni.showToast({ title: '已复制', icon: 'success' }),
      });
    },

    continueAdd() {
      this.newStudentResult = null;
    },
  },
};
</script>

<style scoped>
.container {
  padding: 24rpx;
  padding-bottom: 40rpx;
}

.class-header {
  display: flex;
  align-items: center;
  background: var(--theme-gradient);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.class-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.9);
  color: var(--theme-accent);
  font-size: 40rpx;
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
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.class-count {
  font-size: 26rpx;
  color: #666;
}

.pending-badge {
  background: #FF6B6B;
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  margin-left: 12rpx;
}

.invite-code-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
}

.invite-label {
  font-size: 20rpx;
  color: #666;
  margin-bottom: 4rpx;
}

.invite-value {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-accent);
}

.module-grid {
  display: flex;
  flex-direction: column;
  margin-bottom: 24rpx;
}

.module-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.module-icon {
  font-size: 48rpx;
  margin-right: 16rpx;
}

.module-content {
  flex: 1;
}

.module-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 6rpx;
}

.module-desc {
  font-size: 24rpx;
  color: #999;
}

.module-arrow {
  font-size: 36rpx;
  color: #ccc;
}

.members-card {
  flex-direction: column;
  align-items: stretch;
}

.members-header {
  display: flex;
  align-items: center;
}

.members-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.member-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background: #FF6B6B;
  color: #fff;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section {
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.section-more {
  font-size: 26rpx;
  color: var(--theme-accent);
}

.action-row {
  display: flex;
  gap: 16rpx;
}

.action-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.action-card.primary {
  background: var(--theme-gradient);
}

.action-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.action-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 6rpx;
}

.action-desc {
  font-size: 24rpx;
  color: #999;
}

.homework-list {
  margin-top: 16rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 0 24rpx;
}

.homework-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.homework-item:last-child {
  border-bottom: none;
}

.homework-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.homework-info {
  flex: 1;
}

.homework-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 4rpx;
}

.homework-meta {
  font-size: 24rpx;
  color: #999;
}

.homework-progress {
  text-align: right;
}

.progress-text {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-accent);
}

.progress-label {
  font-size: 22rpx;
  color: #999;
}

.stats-row {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--theme-accent);
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

/* ========== 添加学生弹窗 ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-overlay.show {
  opacity: 1;
}

.add-modal {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 1000;
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  padding-bottom: env(safe-area-inset-bottom);
}

.add-modal.show {
  transform: translateY(0);
}

.modal-view {
  padding: 0 40rpx 40rpx;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 40rpx 0 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.header-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.header-title {
  flex: 1;
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #999;
  background: #f5f5f5;
  border-radius: 50%;
}

.modal-body {
  padding: 32rpx 0;
}

.input-group {
  margin-bottom: 32rpx;
}

.input-label {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.label-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.input-label text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.optional {
  font-size: 24rpx !important;
  color: #999 !important;
  font-weight: 400 !important;
  margin-left: 8rpx;
}

.modal-input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  font-size: 30rpx;
  color: #333;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.modal-input:focus {
  background: #fff;
  box-shadow: 0 0 0 2rpx var(--theme-accent);
}

.placeholder {
  color: #ccc;
}

.tips-box {
  display: flex;
  align-items: flex-start;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF3D6 100%);
  border-radius: 12rpx;
  margin-top: 8rpx;
}

.tips-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.tips-text {
  flex: 1;
  font-size: 24rpx;
  color: #8B6914;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 24rpx;
  padding-top: 16rpx;
}

.btn-cancel {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 48rpx;
  font-size: 30rpx;
  color: #666;
}

.btn-confirm {
  flex: 2;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-gradient);
  border-radius: 48rpx;
  font-size: 30rpx;
  color: #fff;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-confirm.disabled {
  opacity: 0.5;
}

.btn-confirm:active {
  transform: scale(0.98);
}

.loading-text {
  opacity: 0.8;
}

/* ========== 结果视图 ========== */
.result-view {
  padding-top: 0;
}

.result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0 32rpx;
}

.result-check {
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  border-radius: 50%;
  color: #fff;
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.result-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.result-body {
  padding: 0 0 32rpx;
}

.result-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #e8e8e8;
}

.result-item:last-child {
  border-bottom: none;
}

.result-label {
  font-size: 26rpx;
  color: #666;
}

.result-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.result-value.highlight {
  color: var(--theme-accent);
  font-weight: 700;
  font-size: 32rpx;
}

.warning-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx;
  background: #FFF0F0;
  border-radius: 12rpx;
}

.warning-icon {
  font-size: 26rpx;
}

.warning-text {
  font-size: 24rpx;
  color: #E53935;
}

.btn-secondary {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-light);
  border-radius: 48rpx;
  font-size: 30rpx;
  color: var(--theme-accent);
  font-weight: 500;
}

/* ========== 按钮图标（添加学生按钮） ========== */
.member-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
  background: var(--theme-light);
  border-radius: 12rpx;
  font-size: 26rpx;
  color: var(--theme-accent);
  position: relative;
  transition: all 0.2s ease;
}

.member-btn:active {
  transform: scale(0.96);
}

.member-btn.primary {
  background: var(--theme-gradient);
  color: #fff;
}

.btn-icon {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  color: var(--theme-accent);
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 10rpx;
}

.member-btn.primary .btn-icon {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}
</style>
