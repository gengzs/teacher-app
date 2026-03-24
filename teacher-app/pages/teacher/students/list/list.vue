<template>
  <view class="container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input
        class="search-input"
        placeholder="搜索学生姓名或班级"
        v-model="searchKey"
        @input="onSearch"
      />
      <view class="search-icon">🔍</view>
    </view>

    <!-- 筛选选项 -->
    <view class="filter-bar">
      <view class="filter-toggle" @click="toggleShowLeft">
        <text :class="{ active: showLeftStudents }">
          {{showLeftStudents ? '全部学生' : '仅在班'}}
        </text>
      </view>
      <text class="filter-count">{{filteredStudents.length}}名学生</text>
    </view>

    <!-- 学生列表 -->
    <view class="student-list" v-if="filteredStudents.length > 0">
      <view
        class="student-card"
        :class="{ left: item.status === 'inactive' }"
        v-for="item in filteredStudents"
        :key="item._id"
        @click="goToStudentDetail(item)"
      >
        <view class="card-left">
          <view class="student-avatar" :class="{ left: item.status === 'inactive' }">
            {{item.name[0]}}
          </view>
          <view class="student-info">
            <text class="student-name">{{item.name}}</text>
            <text class="student-class">{{item.className || '未分班'}}</text>
          </view>
        </view>
        <view class="card-right">
          <view class="status-tags">
            <text v-if="item.status === 'inactive'" class="status-tag left">已离班</text>
            <text v-if="item.status === 'active' && item.joinSource === 'invite'" class="status-tag invite">邀请加入</text>
            <text v-if="item.status === 'active' && item.joinSource === 'manual'" class="status-tag manual">手动添加</text>
          </view>
          <text class="card-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && filteredStudents.length === 0">
      <text class="icon">👨‍🎓</text>
      <text class="text">{{searchKey ? '未找到匹配的学生' : '暂无学生'}}</text>
      <view class="empty-btn" @click="goToClassList">
        去班级添加学生
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script>
const app = getApp();

export default {
  data() {
    return {
      searchKey: '',
      students: [],
      filteredStudents: [],
      showLeftStudents: false,
      loading: false,
    };
  },

  onLoad() {
    this.loadStudents();
  },

  onShow() {
    this.loadStudents();
  },

  methods: {
    async loadStudents() {
      this.loading = true;

      try {
        const res = await app.callFunction('class', {
          action: 'getAllStudents',
          status: this.showLeftStudents ? 'all' : 'active',
        });

        if (res.code === 0) {
          this.students = res.data || [];
          this.filteredStudents = res.data || [];
        } else {
          uni.showToast({ title: res.msg, icon: 'none' });
        }
      } catch (e) {
        console.error('加载学生列表失败', e);
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },

    onSearch(e) {
      const keyword = e.detail.value || '';
      this.searchKey = keyword;
      this.filterStudents(keyword);
    },

    filterStudents(keyword) {
      if (!keyword) {
        this.filteredStudents = this.students;
        return;
      }

      const kw = keyword.toLowerCase();
      const filtered = this.students.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          (s.className && s.className.toLowerCase().includes(kw))
      );
      this.filteredStudents = filtered;
    },

    toggleShowLeft() {
      this.showLeftStudents = !this.showLeftStudents;
      this.loadStudents();
    },

    goToStudentDetail(student) {
      uni.navigateTo({
        url: `/pages/teacher/students/detail/detail?id=${student._id}&name=${encodeURIComponent(student.name)}&classId=${student.classId || ''}&className=${encodeURIComponent(student.className || '')}`,
      });
    },

    removeStudent(studentId, studentName, classId) {
      uni.showModal({
        title: '移除学生',
        content: `确定要将「${studentName}」从班级移除吗？移除后历史记录会保留。`,
        confirmText: '移除',
        confirmColor: '#ff4d4f',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await app.callFunction('class', {
                action: 'removeStudent',
                classId,
                studentId,
              });

              if (result.code === 0) {
                uni.showToast({ title: '已移除', icon: 'success' });
                this.loadStudents();
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

    goToClassList() {
      uni.switchTab({ url: '/pages/teacher/class/list/list' });
    },
  },

  onShareAppMessage() {
    return {
      title: '学生管理',
      path: '/pages/teacher/home/home',
    };
  },
};
</script>

<style scoped>
.container {
  padding: 24rpx;
  padding-bottom: 40rpx;
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

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.filter-toggle {
  font-size: 28rpx;
  color: var(--theme-accent);
}

.filter-toggle text.active {
  font-weight: 600;
}

.filter-count {
  font-size: 26rpx;
  color: #999;
}

.student-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.student-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
  transition: background 0.2s;
}

.student-card:active {
  background: #f8f8f8;
}

.student-card:last-child {
  border-bottom: none;
}

.student-card.left {
  opacity: 0.6;
}

.card-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.card-right {
  display: flex;
  align-items: center;
}

.student-avatar {
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

.student-avatar.left {
  background: #e5e5e5;
  color: #999;
}

.student-info {
  flex: 1;
}

.student-name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 6rpx;
}

.student-class {
  font-size: 24rpx;
  color: #999;
}

.status-tags {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 16rpx;
}

.status-tag {
  font-size: 22rpx;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  margin-bottom: 4rpx;
}

.status-tag:last-child {
  margin-bottom: 0;
}

.card-arrow {
  font-size: 40rpx;
  color: #ccc;
}

.student-action {
  flex-shrink: 0;
}

.action-btn {
  font-size: 24rpx;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
}

.action-btn.remove {
  background: #FFE8E8;
  color: #FF6B6B;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-state .icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-state .text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 24rpx;
}

.empty-btn {
  padding: 16rpx 32rpx;
  background: var(--theme-gradient);
  color: #fff;
  border-radius: 32rpx;
  font-size: 28rpx;
}

.loading-state {
  text-align: center;
  padding: 60rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>
