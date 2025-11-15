// 数据库连接配置
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径 - 从环境变量读取，未设置则使用默认路径
// 环境变量中的路径相对于项目根目录解析
const defaultDbPath = path.join(__dirname, '../../../data/expense_bills.db');
const DB_PATH = process.env.DB_PATH
    ? path.resolve(__dirname, '../../', process.env.DB_PATH)
    : defaultDbPath;

// 确保数据库目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    try {
        fs.mkdirSync(dbDir, { recursive: true, mode: 0o755 });
        console.log('数据库目录创建成功:', dbDir);
    } catch (error) {
        console.error('创建数据库目录失败:', error.message);
        process.exit(1);
    }
}

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
        console.error('数据库路径:', DB_PATH);
        console.error('错误详情:', err);
        process.exit(1);
    } else {
        console.log('数据库连接成功:', DB_PATH);
        // 启用外键约束
        db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) {
                console.error('设置PRAGMA失败:', err.message);
            }
        });
    }
});

module.exports = db;
