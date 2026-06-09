const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'riverflow.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    token TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    daily_minutes INTEGER DEFAULT 120,
    weekly_minutes INTEGER DEFAULT 600,
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    tag TEXT DEFAULT '其他',
    note TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time);
  CREATE INDEX IF NOT EXISTS idx_sessions_tag ON sessions(tag);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

console.log('SQLite 数据库初始化完成');

function genToken() {
  return crypto.randomBytes(32).toString('hex');
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function mondayStr() {
  const now = new Date();
  const dow = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
}

// ── 认证中间件 ──

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }
  const token = header.slice(7).trim();
  const user = db.prepare('SELECT id, username FROM users WHERE token = ?').get(token);
  if (!user) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
  req.userId = user.id;
  req.username = user.username;
  next();
}

app.use((req, _res, next) => {
  if (req.path.startsWith('/api/auth') || req.path === '/api/health' || req.path === '/') {
    return next();
  }
  authMiddleware(req, _res, next);
});

// ── 认证 API ──

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  try {
    const token = genToken();
    const result = db.prepare('INSERT INTO users (username, password, token) VALUES (?, ?, ?)').run(username, password, token);
    db.prepare('INSERT INTO goals (user_id, daily_minutes, weekly_minutes) VALUES (?, 120, 600)').run(result.lastInsertRowid);
    res.json({ token, userId: result.lastInsertRowid, username });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: '用户名已存在' });
    res.status(500).json({ error: '注册失败' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  const user = db.prepare('SELECT id, username, password FROM users WHERE username = ?').get(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = genToken();
  db.prepare('UPDATE users SET token = ? WHERE id = ?').run(token, user.id);
  res.json({ token, userId: user.id, username: user.username });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ id: req.userId, username: req.username });
});

// ── Sessions ──

