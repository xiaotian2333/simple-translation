# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于智谱GLM模型的简单翻译工具，包含Node.js后端服务器和前端Web界面。项目使用流式传输实现实时翻译效果。  
此项目使用pnpm作为包管理工具。

## 开发命令

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

## 架构说明

### 后端架构 (server.js)
- **JWT Token生成服务**: `/get_token` 端点生成用于智谱API认证的JWT token
- **静态文件服务**: 启动时检查output.html文件，如存在则优先提供构建版本，否则提供index.html
- **日志系统**: 使用winston记录请求和错误信息，支持控制台和文件日志
- **CORS配置**: 限制跨域访问为 `translate.xt-url.com`
- **IP记录**: 记录请求来源IP地址

### 前端架构 (js/script.js)
- **流式翻译**: 使用AbortController管理并发请求，支持实时显示翻译结果
- **Token管理**: 自动获取和刷新JWT token，显示token状态和剩余时间
- **自动翻译**: 500ms防抖的输入触发翻译
- **UI响应**: 动态调整文本区域高度，字符计数，复制功能
- **主题系统**: 支持深色/浅色主题切换，会记住用户偏好
- **思考模式**: GLM-4.5特有的thinking功能，可显示模型思考过程

### 配置系统 (config.json)
- **API配置**: 智谱GLM API端点和模型列表
- **提示词模板**: 系统提示词和用户提示词，支持语言变量替换
- **功能开关**: thinking模式开关，是否显示思考过程

### 前端样式 (css/style.css)
- **CSS变量系统**: 使用CSS变量管理主题颜色
- **响应式设计**: 支持不同屏幕尺寸
- **深色模式**: 完整的深色主题支持

## 关键依赖

- **jsonwebtoken**: JWT token生成
- **winston**: 日志记录
- 无额外前端框架，使用原生JavaScript

## 环境变量

- **API_KEY**: 必需，格式为 `id.secret`，用于JWT token生成
- **PORT**: 可选，默认7860

## 核心功能流程

1. **用户输入**: 文本输入框触发500ms防抖的自动翻译
2. **Token管理**: 前端检查token有效性，过期时自动从`/get_token`获取新token
3. **流式翻译**: 向智谱API发送流式请求，实时显示翻译结果
4. **并发控制**: 使用AbortController确保同一时间只有一个翻译请求
5. **UI更新**: 实时更新翻译结果、token状态、字符计数等信息

## 开发注意事项

1. **构建优化**: 生产环境使用`pnpm build`生成单文件output.html，减少HTTP请求提升性能
2. **文件优先级**: 服务器启动时检查output.html，存在则优先提供构建版本，否则使用开发版本
3. **Token管理**: 前端会自动处理token过期和重新获取，显示获取失败状态
4. **流式传输**: 使用AbortController确保同一时间只有一个翻译请求，避免资源浪费
5. **错误处理**: 网络错误和token获取失败有专门的用户提示
6. **防抖机制**: 输入框500ms防抖避免频繁请求，提升用户体验
7. **HTML转义**: 所有输出内容都经过HTML转义防止XSS攻击
8. **主题持久化**: 用户主题偏好保存在localStorage中
9. **输入监控**: 定时检查输入框状态，清空时自动清除输出结果