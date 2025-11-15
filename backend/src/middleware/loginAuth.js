// 登录相关中间件与工具函数
// 基于环境变量中的用户名和密码进行简单登录校验

const jwt = require('jsonwebtoken');

/**
 * 判断是否配置了登录账号
 * 只有同时配置 LOGIN_USERNAME 和 LOGIN_PASSWORD 时才启用登录校验
 */
const isLoginConfigured = () => {
  return !!(process.env.LOGIN_USERNAME && process.env.LOGIN_PASSWORD);
};

/**
 * 获取用于签名登录 Token 的密钥
 * 优先使用 LOGIN_JWT_SECRET，未配置时使用默认值并给出提示
 */
const getJwtSecret = () => {
  const secret = process.env.LOGIN_JWT_SECRET || 'areyouok-login-default-secret';

  if (!process.env.LOGIN_JWT_SECRET && process.env.NODE_ENV !== 'test') {
    console.warn(
      '[Auth] LOGIN_JWT_SECRET 未配置，将使用默认密钥，仅适合本地开发环境使用。' +
        '请在生产环境中设置 LOGIN_JWT_SECRET 环境变量以增强安全性。'
    );
  }

  return secret;
};

/**
 * 为指定用户名生成登录 Token
 * @param {string} username 登录用户名
 * @returns {string} 已签名的 JWT 字符串
 */
const createLoginToken = (username) => {
  const payload = { username };
  const options = {
    expiresIn: '7d',
    issuer: 'areyouok'
  };

  return jwt.sign(payload, getJwtSecret(), options);
};

/**
 * 从请求头中解析出 Bearer Token
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extractTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};

/**
 * 获取当前请求对应的登录状态
 * 如果未配置登录账号，则视为无需登录且始终已认证
 * @param {import('express').Request} req
 */
const getLoginStatus = (req) => {
  if (!isLoginConfigured()) {
    return {
      loginRequired: false,
      authenticated: true,
      username: null
    };
  }

  const token = extractTokenFromRequest(req);
  if (!token) {
    return {
      loginRequired: true,
      authenticated: false,
      username: null
    };
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    return {
      loginRequired: true,
      authenticated: true,
      username: payload.username
    };
  } catch (error) {
    console.error('[Auth] 验证登录 Token 失败:', error.message || error);
    return {
      loginRequired: true,
      authenticated: false,
      username: null
    };
  }
};

/**
 * 登录鉴权中间件
 * - 若未配置登录账号：直接放行（保持向后兼容）
 * - 若已配置登录账号：要求请求携带有效的登录 Token
 */
const loginRequired = (req, res, next) => {
  // 未启用登录功能时，直接放行
  if (!isLoginConfigured()) {
    return next();
  }

  const token = extractTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未登录或登录已过期'
    });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = { username: payload.username };
    return next();
  } catch (error) {
    console.error('[Auth] 登录鉴权失败:', error.message || error);
    return res.status(401).json({
      success: false,
      message: '未登录或登录已过期'
    });
  }
};

module.exports = {
  isLoginConfigured,
  getLoginStatus,
  createLoginToken,
  loginRequired
};

