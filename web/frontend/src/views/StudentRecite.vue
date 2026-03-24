<template>
  <div class="recite-page">

    <!-- 选词库（与小程序「词库管理」一致：先选 setId 再筛词） -->
    <template v-if="!setId">
      <div class="page-header">
        <button type="button" class="btn btn-outline" @click="goBackFromPick">← 返回</button>
        <div class="header-text">
          <h2 class="page-title">{{ isReview ? '抗遗忘复习' : '选词库学习' }}</h2>
          <p class="page-sub">为 {{ studentDisplayName }} 选择词库</p>
        </div>
      </div>

      <div v-if="pickLoading" class="loading-state">
        <div class="spinner"></div>
        <span>加载词库列表…</span>
      </div>

      <div v-else-if="pickError" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ pickError }}</p>
        <button type="button" class="btn btn-primary" @click="loadWordSets">重试</button>
      </div>

      <div v-else-if="wordSets.length === 0" class="pick-empty">
        <div class="empty-icon">📚</div>
        <p class="empty-title">暂无词库</p>
        <p class="empty-hint">请先在小程序「词库管理」中创建并导入词库</p>
      </div>

      <div v-else class="set-grid">
        <button
          v-for="s in wordSets"
          :key="s._id"
          type="button"
          class="set-card"
          @click="selectWordSet(s)"
        >
          <span class="set-icon">📖</span>
          <span class="set-name">{{ s.name || '未命名词库' }}</span>
          <span class="set-meta">{{ s.wordCount ?? 0 }} 词</span>
          <span class="set-arrow">›</span>
        </button>
      </div>
    </template>

    <!-- 筛词模式 -->
    <template v-else-if="phase === 'filtering'">
      <div class="page-header">
        <button type="button" class="btn btn-outline" @click="goToPickList">← 换词库</button>
        <div class="header-text">
          <h2 class="page-title">{{ setName || '单词带背' }}</h2>
          <p class="page-sub">已标记 {{ knownCount + unknownCount }} / 共 {{ totalCount }} 词</p>
        </div>
      </div>

      <template v-if="!loading && !errorMsg">
        <!-- 进度条 -->
        <div class="progress-track">
          <div class="progress-known" :style="{ width: knownPct + '%' }"></div>
          <div class="progress-unknown" :style="{ width: unknownPct + '%' }"></div>
        </div>

        <!-- 统计标签 -->
        <div class="progress-labels">
          <span class="label known">✓ 认识 {{ knownCount }}</span>
          <span class="label unknown">✗ 待学习 {{ unknownCount }}</span>
        </div>

        <!-- 单词列表 -->
        <div class="word-list">
          <div
            v-for="(item, idx) in allWords"
            :key="item._id"
            class="word-row"
            :class="item.filterStatus"
            @click="onWordTap(idx)"
          >
            <div class="word-main">
              <span class="word-text">{{ item.word }}</span>
              <span class="word-phonetic" v-if="item.tapCount === 2 && item.phonetic">{{ item.phonetic }}</span>
              <span class="word-translation" v-if="item.tapCount === 2">{{ item.translation || '（无释义）' }}</span>
            </div>
            <div class="word-actions">
              <button
                type="button"
                class="mark-btn known-btn"
                :class="{ active: item.filterStatus === 'known' }"
                @click.stop="markKnown(idx)"
                title="认识"
              >✓</button>
              <button
                type="button"
                class="mark-btn unknown-btn"
                :class="{ active: item.filterStatus === 'unknown' }"
                @click.stop="markUnknown(idx)"
                title="不认识"
              >✗</button>
            </div>
          </div>
        </div>

        <!-- 底部固定：进入分组学习 -->
        <div class="bottom-bar">
          <p class="bar-hint" v-if="unknownCount === 0">请先点击右侧 ✗ 标记不认识的词</p>
          <button
            type="button"
            class="btn btn-primary btn-block"
            :class="{ disabled: unknownCount <= 0 }"
            @click="onStartLearning"
          >
            {{ unknownCount > 0 ? `进入分组学习（${unknownCount} 个待学）›` : '进入分组学习' }}
          </button>
        </div>
      </template>
    </template>

    <!-- 结果页 -->
    <template v-else-if="phase === 'result'">
      <div class="result-page">
        <div class="result-icon">🎉</div>
        <h2 class="result-title">筛选完成！</h2>
        <p class="result-subtitle">{{ setName }}</p>

        <div class="result-stats">
          <div class="stat-card known-card">
            <span class="stat-value">{{ knownCount }}</span>
            <span class="stat-label">认识</span>
          </div>
          <div class="stat-card unknown-card">
            <span class="stat-value">{{ unknownCount }}</span>
            <span class="stat-label">不认识</span>
          </div>
          <div class="stat-card total-card">
            <span class="stat-value">{{ totalCount }}</span>
            <span class="stat-label">总单词</span>
          </div>
        </div>

        <div class="accuracy-display" v-if="totalCount > 0">
          <span class="accuracy-num">{{ accuracyPct }}%</span>
          <span class="accuracy-label">认识占比</span>
        </div>

        <div class="result-actions">
          <button type="button" class="btn btn-outline" @click="goToPickList">词库管理</button>
          <button type="button" class="btn btn-primary" @click="restart">再来一次</button>
        </div>
      </div>
    </template>

    <!-- 筛词：加载 / 错误（有 setId 且处于筛词页时） -->
    <div v-if="setId && phase === 'filtering' && loading" class="loading-state">
      <div class="spinner"></div>
      <span>加载单词…</span>
    </div>

    <div v-if="setId && phase === 'filtering' && errorMsg && !loading" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ errorMsg }}</p>
      <button type="button" class="btn btn-primary" @click="loadWordSet">重试</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { axiosFailMessage } from '../utils/httpErrorMessage'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const errorMsg = ref('')
