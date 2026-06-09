# 逐流 (Riverflow)

> Development from Peng Xiujiang

一款专注于记录深度工作时间的 Web 应用，帮助你培养专注习惯，追踪心流状态。

## 主要功能

### 专注计时
- 正计时模式，记录每一次专注时长
- 支持 6 种标签分类：工作、学习、阅读、运动、创作、其他
- 切换页面或最小化浏览器后计时继续
- 空格键快速开始/停止
- 停止后可记录专注笔记
- 自动保存历史记录

### 番茄时钟
- 可自定义工作/休息时长（15/25/30/45/60 分钟）
- 环形进度指示器
- 完成时提示音 + 浏览器通知
- 番茄完成自动创建专注记录（计入统计）
- 累计番茄数跨天不丢失
- 刷新页面后状态自动恢复

### 每日目标
- 设置每日/每周专注目标时长
- 实时显示完成进度与百分比
- 环形进度图可视化

### 热力图
- GitHub 风格 365 天专注热力图
- 5 级颜色深度（0/30/60/120/120+ 分钟）
- 暗色模式适配

### 数据图表
- 7 天/30 天专注趋势柱状图
- 标签分布统计（进度条可视化）
- 总计时长、总计次数、日均时长摘要

### 统计页面
- 日/周/月周期切换
- 目标完成环形图
- 今日/本月/累计数据卡片

### 历史记录
- 分页浏览所有专注记录
- 删除确认对话框
- 导出 CSV 文件
- 显示日期、时间段、标签、时长

### 其他
- 用户注册/登录，数据隔离
- Material Design 3 设计风格
- 深色模式切换
- 自定义背景图片
- 专注音效（雨声、森林、海浪等白噪音）
- 音量控制
- 响应式布局，支持移动端
- 页面关闭时定时器运行中自动警告

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Vue Router |
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 样式 | Material Design 3 (自定义 CSS 变量) |
| 部署 | Docker Compose / 裸机 PM2 |

## 项目结构

```
riverflow/
├── backend/
│   ├── app.js                # 后端入口（全部 API）
│   ├── package.json
│   ├── Dockerfile
│   └── riverflow.db          # SQLite 数据库（运行时生成）
├── frontend/
│   ├── src/
│   │   ├── views/            # 页面组件
│   │   │   ├── Home.vue      # 专注计时 + 热力图
│   │   │   ├── Pomodoro.vue  # 番茄时钟
│   │   │   ├── Chart.vue     # 图表
│   │   │   ├── Stats.vue     # 统计
│   │   │   ├── History.vue   # 历史记录
│   │   │   └── Login.vue     # 登录注册
│   │   ├── components/
│   │   │   └── SoundPlayer.vue  # 白噪音
│   │   ├── stores/
│   │   │   ├── auth.js       # 认证状态
│   │   │   └── timer.js      # 计时器状态
│   │   ├── utils/
│   │   │   └── format.js     # 公共工具函数
│   │   ├── constants/
│   │   │   └── tags.js       # 标签常量
│   │   ├── router/
│   │   │   └── index.js      # 路由配置（懒加载）
│   │   ├── api.js            # HTTP 请求封装
│   │   ├── App.vue           # 根组件
│   │   ├── main.js           # 入口文件
│   │   └── style.css         # 全局样式 + MD3 设计令牌
│   ├── index.html
│   ├── vite.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── riverflow_nginx.conf       # 裸机部署 nginx 配置
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18

### 1. 启动后端

```bash
cd backend
npm install
node app.js
```

看到 `SQLite 数据库初始化完成` 和 `服务器已启动，端口: 3001` 表示成功。数据库文件 `riverflow.db` 会自动创建。

### 2. 启动前端

新打开一个终端：

```bash
cd frontend
npm install
npm run dev
```

浏览器访问终端显示的地址（通常是 `http://localhost:5173`）。

### 3. 注册账号

首次使用需注册账号，之后登录即可。

## Docker 部署

```bash
docker-compose up -d
```

前端通过 nginx 暴露在 3000 端口，API 反向代理到后端 3001 端口。

## API 接口

### 认证

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 注册 | 否 |
| POST | /api/auth/login | 登录 | 否 |
| GET | /api/auth/me | 验证 token | 是 |

### 专注记录

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/sessions | 保存专注记录 | 是 |
| GET | /api/sessions | 获取历史记录（分页） | 是 |
| DELETE | /api/sessions/:id | 删除记录 | 是 |

### 统计与图表

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/stats | 获取统计数据（日/周/月） | 是 |
| GET | /api/chart | 获取图表数据 | 是 |
| GET | /api/tags | 获取标签统计 | 是 |
| GET | /api/heatmap | 获取 365 天热力图数据 | 是 |

### 目标与导出

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/goals | 获取目标设置 | 是 |
| PUT | /api/goals | 更新目标设置 | 是 |
| GET | /api/export | 导出 CSV | 是 |

### 系统

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/health | 健康检查 | 否 |

## 使用说明

**专注计时**
1. 选择标签（工作、学习等）
2. 点击「开始专注」或按空格键
3. 专注完成后点击「停止并保存」
4. 可选填写专注笔记

**番茄时钟**
1. 设置工作/休息时长
2. 点击「开始工作」
3. 工作结束后自动切换到休息时间
4. 番茄完成自动保存为专注记录

**查看统计**
- 点击顶部导航「统计」查看日/周/月数据与目标进度
- 点击「图表」查看趋势和标签分布
- 点击「历史」查看详细记录并可导出 CSV

## 许可

MIT
