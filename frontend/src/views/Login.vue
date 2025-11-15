<template>
  <div class="login-page">
    <div class="login-card">
      <h2>登录 AreYouOk 控制台</h2>
      <p class="login-subtitle">访问前先输入在 Docker 中配置的账号密码</p>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="login-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            autocomplete="username"
            placeholder="请输入用户名"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <p class="login-tip">
        登录账号来自容器环境变量
        <code>LOGIN_USERNAME</code>
        /
        <code>LOGIN_PASSWORD</code>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

const router = useRouter()
const route = useRoute()

const formRef = ref()
const loading = ref(false)
const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = () => {
  if (!formRef.value) return

  formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await api.login(form.value.username, form.value.password)
      if (res && res.success && res.data && res.data.token) {
        localStorage.setItem('login_token', res.data.token)
        if (res.data.username || form.value.username) {
          localStorage.setItem('login_username', res.data.username || form.value.username)
        }

        const redirect = route.query.redirect || '/stats'
        router.replace(redirect)
        ElMessage.success('登录成功')
      } else {
        ElMessage.error(res?.message || '登录失败')
      }
    } catch (error) {
      ElMessage.error(error.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f7e7eb 0%, #e5f0ff 100%);
}

.login-card {
  width: 360px;
  padding: 32px 28px 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08);
  border-radius: 18px;
  backdrop-filter: blur(10px);
}

.login-card h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.login-subtitle {
  margin: 0 0 20px;
  font-size: 13px;
  color: #666;
}

.login-form {
  margin-top: 12px;
}

.login-button {
  width: 100%;
}

.login-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.login-tip code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
}
</style>

