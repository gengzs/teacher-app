<template>
  <div class="class-detail-page">
    <div class="page-header">
      <button class="btn btn-outline" @click="$router.back()">← 返回</button>
      <h2 class="page-title">{{ classInfo.name || '加载中...' }}</h2>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else-if="classInfo._id">
      <div class="detail-grid">
        <!-- 班级信息卡片 -->
        <div class="card">
          <h3 class="card-title">班级信息</h3>
          <div class="info-row">
            <span class="info-label">班级名称</span>
            <span class="info-value">{{ classInfo.name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">邀请码</span>
            <span class="info-value highlight">{{ classInfo.inviteCode || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">学生数量</span>
            <span class="info-value">{{ students.length }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ formatDate(classInfo.createTime) }}</span>
          </div>
        </div>

        <!-- 班级操作卡片 -->
        <div class="card">
          <h3 class="card-title">班级操作</h3>
          <div class="action-list">
            <button class="action-item" @click="goToStudents">
              <span class="action-icon">👨‍🎓</span>
              <span class="action-text">管理学生</span>
              <span class="action-arrow">›</span>
            </button>
            <button class="action-item" @click="goToHomework">
              <span class="action-icon">📝</span>
              <span class="action-text">布置作业</span>
              <span class="action-arrow">›</span>
            </button>
            <button class="action-item" @click="goToStats">
              <span class="action-icon">📊</span>
              <span class="action-text">查看统计</span>
              <span class="action-arrow">›</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 学生列表 -->
      <div class="card students-card" v-if="students.length > 0">
        <h3 class="card-title">班级学生 ({{ students.length }}人)</h3>
        <div class="students-grid">
          <div class="student-item" v-for="student in students" :key="student._id">
            <div class="student-avatar">{{ student.name?.charAt(0) || '?' }}</div>
            <div class="student-name">{{ student.name }}</div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <div class="empty-icon">👨‍🎓</div>
        <div class="empty-text">暂无学生</div>
        <div class="empty-hint">点击上方「管理学生」添加学生</div>
      </div>
    </template>

    <div v-else class="error-state">
      <div class="error-icon">❌</div>
      <div class="error-text">班级不存在或加载失败</div>
      <button class="btn btn-primary" @click="$router.back()">返回列表</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const classInfo = ref({})
const students = ref([])
const loading = ref(true)

async function fetchClassDetail() {
  loading.value = true
  try {
    const res = await axios.get(`/api/classes/${route.params.id}`)
    if (res.data.code === 0 && res.data.data) {
      classInfo.value = res.data.data
      students.value = res.data.data.students || []
    } else {
      classInfo.value = {}
    }
  } catch (err) {
    console.error('获取班级详情失败:', err)
    classInfo.value = {}
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function goToStudents() {
  router.push(`/students?classId=${route.params.id}&className=${encodeURIComponent(classInfo.value.name || '')}`)
}

function goToHomework() {
  router.push(`/homework?classId=${route.params.id}`)
}

function goToStats() {
  router.push(`/stats?classId=${route.params.id}`)
}

onMounted(() => {
  fetchClassDetail()
})
</script>

<style scoped>
.class-detail-page {
  width: 100%;
  max-width: 1100px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #999;
  font-size: 14px;
}

.info-value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.info-value.highlight {
  color: var(--theme-accent);
  font-weight: 600;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--theme-light);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.action-item:hover {
  background: var(--theme-primary);
}

.action-item:active {
  transform: scale(0.98);
}

.action-icon {
  font-size: 20px;
}

.action-text {
  flex: 1;
  font-size: 14px;
  color: var(--theme-accent);
  font-weight: 500;
}

.action-arrow {
  font-size: 18px;
  color: #ccc;
}

.students-card {
  margin-top: 24px;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}

.student-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: var(--border-radius-sm);
}

.student-avatar {
  width: 48px;
  height: 48px;
  background: var(--theme-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--theme-accent);
  margin-bottom: 8px;
}

.student-name {
  font-size: 13px;
  color: #333;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: #999;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}

.error-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.error-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
