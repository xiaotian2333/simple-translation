# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于智谱GLM模型的简单翻译工具，包含Node.js后端服务器和前端Web界面。项目使用流式传输实现实时翻译效果。  
此项目使用pnpm作为包管理工具。

## 开发命令

### 安装依赖
```bash
npm install
# 或
pnpm install
```

### 启动开发服务器
```bash
pnpm start
# 或
node server.js
```

### 构建生产版本
```bash
pnpm build
# 将内联所有CSS和JS资源到单个output.html文件
```

### Docker部署
```bash
docker build -t simple-translation .
docker run -p 7860:7860 -e API_KEY=your_api_key_here simple-translation
```

### 构建过程说明
构建命令会执行两个步骤：
1. 使用uglify-js压缩JavaScript代码
2. 执行build.js将CSS和JS内联到HTML文件中，生成output.html

## 架构说明

### 后端架构 (server.js)
- **JWT Token生成服务**: `/get_token` 端点生成用于智谱API认证的JWT token，包含设备ID、时间戳等必要字段
- **静态文件服务**: 启动时预检查output.html文件存在性，智能选择提供构建版本或开发版本
- **日志系统**: 使用winston记录请求和错误信息，支持控制台和可选的文件日志（通过`log_file`变量控制）
- **CORS配置**: 严格限制跨域访问为 `translate.xt-url.com`
- **IP记录**: 支持代理环境，通过`edgeone-user-ip`、`x-forwarded-for`等头获取真实IP

### 前端架构 (js/script.js)
- **流式翻译**: 使用AbortController管理并发请求，通过SSE流式接收翻译结果，实时显示
- **Token管理**: 前端自动维护token生命周期，过期前自动刷新，显示token状态和剩余时间
- **自动翻译**: 500ms防抖的输入触发翻译，避免频繁请求
- **UI响应**: 动态调整文本区域高度，实时字符计数，一键复制功能
- **主题系统**: 支持深色/浅色主题切换，使用CSS变量实现，偏好保存在localStorage
- **思考模式**: GLM-4.5特有的thinking功能，可显示模型推理过程
- **错误处理**: 统一的错误提示系统，支持网络错误、API错误、token错误等

### 配置系统 (config.json)
- **API配置**: 智谱GLM API端点和支持的模型列表（glm-4.5系列、glm-4系列等）
- **提示词模板**: 详细的系统提示词和用户提示词，支持`{{to}}`、`{{text}}`等变量替换
- **功能开关**: thinking模式开关、是否显示思考过程、等待时间等配置

### 构建系统 (build.js)
- **资源内联**: 将CSS和JavaScript文件内联到HTML中，减少HTTP请求
- **代码压缩**: 使用uglify-js压缩JavaScript，自定义CSS和HTML压缩算法
- **优化输出**: 生成单文件output.html，包含所有资源，适合生产环境部署

## 关键依赖

- **jsonwebtoken**: JWT token生成，用于智谱API认证
- **winston**: 结构化日志记录，支持多种传输方式和格式
- **uglify-js**: JavaScript代码压缩和混淆
- 无额外前端框架，使用原生JavaScript和现代Web API

## 环境变量

- **API_KEY**: 必需，格式为 `id.secret`，用于JWT token生成
- **PORT**: 可选，默认7860，服务器监听端口

## 核心功能流程

1. **用户输入**: 文本输入框触发500ms防抖的自动翻译，支持清空时自动清除结果
2. **Token管理**: 前端检查token有效性，过期时自动从`/get_token`获取新token，显示失败状态
3. **流式翻译**: 向智谱API发送流式请求，通过SSE实时接收和显示翻译结果
4. **并发控制**: 使用AbortController确保同一时间只有一个翻译请求，避免资源浪费
5. **UI更新**: 实时更新翻译结果、token状态、字符计数、模型选择等信息

## 开发注意事项

1. **构建优化**: 生产环境使用`pnpm build`生成单文件output.html，减少HTTP请求提升性能
2. **文件优先级**: 服务器启动时检查output.html，存在则优先提供构建版本，否则使用开发版本
3. **Token管理**: 前端会自动处理token过期和重新获取，显示获取失败状态和网络错误
4. **流式传输**: 使用AbortController确保同一时间只有一个翻译请求，避免资源浪费
5. **错误处理**: 统一的错误提示系统，网络错误和token获取失败有专门的用户提示
6. **防抖机制**: 输入框500ms防抖避免频繁请求，提升用户体验
7. **HTML转义**: 所有输出内容都经过HTML转义防止XSS攻击
8. **主题持久化**: 用户主题偏好保存在localStorage中，支持系统主题自动检测
9. **输入监控**: 定时检查输入框状态，清空时自动清除输出结果
10. **API配置**: 支持多种GLM模型，可通过config.json配置API端点和模型列表
11. **安全考虑**: JWT token包含设备ID和时间戳，支持过期时间控制
12. **用户输入限制**: 输出框已实现输入防护，阻止用户直接编辑、粘贴、拖拽和回车键操作
13. **模型选择**: 用户可以在前端选择不同的GLM模型，偏好会保存在localStorage中
14. **即时翻译触发**: 当用户修改模型、切换输入输出语言时，如果已有文本输入会立即触发翻译