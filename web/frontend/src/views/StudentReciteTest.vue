<template>
  <div class="test-page">

    <!-- 顶部 -->
    <div class="page-header">
      <button type="button" class="btn btn-outline" @click="goBack">← 返回</button>
      <div class="header-text">
        <h2 class="page-title">{{ setName || '单词检测' }}</h2>
        <p class="page-sub">全部 {{ totalCount }} 个词</p>
      </div>
      <div class="header-right">
        <span class="marked-count">{{ markedCount }} / {{ totalCount }}</span>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
    </div>

    <!-- 单词列表 -->
    <div class="test-list">
      <div
        class="test-row"
        :class="{ 'row-right': item.testStatus === 'right', 'row-wrong': item.testStatus === 'wrong' }"
        v-for="(item, idx) in allWords"
        :key="item._id"
      >
        <div class="test-main">
          <span class="test-word">{{ item.word }}</span>
          <span class="test-status right" v-if="item.testStatus === 'right'">✓ 认识</span>
          <span class="test-status wrong" v-if="item.testStatus === 'wrong'">✗ 不认识</span>
        </div>
        <div class="test-actions">
          <button
            type="button"
            class="mark-btn right-btn"
            :class="{ active: item.testStatus === 'right' }"
            @click="markRight(idx)"
            title="认识"
          >✓</button>
          <button
            type="button"
            class="mark-btn wrong-btn"
            :class="{ active: item.testStatus === 'wrong' }"
            @click="markWrong(idx)"
            title="不认识"
          >✗</button>
        </div>
      </div>
    </div>

    <!-- 底部固定 -->
    <div class="bottom-bar">
      <div class="footer-stats">
        <span class="stat known">✓ 认识 {{ rightCount }}</span>
        <span class="stat unknown">✗ 不认识 {{ wrongCount }}</span>
      </div>
      <button
        type="button"
        class="btn btn-primary btn-block"
        :class="{ disabled: markedCount === 0 }"
        @click="onFinish"
      >{{ markedCount > 0 ? '查看检测结果' : '请先标记' }}</button>
    </div>

    <!-- 结果弹窗 -->
    <div v-if="showResult" class="result-overlay" @click.self="closeResult"></div>
    <div v-if="showResult" class="result-modal">
      <div class="result-modal-header">
        <span class="result-icon">🎉</span>
        <h3 class="result-title">检测完成</h3>
      </div>

      <div class="result-modal-body">
        <div class="accuracy-circle">
          <span class="accuracy-num">{{ accuracyPct }}%</span>
          <span class="accuracy-label">正确率</span>
        </div>

        <div class="result-cards">
          <div class="result-card right-card">
            <span class="rc-value">{{ rightCount }}</span>
            <span class="rc-label">✓ 认识</span>
          </div>
          <div class="result-card wrong-card">
            <span class="rc-value">{{ wrongCount }}</span>
            <span class="rc-label">✗ 不认识</span>
          </div>
        </div>

        <div class="result-actions">
          <button type="button" class="result-action-btn print-btn" @click="printNotes">
            <span class="action-icon">🖨️</span>
            <span class="action-text">打印笔记</span>
          </button>
          <button type="button" class="result-action-btn" @click="retry">
            <span class="action-icon">🔄</span>
            <span class="action-text">重新检测</span>
          </button>
          <button type="button" class="result-action-btn" @click="backToLearn">
            <span class="action-icon">📖</span>
            <span class="action-text">返回学习</span>
          </button>
        </div>
      </div>

      <div class="result-modal-footer">
        <button type="button" class="btn btn-primary btn-block" @click="finishAndBack">完成，返回课程</button>
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

const allWords = ref([])
const markedCount = ref(0)
const rightCount = ref(0)
const wrongCount = ref(0)
const accuracyPct = ref(0)
const progressPct = ref(0)
const showResult = ref(false)

