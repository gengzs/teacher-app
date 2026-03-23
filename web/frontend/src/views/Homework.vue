<template>
  <div class="homework-page">
    <div class="page-header">
      <router-link to="/homework/create" class="btn btn-primary">
        <span>+ 布置作业</span>
      </router-link>
    </div>

    <div class="card">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>
      <div v-else-if="homeworkList.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">暂无作业</div>
      </div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>作业名称</th>
            <th>班级</th>
            <th>截止日期</th>
            <th>提交情况</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in homeworkList" :key="item._id">
            <td>
              <div class="homework-name">{{ item.title || '未命名作业' }}</div>
            </td>
            <td>{{ item.className || '未分配' }}</td>
            <td>{{ formatDate(item.deadline) }}</td>
            <td>
              <div class="submit-info">
                <span class="submit-count">{{ item.submitCount || 0 }}/{{ item.totalCount || 0 }}</span>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: getProgress(item) + '%' }"
                  ></div>
                </div>
              </div>
            </td>
            <td>
              <span class="badge" :class="getStatusClass(item.status)">
                {{ getStatusText(item.status) }}
              </span>
            </td>
            <td>
              <button class="btn-link" @click="viewDetail(item)">查看</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getHomeworkList } from '../utils/api'

const loading = ref(false)
const homeworkList = ref([])

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getProgress(item) {
  if (!item.totalCount) return 0
  return Math.round((item.submitCount / item.totalCount) * 100)
}

function getStatusClass(status) {
  return status === 'ongoing' ? 'badge-warning' : 'badge-success'
}

function getStatusText(status) {
  return status === 'ongoing' ? '进行中' : '已完成'
}

function viewDetail(item) {
  console.log('查看作业详情:', item)
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getHomeworkList()
    if (res.code === 0) {
      homeworkList.value = res.data || []
    }
  } catch (err) {
    console.error('获取作业列表失败:', err)
    // 演示数据
    homeworkList.value = [
      { _id: '1', title: 'Unit 3 单词跟读', className: '三年级一班', deadline: '2024-03-25', submitCount: 20, totalCount: 28, status: 'ongoing' },
      { _id: '2', title: '口语练习第二课', className: '三年级二班', deadline: '2024-03-26', submitCount: 30, totalCount: 30, status: 'completed' },
      { _id: '3', title: '周末口语作业', className: '四年级一班', deadline: '2024-03-28', submitCount: 10, totalCount: 25, status: 'ongoing' }
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
.homework-page {
  max-width: 1100px;
}

.page-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.homework-name {
  font-weight: 600;
  color: #333;
}

.submit-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.submit-count {
  font-size: 13px;
  color: #666;
}

.progress-bar {
  width: 100px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--theme-accent);
  border-radius: 2px;
  transition: width 0.3s;
}

.badge-warning {
  background: #fef3c7;
  color: #d97706;
}

.badge-success {
  background: #d1fae5;
  color: #059669;
}

.btn-link {
  background: none;
  border: none;
  color: var(--theme-accent);
  cursor: pointer;
  font-size: 14px;
}

.btn-link:hover {
  text-decoration: underline;
}
</style>
