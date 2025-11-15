// 登录与登录状态相关路由
// 使用环境变量 LOGIN_USERNAME / LOGIN_PASSWORD 作为唯一账号密码

const express = require('express');
const {
  createLoginToken,
  getLoginStatus,
  isLoginConfigured
} = require('../middleware/loginAuth');

const router = express.Router();

/**
 * 登录接口
 * POST /api/auth/login
 * body: { username: string, password: string }
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const envUsername = process.env.LOGIN_USERNAME;
  const envPassword = process.env.LOGIN_PASSWORD;

  if (!envUsername || !envPassword) {
    return res.status(500).json({
      success: false,
      message: '未配置登录账号，当前未启用登录功能'
    });
  }

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }

  if (username !== envUsername || password !== envPassword) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }

  const token = createLoginToken(username);

  return res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      username
    }
  });
});

/**
 * 登录状态检查接口
 * GET /api/auth/status
 *
 * - 若未配置登录账号：返回 loginRequired=false
 * - 若已配置登录账号：
 *   - 携带有效 Token：返回 authenticated=true
 *   - 无 Token 或 Token 无效：返回 401
 */
router.get('/status', (req, res) => {
  const status = getLoginStatus(req);

  // 未启用登录功能：直接视为不需要登录
  if (!isLoginConfigured()) {
    return res.json({
      success: true,
      data: status
    });
  }

  // 已启用登录功能但未通过认证
  if (!status.authenticated) {
    return res.status(401).json({
      success: false,
      message: '未登录或登录已过期',
      data: status
    });
  }

  // 已登录
  return res.json({
    success: true,
    data: status
  });
});

module.exports = router;

