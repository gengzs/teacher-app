# Teacher Web - 教师助手网页端

一个适配桌面端的教师助手网页版，与微信小程序共享同一个云开发后端。

## 功能特性

- 📊 **首页概览** - 班级、学生、作业统计
- 📝 **作业管理** - 创建、查看作业
- 🏫 **班级管理** - 班级列表、详情
- 👨‍🎓 **学生管理** - 学生列表
- 🎨 **主题切换** - 樱花粉、天空蓝、抹茶绿等
- 💻 **桌面端适配** - 响应式设计，适配各种屏幕

## 项目结构

```
web/
├── server/                 # Node.js 后端（代理服务器）
│   ├── index.js          # Express 服务器
│   ├── package.json
│   └── .env              # 配置文件
│
└── frontend/              # Vue 3 前端
    ├── src/
    │   ├── views/        # 页面组件
    │   ├── router/       # 路由配置
    │   ├── utils/        # 工具函数
    │   └── styles/       # 样式文件
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 快速开始

### 1. 配置后端

```bash
cd web/server
npm install
```

编辑 `.env` 文件，填入你的微信云开发配置：

```
WECHAT_APPID=你的AppID
WECHAT_ENV_ID=你的环境ID
WECHAT_SECRET=你的Secret
# 可选：供 GET /api/functions 展示名称。微信 listfunctions 仅支持第三方 authorizer_token，小程序凭证无法拉取列表
WECHAT_CLOUD_FUNCTIONS=class,homework
TEACHER_PASSWORD=123456
PORT=3010
```

### 2. 启动后端服务

```bash
npm start
# 或开发模式
npm run dev
```

### 3. 启动前端

```bash
cd ../frontend
npm install
npm run dev
```

### 4. 访问

打开浏览器访问 http://localhost:5173

## 技术栈

- **前端**: Vue 3 + Vite + Vue Router
- **后端**: Node.js + Express
- **数据**: 微信云开发 HTTP API

## 登录说明

默认密码：`123456`

## 截图预览

网页端采用桌面端优先设计，包含：
- 侧边栏导航
- 统计卡片
- 数据表格
- 响应式布局

## 注意事项

1. 微信云开发的 HTTP API 需要配置合法域名
2. 如果部署到生产环境，需要配置 HTTPS
3. 建议使用反向代理（如 Nginx）进行部署
