const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '9608400',
    database: process.env.DB_NAME || 'riverflow',
    charset: 'utf8mb4'
};

let pool;

async function initDB() {
    pool = mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    const connection = await pool.getConnection();
    console.log('已连接到MySQL数据库');

    // 专注记录表
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            duration INT NOT NULL COMMENT '专注时长（分钟）',
            tag VARCHAR(50) DEFAULT '其他' COMMENT '专注标签',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_start_time (start_time),
            INDEX idx_tag (tag)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 目标设置表
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS goals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            daily_minutes INT DEFAULT 120 COMMENT '每日目标（分钟）',
            weekly_minutes INT DEFAULT 600 COMMENT '每周目标（分钟）',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 插入默认目标（如果不存在）
    const [goalRows] = await connection.query('SELECT COUNT(*) as count FROM goals');
    if (goalRows[0].count === 0) {
        await connection.execute('INSERT INTO goals (daily_minutes, weekly_minutes) VALUES (120, 600)');
    }

    connection.release();
    console.log('数据库表初始化完成');
}

// ISO时间转MySQL DATETIME（UTC）
const toMySQLDateTime = (isoStr) => {
    const d = new Date(isoStr);
    return d.getUTCFullYear() + '-' +
        String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
        String(d.getUTCDate()).padStart(2, '0') + ' ' +
        String(d.getUTCHours()).padStart(2, '0') + ':' +
        String(d.getUTCMinutes()).padStart(2, '0') + ':' +
        String(d.getUTCSeconds()).padStart(2, '0');
};

// DATETIME转ISO字符串（UTC）
const toISOString = (dt) => {
    if (!dt) return null;
    const d = new Date(dt + 'Z');
    return d.toISOString();
};

// 格式化显示时间（东八区）
const formatDisplayTime = (dt) => {
    if (!dt) return '';
    const d = new Date(dt + 'Z');
    const offset = 8 * 60;
    const local = new Date(d.getTime() + offset * 60 * 1000);
    return local.getUTCFullYear() + '-' +
        String(local.getUTCMonth() + 1).padStart(2, '0') + '-' +
        String(local.getUTCDate()).padStart(2, '0') + ' ' +
        String(local.getUTCHours()).padStart(2, '0') + ':' +
        String(local.getUTCMinutes()).padStart(2, '0');
};

// 保存专注记录
app.post('/api/sessions', async (req, res) => {
    const { startTime, endTime, duration, tag } = req.body;

    if (!startTime || !endTime || duration === undefined) {
        return res.status(400).json({ error: '缺少必填字段' });
    }

    if (typeof duration !== 'number' || duration < 0 || duration > 1440) {
        return res.status(400).json({ error: '无效的时长值' });
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO sessions (start_time, end_time, duration, tag) VALUES (?, ?, ?, ?)',
            [toMySQLDateTime(startTime), toMySQLDateTime(endTime), duration, tag || '其他']
        );
        res.json({ id: result.insertId, message: '专注记录保存成功' });
    } catch (err) {
        console.error('保存记录失败:', err);
        res.status(500).json({ error: '保存失败，请稍后重试' });
    }
});

