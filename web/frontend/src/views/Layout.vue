<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🎓</span>
          <span class="logo-text">教师助手</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">👩‍🏫</div>
          <div class="user-detail">
            <div class="user-name">教师用户</div>
            <div class="user-role">网页端</div>
          </div>
        </div>
      </div>
    </aside>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <header class="main-header">
        <div class="header-left">
          <h1 class="page-title">{{ currentPageTitle }}</h1>
          <span class="page-date">{{ currentDate }}</span>
        </div>
        <div class="header-right">
          <button class="header-btn" @click="refreshData">
            🔄 刷新
          </button>
        </div>
      </header>
      
      <div class="content-area">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentDate = ref('')

const navItems = [
  { path: '/', icon: '🏠', label: '首页' },
  { path: '/homework', icon: '📝', label: '作业管理' },
  { path: '/class', icon: '🏫', label: '班级管理' },
  { path: '/students', icon: '👨‍🎓', label: '学生管理' },
  { path: '/notes', icon: '📝', label: '笔记库' },
  { path: '/profile', icon: '👤', label: '个人中心' },
]

const pageTitleMap = {
  '/': '首页概览',
  '/homework': '作业管理',
  '/homework/create': '布置作业',
  '/class': '班级管理',
  '/students': '学生管理',
  '/recite': '选词库学习',
  '/recite/learn': '分组学习',
  '/recite/test': '单词检测',
  '/notes': '笔记库',
  '/notes/new': '新建笔记',
  '/profile': '个人中心'
}

const currentPageTitle = computed(() => {
  const path = route.path
  // 笔记详情页显示笔记标题
  if (path.startsWith('/notes/') && path !== '/notes/new') {
    return '笔记详情'
  }
  if (path.startsWith('/student/')) {
    return '学生详情'
  }
  return pageTitleMap[path] || '教师助手'
})

function isActive(path) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

function setCurrentDate() {
  const now = new Date()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  currentDate.value = `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
}

function refreshData() {
  window.location.reload()
}

onMounted(() => {
  setCurrentDate()
})
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  background: #f8f9fa;
}

/* 侧边栏 */
.sidebar {
  width: var(--sidebar-width);
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--theme-accent);
}

/* 导航 */
.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--border-radius-sm);
  color: #666;
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.nav-item:hover {
  background: var(--theme-light);
  color: var(--theme-accent);
}

.nav-item.active {
  background: var(--theme-gradient);
  color: var(--theme-accent);
  font-weight: 600;
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-size: 14px;
}

.nav-badge {
  margin-left: auto;
  background: var(--theme-accent);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 用户信息 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: var(--theme-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.user-detail {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.user-role {
  font-size: 12px;
  color: #999;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-header {
  height: var(--header-height);
  background: var(--theme-gradient);
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--theme-accent);
}

.page-date {
  font-size: 13px;
  color: var(--theme-text);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: 13px;
  color: var(--theme-accent);
  cursor: pointer;
  transition: all 0.2s;
}

.header-btn:hover {
  background: #fff;
  transform: translateY(-1px);
}

/* 内容区 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  justify-content: center;
}

/* 响应式 */
@media (max-width: 1024px) {
  .sidebar {
    width: 72px;
  }
  
  .logo-text,
  .nav-text,
  .user-detail,
  .nav-badge {
    display: none;
  }
  
  .nav-item {
    justify-content: center;
    padding: 14px;
  }
  
  .user-info {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    flex-direction: row;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .sidebar-header {
    display: none;
  }
  
  .sidebar-nav {
    display: flex;
    padding: 8px;
    overflow-x: auto;
  }
  
  .nav-item {
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    font-size: 11px;
  }
  
  .nav-icon {
    font-size: 20px;
  }
  
  .sidebar-footer {
    display: none;
  }
  
  .main-header {
    padding: 0 16px;
  }
  
  .content-area {
    padding: 16px;
  }
}
</style>
