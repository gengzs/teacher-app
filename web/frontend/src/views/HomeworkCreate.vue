<template>
  <div class="homework-create-page">
    <div class="page-header">
      <button class="btn btn-outline" @click="$router.back()">← 返回</button>
      <h2 class="page-title">布置作业</h2>
    </div>

    <div class="form-card card">
      <div class="form-group">
        <label class="form-label">作业名称</label>
        <input 
          type="text" 
          v-model="form.title"
          class="form-input"
          placeholder="如：Unit 3 单词跟读"
        />
      </div>

      <div class="form-group">
        <label class="form-label">选择班级</label>
        <select v-model="form.classId" class="form-select">
          <option value="">请选择班级</option>
          <option v-for="c in classes" :key="c._id" :value="c._id">
            {{ c.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">截止日期</label>
        <input 
          type="date" 
          v-model="form.deadline"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label class="form-label">作业描述</label>
        <textarea 
          v-model="form.description"
          class="form-textarea"
          placeholder="请输入作业要求..."
          rows="4"
        ></textarea>
      </div>

      <div class="form-actions">
        <button class="btn btn-outline" @click="$router.back()">取消</button>
        <button class="btn btn-primary" @click="submitHomework">发布作业</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getClasses } from '../utils/api'

const router = useRouter()
const classes = ref([])
const form = ref({
  title: '',
  classId: '',
  deadline: '',
  description: ''
})

async function submitHomework() {
  if (!form.value.title) {
    alert('请输入作业名称')
    return
  }
  if (!form.value.classId) {
    alert('请选择班级')
    return
  }
  console.log('提交作业:', form.value)
  router.push('/homework')
}

onMounted(async () => {
  try {
    const res = await getClasses()
    if (res.code === 0) {
      classes.value = res.data || []
    }
  } catch (err) {
    classes.value = [
      { _id: '1', name: '三年级一班' },
      { _id: '2', name: '三年级二班' },
      { _id: '3', name: '四年级一班' }
    ]
  }
})
</script>

<style scoped>
.homework-create-page {
  max-width: 700px;
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

.form-card {
  padding: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius-sm);
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--theme-accent);
}

.form-textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}
</style>