const setName = computed(() => route.query.setName ? decodeURIComponent(String(route.query.setName)) : '词库')
const totalCount = computed(() => allWords.value.length)
const studentId = computed(() => route.query.studentId || '')
const studentDisplayName = computed(() => {
  const n = route.query.studentName
  return n ? decodeURIComponent(String(n)) : '学生'
})
const classId = computed(() => route.query.classId || '')
const className = computed(() => route.query.className || '')

function _recalc() {
  const words = allWords.value
  const marked = words.filter(w => w.testStatus !== 'none').length
  const right = words.filter(w => w.testStatus === 'right').length
  const wrong = words.filter(w => w.testStatus === 'wrong').length
  const acc = marked > 0 ? Math.round((right / marked) * 100) : 0
  const prog = words.length > 0 ? Math.round((marked / words.length) * 100) : 0
  markedCount.value = marked
  rightCount.value = right
  wrongCount.value = wrong
  accuracyPct.value = acc
  progressPct.value = prog
}

function markRight(idx) {
  const prev = allWords.value[idx].testStatus
  allWords.value[idx].testStatus = prev === 'right' ? 'none' : 'right'
  _recalc()
}

function markWrong(idx) {
  const prev = allWords.value[idx].testStatus
  allWords.value[idx].testStatus = prev === 'wrong' ? 'none' : 'wrong'
  _recalc()
}

function onFinish() {
  if (markedCount.value === 0) return
  showResult.value = true
}

function closeResult() {
  showResult.value = false
}

