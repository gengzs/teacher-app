/**
 * API 工具 - 调用后端服务器
 */

import axios from 'axios'

// 开发：Vite 把 /api 代理到后端；生产：同域 Express 路由为 /api/*
const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('teacher_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

/**
 * 教师登录
 */
export function login(password) {
  return api.post('/teacher/login', { password })
}

/**
 * 获取统计数据
 */
export function getStats() {
  return api.get('/stats')
}

/**
 * 获取班级列表
 */
export function getClasses() {
  return api.get('/classes')
}

/**
 * 获取作业列表
 */
export function getHomeworkList() {
  return api.get('/homework')
}

/**
 * 获取学生列表
 */
export function getStudents() {
  return api.get('/students')
}

/**
 * 获取课程表
 */
export function getSchedule() {
  return api.get('/schedule')
}

/**
 * 调用云函数
 */
export function callFunction(name, data) {
  return api.post('/call-function', { name, data })
}

// ============================================================
// 笔记管理 (Notes)
// ============================================================

/**
 * 获取笔记列表
 */
export function getNotes(sort = 'update') {
  return api.get('/notes', { params: { sort } })
}

/**
 * 获取单个笔记（含反向链接）
 */
export function getNote(id) {
  return api.get(`/notes/${id}`)
}

/**
 * 创建笔记
 */
export function createNote(data) {
  return api.post('/notes', data)
}

/**
 * 更新笔记
 */
export function updateNote(id, data) {
  return api.put(`/notes/${id}`, data)
}

/**
 * 删除笔记
 */
export function deleteNote(id) {
  return api.delete(`/notes/${id}`)
}

/**
 * 搜索笔记
 */
export function searchNotes(q) {
  return api.get('/notes/search', { params: { q } })
}

export default api
