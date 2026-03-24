<template>
  <div class="class-page">
    <div class="page-header">
      <button class="btn btn-primary" @click="showCreateModal = true">
        <span>+ 创建班级</span>
      </button>
    </div>

    <div class="class-grid">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>
      <div v-else-if="classList.length === 0" class="empty-state">
        <div class="empty-icon">🏫</div>
        <div class="empty-text">暂无班级</div>
      </div>
      <div 
        v-else 
        v-for="item in classList" 
        :key="item._id"
        class="class-card"
        @click="goToDetail(item._id)"
      >
        <div class="class-header">
          <div class="class-avatar">{{ item.name?.charAt(0) || '班' }}</div>
          <div class="class-info">
            <div class="class-name">{{ item.name || '未命名班级' }}</div>
            <div class="class-code">邀请码: {{ item.inviteCode || '-' }}</div>
          </div>
          <div class="class-arrow">›</div>
        </div>
        <div class="class-stats">
          <div class="stat-item">
            <span class="stat-icon">👨‍🎓</span>
            <span class="stat-value">{{ item.studentCount || 0 }}</span>
            <span class="stat-label">学生</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📝</span>
            <span class="stat-value">{{ item.homeworkCount || 0 }}</span>
            <span class="stat-label">作业</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建班级弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>创建班级</h3>
          <button class="modal-close" @click="showCreateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">班级名称</label>
            <input 
              type="text" 
              v-model="newClass.name"
              class="form-input"
              placeholder="如：三年级一班"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showCreateModal = false">取消</button>
          <button class="btn btn-primary" @click="createClass">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getClasses } from '../utils/api'

const router = useRouter()
const loading = ref(false)
const classList = ref([])
const showCreateModal = ref(false)
const newClass = ref({ name: '' })

function goToDetail(id) {
  router.push(`/class/${id}`)
}

async function createClass() {
  console.log('创建班级:', newClass.value)
  showCreateModal.value = false
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getClasses()
    if (res.code === 0) {
      classList.value = res.data || []
    }
  } catch (err) {
    console.error('获取班级列表失败:', err)
    classList.value = [
      { _id: '1', name: '三年级一班', inviteCode: '3A001', studentCount: 28, homeworkCount: 5 },
      { _id: '2', name: '三年级二班', inviteCode: '3A002', studentCount: 30, homeworkCount: 4 },
      { _id: '3', name: '四年级一班', inviteCode: '4A001', studentCount: 25, homeworkCount: 3 },
      { _id: '4', name: '五年级一班', inviteCode: '5A001', studentCount: 22, homeworkCount: 2 }
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
.class-page {
  width: 100%;
  max-width: 1100px;
}

.page-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.class-card {
  background: #fff;
  border-radius: var(--border-radius);
  padding: 24px;
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
  margin-bottom: 20px;
}

.class-avatar {
  width: 56px;
  height: 56px;
  background: var(--theme-gradient);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--theme-accent);
  margin-right: 16px;
}

.class-info {
  flex: 1;
}

.class-name {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.class-code {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.class-arrow {
  font-size: 24px;
  color: #ccc;
}

.class-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 16px;
}

.stat-value {
  font-weight: 600;
  color: var(--theme-accent);
}

.stat-label {
  font-size: 13px;
  color: #999;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  font-size: 17px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius-sm);
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: var(--theme-accent);
}

/* 响应式 */
@media (max-width: 1024px) {
  .class-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .class-grid {
    grid-template-columns: 1fr;
  }
}
</style>