function toLocalStr(isoStr) {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return null;
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function toLocalDateStr(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

app.post('/api/sessions', (req, res) => {
  const { startTime, endTime, duration, tag, note } = req.body;
  if (!startTime || !endTime || !duration) return res.status(400).json({ error: '缺少必填字段' });
  const dur = parseInt(duration, 10);
  if (!dur || dur < 1 || dur > 1440) return res.status(400).json({ error: '时长应在 1-1440 分钟之间' });
  const startStr = toLocalStr(startTime);
  const endStr = toLocalStr(endTime);
  if (!startStr || !endStr) return res.status(400).json({ error: '时间格式无效' });
  const r = db.prepare('INSERT INTO sessions (user_id, start_time, end_time, duration, tag, note) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.userId, startStr, endStr, dur, tag || '其他', note || null);
  res.json({ id: r.lastInsertRowid });
});

app.get('/api/sessions', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as t FROM sessions WHERE user_id = ?').get(req.userId).t;
  const rows = db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT ? OFFSET ?').all(req.userId, limit, offset);
  res.json({ data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

app.delete('/api/sessions/:id', (req, res) => {
  const r = db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?').run(parseInt(req.params.id, 10), req.userId);
  if (r.changes === 0) return res.status(404).json({ error: '记录不存在' });
  res.json({ message: '删除成功' });
});

// ── Stats ──

app.get('/api/stats', (req, res) => {
  const t = today();
  const tm = thisMonth();
  const uid = req.userId;

  const s = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN substr(start_time,1,10) = ? THEN duration ELSE 0 END), 0) as daily,
      COALESCE(SUM(CASE WHEN substr(start_time,1,7) = ? THEN duration ELSE 0 END), 0) as monthly,
      COALESCE(SUM(duration), 0) as total,
      COALESCE(COUNT(CASE WHEN substr(start_time,1,10) = ? THEN 1 END), 0) as daily_count,
      COALESCE(COUNT(CASE WHEN substr(start_time,1,7) = ? THEN 1 END), 0) as monthly_count,
      COUNT(*) as total_count
    FROM sessions WHERE user_id = ?
  `).get(t, tm, t, tm, uid);

  const goal = db.prepare('SELECT daily_minutes, weekly_minutes FROM goals WHERE user_id = ?').get(uid);
  const g = goal || { daily_minutes: 120, weekly_minutes: 600 };

  const period = req.query.period || 'month';
  let weekly = 0, weeklyCount = 0;
  if (period === 'week' || period === 'month') {
    const mon = mondayStr();
    const wr = db.prepare('SELECT COALESCE(SUM(duration),0) as w, COUNT(*) as c FROM sessions WHERE user_id = ? AND substr(start_time,1,10) >= ?').get(uid, mon);
    weekly = wr.w; weeklyCount = wr.c;
  }

  res.json({ ...s, weekly, weekly_count: weeklyCount, daily_goal: g.daily_minutes, weekly_goal: g.weekly_minutes });
});

// ── Heatmap ──

app.get('/api/heatmap', (req, res) => {
  const rawDays = Math.min(365, Math.max(30, parseInt(req.query.days, 10) || 365));
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - rawDays);
  const cursor = new Date(startDate);
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));

  const rows = db.prepare(
    'SELECT substr(start_time,1,10) as date, SUM(duration) as minutes FROM sessions WHERE user_id = ? AND start_time >= ? GROUP BY substr(start_time,1,10)'
  ).all(req.userId, toLocalDateStr(cursor));

  const map = {};
  rows.forEach(r => { map[r.date] = r.minutes; });

  const result = [];
  while (cursor <= now) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    result.push({ date: key, minutes: map[key] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  res.json(result);
});

// ── Chart / Tags / Export ──

app.get('/api/chart', (req, res) => {
  const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 7));
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = toLocalDateStr(start);

  const rows = db.prepare(
    'SELECT substr(start_time,1,10) as date, SUM(duration) as total_minutes, COUNT(*) as session_count FROM sessions WHERE user_id = ? AND substr(start_time,1,10) >= ? GROUP BY substr(start_time,1,10) ORDER BY date ASC'
  ).all(req.userId, startStr);

  const map = {};
  rows.forEach(r => { map[r.date] = { minutes: r.total_minutes, count: r.session_count }; });

  const result = [];
  const cursor = new Date(start);
  for (let i = 0; i <= days; i++) {
    const ds = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    const found = map[ds];
    result.push({ date: ds, minutes: found ? found.minutes : 0, count: found ? found.count : 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  res.json(result);
});

app.get('/api/tags', (req, res) => {
  const rows = db.prepare('SELECT tag, SUM(duration) as total_minutes, COUNT(*) as session_count FROM sessions WHERE user_id = ? GROUP BY tag ORDER BY total_minutes DESC').all(req.userId);
  res.json(rows);
});

app.get('/api/export', (req, res) => {
  const rows = db.prepare('SELECT id, start_time, end_time, duration, tag, note FROM sessions WHERE user_id = ? ORDER BY start_time DESC').all(req.userId);
  const esc = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  let csv = '\uFEFFID,开始时间,结束时间,时长(分钟),标签,笔记\n';
  rows.forEach(r => csv += `${r.id},${esc(r.start_time)},${esc(r.end_time)},${r.duration},${esc(r.tag)},${esc(r.note)}\n`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=riverflow-export.csv');
  res.send(csv);
});

// ── Goals ──

app.get('/api/goals', (req, res) => {
  const row = db.prepare('SELECT daily_minutes, weekly_minutes FROM goals WHERE user_id = ?').get(req.userId);
  res.json(row || { daily_minutes: 120, weekly_minutes: 600 });
});

app.put('/api/goals', (req, res) => {
  const { daily_minutes, weekly_minutes } = req.body;
  const d = parseInt(daily_minutes, 10);
  const w = parseInt(weekly_minutes, 10);
  if (!d || d < 1 || d > 1440) return res.status(400).json({ error: '每日目标在 1-1440 分钟之间' });
  if (!w || w < 1 || w > 10080) return res.status(400).json({ error: '每周目标在 1-10080 分钟之间' });
  const existing = db.prepare('SELECT id FROM goals WHERE user_id = ?').get(req.userId);
  if (existing) {
    db.prepare('UPDATE goals SET daily_minutes = ?, weekly_minutes = ? WHERE user_id = ?').run(d, w, req.userId);
  } else {
    db.prepare('INSERT INTO goals (user_id, daily_minutes, weekly_minutes) VALUES (?, ?, ?)').run(req.userId, d, w);
  }
  res.json({ message: '目标更新成功' });
});

// ── General ──

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.json({ name: 'Riverflow API', version: '3.0.0' });
});

app.use((err, req, res, _next) => {
  console.error(`[${new Date().toLocaleString('zh-CN')}] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器已启动，端口: ${PORT}`);
});
