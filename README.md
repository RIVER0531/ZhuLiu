# 逐流

> Development from Peng Xiujiang

一款专注于记录深度工作时间的 Web 应用，帮助你培养专注习惯，追踪工作流状态。

## 主要功能

### 专注计时
- 正计时模式，记录每一次专注时长
- 支持 6 种标签分类：工作、学习、阅读、运动、创作、其他
- 切换页面或最小化浏览器后计时继续
- 空格键快速开始/停止
- 自动保存历史记录

### 番茄时钟
- 独立于专注计时的番茄工作法工具
- 可自定义工作/休息时长
- 环形进度指示器
- 完成时提示音
- 刷新页面后状态自动恢复

### 每日目标
- 设置每日专注目标时长
- 实时显示完成进度
- 统计页面展示今日/本月/累计数据

### 数据图表
- 7 天/30 天专注趋势图
- 标签分布统计
- 历史记录查看与删除
- 导出 CSV 文件

### 其他
- Material Design 3 设计风格
- 深色模式切换
- 专注音效（雨声、森林、海浪等白噪音）
- 响应式布局，支持移动端

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Vue Router |
| 后端 | Node.js + Express |
| 数据库 | MySQL 8.0 |
| 样式 | Material Design 3 |

## 项目结构

```
riverflow/
├── backend/
│   ├── app.js            # 后端入口
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   ├── components/   # 公共组件
│   │   ├── stores/       # 状态管理
│   │   ├── router/       # 路由配置
│   │   ├── App.vue       # 根组件
│   │   ├── main.js       # 入口文件
│   │   └── style.css     # 全局样式
│   ├── index.html
│   ├── vite.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 8.0

### 1. 创建数据库

在 MySQL 中执行：

```sql
CREATE DATABASE riverflow CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 2. 修改数据库密码

编辑 `backend/app.js`，修改第 15 行的密码：

```javascript
password: process.env.DB_PASSWORD || '你的MySQL密码',
```

### 3. 启动后端

```bash
cd backend
npm install
node app.js
```

看到 `服务器已启动，端口: 3001` 表示成功。

### 4. 启动前端

新打开一个终端：

```bash
cd frontend
npm install
npm run dev
```

浏览器访问终端显示的地址（通常是 `http://localhost:5173`）。

## Docker 部署

```bash
# 创建环境变量文件
cp .env.example .env

# 修改 .env 中的密码
# 启动所有服务
docker-compose up -d
```

访问 `http://服务器IP` 即可使用。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/sessions | 保存专注记录 |
| GET | /api/sessions | 获取历史记录（分页） |
| DELETE | /api/sessions/:id | 删除记录 |
| GET | /api/stats | 获取统计数据 |
| GET | /api/chart | 获取图表数据 |
| GET | /api/tags | 获取标签统计 |
| GET | /api/goals | 获取目标设置 |
| PUT | /api/goals | 更新目标设置 |
| GET | /api/export | 导出 CSV |
| GET | /api/health | 健康检查 |

## 使用说明

**专注计时**
1. 选择标签（工作、学习等）
2. 点击「开始专注」或按空格键
3. 专注完成后点击「停止并保存」

**番茄时钟**
1. 设置工作/休息时长
2. 点击「开始工作」
3. 工作结束后自动切换到休息时间
4. 休息结束后自动切换到工作时间

**查看统计**
- 点击顶部导航「统计」查看今日/本月/累计数据
- 点击「图表」查看趋势和标签分布
- 点击「历史」查看详细记录并可导出 CSV

## 许可

MIT