const allWords = ref([])
const totalCount = ref(0)
const knownCount = ref(0)
const unknownCount = ref(0)
const phase = ref('filtering') // 'filtering' | 'result'

const wordSets = ref([])
const pickLoading = ref(false)
const pickError = ref('')

const setId = computed(() => {
  const id = route.query.setId
  return id != null && String(id).trim() !== '' ? String(id).trim() : ''
})
const setName = computed(() => route.query.setName ? decodeURIComponent(String(route.query.setName)) : '词库')
const studentId = computed(() => route.query.studentId || '')
const studentDisplayName = computed(() => {
  const n = route.query.studentName
  return n ? decodeURIComponent(String(n)) : '学生'
})
const isReview = computed(() => route.query.mode === 'review')

const knownPct = computed(() => totalCount.value > 0 ? (knownCount.value / totalCount.value) * 100 : 0)
const unknownPct = computed(() => totalCount.value > 0 ? (unknownCount.value / totalCount.value) * 100 : 0)
const accuracyPct = computed(() => totalCount.value > 0 ? Math.round((knownCount.value / totalCount.value) * 100) : 0)

function initWords(words) {
  allWords.value = words.map(w => ({ ...w, filterStatus: 'none', tapCount: 0 }))
  totalCount.value = allWords.value.length
  knownCount.value = 0
  unknownCount.value = 0
  phase.value = 'filtering'
}

