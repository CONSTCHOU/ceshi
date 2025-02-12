# AI 网页内容提取器

一个基于 AI 的网页内容自动提取工具，支持多个 AI 服务提供商，具有缓存机制和错误重试功能，并提供友好的 Web 界面。

## 功能特点

- 🤖 支持多个 AI 服务（OpenAI、DeepSeek、Gemini）
- 💾 智能缓存机制，减少 API 调用
- 🔄 自动重试和故障转移
- 📊 结果导出为 Excel 格式
- 🎯 智能选择器提取
- 🚀 支持批量处理多个网址
- 🖥️ 现代化 Web 界面
- 🎯 响应式设计
- 🔋 智能资源管理
- 📸 自动截图功能
- 🧹 定时清理机制
- 🎯 智能滚动加载
- 🔨 支持打包为可执行文件
- 📦 提供完整安装程序
- 🛡️ 自动环境检查
- 📝 详细的日志记录

## 系统要求

- Node.js >= 14
- npm >= 6
- Chrome/Chromium (用于网页爬取)
- 内存 >= 1GB
- 磁盘空间 >= 500MB
- 网络连接（用于下载依赖和组件）
- Windows 7 及以上（64位）

## 安装说明

### 方式一：直接运行
1. 下载 ai-extractor.exe
2. 双击运行，程序会自动检查和安装必要组件
3. 按照提示完成配置

### 方式二：完整安装包
1. 下载 ai-extractor-setup.exe
2. 运行安装程序
3. 按照安装向导完成安装

### 开发者安装
1. 克隆项目：
```bash
git clone <repository-url>
cd ai-web-extractor
```

2. 安装依赖：
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd web-ui
npm install
```

3. 配置环境变量

### 打包说明

#### 方式一：构建可执行文件
```bash
# 构建单文件版本
npm run build:exe

# 输出: dist/ai-extractor.exe
```

#### 方式二：创建安装包
```bash
# 构建完整安装包
npm run package

# 输出: dist/ai-extractor-setup.exe
```

#### 打包配置
在 `build-config.ts` 中可以配置打包参数：
```typescript
PACKAGING: {
  OUTPUT_DIR: 'dist',
  TEMP_DIR: '.temp',
  INSTALLER_NAME: 'ai-extractor-setup.exe',
  EXECUTABLE_NAME: 'ai-extractor.exe',
  // ...
}
```

#### 错误处理配置
```typescript
ERROR_HANDLING: {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000
}
```

#### 日志配置
```typescript
LOGGING: {
  ENABLED: true,
  LEVEL: 'info',
  FILE: 'build.log'
}
```

### 系统要求
- Windows 7/8/10/11 (64位)
- 至少 1GB 可用内存
- 至少 500MB 可用磁盘空间
- 网络连接

### 注意事项
- 首次运行可能需要安装一些组件，请保持网络连接
- 如果遇到权限问题，请以管理员身份运行
- 建议关闭杀毒软件，避免误报
- 打包需要 Node.js v14 或更高版本
- 打包过程需要网络连接以下载依赖
- 确保有足够的磁盘空间用于打包
- 打包可能需要较长时间，请耐心等待
- 打包过程会自动检查环境依赖
- 支持断点续传和错误重试
- 提供详细的构建日志
- 自动清理临时文件

## 安装

1. 克隆项目：
```bash
git clone <repository-url>
cd ai-web-extractor
```

2. 安装依赖：
```bash
# 安装后端依赖
npm install

# 安装 Playwright 浏览器
npx playwright install chromium

# 安装前端依赖
cd web-ui
npm install
```

3. 配置环境变量：
创建 `.env` 文件并添加以下内容：
```env
OPENAI_API_KEY=你的OpenAI_API密钥
DEEPSEEK_API_KEY=你的DeepSeek_API密钥
GEMINI_API_KEY=你的Gemini_API密钥
PORT=3000  # 可选，默认 3000
NODE_ENV=development  # 开发环境设置
MAX_MEMORY=512  # 最大内存限制(MB)
```

## 性能优化

### 浏览器优化
- 智能实例管理
- 自动内存回收
- 并发任务控制
- 超时自动处理

### 资源管理
- 定时清理缓存
- 自动删除旧截图
- 过期任务清理
- 内存使用监控

### 性能配置
```typescript
PERFORMANCE: {
  MAX_CONCURRENT_TASKS: 3,
  TASK_TIMEOUT: 60000,
  MEMORY_LIMIT: 512 * 1024 * 1024, // 512MB
  CAPTURE_SCREENSHOT: false,
  CLEANUP_INTERVAL: 3600000 // 1小时
}
```

### 浏览器配置
```typescript
BROWSER: {
  VIEWPORT: {
    WIDTH: 1280,
    HEIGHT: 800
  },
  USER_AGENT: '...',
  HEADERS: {
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
  }
}
```

## 启动服务

1. 启动后端服务：
```bash
# 在项目根目录
npm start
```

2. 启动前端服务：
```bash
# 在 web-ui 目录
npm run dev
```

3. 访问 Web 界面：
打开浏览器访问 `http://localhost:5173`

## Web 界面功能

- 📝 提交新的爬取任务
- 📋 查看任务列表和状态
- 🔍 预览爬取结果
- ⬇️ 下载 Excel 报告
- 🔄 实时状态更新
- ⚙️ 可视化系统设置
- 📊 系统资源监控
- 🔄 自动任务清理
- 📖 在线帮助文档
- 💡 常见问题解答
- 🔔 任务状态通知
- 📈 系统状态面板

## 系统设置

### AI 服务设置
- 配置多个 AI 服务（OpenAI、DeepSeek、Gemini）
- 调整服务优先级
- 设置模型参数
- 启用/禁用特定服务

