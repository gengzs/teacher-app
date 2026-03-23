<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">🎓</div>
        <h1 class="login-title">教师助手</h1>
        <p class="login-subtitle">Teacher Web</p>
      </div>
      
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">教师密码</label>
          <input 
            type="password" 
            v-model="password"
            class="form-input"
            placeholder="请输入密码"
            required
          />
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="login-hint">
        <p>默认密码：123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../utils/api'

const router = useRouter()
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!password.value) {
    error.value = '请输入密码'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const res = await login(password.value)
    if (res.success) {
      localStorage.setItem('teacher_token', res.token)
      router.push('/')
    } else {
      error.value = res.message || '登录失败'
    }
  } catch (err) {
    const msg = err?.message || ''
    const apiMsg = err?.response?.data?.message || err?.response?.data?.error
    const noServer =
      msg.includes('Network Error') ||
      msg.includes('ERR_CONNECTION_REFUSED') ||
      err?.code === 'ECONNREFUSED'
    if (noServer) {
      error.value =
        '连不上后端：请在 web\\server 目录运行 npm start（端口需与 Vite 代理一致，默认 3010），再刷新本页。'
    } else if (apiMsg) {
      error.value = `服务器返回：${apiMsg}（若端口被其它程序占用，请改 .env 里 PORT 与 vite.config.js 代理一致）`
    } else {
      error.value = `登录失败：${msg || '请检查后端是否为本项目的 Express（端口 3010）'}`
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-gradient);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 48px 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-logo {
  font-size: 56px;
  margin-bottom: 16px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--theme-accent);
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #999;
}

.login-form {
  margin-bottom: 24px;
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
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius-sm);
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--theme-accent);
}

.error-message {
  padding: 12px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: var(--border-radius-sm);
  font-size: 13px;
  margin-bottom: 16px;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: var(--theme-gradient);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-accent);
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-hint {
  text-align: center;
  font-size: 12px;
  color: #999;
}
</style>
