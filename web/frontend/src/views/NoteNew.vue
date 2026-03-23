<template>
  <div class="note-new-page">
    <!-- 头部 -->
    <div class="page-header">
      <button class="back-btn" @click="$router.push('/notes')">
        ← 返回
      </button>
      <div class="header-actions">
        <button class="btn-save" @click="createNote" :disabled="saving">
          {{ saving ? '创建中...' : '创建' }}
        </button>
      </div>
    </div>

    <!-- 创建表单 -->
    <div class="form-container">
      <div class="form-group">
        <input
          v-model="form.title"
          class="title-input"
          placeholder="笔记标题"
          @keydown.enter="createNote"
          autofocus
        />
      </div>

      <div class="form-group">
        <input
          v-model="form.tagsInput"
          class="tags-input"
          placeholder="标签（用逗号分隔，如：高考,真题,阅读）"
        />
      </div>

      <div class="form-group editor-wrapper">
        <div class="editor-hint">
          💡 使用 <code>[[笔记名称]]</code> 插入双链
        </div>
        <textarea
          ref="editorRef"
          v-model="form.content"
          class="content-editor"
          placeholder="在这里写笔记内容...

支持的格式：
• **粗体** *斜体*
• # 标题
• - 列表项
• [[另一篇笔记]] 双向链接"
          @keydown.tab.prevent="handleTab"
        ></textarea>
      </div>

      <div class="form-hint">
        💡 按 Enter 或点击「创建」保存笔记
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createNote as apiCreateNote } from '../utils/api'

const router = useRouter()

const saving = ref(false)
const editorRef = ref(null)

const form = ref({
  title: '',
  content: '',
  tagsInput: ''
})

function handleTab(e) {
  const textarea = editorRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  form.value.content =
    form.value.content.substring(0, start) +
    '  ' +
    form.value.content.substring(end)

  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 2
  }, 0)
}

async function createNote() {
  if (!form.value.title.trim()) {
    alert('请输入笔记标题')
    return
  }

  saving.value = true
  try {
    const tags = form.value.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const res = await apiCreateNote({
      title: form.value.title.trim(),
      content: form.value.content,
      tags
    })

    if (res.code === 0) {
      router.replace(`/notes/${res.data._id}`)
    } else {
      alert(res.error || '创建失败')
    }
  } catch (err) {
    console.error('创建笔记失败:', err)
    alert('创建失败，请重试')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.note-new-page {
  max-width: 900px;
}

/* 头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.back-btn {
  padding: 8px 16px;
  border: 1px solid #e8e8e8;
  background: #fff;
  border-radius: var(--border-radius);
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  border-color: var(--theme-accent);
  color: var(--theme-accent);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-save {
  padding: 8px 24px;
  border: none;
  background: var(--theme-gradient);
  color: var(--theme-accent);
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 表单容器 */
.form-container {
  background: #fff;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 32px 40px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-of-type {
  margin-bottom: 0;
}

.title-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e8e8e8;
  border-radius: var(--border-radius);
  font-size: 24px;
  font-weight: 600;
  transition: border-color 0.2s;
}

.title-input:focus {
  outline: none;
  border-color: var(--theme-accent);
}

.tags-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e8e8e8;
  border-radius: var(--border-radius);
  font-size: 14px;
}

.tags-input:focus {
  outline: none;
  border-color: var(--theme-accent);
}

/* 编辑器 */
.editor-wrapper {
  border: 1px solid #e8e8e8;
  border-radius: var(--border-radius);
  overflow: hidden;
  margin-bottom: 20px;
}

.editor-hint {
  padding: 10px 16px;
  background: #f8f9fa;
  font-size: 13px;
  color: #666;
  border-bottom: 1px solid #e8e8e8;
}

.editor-hint code {
  background: #e8e8e8;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.content-editor {
  width: 100%;
  min-height: 400px;
  padding: 20px;
  border: none;
  font-size: 15px;
  line-height: 1.8;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  resize: vertical;
}

.content-editor:focus {
  outline: none;
}

.form-hint {
  text-align: center;
  font-size: 13px;
  color: #999;
  margin-top: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .form-container {
    padding: 20px;
  }

  .title-input {
    font-size: 20px;
  }

  .content-editor {
    min-height: 300px;
  }
}
</style>
