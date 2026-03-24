/**
 * 将 axios 错误转成用户可读中文说明（开发环境常见：后端未启动 / 代理端口不对）
 */
export function axiosFailMessage(err, fallback = '请求失败') {
  const data = err.response?.data
  if (data && typeof data === 'object') {
    if (data.error != null) return String(data.error)
    if (data.message != null) return String(data.message)
  }
  const code = err.code
  const msg = err.message || ''
  if (
    code === 'ERR_NETWORK' ||
    code === 'ECONNABORTED' ||
    msg === 'Network Error' ||
    code === 'ECONNREFUSED'
  ) {
    return '无法连接后端。请在本机启动 web/server（默认端口 3010），并在 web/frontend 下复制 env.example 为 .env.development，将 DEV_API_PROXY 设为实际后端地址（例如 http://127.0.0.1:8080）。'
  }
  if (err.response?.status === 504 || err.response?.status === 502) {
    return '网关超时或后端无响应，请确认服务已启动。'
  }
  return msg || fallback
}