async function printNotes() {
  if (!studentId.value) {
    alert('无学生信息，无法获取笔记')
    return
  }
  try {
    const res = await axios.get(`/api/word-notes?studentId=${encodeURIComponent(studentId.value)}`, {
      validateStatus: (s) => s < 500
    })
    const notes = Array.isArray(res.data?.data) ? res.data.data : []
    const withNotes = notes.filter(n => n.note && n.note.trim())

    if (!withNotes.length) {
      alert('该学生暂无笔记')
      return
    }

    // 生成可打印的 HTML 供浏览器打印
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>单词笔记 - ${studentDisplayName.value}</title>
  <style>
    body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; padding: 32px; }
    h2 { border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 24px; }
    .note-item { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #eee; }
    .word { font-size: 20px; font-weight: 700; color: #1a1a2e; }
    .note { font-size: 15px; color: #444; margin-top: 6px; line-height: 1.6; white-space: pre-wrap; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h2>📝 单词笔记 - ${studentDisplayName.value}</h2>
  ${withNotes.map(n => `
  <div class="note-item">
    <div class="word">${n.word || ''}</div>
    <div class="note">${(n.note || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>`).join('')}
</body>
</html>`

    const win = window.open('', '_blank')
    if (!win) { alert('请允许弹出窗口以打印笔记'); return }
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.print(); win.close() }
  } catch (e) {
    alert('获取笔记失败')
  }
}

function retry() {
  allWords.value = allWords.value.map(w => ({ ...w, testStatus: 'none' }))
  showResult.value = false
  _recalc()
}

function backToLearn() {
  showResult.value = false
  router.back()
}

function finishAndBack() {
  showResult.value = false
  if (studentId.value) {
    const q = new URLSearchParams({
      id: studentId.value,
      name: studentDisplayName.value,
      classId: classId.value,
      className: className.value
    }).toString()
    router.push(`/student/${studentId.value}?${q}`)
    return
  }
  router.push('/')
}

function goBack() {
  if (studentId.value) {
    const q = new URLSearchParams({
      id: studentId.value,
      name: studentDisplayName.value,
      classId: classId.value,
      className: className.value
    }).toString()
    router.push(`/student/${studentId.value}?${q}`)
    return
  }
  router.push('/')
}

onMounted(() => {
  let words = []
  try {
    const raw = sessionStorage.getItem('teacher_unknown_words')
    if (raw) words = JSON.parse(raw)
  } catch {}
  if (!words.length) return
  allWords.value = words.map(w => ({ ...w, testStatus: 'none' }))
  _recalc()
})
</script>

<style scoped>
.test-page {
  width: 100%;
  max-width: 1100px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
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

.header-right {
  flex-shrink: 0;
}

.marked-count {
  font-size: 14px;
  color: var(--theme-accent);
  font-weight: 600;
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
  transition: width 0.25s ease;
}

/* 单词列表 */
.test-list {
  background: #fff;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  margin-bottom: 120px;
}

.test-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.15s;
}

.test-row:last-child {
  border-bottom: none;
}

.test-row.row-right {
  background: var(--theme-light);
}

.test-row.row-wrong {
  background: #FFF0F0;
}

.test-main {
  flex: 1;
  min-width: 0;
}

.test-word {
  display: block;
  font-size: 17px;
  font-weight: 600;
  color: #222;
  margin-bottom: 2px;
}

.test-status {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 6px;
}

.test-status.right {
  background: var(--theme-light);
  color: var(--theme-accent);
}

.test-status.wrong {
  background: #FFE8E8;
  color: #FF6B6B;
}

.test-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  margin-left: 12px;
}

.mark-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
  background: transparent;
  font-size: 16px;
  font-weight: 700;
  color: #bbb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.mark-btn:hover {
  border-color: #ccc;
  color: #888;
}

.mark-btn.active {
  border: none;
  color: #fff;
}

.right-btn.active {
  background: var(--theme-accent);
}

.wrong-btn.active {
  background: #FF6B6B;
}

/* 底部固定 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 14px 20px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 12px rgba(0,0,0,0.07);
  max-width: calc(1100px + 2 * 32px);
  margin: 0 auto;
}

.footer-stats {
  display: flex;
  justify-content: center;
  gap: 28px;
  margin-bottom: 10px;
}

.stat {
  font-size: 14px;
}

.stat.known { color: var(--theme-accent); }
.stat.unknown { color: #FF6B6B; }

.btn-block {
  width: 100%;
}

/* 结果弹窗 */
.result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 900;
}

.result-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 20px 20px 0 0;
  z-index: 901;
  padding: 28px 24px calc(28px + env(safe-area-inset-bottom));
  max-width: 1100px;
  margin: 0 auto;
  max-height: 85vh;
  overflow-y: auto;
}

.result-modal-header {
  text-align: center;
  margin-bottom: 20px;
}

.result-icon {
  font-size: 56px;
  display: block;
  margin-bottom: 8px;
}

.result-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.result-modal-body {
  margin-bottom: 20px;
}

.accuracy-circle {
  text-align: center;
  padding: 24px;
  background: var(--theme-light);
  border-radius: 14px;
  margin-bottom: 16px;
}

.accuracy-num {
  display: block;
  font-size: 48px;
  font-weight: 700;
  color: var(--theme-accent);
  margin-bottom: 4px;
}

.accuracy-label {
  font-size: 14px;
  color: #666;
}

.result-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.result-card {
  flex: 1;
  padding: 16px 12px;
  border-radius: var(--border-radius-sm);
  text-align: center;
  box-shadow: var(--shadow);
}

.right-card { background: var(--theme-light); }
.wrong-card { background: #FFE8E8; }

.rc-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.right-card .rc-value { color: var(--theme-accent); }
.wrong-card .rc-value { color: #FF6B6B; }

.rc-label {
  font-size: 13px;
  color: #666;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-action-btn {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #f9f9f9;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  color: #333;
  font-family: inherit;
  transition: background 0.15s;
}

.result-action-btn:hover {
  background: #f0f0f0;
}

.print-btn {
  background: var(--theme-light);
}

.print-btn:hover {
  background: #e8f0ff;
}

.action-icon {
  font-size: 20px;
  margin-right: 10px;
}

.result-modal-footer {
  margin-top: 16px;
}

.btn.disabled {
  background: #e5e5e5 !important;
  color: #999 !important;
  cursor: not-allowed;
  border-color: #e5e5e5;
}
</style>
