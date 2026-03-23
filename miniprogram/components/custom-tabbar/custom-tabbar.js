/**
 * 自定义 TabBar 组件
 * 替代原生 tabBar，彻底解决 tab 切换延迟问题
 */
Component({
  properties: {
    currentTab: {
      type: String,
      value: 'home',
    },
    themeAccent: {
      type: String,
      value: '#C47786',
    },
  },

  data: {
    tabs: [
      { key: 'home',      label: '首页', icon: '/assets/tab/home.png',      activeIcon: '/assets/tab/home-active.png' },
      { key: 'class',     label: '班级', icon: '/assets/tab/class.png',     activeIcon: '/assets/tab/class-active.png' },
      { key: 'schedule', label: '课表', icon: '/assets/tab/schedule.png',   activeIcon: '/assets/tab/schedule-active.png' },
      { key: 'homework',  label: '作业', icon: '/assets/tab/homework.png',   activeIcon: '/assets/tab/homework-active.png' },
      { key: 'profile',   label: '我的', icon: '/assets/tab/profile.png',    activeIcon: '/assets/tab/profile-active.png' },
    ],
  },

  methods: {
    onTabTap(e) {
      const key = e.currentTarget.dataset.key;
      if (key === this.properties.currentTab) return;
      this.triggerEvent('switch', { tab: key });
    },
  },
});
