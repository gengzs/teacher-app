<template>
  <div class="note-detail-page">
    <!-- 头部 -->
    <div class="page-header">
      <button class="back-btn" @click="$router.push('/notes')">
        ← 返回
      </button>
      <div class="header-actions">
        <button v-if="!editing" class="btn-edit" @click="startEdit">
          编辑
        </button>
        <template v-else>
          <button class="btn-cancel" @click="cancelEdit">取消</button>
          <button class="btn-save" @click="saveNote" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </template>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- 笔记内容 -->
    <div v-else-if="note" class="note-container">
      <!-- 标题 -->
      <div class="title-section">
        <input
          v-if="editing"
          v-model="editForm.title"
          class="title-input"
          placeholder="笔记标题"
        />
        <h1 v-else class="note-title">{{ note.title }}</h1>
      </div>

      <!-- 标签 -->
      <div class="tags-section">
        <input
          v-if="editing"
          v-model="editForm.tagsInput"
          class="tags-input"
          placeholder="标签（用逗号分隔，如：高考,真题,阅读）"
        />
        <div v-else-if="note.tags?.length" class="tags-list">
          <span v-for="tag in note.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-section">
        <!-- 编辑模式 -->
        <div v-if="editing" class="editor-wrapper">
          <div class="editor-hint">
            💡 使用 <code>[[笔记名称]]</code> 插入双链
          </div>
          <textarea
            ref="editorRef"
            v-model="editForm.content"
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

        <!-- 阅读模式 -->
        <div v-else class="content-view">
          <div class="rendered-content" v-html="renderedContent"></div>
        </div>
      </div>

      <!-- 反向链接 -->
      <div v-if="!editing && note.backlinks?.length" class="backlinks-section">
        <h3 class="section-title">🔗 哪些笔记引用了这篇</h3>
        <div class="backlinks-list">
          <div
            v-for="bl in note.backlinks"
            :key="bl._id"
            class="backlink-item"
            @click="$router.push(`/notes/${bl._id}`)"
          >
            <span class="backlink-icon">←</span>
            <span class="backlink-title">{{ bl.title }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 笔记不存在 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <div class="empty-text">笔记不存在</div>
      <button class="btn-primary" @click="$router.push('/notes')">
        返回笔记列表
      </button>
    </div>

    <!-- 创建笔记弹窗（编辑模式下） -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <h3 class="modal-title">创建新笔记</h3>
        <p class="modal-hint">将创建「{{ pendingLink }}」，后续可在笔记中添加内容</p>
        <input
          v-model="newNoteTitle"
          class="new-note-input"
          placeholder="笔记标题"
          @keydown.enter="createAndInsert"
        />
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateModal = false">取消</button>
          <button class="btn-create" @click="createAndInsert" :disabled="creating">
            {{ creating ? '创建中...' : '创建并插入链接' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNote, createNote, updateNote } from '../utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const editing = ref(false)
const note = ref(null)
const editorRef = ref(null)

// 编辑表单
const editForm = ref({
  title: '',
  content: '',
  tagsInput: ''
})

// 创建笔记弹窗
const showCreateModal = ref(false)
const pendingLink = ref('')
const newNoteTitle = ref('')
const creating = ref(false)

// 原始数据（用于取消编辑）
const originalForm = ref(null)

// 渲染内容（将 Markdown 和双链转为 HTML）
const renderedContent = computed(() => {
  if (!note.value?.content) return ''
  let html = note.value.content

  // 1. 双链替换（放在最后，优先级最高）
  html = html.replace(/\[\[([^\]]+)\]\]/g, (match, title) => {
    return `<a class="wiki-link" data-note-title="${title}" href="javascript:void(0)">${title}</a>`
  })

  // 2. 标题
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // 3. 粗体和斜体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // 4. 代码块
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  html = html.replace(/`(.+?)`/g, '<code>$1</code>')

  // 5. 列表
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

  // 6. 换行
  html = html.replace(/\n/g, '<br>')

  return html
})

async function fetchNote() {
  loading.value = true
  try {
    const res = await getNote(route.params.id)
    if (res.code === 0) {
      note.value = res.data
    }
  } catch (err) {
    console.error('获取笔记失败:', err)
  } finally {
    loading.value = false
  }
}

function startEdit() {
  originalForm.value = {
    title: note.value.title,
    content: note.value.content,
    tagsInput: (note.value.tags || []).join(', ')
  }
  editForm.value = { ...originalForm.value }
  editing.value = true
  nextTick(() => {
    setupWikiLinkHandlers()
  })
}

function cancelEdit() {
  if (originalForm.value) {
    editForm.value = { ...originalForm.value }
  }
  editing.value = false
}

async function saveNote() {
  if (!editForm.value.title.trim()) {
    alert('请输入笔记标题')
    return
  }

  saving.value = true
  try {
    const tags = editForm.value.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const res = await updateNote(route.params.id, {
      title: editForm.value.title,
      content: editForm.value.content,
      tags
    })
    if (res && res.code !== 0) {
      const msg = res.error || res.message || '未知错误'
      alert('保存失败：' + msg)
      return
    }

    editing.value = false
    await fetchNote()
  } catch (err) {
    console.error('保存失败:', err)
    const detail =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      '请检查后端是否已启动（端口 3010）、.env 是否配置正确'
    alert('保存失败：' + detail)
  } finally {
    saving.value = false
  }
}

// Tab 键支持（插入空格）
function handleTab(e) {
  const textarea = editorRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  editForm.value.content =
    editForm.value.content.substring(0, start) +
    '  ' +
    editForm.value.content.substring(end)

  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 2
  })
}

