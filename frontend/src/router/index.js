import { createRouter, createWebHistory } from 'vue-router'
import Settings from '../views/Settings.vue'
import Bills from '../views/Bills.vue'
import Stats from '../views/Stats.vue'
import Sync from '../views/Sync.vue'
import Onboarding from '../views/Onboarding.vue'
import Login from '../views/Login.vue'
import api from '../api'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Onboarding
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: Onboarding
  },
  {
    path: '/stats',
    name: 'Stats',
    component: Stats,
    meta: { requiresAuth: true }
  },
  {
    path: '/bills',
    name: 'Bills',
    component: Bills,
    meta: { requiresAuth: true }
  },
  {
    path: '/sync',
    name: 'Sync',
    component: Sync,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：先判断是否需要登录，再复用原有 Token / Onboarding 逻辑
router.beforeEach(async (to, from, next) => {
  let loginRequired = false
  let isLoggedIn = true

  // 先检查后端是否启用了登录，以及当前登录状态
  try {
    const status = await api.checkLoginStatus()
    if (status && status.data) {
      loginRequired = !!status.data.loginRequired
      isLoggedIn = !loginRequired || !!status.data.authenticated
    }
  } catch (error) {
    // 如果后端明确提示未登录，则视为需要登录
    if (error && /未登录/.test(error.message || '')) {
      loginRequired = true
      isLoggedIn = false
    } else {
      // 其他错误时不强制登录，避免前端完全不可用
      loginRequired = false
      isLoggedIn = true
    }
  }

  // 登录页本身的处理
  if (to.path === '/login') {
    if (!loginRequired) {
      // 未启用登录，直接跳回首页
      return next('/')
    }
    if (isLoggedIn) {
      // 已登录则跳转到统计页
      return next('/stats')
    }
    return next()
  }

  // 其他页面：如果需要登录但当前未登录，先跳转到登录页
  if (loginRequired && !isLoggedIn) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  // 以下保留原有的 Token / Onboarding 逻辑

  // 访问根路径时，检查数据库中是否已经有 Token
  if (to.path === '/') {
    try {
      const result = await api.getToken()
      if (result.success && result.data && result.data.token) {
        // 数据库中存在 Token，保存到 localStorage 并跳转到统计页
        localStorage.setItem('api_token', result.data.token)
        return next('/stats')
      } else {
        // 数据库中没有 Token，跳转到引导页
        return next('/onboarding')
      }
    } catch (error) {
      console.error('检查 Token 失败:', error)
      // 查询失败也跳转到引导页
      return next('/onboarding')
    }
  }

  // 访问 /onboarding 路径时总是允许（前面已经处理过登录）
  if (to.path === '/onboarding') {
    return next()
  }

  // 其他需要业务 Token 的页面，检查是否已配置大模型 Token
  try {
    const result = await api.getToken()
    if (result.success && result.data && result.data.token) {
      // 已经配置 Token，允许访问
      return next()
    }
  } catch (error) {
    console.error('检查 Token 失败:', error)
  }

  // 没有配置 Token，跳转到引导页
  return next('/onboarding')
})

export default router

