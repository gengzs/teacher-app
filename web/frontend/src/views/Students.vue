<template>
  <div class="students-page">
    <div class="page-header">
      <h2 class="page-title">学生管理</h2>
    </div>

    <div class="card">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>
      <div v-else-if="students.length === 0" class="empty-state">
        <div class="empty-icon">👨‍🎓</div>
        <div class="empty-text">暂无学生</div>
      </div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>班级</th>
            <th>加入时间</th>
            <th>提交作业</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student._id">
            <td>
              <div class="student-info">
                <div class="student-avatar">{{ student.name?.charAt(0) || '学' }}</div>
                <span class="student-name">{{ student.name || '未知' }}</span>
              </div>
            </td>
            <td>{{ student.className || '-' }}</td>
            <td>{{ formatDate(student.createTime) }}</td>
            <td>
              <span class="badge badge-primary">{{ student.submitCount || 0 }} 次</span>
            </td>
            <td>
              <button class="btn-link">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getStudents } from '../utils/api'

const loading = ref(false)
const students = ref([])

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getStudents()
    if (res.code === 0) {
      students.value = res.data || []
    }
  } catch (err) {
    console.error('获取学生列表失败:', err)
    students.value = [
      { _id: '1', name: '张小明', className: '三年级一班', createTime: '2024-01-15', submitCount: 12 },
      { _id: '2', name: '李小红', className: '三年级一班', createTime: '2024-01-15', submitCount: 15 },
      { _id: '3', name: '王大力', className: '三年级二班', createTime: '2024-01-18', submitCount: 10 },
      { _id: '4', name: '陈小花', className: '三年级二班', createTime: '2024-01-18', submitCount: 14 },
      { _id: '5', name: '刘小华', className: '四年级一班', createTime: '2024-02-01', submitCount: 8 }
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
.students-page {
  max-width: 1100px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-avatar {
  width: 36px;
  height: 36px;
  background: var(--theme-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-accent);
}

.student-name {
  font-weight: 500;
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
