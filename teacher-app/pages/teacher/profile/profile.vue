<template>
  <view class="container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-avatar">
        <text>{{userInfo.name ? userInfo.name[0] : '老'}}</text>
      </view>
      <view class="user-info">
        <text class="user-name">{{userInfo.name}}</text>
        <text class="user-school">{{userInfo.school}}</text>
      </view>
    </view>

    <!-- 统计数据 -->
    <view class="stats-row">
      <view class="stat-item">
        <text class="stat-num">{{stats.classCount}}</text>
        <text class="stat-label">班级</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{stats.studentCount}}</text>
        <text class="stat-label">学生</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{stats.taskCount}}</text>
        <text class="stat-label">任务</text>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="card menu-card">
      <view
        class="menu-item"
        v-for="item in menuItems"
        :key="item.id"
        @click="goToPage(item.id)"
      >
        <view class="menu-icon">{{item.icon}}</view>
        <view class="menu-content">
          <text class="menu-title">{{item.title}}</text>
          <text class="menu-subtitle">{{item.subtitle}}</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 版本信息 -->
    <view class="version-info" @click="showAbout">
      <text class="version-text">英语口语助手 v1.0.0</text>
    </view>

    <custom-tabbar currentTab="profile" :themeAccent="tabThemeAccent" @switch="onTabSwitch" />
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {
        name: '张老师',
        school: '某某小学',
        avatar: '',
      },
      stats: {
        classCount: 3,
        studentCount: 86,
        taskCount: 12,
      },
      menuItems: [
        { id: 'theme', icon: '🎨', title: '主题设置', subtitle: '自定义应用外观' },
        { id: 'createClass', icon: '🏫', title: '创建班级', subtitle: '新建班级并获取邀请码' },
        { id: 'words', icon: '📖', title: '单词复习', subtitle: '设置抗遗忘复习计划' },
        { id: 'schedule', icon: '📅', title: '排课管理', subtitle: '管理课程表' },
        { id: 'stats', icon: '📊', title: '学习统计', subtitle: '查看学生数据' },
        { id: 'records', icon: '📝', title: '学习记录', subtitle: '学生完成情况' },
        { id: 'students', icon: '👥', title: '学生管理', subtitle: '查看全部学生' },
        { id: 'settings', icon: '⚙️', title: '设置', subtitle: '账号和偏好设置' },
      ],
    };
  },

  onLoad() {},

  onShow() {},

  computed: {
    tabThemeAccent() {
      const app = getApp();
      const themeId = app.globalData.currentTheme || 'pink';
      const t = app.globalData.themes && app.globalData.themes[themeId];
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
    goToPage(id) {
      if (id === 'createClass') {
        this.createClass();
        return;
      }
      if (id === 'theme') {
        uni.navigateTo({ url: '/pages/theme/theme' });
        return;
      }
      const routes = {
        words: '/pages/teacher/recite/recite',
        schedule: '/pages/teacher/schedule/schedule',
        stats: '/pages/teacher/class/stats/stats',
        records: '/pages/teacher/records/records/records',
        students: '/pages/teacher/students/list/list',
      };
      if (routes[id]) {
        uni.navigateTo({ url: routes[id] });
      }
    },

    // 创建班级
    createClass() {
      uni.showModal({
        title: '创建班级',
        editable: true,
        placeholderText: '请输入班级名称',
        success: async (res) => {
          if (res.confirm && res.content) {
            try {
              const app = getApp();
              const result = await app.callFunction('class', { action: 'create', name: res.content });
              if (result.code === 0) {
                uni.showToast({ title: '创建成功', icon: 'success' });
              } else {
                uni.showToast({ title: result.msg || '创建失败', icon: 'none' });
              }
            } catch (e) {
              uni.showToast({ title: '创建失败', icon: 'none' });
            }
          }
        },
      });
    },

    showAbout() {
      uni.showModal({
        title: '关于我们',
        content: '英语口语助手 v1.0.0\n帮助教师高效布置口语作业',
        showCancel: false,
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

.user-card {
  display: flex;
  align-items: center;
  background: var(--theme-gradient);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.user-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: var(--theme-accent);
  font-size: 40rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.user-school {
  font-size: 26rpx;
  color: #666;
}

.stats-row {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-num {
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

.stat-divider {
  width: 1rpx;
  background: #f0f0f0;
  margin: 0 10rpx;
}

.menu-card {
  padding: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.menu-content {
  flex: 1;
}

.menu-title {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 6rpx;
}

.menu-subtitle {
  font-size: 24rpx;
  color: #999;
}

.menu-arrow {
  font-size: 36rpx;
  color: #ccc;
}

.version-info {
  text-align: center;
  padding: 40rpx 0;
}

.version-text {
  font-size: 24rpx;
  color: #ccc;
}
</style>
