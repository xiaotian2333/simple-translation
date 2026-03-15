# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于OpenAI接口的简单翻译工具，包含Node.js后端服务器和前端Web界面。项目使用流式传输实现实时翻译效果。  
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
docker run -p 7860:7860 simple-translation
```

### 构建过程说明
构建命令会执行两个步骤：
1. 使用uglify-js压缩JavaScript代码
2. 执行build.js将CSS和JS内联到HTML文件中，生成output.html

## 架构说明

### 后端架构 (server.js)
- **静态文件服务**: 启动时预检查output.html文件存在性，智能选择提供构建版本或开发版本
- **日志系统**: 使用winston记录请求和错误信息，支持控制台和可选的文件日志（通过`log_file`变量控制）
- **CORS配置**: 严格限制跨域访问为 `translate.xt-url.com`
- **IP记录**: 支持代理环境，通过`edgeone-user-ip`、`x-forwarded-for`等头获取真实IP

### 前端架构 (js/script.js)
- **流式翻译**: 使用AbortController管理并发请求，通过SSE流式接收翻译结果，实时显示
- **Key管理**: 读取配置默认Key，用户自定义Key持久化到localStorage并优先生效
- **接口配置**: 用户可自定义API基础地址（需以`/v1`结尾），持久化到localStorage并优先生效
- **模型发现**: 通过OpenAI标准`/v1/models`接口获取模型列表
- **自动翻译**: 500ms防抖的输入触发翻译，避免频繁请求
- **UI响应**: 动态调整文本区域高度，实时字符计数，一键复制功能
- **主题系统**: 支持深色/浅色主题切换，使用CSS变量实现，偏好保存在localStorage
- **错误处理**: 统一的错误提示系统，支持网络错误、API错误、Key错误等

### Key状态管理架构
- **状态枚举**: 使用`TOKEN_STATUS`枚举管理所有Key状态（CONFIGURED、FETCHING、FETCH_FAILED、UNFETCHED、VALID）
- **全局状态变量**: `currentTokenStatus`作为唯一状态标记
- **集中更新**: `updateTokenStatus()`函数接收状态参数，不进行条件判断
- **状态同步**: 所有Key相关操作通过明确的函数调用更新状态

### 配置系统 (config.json)
- **API配置**: OpenAI API基础地址与默认Key
- **提示词模板**: 详细的系统提示词和用户提示词，支持`{{to}}`、`{{text}}`等变量替换
- **功能开关**: 等待时间等配置

### 构建系统 (build.js)
- **资源内联**: 将CSS和JavaScript文件内联到HTML中，减少HTTP请求
- **代码压缩**: 使用uglify-js压缩JavaScript，自定义CSS和HTML压缩算法
- **优化输出**: 生成单文件output.html，包含所有资源，适合生产环境部署

## 关键依赖

- **winston**: 结构化日志记录，支持多种传输方式和格式
- **uglify-js**: JavaScript代码压缩和混淆
- 无额外前端框架，使用原生JavaScript和现代Web API

## 环境变量

- **PORT**: 可选，默认7860，服务器监听端口

## 核心功能流程

1. **用户输入**: 文本输入框触发500ms防抖的自动翻译，支持清空时自动清除结果
2. **Key管理**: 优先使用用户配置的Key，若无则使用配置文件默认Key
3. **模型发现**: 使用OpenAI标准`/v1/models`接口获取模型列表
4. **流式翻译**: 向OpenAI API发送流式请求，通过SSE实时接收和显示翻译结果
5. **并发控制**: 使用AbortController确保同一时间只有一个翻译请求，避免资源浪费
6. **UI更新**: 实时更新翻译结果、Key状态、字符计数、模型选择等信息

## 开发注意事项

### 构建和部署
1. **构建优化**: 生产环境使用`pnpm build`生成单文件output.html，减少HTTP请求提升性能
2. **文件优先级**: 服务器启动时检查output.html，存在则优先提供构建版本，否则使用开发版本

### Key管理
3. **状态集中管理**: 使用`TOKEN_STATUS`枚举和`currentTokenStatus`全局变量管理Key状态
4. **明确状态更新**: 所有状态变化通过调用`updateTokenStatus(状态类型)`函数触发
5. **优先级**: 用户Key优先生效，未配置时使用配置文件默认Key

### 前端功能
6. **流式传输**: 使用AbortController确保同一时间只有一个翻译请求，避免资源浪费
7. **错误处理**: 统一的错误提示系统，网络错误和Key获取失败有专门的用户提示
8. **防抖机制**: 输入框500ms防抖避免频繁请求，提升用户体验
9. **HTML转义**: 所有输出内容都经过HTML转义防止XSS攻击
10. **主题持久化**: 用户主题偏好保存在localStorage中，支持系统主题自动检测
11. **输入监控**: 定时检查输入框状态，清空时自动清除输出结果

### 配置和扩展
12. **API配置**: 支持OpenAI API基础地址与默认Key配置
13. **用户输入限制**: 输出框已实现输入防护，阻止用户直接编辑、粘贴、拖拽和回车键操作
14. **模型选择**: 用户可以在前端选择不同模型，偏好会保存在localStorage中
15. **即时翻译触发**: 当用户修改模型、切换输入输出语言时，如果已有文本输入会立即触发翻译

## 代码架构特点

### 模块化设计
- **职责分离**: 前后端逻辑清晰分离，各自负责不同功能域
- **无框架依赖**: 使用原生JavaScript，减少依赖复杂度
- **事件驱动**: 基于事件监听器的用户交互设计

### 状态管理模式
- **枚举驱动**: 使用枚举定义明确的状态类型
- **全局状态**: 单一状态变量确保状态一致性
- **函数式更新**: 状态更新通过明确函数调用，避免隐式状态变化

### 性能优化
- **资源内联**: 构建时合并资源文件，减少网络请求
- **防抖控制**: 避免频繁API调用
- **流式处理**: 实时显示翻译结果，提升用户体验

### 安全考虑
- **CORS限制**: 严格限制跨域访问
- **输入验证**: HTML转义防止XSS攻击
- **Key管理**: 用户Key保存在浏览器本地存储
