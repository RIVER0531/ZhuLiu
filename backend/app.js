require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'riverflow',
  charset: 'utf8mb4'
};

let pool;

async function initDB() {
  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const conn = await pool.getConnection();
  console.log('已连接到MySQL数据库');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      token VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_users_token (token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      daily_minutes INT DEFAULT 120,
      weekly_minutes INT DEFAULT 600,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      duration INT NOT NULL,
      tag VARCHAR(50) DEFAULT '其他',
      note TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sessions_start (start_time),
      INDEX idx_sessions_tag (tag),
      INDEX idx_sessions_user (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  conn.release();
  console.log('数据库表初始化完成');
}

function getLocalDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getLocalYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function genToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ── 认证中间件 ──

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }
  const token = header.slice(7).trim();
  try {
    const [rows] = await pool.query('SELECT id, username FROM users WHERE token = ? LIMIT 1', [token]);
    if (rows.length === 0) {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }
    req.userId = rows[0].id;
    req.username = rows[0].username;
    next();
  } catch (err) {
    next(err);
  }
}

app.use((req, _res, next) => {
  if (req.path.startsWith('/api/auth') || req.path === '/api/health' || req.path === '/') {
    return next();
  }
  authMiddleware(req, _res, next);
});

// ── 错误处理 ──

const errorHandler = (err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({ error: '服务器内部错误，请稍后重试' });
};

// ── 认证 API ──

app.post('/api/auth/register', async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  try {
    const token = genToken();
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, token) VALUES (?, ?, ?)',
      [username, password, token]
    );
    const userId = result.insertId;

    await pool.execute(
      'INSERT INTO goals (user_id, daily_minutes, weekly_minutes) VALUES (?, 120, 600)',
      [userId]
    );

    res.json({ token, userId, username });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: '用户名已存在' });
    }
    next(err);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, password FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    if (rows.length === 0 || rows[0].password !== password) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = genToken();
    await pool.execute('UPDATE users SET token = ? WHERE id = ?', [token, rows[0].id]);
    res.json({ token, userId: rows[0].id, username: rows[0].username });
  } catch (err) {
    next(err);
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ id: req.userId, username: req.username });
});

function toLocalMySQL(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ── Sessions ──

app.post('/api/sessions', async (req, res, next) => {
  const { startTime, endTime, duration, tag, note } = req.body;
  if (!startTime || !endTime || !duration) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO sessions (user_id, start_time, end_time, duration, tag, note) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, toLocalMySQL(startTime), toLocalMySQL(endTime), duration, tag || '其他', note || null]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
});

