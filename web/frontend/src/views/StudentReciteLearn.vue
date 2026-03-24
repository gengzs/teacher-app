<template>
  <div class="learn-page">

    <!-- 顶部 -->
    <div class="page-header">
      <button type="button" class="btn btn-outline" @click="goBack">← 返回</button>
      <div class="header-text">
        <h2 class="page-title">{{ studentDisplayName }}</h2>
        <p class="page-sub">第 {{ currentGroupIndex + 1 }} / {{ totalGroups }} 组 · 共 {{ totalCount }} 词</p>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
    </div>

    <!-- 当前组：每个单词独立卡片 -->
    <div class="group-list">
      <article
        v-for="(item, idx) in currentGroup"
        :key="item._id"
        class="word-card"
        :class="{ revealed: item.showMeaning }"
      >
        <button
          type="button"
          class="note-btn"
          :class="{ 'has-note': !!item.note }"
          @click.stop="openNote(idx)"
          :title="item.note ? '查看笔记' : '添加笔记'"
        >
          {{ item.note ? '📝' : '✏️' }}
        </button>
        <div class="word-card-center">
          <div class="word-row" @click="onWordTap(idx)">
            <span class="word-text">{{ item.word }}</span>
            <span class="word-phonetic" v-if="item.phonetic">{{ item.phonetic }}</span>
          </div>
          <div class="word-reveal" v-if="item.showMeaning">
            <span class="word-translation">{{ item.translation || '（无释义）' }}</span>
            <span class="word-note" v-if="item.note">📝 {{ item.note }}</span>
          </div>
        </div>
      </article>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-bar">
      <button
        type="button"
        class="nav-btn"
        :class="{ disabled: currentGroupIndex === 0 }"
        @click="prevGroup"
      >‹ 上一组</button>

      <div class="nav-dots">
        <span
          class="dot"
          :class="{ active: i === currentGroupIndex }"
          v-for="i in totalGroups"
          :key="i"
        ></span>
      </div>

      <button
        type="button"
        class="nav-btn primary"
        :class="{ finish: currentGroupIndex === totalGroups - 1 }"
        @click="nextGroup"
      >{{ currentGroupIndex === totalGroups - 1 ? '完成学习 ›' : '下一组 ›' }}</button>
    </div>

    <!-- 笔记弹窗 -->
    <div v-if="noteModal.show" class="note-overlay" @click.self="closeNote"></div>
    <div v-if="noteModal.show" class="note-modal">
      <div class="note-modal-header">
        <h3>📝 为「{{ noteModal.word }}」添加笔记</h3>
        <button type="button" class="modal-close" @click="closeNote">✕</button>
      </div>
      <div class="note-modal-body">
        <textarea
          class="note-textarea"
          v-model="noteModal.content"
          placeholder="记录记忆技巧、例句、联想等..."
          maxlength="200"
          rows="5"
        ></textarea>
        <span class="note-char-count">{{ noteModal.content.length }} / 200</span>
      </div>
      <div class="note-modal-footer">
        <button type="button" class="btn btn-outline" @click="closeNote">取消</button>
        <button type="button" class="btn btn-primary" @click="saveNote">保存笔记</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const GROUP_SIZE = 5

const totalCount = ref(0)
const totalGroups = ref(0)
const currentGroupIndex = ref(0)
const currentGroup = ref([])
const _allWords = ref([])

const noteModal = ref({ show: false, idx: -1, word: '', content: '' })

const setName = computed(() => route.query.setName ? decodeURIComponent(String(route.query.setName)) : '词库')
const studentId = computed(() => route.query.studentId || '')
const studentDisplayName = computed(() => {
  const n = route.query.studentName
  return n ? decodeURIComponent(String(n)) : '学生'
})
const totalCountRaw = computed(() => parseInt(route.query.totalCount || '0', 10))
const progressPct = computed(() => {
  if (!totalGroups.value) return 0
  return Math.round(((currentGroupIndex.value + 1) / totalGroups.value) * 100)
})

function _renderGroup(groupIndex) {
  const start = groupIndex * GROUP_SIZE
  const words = _allWords.value.slice(start, start + GROUP_SIZE)
  currentGroup.value = words.map(w => ({
    ...w,
    heardOnce: false,
    showMeaning: false
  }))
  currentGroupIndex.value = groupIndex
}

