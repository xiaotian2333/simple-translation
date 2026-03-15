# 简单翻译

一个使用OpenAI接口的简单翻译网页，支持模型发现与流式翻译

## 关于智谱版  

位于glm分支，已停止更新和维护，如需使用可自行切换分支查看  

## 建议环境

- Node.js 20+
- npm 10+
- pnpm 9+ (可选)

## 使用方法

### 在线使用

电脑端推荐直接访问 [https://translate.xt-url.com](https://translate.xt-url.com/)  

提供安卓端网页套壳APP [立即下载](https://github.com/xiaotian2333/simple-translation/releases/download/V1.0/app.apk)

### 源码启动  

1. 克隆此项目

``` bash
git clone https://github.com/xiaotian2333/simple-translation.git
cd simple-translation
```

2. 安装依赖

``` bash
npm install # or pnpm install
```

3. 构建

``` bash
npm run build # or pnpm build
```

4. 启动

``` bash
npm run start # or pnpm start
```

### Dockerfile部署（huggingface）

整个git项目上传即可，API Key在 `config.json` 中配置，或在网页设置里填写并自动持久化。

或直接[fork此项目](https://huggingface.co/spaces/5onlp6u186/Translate)

### 访问

访问 `http://localhost:7860/` 即可使用  

## 配置说明

`config.json` 关键字段：

- `api_url`: OpenAI API基础地址（默认 `https://api.openai.com/v1`）
- `api_key`: 默认公共Key（不持久化，仅作为兜底）

用户在页面设置中填写的Key会保存到浏览器本地存储并优先生效。
用户在页面设置中填写的API接口地址会保存到浏览器本地存储并优先生效，需以 `/v1` 结尾。
