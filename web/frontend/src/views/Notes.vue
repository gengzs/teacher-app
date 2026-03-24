<template>
  <div class="notes-page">
    <!-- 头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">📝 笔记库</h1>
        <p class="page-desc">存放历年真题、阅读材料，随时查阅</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="$router.push('/notes/new')">
          + 新建笔记
        </button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="搜索笔记标题或内容..."
        @input="handleSearch"
      />
      <div class="sort-tabs">
        <button
          :class="['sort-tab', { active: sort === 'update' }]"
          @click="changeSort('update')"
        >
          最近更新
        </button>
        <button
          :class="['sort-tab', { active: sort === 'create' }]"
          @click="changeSort('create')"
        >
          最新创建
        </button>
      </div>
    </div>

    <!-- 笔记列表 -->
    <div class="notes-list" v-if="!loading">
      <div
        v-for="note in filteredNotes"
        :key="note._id"
        class="note-card"
        @click="$router.push(`/notes/${note._id}`)"
      >
        <div class="note-header">
          <h3 class="note-title">{{ note.title }}</h3>
          <button
            class="delete-btn"
            @click.stop="confirmDelete(note)"
            title="删除"
          >
            ×
          </button>
        </div>
        <p class="note-preview">{{ getPreview(note.content) }}</p>
        <div class="note-footer">
          <div class="note-tags">
            <span
              v-for="tag in note.tags"
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
          <div class="note-meta">
            <span v-if="note.links?.length" class="link-count">
              🔗 {{ note.links.length }}
            </span>
            <span class="note-date">{{ formatDate(note.updateTime) }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredNotes.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-text">{{ searchQuery ? '没有找到匹配的笔记' : '还没有笔记，点击上方"新建笔记"开始' }}</div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-else class="loading">
      <div class="spinner"></div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal">
        <h3 class="modal-title">确认删除</h3>
        <p class="modal-text">确定要删除笔记「{{ deleteTarget.title }}」吗？此操作不可恢复。</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="deleteTarget = null">取消</button>
          <button class="btn-danger" @click="handleDelete" :disabled="deleting">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getNotes, deleteNote, searchNotes } from '../utils/api'

const notes = ref([])
const loading = ref(false)
const searchQuery = ref('')
const sort = ref('update')
const deleteTarget = ref(null)
const deleting = ref(false)

const filteredNotes = computed(() => {
  if (!searchQuery.value.trim()) return notes.value
  const q = searchQuery.value.toLowerCase()
  return notes.value.filter(n =>
    n.title?.toLowerCase().includes(q) ||
    n.content?.toLowerCase().includes(q)
  )
})

function getPreview(content) {
  if (!content) return '（空笔记）'
  const text = content.replace(/\[\[([^\]]+)\]\]/g, '[[$1]]').replace(/[#*`]/g, '')
  return text.length > 100 ? text.slice(0, 100) + '...' : text
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

async function fetchNotes() {
  loading.value = true
  try {
    const res = await getNotes(sort.value)
    if (res.code === 0) {
      notes.value = res.data || []
    }
  } catch (err) {
    console.error('获取笔记失败:', err)
    notes.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  // 前端过滤，实时响应
}

function changeSort(newSort) {
  sort.value = newSort
  fetchNotes()
}

function confirmDelete(note) {
  deleteTarget.value = note
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteNote(deleteTarget.value._id)
    notes.value = notes.value.filter(n => n._id !== deleteTarget.value._id)
    deleteTarget.value = null
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败，请重试')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchNotes()
})
</script>

<style scoped>
.notes-page {
  width: 100%;
  max-width: 1100px;
}

/* 头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.page-desc {
  font-size: 14px;
  color: #999;
}

.btn-primary {
  background: var(--theme-gradient);
  color: var(--theme-accent);
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e8e8e8;
  border-radius: var(--border-radius);
  font-size: 15px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--theme-accent);
}

.sort-tabs {
  display: flex;
  gap: 8px;
}

.sort-tab {
  padding: 10px 16px;
  border: 1px solid #e8e8e8;
  background: #fff;
  border-radius: var(--border-radius);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-tab.active {
  background: var(--theme-light);
  border-color: var(--theme-accent);
  color: var(--theme-accent);
}

/* 笔记卡片 */
.notes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-card {
  background: #fff;
  border-radius: var(--border-radius);
  padding: 20px 24px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.2s;
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.note-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.delete-btn:hover {
  background: #fee;
  color: #e74c3c;
}

.note-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 10px;
  background: var(--theme-light);
  color: var(--theme-accent);
  border-radius: 12px;
  font-size: 12px;
}

.note-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #999;
}

.link-count {
  color: #666;
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
  font-size: 15px;
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
  margin-bottom: 12px;
}

.modal-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 10px 20px;
  border: 1px solid #e8e8e8;
  background: #fff;
  border-radius: var(--border-radius);
  font-size: 14px;
  cursor: pointer;
}

.btn-danger {
  padding: 10px 20px;
  border: none;
  background: #e74c3c;
  color: #fff;
  border-radius: var(--border-radius);
  font-size: 14px;
  cursor: pointer;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-tabs {
    justify-content: center;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