// 获取统计数据
app.get('/api/stats', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN DATE(start_time) = UTC_DATE() THEN duration ELSE 0 END), 0) as daily,
                COALESCE(SUM(CASE WHEN DATE_FORMAT(start_time, '%Y-%m') = DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m') THEN duration ELSE 0 END), 0) as monthly,
                COALESCE(SUM(duration), 0) as total,
                COALESCE(COUNT(CASE WHEN DATE(start_time) = UTC_DATE() THEN 1 END), 0) as daily_count,
                COUNT(*) as total_count
            FROM sessions
        `);

        const [goalRows] = await pool.query('SELECT daily_minutes, weekly_minutes FROM goals LIMIT 1');
        const goal = goalRows[0] || { daily_minutes: 120, weekly_minutes: 600 };

        res.json({
            ...rows[0],
            daily_goal: goal.daily_minutes,
            weekly_goal: goal.weekly_minutes
        });
    } catch (err) {
        console.error('获取统计失败:', err);
        res.status(500).json({ error: '获取统计数据失败' });
    }
});

// 获取历史记录
app.get('/api/sessions', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    try {
        const [countRows] = await pool.query('SELECT COUNT(*) as total FROM sessions');
        const total = countRows[0].total;

        const [rows] = await pool.query(
            `SELECT id, start_time, end_time, duration, tag, created_at 
             FROM sessions 
             ORDER BY start_time DESC 
             LIMIT ${limit} OFFSET ${offset}`
        );

        const data = rows.map(row => ({
            ...row,
            start_time: toISOString(row.start_time),
            end_time: toISOString(row.end_time)
        }));

        res.json({
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('获取历史记录失败:', err);
        res.status(500).json({ error: '获取历史记录失败' });
    }
});

// 删除专注记录
app.delete('/api/sessions/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ error: '无效的记录ID' });
    }

    try {
        const [result] = await pool.execute('DELETE FROM sessions WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '记录不存在' });
        }

        res.json({ message: '删除成功' });
    } catch (err) {
        console.error('删除记录失败:', err);
        res.status(500).json({ error: '删除失败' });
    }
});

// 获取目标设置
app.get('/api/goals', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM goals LIMIT 1');
        res.json(rows[0] || { daily_minutes: 120, weekly_minutes: 600 });
    } catch (err) {
        console.error('获取目标失败:', err);
        res.status(500).json({ error: '获取目标失败' });
    }
});

// 更新目标设置
app.put('/api/goals', async (req, res) => {
    const { daily_minutes, weekly_minutes } = req.body;

    try {
        await pool.execute(
            'UPDATE goals SET daily_minutes = ?, weekly_minutes = ? WHERE id = 1',
            [daily_minutes || 120, weekly_minutes || 600]
        );
        res.json({ message: '目标更新成功' });
    } catch (err) {
        console.error('更新目标失败:', err);
        res.status(500).json({ error: '更新目标失败' });
    }
});

// 获取图表数据（最近7天/30天）
app.get('/api/chart', async (req, res) => {
    const days = parseInt(req.query.days) || 7;

    try {
        const [rows] = await pool.query(`
            SELECT 
                DATE(start_time) as date,
                SUM(duration) as total_minutes,
                COUNT(*) as session_count
            FROM sessions
            WHERE start_time >= DATE_SUB(UTC_DATE(), INTERVAL ? DAY)
            GROUP BY DATE(start_time)
            ORDER BY date ASC
        `, [days]);

        // 填充没有数据的日期（使用本地日期）
        const result = [];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const found = rows.find(r => {
                const rDate = new Date(r.date);
                const rDateStr = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}-${String(rDate.getDate()).padStart(2, '0')}`;
                return rDateStr === dateStr;
            });
            result.push({
                date: dateStr,
                minutes: found ? found.total_minutes : 0,
                count: found ? found.session_count : 0
            });
        }

        res.json(result);
    } catch (err) {
        console.error('获取图表数据失败:', err);
        res.status(500).json({ error: '获取图表数据失败' });
    }
});

// 获取标签统计
app.get('/api/tags', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                tag,
                SUM(duration) as total_minutes,
                COUNT(*) as session_count
            FROM sessions
            GROUP BY tag
            ORDER BY total_minutes DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('获取标签统计失败:', err);
        res.status(500).json({ error: '获取标签统计失败' });
    }
});

// 导出CSV
app.get('/api/export', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, start_time, end_time, duration, tag FROM sessions ORDER BY start_time DESC'
        );

        let csv = '\uFEFFID,开始时间,结束时间,时长(分钟),标签\n';
        rows.forEach(row => {
            csv += `${row.id},${formatDisplayTime(row.start_time)},${formatDisplayTime(row.end_time)},${row.duration},${row.tag}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=riverflow-export.csv');
        res.send(csv);
    } catch (err) {
        console.error('导出失败:', err);
        res.status(500).json({ error: '导出失败' });
    }
});

// 健康检查
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ status: 'error', message: '数据库连接失败' });
    }
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        name: '逐流 API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            sessions: 'GET /api/sessions',
            stats: 'GET /api/stats',
            chart: 'GET /api/chart',
            tags: 'GET /api/tags',
            goals: 'GET/PUT /api/goals',
            export: 'GET /api/export'
        }
    });
});

app.listen(PORT, async () => {
    try {
        await initDB();
        console.log(`服务器已启动，端口: ${PORT}`);
    } catch (err) {
        console.error('数据库连接失败:', err);
        process.exit(1);
    }
});