function _playAudio(word) {
  if (!word) return
  const audio = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`)
  audio.play()
  audio.onerror = () => audio.remove()
  audio.onended = () => audio.remove()
}

function onWordTap(idx) {
  const item = allWords.value[idx]
  if (!item) return

  // 点新单词：先把所有单词的 tapCount 重置为 0
  for (let i = 0; i < allWords.value.length; i++) {
    allWords.value[i].tapCount = 0
  }

  item.tapCount++
  _playAudio(item.word)

  if (item.tapCount >= 3) {
    item.tapCount = 0 // 三次后归零，重新开始
  }
}

async function loadWordSets() {
  pickLoading.value = true
  pickError.value = ''
  try {
    const res = await axios.get('/api/word-sets')
    const outer = res.data
    if (outer.code !== 0) {
      pickError.value = outer.error || '加载失败'
      return
    }
    wordSets.value = Array.isArray(outer.data) ? outer.data : []
  } catch (e) {
    console.error(e)
    pickError.value = axiosFailMessage(e, '网络异常，请稍后重试')
  } finally {
    pickLoading.value = false
  }
}

function selectWordSet(s) {
  if (!s || !s._id) return
  const q = {
    setId: s._id,
    setName: s.name || '',
    studentId: studentId.value,
    studentName: route.query.studentName || '',
    classId: route.query.classId || '',
    className: route.query.className || ''
  }
  if (isReview.value) q.mode = 'review'
  router.push({ path: '/recite', query: q })
}

function goToPickList() {
  router.push({
    path: '/recite',
    query: {
      studentId: studentId.value,
      studentName: route.query.studentName || '',
      mode: route.query.mode || '',
      classId: route.query.classId || '',
      className: route.query.className || ''
    }
  })
}

function goBackFromPick() {
  const sid = studentId.value
  if (sid) {
    const q = new URLSearchParams({
      id: sid,
      name: studentDisplayName.value,
      classId: route.query.classId || '',
      className: route.query.className || ''
    })
    router.push(`/student/${sid}?${q.toString()}`)
    return
  }
  router.push('/')
}

async function loadWordSet() {
  if (!setId.value) {
    loading.value = false
    errorMsg.value = ''
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await axios.get(`/api/word-sets/${encodeURIComponent(setId.value)}/words`, {
      validateStatus: (s) => s < 500
    })
    if (res.status === 404 || res.data?.code !== 0) {
      errorMsg.value = res.data?.error || '加载失败'
      return
    }
    const words = Array.isArray(res.data?.data) ? res.data.data : []
    if (words.length === 0) {
      errorMsg.value = '词库为空'
      return
    }
    initWords(words)
  } catch (e) {
    console.error(e)
    errorMsg.value = axiosFailMessage(e, '网络异常')
  } finally {
    loading.value = false
  }
}

function _recalc() {
  const words = allWords.value
  let known = 0, unknown = 0
  for (const w of words) {
    if (w.filterStatus === 'known') known++
    else if (w.filterStatus === 'unknown') unknown++
  }
  knownCount.value = known
  unknownCount.value = unknown
}

function markKnown(idx) {
  const prev = allWords.value[idx].filterStatus
  allWords.value[idx].filterStatus = prev === 'known' ? 'none' : 'known'
  _recalc()
}

function markUnknown(idx) {
  const prev = allWords.value[idx].filterStatus
  allWords.value[idx].filterStatus = prev === 'unknown' ? 'none' : 'unknown'
  _recalc()
}

function onStartLearning() {
  if (unknownCount.value <= 0) return
  const unknownWords = allWords.value
    .filter(w => w.filterStatus === 'unknown')
    .map(({ _id, word, phonetic, translation, index }) =>
      ({ _id, word, phonetic, translation, index })
    )
  sessionStorage.setItem('teacher_unknown_words', JSON.stringify(unknownWords))

  const q = {
    setId: setId.value,
    setName: route.query.setName || '',
    totalCount: String(unknownWords.length),
    studentId: studentId.value,
    studentName: route.query.studentName || '',
    mode: isReview.value ? 'review' : 'recite',
    classId: route.query.classId || '',
    className: route.query.className || ''
  }
  const qs = new URLSearchParams(q).toString()
  router.push(`/recite/learn?${qs}`)
}

function restart() {
  if (allWords.value.length) initWords(allWords.value.map(w => {
    const { filterStatus, ...rest } = w
    return rest
  }))
}

watch(
  () => route.query.setId,
  (id) => {
    if (id != null && String(id).trim() !== '') {
      loadWordSet()
    } else {
      loading.value = false
      errorMsg.value = ''
      allWords.value = []
      loadWordSets()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.recite-page {
  width: 100%;
  max-width: 1100px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px;
}

.page-sub {
  margin: 0;
  font-size: 14px;
  color: #888;
}

/* 进度条 */
.progress-track {
  height: 6px;
  display: flex;
  background: #e5e5e5;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-known {
  height: 100%;
  background: linear-gradient(90deg, #56c28e, #3db87a);
  transition: width 0.2s ease;
}

.progress-unknown {
  height: 100%;
  background: linear-gradient(90deg, #ff9a9e, #ff6b8a);
  transition: width 0.2s ease;
}

/* 统计标签 */
.progress-labels {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.label {
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 16px;
  font-weight: 500;
}

.label.known {
  background: #e8f8f1;
  color: #2e9e68;
  border: 1px solid #56c28e;
}

.label.unknown {
  background: #fff0f1;
  color: #d94050;
  border: 1px solid #ff9a9e;
}

/* 单词列表 */
.word-list {
  background: #fff;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  margin-bottom: 120px;
}

.word-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px 16px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  border-left: 4px solid transparent;
  transition: background 0.15s;
  cursor: pointer;
}

.word-row:last-child {
  border-bottom: none;
}

.word-row.known {
  background: #f0faf4;
  border-left: 4px solid #56c28e;
}

.word-row.unknown {
  background: #fff5f6;
  border-left: 4px solid #ff6b8a;
}

.word-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  min-height: 48px;
}

.word-text {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.1;
}

.word-phonetic {
  display: block;
  font-size: 14px;
  color: var(--theme-accent);
  line-height: 1.2;
}

.word-translation {
  display: block;
  font-size: 16px;
  color: #555;
  line-height: 1.3;
  font-weight: 500;
}

.word-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 5px 7px;
  background: #fdf6f7;
  border-radius: 999px;
  border: 1px solid #f0e8eb;
  align-self: center;
}

.mark-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.mark-btn:active:not(:disabled) {
  transform: scale(0.94);
}

/* 认识：鲜绿 */
.known-btn {
  border: 2px solid #56c28e;
  background: #fff;
  color: #2e9e68;
}

.known-btn:hover {
  background: #e8f8f1;
  border-color: #3db87a;
  color: #2e9e68;
}

.known-btn.active {
  border-color: #2e9e68;
  background: linear-gradient(160deg, #56c28e, #3db87a);
  color: #fff;
  box-shadow: 0 2px 10px rgba(46, 158, 104, 0.3);
}

/* 不认识：艳红 */
.unknown-btn {
  border: 2px solid #ff6b8a;
  background: #fff;
  color: #d94050;
}

.unknown-btn:hover {
  background: #fff0f1;
  border-color: #ff6b8a;
  color: #c43040;
}

.unknown-btn.active {
  border-color: #d94050;
  background: linear-gradient(160deg, #ff6b8a, #ff3a5a);
  color: #fff;
  box-shadow: 0 2px 10px rgba(217, 64, 80, 0.3);
}

/* 底部固定 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 14px 24px calc(14px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 12px rgba(0,0,0,0.07);
  max-width: calc(1100px + 2 * 32px);
  margin: 0 auto;
}

.bar-hint {
  text-align: center;
  font-size: 13px;
  color: #aaa;
  margin: 0 0 10px;
}

.btn-block {
  width: 100%;
}

/* 结果页 */
.result-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px 100px;
  text-align: center;
}

.result-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.result-title {
  font-size: 24px;
  font-weight: 700;
  color: #222;
  margin: 0 0 8px;
}

.result-subtitle {
  font-size: 15px;
  color: #999;
  margin: 0 0 36px;
}

.result-stats {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 480px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  padding: 18px 12px;
  border-radius: var(--border-radius-sm);
  text-align: center;
  box-shadow: var(--shadow);
}

.known-card { background: #e8f8f1; }
.unknown-card { background: #fff0f1; }
.total-card { background: #f5f5f5; }

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.known-card .stat-value { color: #2e9e68; }
.unknown-card .stat-value { color: #d94050; }
.total-card .stat-value { color: #666; }

.stat-label {
  font-size: 13px;
  color: #666;
}

.accuracy-display {
  margin-bottom: 36px;
}

.accuracy-num {
  display: block;
  font-size: 52px;
  font-weight: 700;
  color: var(--theme-accent);
  margin-bottom: 4px;
}

.accuracy-label {
  font-size: 14px;
  color: #999;
}

.result-actions {
  display: flex;
  gap: 14px;
  width: 100%;
  max-width: 400px;
}

.result-actions .btn {
  flex: 1;
}

/* 通用状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #eee;
  border-top-color: var(--theme-accent);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon { font-size: 40px; }
.error-state p { color: #b91c1c; margin: 0; }

.btn.disabled {
  background: #e5e5e5 !important;
  color: #999 !important;
  cursor: not-allowed;
  border-color: #e5e5e5;
}

/* 选词库列表 */
.pick-empty {
  background: #fff;
  border-radius: var(--border-radius);
  padding: 48px 24px;
  text-align: center;
  box-shadow: var(--shadow);
}

.pick-empty .empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.pick-empty .empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.pick-empty .empty-hint {
  font-size: 13px;
  color: #888;
  margin: 0;
  line-height: 1.5;
}

.set-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.set-card {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  box-shadow: var(--shadow);
}

.set-card:hover {
  border-color: var(--theme-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
}

.set-icon {
  font-size: 28px;
}

.set-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.set-meta {
  font-size: 13px;
  color: #999;
}

.set-arrow {
  font-size: 22px;
  color: var(--theme-accent);
  font-weight: 300;
}
</style>