### 选择器设置
- 自定义 HTML 选择器
- 配置备用选择器
- 实时预览选择器效果

### 缓存设置
- 启用/禁用缓存
- 设置缓存过期时间
- 限制缓存条目数
- 一键清除缓存

### 性能设置
- 控制并发任务数
- 设置超时时间
- 配置内存限制

### 前端
- vue: 前端框架
- element-plus: UI 组件库
- element-plus/icons-vue: 图标组件
- axios: HTTP 客户端
- typescript: 类型支持
- date-fns: 日期处理
- lodash-es: 工具函数库

## 配置选项

### 选择器配置
在 `config.ts` 中可以配置 HTML 选择器：
```typescript
SELECTORS: {
  TITLE: 'h1, .article-title, .post-title',
  CONTENT: '.main-content, .article-content, .post-content, article',
  TIMESTAMP: '.timestamp, .date, time, .published-date',
  // ...
}
```

### 缓存设置
```typescript
CACHE_SETTINGS: {
  ENABLED: true,
  MAX_AGE: 24 * 60 * 60 * 1000, // 24小时
  MAX_ENTRIES: 1000
}
```

### AI 服务配置
```typescript
AI_SETTINGS: {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  MAX_TEXT_LENGTH: 1000,
  SERVICES: {
    OPENAI: {
      ENABLED: true,
      PRIORITY: 1,
      // ...
    },
    DEEPSEEK: {
      ENABLED: true,
      PRIORITY: 2,
      // ...
    },
    GEMINI: {
      ENABLED: true,
      PRIORITY: 3,
      MODEL: 'gemini-pro'
    }
  }
}
```

## 项目结构
```
.
├── src/
│   ├── browser-automation.ts  # 浏览器自动化逻辑
│   ├── config.ts             # 配置文件
│   ├── build-config.ts       # 打包配置
│   ├── install-checker.ts    # 安装检查
│   ├── launcher.ts          # 启动器
│   ├── server.ts            # API 服务器
│   └── index.ts             # 入口文件
├── scripts/
│   ├── build.ts             # 构建脚本
│   └── post-build.js        # 后处理脚本
├── web-ui/                  # 前端项目
│   ├── src/
│   │   ├── components/     # Vue 组件
│   │   │   ├── TaskManager.vue    # 任务管理组件
│   │   │   └── SettingsDialog.vue # 设置管理组件
│   │   ├── api/           # API 客户端
│   │   │   ├── scraper.ts  # 爬虫 API
│   │   │   └── settings.ts # 设置 API
│   │   ├── assets/        # 静态资源
│   │   │   └── icons/     # 图标资源
│   │   └── App.vue        # 主应用组件
│   └── package.json       # 前端依赖
├── resources/              # 资源文件
│   ├── icon.ico           # 应用图标
│   └── installing.gif     # 安装动画
├── .env                    # 环境变量
└── README.md              # 说明文档
```

## API 接口

### POST /api/tasks
创建新的爬取任务
```json
{
  "url": "https://example.com"
}
```

### GET /api/tasks
获取任务列表

### GET /api/tasks/:id
获取单个任务详情

### GET /api/tasks/:id/download
下载任务结果（Excel）

### GET /api/settings
获取系统设置

### PUT /api/settings
更新系统设置

### POST /api/settings/clear-cache
清除系统缓存

## 注意事项

- 确保遵守目标网站的使用条款和爬虫协议
- 合理设置请求间隔，避免对目标站点造成压力
- 定期检查和更新 AI API 密钥
- 监控缓存大小，避免占用过多磁盘空间
- 在生产环境中建议配置反向代理（如 Nginx）
- 定期备份系统设置
- 谨慎修改 AI 服务配置
- 注意内存使用限制
- 定期检查日志文件
- 配置适当的清理周期
- 监控系统资源使用
- 关注系统状态面板
- 定期查看帮助文档更新
- 及时处理任务通知

## 依赖项

### 后端
- playwright: 浏览器自动化
- openai: OpenAI API 客户端
- axios: HTTP 客户端
- xlsx: Excel 文件处理
- express: Web 服务器
- cors: 跨域支持
- uuid: 唯一标识符生成
- @google/generative-ai: Gemini API 客户端
- node-schedule: 定时任务
- memory-cache: 内存缓存
- pkg: 可执行文件打包
- electron-winstaller: 安装包创建
- archiver: 资源打包
- fs-extra: 文件操作
- semver: 版本检查

### 前端
- vue: 前端框架
- element-plus: UI 组件库
- element-plus/icons-vue: 图标组件
- axios: HTTP 客户端
- typescript: 类型支持
- date-fns: 日期处理
- lodash-es: 工具函数库

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 作者

[baiye]

## 更新日志

### v1.1.0
- 添加 Web 界面
- 支持任务管理
- 添加实时状态更新
- 优化用户体验

### v1.0.0
- 初始版本发布
- 支持 OpenAI 和 DeepSeek
- 实现基本功能

### v1.2.0
- 添加 Google Gemini 支持
- 优化服务优先级管理
- 改进错误处理

### v1.3.0
- 添加可视化设置界面
- 支持实时配置 AI 服务
- 添加选择器管理功能
- 优化缓存控制

### v1.4.0
- 添加智能资源管理
- 优化浏览器实例控制
- 添加定时清理机制
- 改进性能监控
- 优化内存使用
- 优化 WebUI 界面
- 添加帮助文档系统
- 添加系统状态面板
- 改进用户体验
- 添加打包功能
- 支持创建安装程序
- 优化安装体验
- 添加环境检查功能
- 改进错误处理机制
- 添加构建日志系统
- 优化资源管理