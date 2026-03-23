<template>
  <div class="home-page">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" @click="goTo('/class')">
        <div class="stat-icon">🏫</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.classCount }}</div>
          <div class="stat-label">班级数量</div>
        </div>
      </div>
      
      <div class="stat-card" @click="goTo('/students')">
        <div class="stat-icon">👨‍🎓</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.studentCount }}</div>
          <div class="stat-label">学生总数</div>
        </div>
      </div>
      
      <div class="stat-card" @click="goTo('/homework')">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.pendingHomework }}</div>
          <div class="stat-label">待交作业</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.completedHomework }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="section">
      <h2 class="section-title">快捷操作</h2>
      <div class="action-grid">
        <button class="action-card primary" @click="goTo('/homework/create')">
          <div class="action-icon">📝</div>
          <div class="action-text">布置作业</div>
        </button>
        <button class="action-card" @click="goTo('/class')">
          <div class="action-icon">🏫</div>
          <div class="action-text">班级管理</div>
        </button>
        <button class="action-card" @click="goTo('/students')">
          <div class="action-icon">👨‍🎓</div>
          <div class="action-text">学生管理</div>
        </button>
        <button class="action-card" @click="goTo('/notes')">
          <div class="action-icon">📖</div>
          <div class="action-text">笔记库</div>
        </button>
        <button class="action-card" @click="goTo('/profile')">
          <div class="action-icon">⚙️</div>
          <div class="action-text">设置</div>
        </button>
      </div>
    </div>

    <!-- 最近作业 -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">最近作业</h2>
        <router-link to="/homework" class="more-link">查看全部 ›</router-link>
      </div>
      <div class="homework-list">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>
        <div v-else-if="recentHomework.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">暂无作业</div>
        </div>
        <div 
          v-else 
          v-for="item in recentHomework" 
          :key="item._id"
          class="homework-item"
        >
          <div class="homework-info">
            <div class="homework-title">{{ item.title || '未命名作业' }}</div>
            <div class="homework-meta">
              <span class="homework-class">{{ item.className || '未分配班级' }}</span>
              <span class="homework-date">截止: {{ formatDate(item.deadline) }}</span>
            </div>
          </div>
          <div class="homework-stats">
            <span class="submit-count">{{ item.submitCount || 0 }}/{{ item.totalCount || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 班级概览 -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">我的班级</h2>
        <router-link to="/class" class="more-link">查看全部 ›</router-link>
      </div>
      <div class="class-grid">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>
        <div v-else-if="recentClasses.length === 0" class="empty-state">
          <div class="empty-icon">🏫</div>
          <div class="empty-text">暂无班级</div>
        </div>
        <div 
          v-else 
          v-for="item in recentClasses" 
          :key="item._id"
          class="class-card"
          @click="goToClassDetail(item._id)"
        >
          <div class="class-header">
            <div class="class-avatar">{{ item.name?.charAt(0) || '班' }}</div>
            <div class="class-info">
              <div class="class-name">{{ item.name || '未命名班级' }}</div>
              <div class="class-code">邀请码: {{ item.inviteCode || '-' }}</div>
            </div>
          </div>
          <div class="class-footer">
            <div class="class-students">
              <span class="student-icon">👨‍🎓</span>
              <span>{{ item.studentCount || 0 }} 名学生</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getClasses, getHomeworkList } from '../utils/api'

const router = useRouter()
const loading = ref(false)
const stats = ref({
  classCount: 0,
  studentCount: 0,
  pendingHomework: 0,
  completedHomework: 0
})
const recentHomework = ref([])
const recentClasses = ref([])

function goTo(path) {
  router.push(path)
}

function goToClassDetail(id) {
  router.push(`/class/${id}`)
}

function formatDate(date) {
  if (!date) return '未设置'
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

async function fetchData() {
  loading.value = true
  try {
    // 获取班级数据
    const classRes = await getClasses()
    if (classRes.code === 0) {
      const classes = classRes.data || []
      recentClasses.value = classes.slice(0, 3)
      stats.value.classCount = classes.length
      stats.value.studentCount = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)
    }

    // 获取作业数据
    const homeworkRes = await getHomeworkList()
    if (homeworkRes.code === 0) {
      const homework = homeworkRes.data || []
      recentHomework.value = homework.slice(0, 3)
      stats.value.pendingHomework = homework.filter(h => h.status === 'ongoing').length
      stats.value.completedHomework = homework.filter(h => h.status === 'completed').length
    }
  } catch (err) {
    console.error('获取数据失败:', err)
    // 演示数据
    stats.value = {
      classCount: 3,
      studentCount: 86,
      pendingHomework: 5,
      completedHomework: 23
    }
    recentClasses.value = [
      { _id: '1', name: '三年级一班', inviteCode: '3A001', studentCount: 28 },
      { _id: '2', name: '三年级二班', inviteCode: '3A002', studentCount: 30 },
      { _id: '3', name: '四年级一班', inviteCode: '4A001', studentCount: 28 }
    ]
    recentHomework.value = [
      { _id: '1', title: 'Unit 3 单词跟读', className: '三年级一班', deadline: '2024-03-25', submitCount: 20, totalCount: 28 },
      { _id: '2', title: '口语练习第二课', className: '三年级二班', deadline: '2024-03-26', submitCount: 15, totalCount: 30 }
    ]
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.home-page {
  max-width: 1100px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  border-radius: var(--border-radius);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.stat-icon {
  font-size: 36px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--theme-accent);
}

.stat-label {
  font-size: 13px;
  color: #999;
}

/* 区块 */
.section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.more-link {
  font-size: 13px;
  color: var(--theme-accent);
  text-decoration: none;
}

/* 快捷操作 */
.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  background: #fff;
  border: none;
  border-radius: var(--border-radius);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.action-card.primary {
  background: var(--theme-gradient);
}

.action-icon {
  font-size: 32px;
}

.action-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.action-card.primary .action-text {
  color: var(--theme-accent);
}

/* 作业列表 */
.homework-list {
  background: #fff;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.homework-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.homework-item:last-child {
  border-bottom: none;
}

.homework-item:hover {
  background: #fafafa;
}

.homework-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.homework-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.submit-count {
  background: var(--theme-light);
  color: var(--theme-accent);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

/* 班级网格 */
.class-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.class-card {
  background: #fff;
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.2s;
}

.class-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.class-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.class-avatar {
  width: 48px;
  height: 48px;
  background: var(--theme-gradient);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--theme-accent);
}

.class-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.class-code {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.class-footer {
  display: flex;
  align-items: center;
}

.class-students {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .class-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-icon {
    font-size: 28px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .class-grid {
    grid-template-columns: 1fr;
  }
}
</style>
