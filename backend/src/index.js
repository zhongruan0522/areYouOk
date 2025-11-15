// 后端入口文件
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 引入路由
const billRoutes = require('./routes/billRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const autoSyncRoutes = require('./routes/autoSyncRoutes');
const authRoutes = require('./routes/authRoutes');

// 引入服务与中间件
const autoSyncService = require('./services/autoSyncService');
const { loginRequired } = require('./middleware/loginAuth');

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 7965;

// 通用中间件
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码请求体

// API 路由
// 登录相关接口：不要求已登录，用于获取登录状态和登录 Token
app.use('/api/auth', authRoutes);
// 业务接口：在配置了登录账号后，将统一要求登录
app.use('/api/bills', loginRequired, billRoutes);
app.use('/api/tokens', loginRequired, tokenRoutes);
app.use('/api/auto-sync', loginRequired, autoSyncRoutes);

// 根路由（简单返回 API 信息）
app.get('/', (req, res) => {
  res.json({
    message: 'AreYouOk AI 账单统计 API',
    version: '1.0.0',
    endpoints: {
      sync: 'POST /api/bills/sync - 同步账单数据',
      list: 'GET /api/bills - 获取账单列表',
      products: 'GET /api/bills/products - 获取产品列表',
      stats: 'GET /api/bills/stats - 获取统计信息',
      status: 'GET /api/bills/sync-status - 获取同步状态',
      tokenSave: 'POST /api/tokens/save - 保存 Token',
      tokenGet: 'GET /api/tokens/get - 获取 Token'
    }
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 路径不存在'
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务端错误:', err);
  res.status(500).json({
    success: false,
    message: '服务端内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log('=================================');
  console.log('  AreYouOk AI 账单统计 API');
  console.log(`  端口: ${PORT}`);
  console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
  console.log('=================================');
  console.log('\n可用接口:');
  console.log('  POST /api/bills/sync - 同步账单数据');
  console.log('  GET  /api/bills - 获取账单列表');
  console.log('  GET  /api/bills/products - 获取产品列表');
  console.log('  GET  /api/bills/stats - 获取统计信息');
  console.log('  GET  /api/bills/sync-status - 获取同步状态');
  console.log('  POST /api/tokens/save - 保存 Token');
  console.log('  GET  /api/tokens/get - 获取 Token');
  console.log('  GET  /api/auto-sync/config - 获取自动同步配置');
  console.log('  POST /api/auto-sync/config - 保存自动同步配置');
  console.log('  POST /api/auto-sync/trigger - 触发一次自动同步');
  console.log('  POST /api/auto-sync/stop - 停止自动同步');
  console.log('\n=================================');

  // 启动自动同步服务
  autoSyncService.start();
});

// 优雅关闭
process.on('SIGTERM', () => {
  shutdown();
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务...');
  shutdown();
});

/**
 * 优雅关闭服务
 */
function shutdown() {
  console.log('正在停止自动同步服务...');
  autoSyncService.stop();

  setTimeout(() => {
    console.log('服务已关闭');
    process.exit(0);
  }, 1000);
}

