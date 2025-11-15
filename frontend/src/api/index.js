import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 登录 Token 统一通过请求拦截器注入到请求头中
api.interceptors.request.use(
  (config) => {
    const loginToken = localStorage.getItem('login_token')
    if (loginToken) {
      config.headers = config.headers || {}
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${loginToken}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 统一处理响应结构，直接返回后端 data 字段
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const message = error.response.data?.message || error.message
      return Promise.reject(new Error(message))
    }
    return Promise.reject(error)
  }
)

export default {
  // 账单相关
  syncBills(billingMonth, type = 'full') {
    return api.post('/bills/sync', { billingMonth, type })
  },

  getBills(params) {
    return api.get('/bills', { params })
  },

  getProducts() {
    return api.get('/bills/products')
  },

  getBillsCount() {
    return api.get('/bills/count')
  },

  getCurrentMembershipTier() {
    return api.get('/bills/current-membership-tier')
  },

  getApiUsageProgress() {
    return api.get('/bills/api-usage-progress')
  },

  getTokenUsageProgress() {
    return api.get('/bills/token-usage-progress')
  },

  getTotalCostProgress() {
    return api.get('/bills/total-cost-progress')
  },

  getStats(period = '5h') {
    return api.get('/bills/stats', { params: { period } })
  },

  getSyncStatus() {
    return api.get('/bills/sync-status')
  },

  // 同步历史
  saveSyncHistory(historyData) {
    return api.post('/bills/sync-history', historyData)
  },

  getSyncHistory(syncType, limit = 10, page = 1) {
    const offset = (page - 1) * limit
    return api.get('/bills/sync-history', {
      params: { sync_type: syncType, limit, offset }
    })
  },

  // 使用统计
  getHourlyUsage(hours = 5) {
    return api.get('/bills/hourly-usage', { params: { hours } })
  },

  getDailyUsage(days = 7) {
    return api.get('/bills/daily-usage', { params: { days } })
  },

  getMonthlyUsage() {
    return api.get('/bills/daily-usage', { params: { days: 30 } })
  },

  getProductDistribution(hours = 5) {
    return api.get('/bills/product-distribution', { params: { hours } })
  },

  getDayApiUsage() {
    return api.get('/bills/day-api-usage')
  },

  getDayTokenUsage() {
    return api.get('/bills/day-token-usage')
  },

  getDayTotalCost() {
    return api.get('/bills/day-total-cost')
  },

  getWeekApiUsage() {
    return api.get('/bills/week-api-usage')
  },

  getWeekTokenUsage() {
    return api.get('/bills/week-token-usage')
  },

  getWeekTotalCost() {
    return api.get('/bills/week-total-cost')
  },

  getMonthApiUsage() {
    return api.get('/bills/month-api-usage')
  },

  getMonthTokenUsage() {
    return api.get('/bills/month-token-usage')
  },

  getMonthTotalCost() {
    return api.get('/bills/month-total-cost')
  },

  // Token 管理
  verifyToken(token) {
    return api.post('/tokens/verify', { token })
  },

  saveToken(token) {
    return api.post('/tokens/save', { token })
  },

  getToken() {
    return api.get('/tokens/get')
  },

  deleteToken() {
    return api.delete('/tokens/delete')
  },

  // 自动同步
  getAutoSyncConfig() {
    return api.get('/auto-sync/config')
  },

  saveAutoSyncConfig(config) {
    return api.post('/auto-sync/config', config)
  },

  triggerAutoSync() {
    return api.post('/auto-sync/trigger')
  },

  stopAutoSync() {
    return api.post('/auto-sync/stop')
  },

  // 登录相关
  login(username, password) {
    return api.post('/auth/login', { username, password })
  },

  checkLoginStatus() {
    return api.get('/auth/status')
  }
}

