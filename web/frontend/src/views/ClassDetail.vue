<template>
  <div class="class-detail-page">
    <div class="page-header">
      <button class="btn btn-outline" @click="$router.back()">← 返回</button>
      <h2 class="page-title">{{ classInfo.name || '班级详情' }}</h2>
    </div>

    <div class="detail-grid">
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
          <span class="info-value">{{ classInfo.studentCount || 0 }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">创建时间</span>
          <span class="info-value">{{ formatDate(classInfo.createTime) }}</span>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">班级操作</h3>
        <div class="action-list">
          <button class="action-item">
            <span class="action-icon">👨‍🎓</span>
            <span class="action-text">管理学生</span>
          </button>
          <button class="action-item">
            <span class="action-icon">📝</span>
            <span class="action-text">布置作业</span>
          </button>
          <button class="action-item">
            <span class="action-icon">📊</span>
            <span class="action-text">查看统计</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const classInfo = ref({
  name: '三年级一班',
  inviteCode: '3A001',
  studentCount: 28,
  createTime: '2024-01-15'
})

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(() => {
  const id = route.params.id
  console.log('班级ID:', id)
})
</script>

<style scoped>
.class-detail-page {
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
}

.action-item:hover {
  background: var(--theme-primary);
}

.action-icon {
  font-size: 20px;
}

.action-text {
  font-size: 14px;
  color: var(--theme-accent);
  font-weight: 500;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
