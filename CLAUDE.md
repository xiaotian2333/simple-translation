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

## 架构说明

### 后端架构 (server.js)
- **JWT Token生成服务**: `/get_token` 端点生成用于智谱API认证的JWT token
- **静态文件服务**: 提供前端HTML、CSS、JS文件
- **日志系统**: 使用winston记录请求和错误信息
- **CORS配置**: 限制跨域访问为 `translate.xt-url.com`

### 前端架构 (js/script.js)
- **流式翻译**: 使用AbortController管理并发请求，支持实时显示翻译结果
- **Token管理**: 自动获取和刷新JWT token，显示token状态和剩余时间
- **自动翻译**: 500ms防抖的输入触发翻译
- **UI响应**: 动态调整文本区域高度，字符计数，复制功能

### 配置系统 (config.json)
- **API配置**: 智谱GLM API端点和模型列表
- **提示词模板**: 系统提示词和用户提示词，支持语言变量替换
- **功能开关**: thinking模式开关，是否显示思考过程

## 关键依赖

- **jsonwebtoken**: JWT token生成
- **winston**: 日志记录
- 无额外前端框架，使用原生JavaScript

## 环境变量

- **API_KEY**: 必需，格式为 `id.secret`，用于JWT token生成
- **PORT**: 可选，默认7860

## 开发注意事项

1. **Token管理**: 前端会自动处理token过期和重新获取
2. **流式传输**: 使用AbortController确保同一时间只有一个翻译请求
3. **错误处理**: 网络错误和token获取失败有专门的用户提示
4. **防抖机制**: 输入框500ms防抖避免频繁请求
5. **HTML转义**: 所有输出内容都经过HTML转义防止XSS攻击