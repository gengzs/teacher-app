<template>
  <div class="students-page">
    <div class="page-header">
      <button class="btn btn-outline" @click="$router.back()">← 返回</button>
      <h2 class="page-title">{{ className ? className + ' - ' : '' }}学生管理</h2>
      <button class="btn btn-primary" @click="showAddModal = true">
        <span>+ 添加学生</span>
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>
      <div v-else-if="students.length === 0" class="empty-state">
        <div class="empty-icon">👨‍🎓</div>
        <div class="empty-text">暂无学生</div>
        <div class="empty-hint">点击右上角「添加学生」开始</div>
      </div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>年级</th>
            <th>加入方式</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="student in students"
            :key="student._id"
            class="clickable-row"
            @click="goToDetail(student)"
          >
            <td>
              <div class="student-info">
                <div class="student-avatar">{{ student.name?.charAt(0) || '学' }}</div>
                <span class="student-name">{{ student.name || '未知' }}</span>
              </div>
            </td>
            <td>{{ student.grade || '-' }}</td>
            <td>
              <span class="tag" :class="student.joinSource === 'manual' ? 'tag-blue' : 'tag-green'">
                {{ student.joinSource === 'manual' ? '手动添加' : '邀请加入' }}
              </span>
            </td>
            <td>
              <span class="tag" :class="student.status === 'active' ? 'tag-green' : 'tag-gray'">
                {{ student.status === 'active' ? '在班' : '已离班' }}
              </span>
            </td>
            <td>
              <button
                type="button"
                class="btn-link"
                v-if="student.status === 'active'"
                @click.stop="removeStudent(student)"
              >移除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="total-hint" v-if="students.length > 0">共 {{ students.length }} 名学生</p>

    <!-- 添加学生弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>添加学生</h3>
          <button class="modal-close" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">学生姓名 *</label>
            <input
              type="text"
              v-model="newStudent.name"
              class="form-input"
              placeholder="请输入学生姓名"
              @keyup.enter="addStudent"
            />
          </div>
          <div class="form-group">
            <label class="form-label">手机号（选填）</label>
            <input
              type="tel"
              v-model="newStudent.phone"
              class="form-input"
              placeholder="用于绑定微信账号"
            />
          </div>
          <div class="tips-box">
            <span class="tips-icon">💡</span>
            <span class="tips-text">添加成功后系统将生成临时账号密码，可发送给家长绑定微信</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="addStudent" :disabled="addLoading || !newStudent.name.trim()">
            {{ addLoading ? '添加中...' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 添加成功结果弹窗 -->
    <div v-if="addSuccess" class="modal-overlay" @click.self="closeSuccessModal">
      <div class="modal result-modal">
        <div class="result-header">
          <div class="result-check">✓</div>
          <h3 class="result-title">添加成功</h3>
        </div>
        <div class="result-body">
          <div class="result-info">
            <div class="info-row">
              <span class="info-label">学生姓名</span>
              <span class="info-value">{{ addSuccessData.name }}</span>
            </div>
            <div class="info-row" v-if="addSuccessData.phone">
              <span class="info-label">手机号码</span>
              <span class="info-value">{{ addSuccessData.phone }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">初始密码</span>
              <span class="info-value highlight">{{ addSuccessData.tempPassword }}</span>
            </div>
          </div>
          <div class="warning-box">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">请将此账号信息发给家长或学生</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="copyAndClose">复制信息</button>
          <button class="btn btn-primary" @click="closeSuccessModal">完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const students = ref([])
const showAddModal = ref(false)
const addLoading = ref(false)
const addSuccess = ref(false)
const addSuccessData = ref({})
const newStudent = ref({ name: '', phone: '' })

const classId = computed(() => route.query.classId || '')
const className = computed(() => route.query.className || '')

async function fetchClassDetail() {
  loading.value = true
  try {
    if (classId.value) {
      const res = await axios.get(`/api/classes/${classId.value}`)
      if (res.data.code === 0 && res.data.data) {
        students.value = res.data.data.students || []
      }
    } else {
      const res = await axios.get('/api/students')
      if (res.data.code === 0) {
        students.value = res.data.data || []
      }
    }
  } catch (err) {
    console.error('获取学生列表失败:', err)
  } finally {
    loading.value = false
  }
}

async function addStudent() {
  if (!newStudent.value.name.trim()) return

  addLoading.value = true
  try {
    const res = await axios.post('/api/call-function', {
      name: 'class',
      data: {
        action: 'addStudentManual',
        classId: classId.value,
        name: newStudent.value.name.trim(),
        phone: newStudent.value.phone.trim()
      }
    })

    if (res.data.code === 0 && res.data.data) {
      addSuccessData.value = res.data.data
      showAddModal.value = false
      addSuccess.value = true
      newStudent.value = { name: '', phone: '' }
      await fetchClassDetail()
    } else {
      alert(res.data.error || '添加失败')
    }
  } catch (err) {
    console.error('添加学生失败:', err)
    alert('添加失败，请重试')
  } finally {
    addLoading.value = false
  }
}

function removeStudent(student) {
  if (!confirm(`确定要将「${student.name}」从班级移除吗？`)) return

  axios.post('/api/call-function', {
    name: 'class',
    data: {
      action: 'removeStudent',
      classId: classId.value,
      studentId: student._id
    }
  }).then(res => {
    if (res.data.code === 0) {
      alert('已移除')
      fetchClassDetail()
    } else {
      alert(res.data.error || '移除失败')
    }
  }).catch(err => {
    alert('移除失败')
  })
}

function goToDetail(student) {
  if (!student?._id) return
  const q = new URLSearchParams()
  if (student.name) q.set('name', student.name)
  const cid = student.classId || classId.value
  const cnm = student.className || className.value
  if (cid) q.set('classId', cid)
  if (cnm) q.set('className', cnm)
  const qs = q.toString()
  router.push(`/student/${student._id}${qs ? '?' + qs : ''}`)
}

function copyAndClose() {
  const text = `姓名：${addSuccessData.value.name}\n手机：${addSuccessData.value.phone || '未填写'}\n初始密码：${addSuccessData.value.tempPassword}`
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板')
    closeSuccessModal()
  })
}

function closeSuccessModal() {
  addSuccess.value = false
  addSuccessData.value = {}
}

onMounted(() => {
  fetchClassDetail()
})
</script>

<style scoped>
.students-page {
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
  flex: 1;
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

.total-hint {
  margin-top: 16px;
  font-size: 14px;
  color: #999;
}

/* 标签 */
.tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.tag-green {
  background: #E8F5E6;
  color: #4CAF50;
}

.tag-blue {
  background: #E3F2FD;
  color: #2196F3;
}

.tag-gray {
  background: #f5f5f5;
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
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--theme-accent);
}

.tips-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: #FFF9E6;
  border-radius: 8px;
  margin-top: 8px;
}

.tips-icon {
  font-size: 16px;
}

.tips-text {
  font-size: 13px;
  color: #8B6914;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

/* 结果弹窗 */
.result-modal {
  text-align: center;
}

.result-header {
  padding: 32px 24px 16px;
}

.result-check {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  border-radius: 50%;
  color: #fff;
  font-size: 32px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.result-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.result-body {
  padding: 0 24px 24px;
}

.result-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.info-value.highlight {
  color: var(--theme-accent);
  font-weight: 700;
  font-size: 16px;
}

.warning-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #FFF0F0;
  border-radius: 8px;
}

.warning-icon {
  font-size: 14px;
}

.warning-text {
  font-size: 13px;
  color: #E53935;
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

/* 可点击行 */
.clickable-row {
  cursor: pointer;
  transition: background 0.2s;
}

.clickable-row:hover {
  background: #f8f9fa;
}
</style>