function _playAudio(word) {
  if (!word) return
  const audio = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`)
  audio.play()
  audio.onerror = () => audio.remove()
  audio.onended = () => audio.remove()
}

function onWordTap(idx) {
  const item = currentGroup.value[idx]
  if (!item) return
  if (item.showMeaning) {
    currentGroup.value[idx].showMeaning = false
    return
  }
  if (!item.heardOnce) {
    currentGroup.value[idx].heardOnce = true
    _playAudio(item.word)
    return
  }
  currentGroup.value[idx].showMeaning = true
}

function openNote(idx) {
  const item = currentGroup.value[idx]
  noteModal.value = {
    show: true,
    idx,
    word: item.word,
    content: item.note || ''
  }
}

function closeNote() {
  noteModal.value.show = false
}

async function saveNote() {
  const { idx, content } = noteModal.value
  if (idx < 0) return
  const item = currentGroup.value[idx]
  currentGroup.value[idx].note = content
  const globalIdx = currentGroupIndex.value * GROUP_SIZE + idx
  _allWords.value[globalIdx].note = content
  try { sessionStorage.setItem('teacher_unknown_words', JSON.stringify(_allWords.value)) } catch {}
  noteModal.value.show = false

  // 持久化到云数据库（按学生+单词ID隔离）
  if (studentId.value && item._id) {
    try {
      await axios.post('/api/word-notes', {
        studentId: studentId.value,
        wordId: item._id,
        word: item.word || '',
        note: content
      }, { validateStatus: (s) => s < 500 })
    } catch {}
  }
}

function prevGroup() {
  if (currentGroupIndex.value <= 0) return
  _renderGroup(currentGroupIndex.value - 1)
}

function nextGroup() {
  if (currentGroupIndex.value < totalGroups.value - 1) {
    _renderGroup(currentGroupIndex.value + 1)
    return
  }
  const q = new URLSearchParams({
    setId: route.query.setId || '',
    setName: route.query.setName || '',
    totalCount: route.query.totalCount || '0',
    studentId: studentId.value,
    studentName: route.query.studentName || '',
    mode: route.query.mode || 'recite',
    classId: route.query.classId || '',
    className: route.query.className || ''
  }).toString()
  router.push(`/recite/test?${q}`)
}

function goBack() {
  router.back()
}

onMounted(async () => {
  let words = []
  try {
    const raw = sessionStorage.getItem('teacher_unknown_words')
    if (raw) words = JSON.parse(raw)
  } catch {}
  if (!words.length) {
    totalCount.value = 0
    totalGroups.value = 0
    return
  }

  // 从云端加载该学生的已有笔记，合并到单词列表
  if (studentId.value) {
    try {
      const res = await axios.get(`/api/word-notes?studentId=${encodeURIComponent(studentId.value)}`, {
        validateStatus: (s) => s < 500
      })
      if (res.data?.code === 0 && Array.isArray(res.data?.data)) {
        const noteMap = {}
        for (const n of res.data.data) {
          if (n.wordId) noteMap[n.wordId] = n.note || ''
        }
        words = words.map(w => ({ ...w, note: noteMap[w._id] || w.note || '' }))
      }
    } catch {}
  }

  totalCount.value = words.length
  totalGroups.value = Math.ceil(words.length / GROUP_SIZE)
  _allWords.value = words
  _renderGroup(0)
})
</script>

<style scoped>
.learn-page {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding-bottom: 8px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.page-sub {
  margin: 0;
  font-size: 13px;
  color: #888;
}

.progress-track {
  height: 5px;
  background: #e5e5e5;
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-accent), #7c9cff);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 每组内：多张小卡片 */
.group-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 120px;
}

.word-card {
  position: relative;
  background: #fff;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 14px rgba(180, 120, 140, 0.1);
  border: 1px solid #f0e8eb;
  padding: 22px 20px 18px;
  transition: background 0.2s, border-color 0.2s;
}

.word-card.revealed {
  background: var(--theme-light);
  border-color: var(--theme-accent);
}

.word-card-center {
  padding: 0 36px 0 4px;
}

.word-row {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-height: 56px;
  justify-content: center;
}

.word-text {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.02em;
  line-height: 1.1;
}

.word-phonetic {
  display: block;
  font-size: 15px;
  color: var(--theme-accent);
}

.word-reveal {
  margin-top: 16px;
  padding: 12px 14px 14px;
  background: var(--theme-light);
  border-radius: 12px;
  border: 1px solid var(--theme-accent);
  text-align: center;
}

.word-translation {
  display: block;
  font-size: 18px;
  color: #1a1a2e;
  line-height: 1.55;
  font-weight: 500;
}

.word-note {
  display: block;
  font-size: 13px;
  color: #888;
  margin-top: 8px;
  font-style: italic;
}

.note-btn {
  position: absolute;
  top: 10px;
  right: 8px;
  z-index: 1;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 17px;
  opacity: 0.4;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}

.note-btn:hover,
.note-btn.has-note {
  opacity: 1;
}

/* 底部导航 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.07);
  max-width: calc(1100px + 2 * 32px);
  margin: 0 auto;
}

.nav-btn {
  background: none;
  border: none;
  font-size: 15px;
  color: var(--theme-accent);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.15s;
}

.nav-btn:hover {
  background: var(--theme-light);
}

.nav-btn.disabled {
  color: #ccc;
  cursor: not-allowed;
}

.nav-btn.disabled:hover {
  background: none;
}

.nav-btn.primary.finish {
  background: var(--theme-gradient);
  color: #fff;
}

.nav-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e0e0e0;
  transition: all 0.2s;
}

.dot.active {
  background: var(--theme-accent);
  width: 20px;
  border-radius: 4px;
}

/* 笔记弹窗 */
.note-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 900;
}

.note-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 16px 16px 0 0;
  z-index: 901;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
  max-width: 1100px;
  margin: 0 auto;
}

.note-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.note-modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 22px;
  color: #ccc;
  cursor: pointer;
  padding: 4px;
}

.note-textarea {
  width: 100%;
  padding: 12px;
  border: 1.5px solid #e5e5e5;
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s;
}

.note-textarea:focus {
  border-color: var(--theme-accent);
}

.note-char-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #aaa;
  margin-top: 6px;
}

.note-modal-footer {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.note-modal-footer .btn {
  flex: 1;
}
</style>
