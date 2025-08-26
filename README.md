# 简单翻译

一个使用智谱的简单翻译网页，集成token签发能力

建议环境

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

整个git项目上传，设置环境变量`API_KEY`为智谱key即可

或直接[fork此项目](https://huggingface.co/spaces/5onlp6u186/Translate)

### 访问

访问 `http://localhost:7860/` 即可使用  