app.get('/api/sessions', async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  try {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM sessions WHERE user_id = ?',
      [req.userId]
    );

    const [rows] = await pool.query(
      'SELECT id, start_time, end_time, duration, tag, note, created_at FROM sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT ? OFFSET ?',
      [req.userId, limit, offset]
    );

    res.json({ data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/sessions/:id', async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: '无效的记录ID' });

  try {
    const [result] = await pool.execute('DELETE FROM sessions WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: '记录不存在' });
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

// ── Stats ──

app.get('/api/stats', async (req, res, next) => {
  const period = req.query.period || 'month';
  const userId = req.userId;
  const today = getLocalDate();
  const thisMonth = getLocalYearMonth();

  try {
    const [[rows]] = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN DATE(start_time) = ? THEN duration ELSE 0 END), 0) as daily,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(start_time, '%Y-%m') = ? THEN duration ELSE 0 END), 0) as monthly,
        COALESCE(SUM(duration), 0) as total,
        COALESCE(COUNT(CASE WHEN DATE(start_time) = ? THEN 1 END), 0) as daily_count,
        COALESCE(COUNT(CASE WHEN DATE_FORMAT(start_time, '%Y-%m') = ? THEN 1 END), 0) as monthly_count,
        COUNT(*) as total_count
      FROM sessions WHERE user_id = ?`,
      [today, thisMonth, today, thisMonth, userId]
    );

    const [[goal]] = await pool.query(
      'SELECT daily_minutes, weekly_minutes FROM goals WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const g = goal || { daily_minutes: 120, weekly_minutes: 600 };

    let weekly = 0, weeklyCount = 0;
    if (period === 'week' || period === 'month') {
      const now = new Date();
      const dow = now.getDay();
      const mon = new Date(now);
      mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
      const monStr = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;

      const [[wr]] = await pool.query(
        'SELECT COALESCE(SUM(duration), 0) as w, COUNT(*) as c FROM sessions WHERE user_id = ? AND DATE(start_time) >= ?',
        [userId, monStr]
      );
      weekly = wr.w;
      weeklyCount = wr.c;
    }

    res.json({ ...rows, weekly, weekly_count: weeklyCount, daily_goal: g.daily_minutes, weekly_goal: g.weekly_minutes });
  } catch (err) {
    next(err);
  }
});

// ── Heatmap ──

app.get('/api/heatmap', async (req, res, next) => {
  const rawDays = Math.min(365, Math.max(30, parseInt(req.query.days, 10) || 365));
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - rawDays);

  try {
    const [rows] = await pool.query(
      'SELECT DATE(start_time) as date, SUM(duration) as minutes FROM sessions WHERE user_id = ? AND start_time >= DATE_SUB(?, INTERVAL ? DAY) GROUP BY DATE(start_time)',
      [req.userId, getLocalDate(), rawDays + 7]
    );

    const map = {};
    rows.forEach(r => {
      const rd = new Date(r.date);
      map[`${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`] = r.minutes;
    });

    const result = [];
    const cursor = new Date(startDate);
    cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      result.push({ date: key, minutes: map[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── Chart / Tags / Export ──

app.get('/api/chart', async (req, res, next) => {
  const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 7));

  try {
    const [rows] = await pool.query(
      'SELECT DATE(start_time) as date, SUM(duration) as total_minutes, COUNT(*) as session_count FROM sessions WHERE user_id = ? AND start_time >= DATE_SUB(?, INTERVAL ? DAY) GROUP BY DATE(start_time) ORDER BY date ASC',
      [req.userId, getLocalDate(), days]
    );

    const result = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const found = rows.find(r => {
        const rd = new Date(r.date);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth() && rd.getDate() === d.getDate();
      });
      result.push({ date: ds, minutes: found ? found.total_minutes : 0, count: found ? found.session_count : 0 });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/api/tags', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT tag, SUM(duration) as total_minutes, COUNT(*) as session_count FROM sessions WHERE user_id = ? GROUP BY tag ORDER BY total_minutes DESC',
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.get('/api/export', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, start_time, end_time, duration, tag, note FROM sessions WHERE user_id = ? ORDER BY start_time DESC',
      [req.userId]
    );

    const esc = v => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    let csv = '\uFEFFID,开始时间,结束时间,时长(分钟),标签,笔记\n';
    rows.forEach(r => csv += `${r.id},${esc(r.start_time)},${esc(r.end_time)},${r.duration},${esc(r.tag)},${esc(r.note)}\n`);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=riverflow-export.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// ── Goals ──

app.get('/api/goals', async (req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT daily_minutes, weekly_minutes FROM goals WHERE user_id = ? LIMIT 1', [req.userId]);
    res.json(row || { daily_minutes: 120, weekly_minutes: 600 });
  } catch (err) {
    next(err);
  }
});

app.put('/api/goals', async (req, res, next) => {
  const { daily_minutes, weekly_minutes } = req.body;
  if (daily_minutes < 1 || daily_minutes > 1440) return res.status(400).json({ error: '每日目标在 1-1440 分钟之间' });
  if (weekly_minutes < 1 || weekly_minutes > 10080) return res.status(400).json({ error: '每周目标在 1-10080 分钟之间' });

  try {
    const [existing] = await pool.query('SELECT id FROM goals WHERE user_id = ? LIMIT 1', [req.userId]);
    if (existing.length) {
      await pool.execute('UPDATE goals SET daily_minutes = ?, weekly_minutes = ? WHERE user_id = ?', [daily_minutes, weekly_minutes, req.userId]);
    } else {
      await pool.execute('INSERT INTO goals (user_id, daily_minutes, weekly_minutes) VALUES (?, ?, ?)', [req.userId, daily_minutes, weekly_minutes]);
    }
    res.json({ message: '目标更新成功' });
  } catch (err) {
    next(err);
  }
});

// ── 通用 ──

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'error' });
  }
});

app.get('/', (_req, res) => {
  res.json({ name: 'Riverflow API', version: '3.0.0' });
});

app.use(errorHandler);

app.listen(PORT, async () => {
  try {
    await initDB();
    console.log(`服务器已启动，端口: ${PORT}`);
  } catch (err) {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }
});