// 设置双链点击处理
function setupWikiLinkHandlers() {
  document.querySelectorAll('.wiki-link').forEach(link => {
    link.addEventListener('click', handleWikiLinkClick)
  })
}

function handleWikiLinkClick(e) {
  const title = e.target.dataset.noteTitle
  if (!title) return

  const targetNote = note.value?.title === title
    ? note.value
    : null

  if (targetNote) {
    router.push(`/notes/${targetNote._id}`)
  } else {
    // 笔记不存在，弹出创建
    pendingLink.value = title
    newNoteTitle.value = title
    showCreateModal.value = true
  }
}

async function createAndInsert() {
  if (!newNoteTitle.value.trim()) {
    alert('请输入笔记标题')
    return
  }

  creating.value = true
  try {
    const res = await createNote({
      title: newNoteTitle.value.trim(),
      content: ''
    })

    if (res.code === 0) {
      // 把链接插入到当前光标位置
      const linkText = `[[${newNoteTitle.value.trim()}]]`
      const textarea = editorRef.value
      if (textarea) {
        const pos = textarea.selectionStart
        editForm.value.content =
          editForm.value.content.substring(0, pos) +
          linkText +
          editForm.value.content.substring(pos)
      } else {
        editForm.value.content += '\n' + linkText
      }

      showCreateModal.value = false
      pendingLink.value = ''
      newNoteTitle.value = ''
    }
  } catch (err) {
    console.error('创建笔记失败:', err)
    alert('创建失败，请重试')
  } finally {
    creating.value = false
  }
}

// 暴露方法给外部调用（渲染内容中的链接）
onMounted(() => {
  fetchNote().then(() => {
    nextTick(() => setupWikiLinkHandlers())
  })
})
</script>

<style scoped>
.note-detail-page {
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

.btn-edit,
.btn-save,
.btn-cancel {
  padding: 8px 20px;
  border-radius: var(--border-radius);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  border: 1px solid var(--theme-accent);
  background: var(--theme-light);
  color: var(--theme-accent);
}

.btn-cancel {
  border: 1px solid #e8e8e8;
  background: #fff;
  color: #666;
}

.btn-save {
  border: none;
  background: var(--theme-gradient);
  color: var(--theme-accent);
  font-weight: 600;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 笔记容器 */
.note-container {
  background: #fff;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 32px 40px;
}

/* 标题 */
.title-section {
  margin-bottom: 16px;
}

.note-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
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

/* 标签 */
.tags-section {
  margin-bottom: 24px;
}

.tags-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 6px 14px;
  background: var(--theme-light);
  color: var(--theme-accent);
  border-radius: 16px;
  font-size: 13px;
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

/* 内容区域 */
.content-section {
  margin-bottom: 32px;
}

.editor-wrapper {
  border: 1px solid #e8e8e8;
  border-radius: var(--border-radius);
  overflow: hidden;
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
  min-height: 500px;
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

/* 渲染内容 */
.content-view {
  font-size: 16px;
  line-height: 1.9;
  color: #333;
}

.content-view :deep(h1) {
  font-size: 24px;
  margin: 24px 0 12px;
  color: #222;
}

.content-view :deep(h2) {
  font-size: 20px;
  margin: 20px 0 10px;
  color: #222;
}

.content-view :deep(h3) {
  font-size: 18px;
  margin: 16px 0 8px;
  color: #222;
}

.content-view :deep(strong) {
  font-weight: 700;
}

.content-view :deep(em) {
  font-style: italic;
  color: #555;
}

.content-view :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.content-view :deep(pre) {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

.content-view :deep(pre code) {
  background: none;
  padding: 0;
}

.content-view :deep(ul) {
  padding-left: 24px;
  margin: 12px 0;
}

.content-view :deep(li) {
  margin: 6px 0;
}

.content-view :deep(.wiki-link) {
  color: var(--theme-accent);
  text-decoration: none;
  border-bottom: 1px dashed var(--theme-accent);
  cursor: pointer;
  transition: all 0.2s;
}

.content-view :deep(.wiki-link:hover) {
  background: var(--theme-light);
  border-bottom-style: solid;
}

/* 反向链接 */
.backlinks-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #666;
  margin-bottom: 16px;
}

.backlinks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backlink-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.backlink-item:hover {
  background: var(--theme-light);
}

.backlink-icon {
  color: var(--theme-accent);
  font-size: 16px;
}

.backlink-title {
  font-size: 14px;
  color: #333;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 24px;
}

/* 加载 */
.loading {
  display: flex;
  justify-content: center;
  padding: 64px;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: var(--border-radius);
  padding: 24px;
  width: 400px;
  max-width: 90vw;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.modal-hint {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.new-note-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e8e8e8;
  border-radius: var(--border-radius);
  font-size: 15px;
  margin-bottom: 20px;
}

.new-note-input:focus {
  outline: none;
  border-color: var(--theme-accent);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-create {
  padding: 10px 20px;
  border: none;
  background: var(--theme-gradient);
  color: var(--theme-accent);
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .note-container {
    padding: 20px;
  }

  .note-title {
    font-size: 22px;
  }

  .content-editor {
    min-height: 300px;
  }
}
</style>
