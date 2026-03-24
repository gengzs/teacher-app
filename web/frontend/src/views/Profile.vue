<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="avatar">👩‍🏫</div>
      <div class="user-info">
        <h2 class="user-name">教师用户</h2>
        <p class="user-role">网页端</p>
      </div>
    </div>

    <div class="settings-list">
      <div class="settings-section">
        <h3 class="section-title">账号信息</h3>
        <div class="settings-item">
          <span class="settings-label">登录方式</span>
          <span class="settings-value">密码登录</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">登录时间</span>
          <span class="settings-value">{{ loginTime }}</span>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">主题设置</h3>
        <div class="theme-grid">
          <button 
            v-for="theme in themes" 
            :key="theme.id"
            class="theme-btn"
            :class="{ active: currentTheme === theme.id }"
            :style="{ background: theme.gradient }"
            @click="setTheme(theme.id)"
          >
            <span class="theme-name">{{ theme.name }}</span>
          </button>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">其他</h3>
        <button class="settings-item clickable" @click="logout">
          <span class="settings-label">退出登录</span>
          <span class="settings-arrow">›</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loginTime = ref('')
const currentTheme = ref('pink')

const themes = [
  { id: 'pink', name: '樱花粉', gradient: 'linear-gradient(135deg, #F9E2E6 0%, #F5D0D8 100%)' },
  { id: 'blue', name: '天空蓝', gradient: 'linear-gradient(135deg, #87CEEB 0%, #6BBFDE 100%)' },
  { id: 'green', name: '抹茶绿', gradient: 'linear-gradient(135deg, #A8D5A2 0%, #92CC8C 100%)' },
  { id: 'purple', name: '薰衣草', gradient: 'linear-gradient(135deg, #DDA0DD 0%, #D090D0 100%)' },
  { id: 'orange', name: '活力橙', gradient: 'linear-gradient(135deg, #FFB366 0%, #FFA54D 100%)' }
]

function setTheme(themeId) {
  currentTheme.value = themeId
  localStorage.setItem('theme', themeId)
  
  const theme = themes.find(t => t.id === themeId)
  if (theme) {
    document.documentElement.style.setProperty('--theme-gradient', theme.gradient)
  }
}

function logout() {
  localStorage.removeItem('teacher_token')
  router.push('/login')
}

onMounted(() => {
  const now = new Date()
  loginTime.value = now.toLocaleString('zh-CN')
  
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    currentTheme.value = savedTheme
    setTheme(savedTheme)
  }
})
</script>

<style scoped>
.profile-page {
  width: 100%;
  max-width: 1100px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 32px;
  background: var(--theme-gradient);
  border-radius: var(--border-radius);
  margin-bottom: 24px;
}

.avatar {
  width: 72px;
  height: 72px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}

.user-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--theme-accent);
  margin-bottom: 4px;
}

.user-role {
  font-size: 14px;
  color: var(--theme-text);
}

.settings-section {
  background: #fff;
  border-radius: var(--border-radius);
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #999;
  margin-bottom: 16px;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-item.clickable {
  cursor: pointer;
  transition: background 0.2s;
}

.settings-item.clickable:hover {
  background: #fafafa;
  margin: 0 -24px;
  padding: 14px 24px;
}

.settings-label {
  font-size: 14px;
  color: #333;
}

.settings-value {
  font-size: 14px;
  color: #999;
}

.settings-arrow {
  font-size: 20px;
  color: #ccc;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.theme-btn {
  padding: 16px 12px;
  border: 3px solid transparent;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.theme-btn:hover {
  transform: scale(1.05);
}

.theme-btn.active {
  border-color: var(--theme-accent);
}

.theme-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--theme-text);
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .theme-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
