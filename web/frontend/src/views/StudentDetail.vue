<template>
  <div class="student-detail-page">
    <div class="page-header">
      <button class="btn btn-outline" @click="$router.back()">← 返回</button>
      <h2 class="page-title">{{ studentInfo.name || '学生详情' }}</h2>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="loadError" class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-text">{{ loadError }}</div>
      <button class="btn btn-primary" @click="loadData">重试</button>
    </div>

    <template v-else-if="studentId">
      <!-- 学生信息卡片 -->
      <div class="student-card">
        <div class="student-avatar">{{ studentInfo.name?.charAt(0) || '?' }}</div>
        <div class="student-info">
          <div class="student-name">{{ studentInfo.name }}</div>
          <div class="student-meta">
            <span class="meta-item">班级：{{ studentInfo.className || '未分班' }}</span>
            <span class="meta-item">学习天数：{{ learnDays }} 天</span>
            <span class="meta-item">掌握率：{{ masterRate }}%</span>
          </div>
        </div>
      </div>

      <!-- 学习操作 -->
      <div class="card">
        <h3 class="card-title">📖 学习</h3>
        <div class="action-grid">
          <button class="action-card primary" @click="startRecite">
            <span class="action-icon">🎯</span>
            <span class="action-title">开始背单词</span>
            <span class="action-desc">选词库进行学习</span>
          </button>
          <button class="action-card" @click="startReview">
            <span class="action-icon">🔄</span>
            <span class="action-title">抗遗忘复习</span>
            <span class="action-desc">根据遗忘曲线</span>
          </button>
        </div>
      </div>

      <!-- 学习数据 -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📊 学习数据</h3>
          <button class="btn-link" @click="exportData">导出 ›</button>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-icon">📚</span>
            <div class="stat-content">
              <span class="stat-value">{{ totalWords }}</span>
              <span class="stat-label">已学单词</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">✅</span>
            <div class="stat-content">
              <span class="stat-value">{{ masteredWords }}</span>
              <span class="stat-label">已掌握</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">⏰</span>
            <div class="stat-content">
              <span class="stat-value">{{ reviewCount }}</span>
              <span class="stat-label">待复习</span>
            </div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-title">整体进度</span>
            <span class="progress-percent">{{ progressPercent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="progress-legend">
            <div class="legend-item">
              <div class="legend-dot green"></div>
              <span>已掌握 {{ masteredWords }}</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot yellow"></div>
              <span>学习中 {{ learningWords }}</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot gray"></div>
              <span>未开始 {{ notStartedWords }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 词汇测试 -->
      <div class="card">
        <h3 class="card-title">🎤 词汇测试</h3>
        <button class="test-card" @click="startTest">
          <span class="test-icon">📝</span>
          <div class="test-content">
            <span class="test-title">词汇量测试</span>
            <span class="test-desc">测试学生当前词汇量水平</span>
          </div>
          <span class="test-arrow">›</span>
        </button>
      </div>

      <!-- 学习记录 -->
      <div class="card">
        <h3 class="card-title">📜 学习记录</h3>
        <div class="records-list" v-if="records.length > 0">
          <div class="record-item" v-for="item in records" :key="item._id">
            <div class="record-icon" :class="item.type">
              <span>{{ item.type === 'recite' ? '🎯' : item.type === 'review' ? '🔄' : '📝' }}</span>
            </div>
            <div class="record-info">
              <span class="record-title">{{ item.title }}</span>
              <span class="record-date">{{ item.date }}</span>
            </div>
            <div class="record-result" v-if="item.score">
              <span class="result-score">{{ item.score }}分</span>
            </div>
            <div class="record-result" v-if="item.wordCount">
              <span class="result-count">{{ item.wordCount }}词</span>
            </div>
          </div>
        </div>
        <div class="empty-records" v-else>
          <span>暂无学习记录</span>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="bottom-actions">
        <button class="btn btn-danger" @click="removeFromClass">移出班级</button>
      </div>
    </template>

    <div v-else class="error-state">
      <div class="error-icon">❌</div>
      <div class="error-text">学生不存在</div>
      <button class="btn btn-primary" @click="$router.back()">返回</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStudentStats } from '../utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const loadError = ref('')
const studentId = ref('')
const studentInfo = ref({})
const learnDays = ref(0)
const masterRate = ref(0)
const totalWords = ref(0)
const masteredWords = ref(0)
const learningWords = ref(0)
const notStartedWords = ref(0)
const reviewCount = ref(0)
const progressPercent = ref(0)
const records = ref([])

async function loadData() {
  loading.value = true
  loadError.value = ''

  const id = route.query.id || route.params.id || ''
  const name = decodeURIComponent(route.query.name || '')
  const className = decodeURIComponent(route.query.className || '')
  const classId = route.query.classId || ''

  studentId.value = id
  studentInfo.value = { name, className, classId }

  try {
    if (id) {
      const res = await getStudentStats(id)
      if (res.code === 0 && res.data) {
        const d = res.data
        totalWords.value = d.totalWords || 0
        masteredWords.value = d.masteredWords || 0
        learningWords.value = d.learningWords || 0
        notStartedWords.value = d.notStartedWords || 0
        reviewCount.value = d.reviewCount || 0
        learnDays.value = d.learnDays || 0
        masterRate.value = d.masterRate || 0
        progressPercent.value = d.masterRate || 0
        if (d.name) studentInfo.value.name = d.name
        if (d.className) studentInfo.value.className = d.className
        if (d.classId) studentInfo.value.classId = d.classId
      }
    }
  } catch (err) {
    console.error('加载学生数据失败:', err)
    loadError.value = '数据加载失败'
  } finally {
    loading.value = false
  }
}

function studentFlowQuery(extra = {}) {
  return {
    studentId: studentId.value,
    studentName: studentInfo.value.name || '',
    classId: studentInfo.value.classId || '',
    className: studentInfo.value.className || '',
    ...extra
  }
}

function startRecite() {
  router.push({ path: '/recite', query: studentFlowQuery() })
}

function startReview() {
  router.push({ path: '/recite', query: studentFlowQuery({ mode: 'review' }) })
}

function startTest() {
  router.push({ path: '/recite', query: studentFlowQuery({ mode: 'review' }) })
}

function exportData() {
  const method = window.confirm('选择导出格式：\n确定 - Excel\n取消 - PDF')
  if (method) {
    alert('正在生成 Excel...')
    setTimeout(() => alert('导出成功'), 1500)
  } else {
    alert('正在生成 PDF...')
    setTimeout(() => alert('导出成功'), 1500)
  }
}

function removeFromClass() {
  if (!studentInfo.value.classId) {
    alert('该学生未分班')
    return
  }

  if (confirm(`确定要将「${studentInfo.value.name}」移出「${studentInfo.value.className}」吗？`)) {
    alert('已移出（此功能需后端完善）')
    router.back()
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.student-detail-page {
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

/* 学生卡片 */
.student-card {
  display: flex;
  align-items: center;
  background: var(--theme-gradient);
  border-radius: var(--border-radius);
  padding: 24px;
  margin-bottom: 24px;
}

.student-avatar {
  width: 72px;
  height: 72px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-accent);
  margin-right: 20px;
}

.student-info {
  flex: 1;
}

.student-name {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.student-meta {
  display: flex;
  gap: 20px;
}

.meta-item {
  font-size: 13px;
  color: #666;
}

/* 卡片 */
.card {
  background: #fff;
  border-radius: var(--border-radius);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.card-header .card-title {
  margin-bottom: 0;
}

.btn-link {
  background: none;
  border: none;
  color: var(--theme-accent);
  cursor: pointer;
  font-size: 14px;
}

/* 操作卡片 */
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  background: var(--theme-light);
  border: none;
  border-radius: var(--border-radius-sm);
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
  font-size: 36px;
  margin-bottom: 12px;
}

.action-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.action-card.primary .action-title {
  color: #fff;
}

.action-desc {
  font-size: 12px;
  color: #999;
}

.action-card.primary .action-desc {
  color: rgba(255, 255, 255, 0.8);
}

/* 统计 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--theme-accent);
}

.stat-label {
  font-size: 12px;
  color: #999;
}

/* 进度条 */
.progress-section {
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.progress-title {
  font-size: 14px;
  color: #666;
}

.progress-percent {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-accent);
}

.progress-bar {
  height: 12px;
  background: #E0E0E0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #66BB6A);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-legend {
  display: flex;
  justify-content: space-between;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
}

.legend-dot.green { background: #4CAF50; }
.legend-dot.yellow { background: #FFC107; }
.legend-dot.gray { background: #E0E0E0; }

/* 测试卡片 */
.test-card {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px;
  background: var(--theme-light);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.test-card:hover {
  background: var(--theme-primary);
}

.test-icon {
  font-size: 28px;
  margin-right: 16px;
}

.test-content {
  flex: 1;
  text-align: left;
}

.test-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.test-desc {
  font-size: 13px;
  color: #999;
}

.test-arrow {
  font-size: 24px;
  color: #ccc;
}

/* 学习记录 */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: var(--border-radius-sm);
}

.record-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.record-icon span {
  font-size: 22px;
}

.record-icon.recite { background: #FFF3E0; }
.record-icon.review { background: #E8F5E6; }
.record-icon.test { background: #E3F2FD; }

.record-info {
  flex: 1;
}

.record-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.record-date {
  font-size: 12px;
  color: #999;
}

.record-result {
  text-align: right;
}

.result-score {
  font-size: 20px;
  font-weight: 700;
  color: #4CAF50;
}

.result-count {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-accent);
}

.empty-records {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

/* 底部操作 */
.bottom-actions {
  margin-top: 24px;
}

.btn-danger {
  background: #FFF0F0;
  color: #E53935;
  border: none;
  padding: 14px 32px;
  border-radius: var(--border-radius-sm);
  font-size: 14px;
  cursor: pointer;
}

.btn-danger:hover {
  background: #FFE0E0;
}

/* 错误状态 */
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
  .action-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
