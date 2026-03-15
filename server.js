/**
 * ====================== 简单翻译服务器 ======================
 * 
 * 基于Node.js的简单翻译服务器，提供以下功能：
 * 1. 静态文件服务 - 提供前端HTML、CSS、JS文件
 * 2. 日志记录 - 记录请求和错误信息
 * 3. CORS支持 - 限制跨域访问
 * 
 * 启动命令：node server.js
 */

// ====================== 依赖模块导入 ======================
const http = require('http')          // HTTP服务器模块
const winston = require('winston')     // 日志记录模块
const fs = require('fs')              // 文件系统模块
const path = require('path')          // 路径处理模块

// ====================== 服务器配置 ======================
const PORT = 7860                      // 服务器监听端口
const log_level = 'http';              // 日志级别：debug/http/info/warn/error
const log_file = false;                // 是否启用文件日志
const plugin_name = '简单翻译'         // 插件名称，用于日志文件名

// ====================== 日志系统配置 ======================

/**
 * 初始化Winston日志系统
 * 配置控制台和文件日志输出
 */
const logger = winston.createLogger({
    level: log_level,                                    // 设置日志级别
    format: winston.format.combine(                      // 组合多个格式化器
        winston.format.colorize(),                          // 控制台颜色输出
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // 时间戳格式
        winston.format.printf(({ timestamp, level, message }) => {     // 自定义输出格式
            return `[${timestamp}][${level}] ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),                   // 控制台输出
    ]
});

/**
 * 如果启用文件日志，添加文件传输器
 * 可选功能，用于持久化日志记录
 */
if (log_file) {
    logger.add(
        new winston.transports.File({
            filename: `${plugin_name}.log`,                   // 日志文件名
            format: winston.format.combine(                  // 文件日志格式
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}][${level.toUpperCase()}] ${message}`;
                })
            )
        })
    );
}


// ====================== 工具函数 ======================

/**
 * 获取用户真实IP地址
 * 支持代理服务器和负载均衡环境
 * @param {http.IncomingMessage} req - HTTP请求对象
 * @returns {string} 用户IP地址
 */
function getip(req) {
    const ip = req.headers['edgeone-user-ip'] || // 腾讯EO的自定义IP头
        req.headers['x-forwarded-for'] ||  // 代理服务器转发的IP
        req.socket.remoteAddress ||        // 直接连接的IP
        req.ip ||                          // Express框架的IP
        'unknown';                         // 无法获取时的默认值
    return ip;
}

// ====================== HTTP服务器 ======================

/**
 * 创建HTTP服务器
 * 处理Token生成请求和静态文件服务
 */
const server = http.createServer((req, res) => {
    // ====================== CORS配置 ======================
    // 设置跨域资源共享头，限制只允许特定域名访问
    res.setHeader('Access-Control-Allow-Origin', 'translate.xt-url.com')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
    }

    // ====================== 请求日志记录 ======================
    // 获取用户IP并记录请求信息
    const ip = getip(req);
    logger.http(`请求 ${req.method} ${req.url} 来自 IP: ${ip}`);

    // ====================== 静态文件服务 ======================

    // 构建文件路径，优先提供output.html
    let filePath
    if (req.url === '/') {
        // 使用启动时预检查的结果
        if (hasOutputFile) {
            filePath = outputPath
        } else {
            filePath = path.join(__dirname, 'index.html')
        }
    } else {
        filePath = path.join(__dirname, req.url)
    }

    // 获取文件扩展名
    const extname = path.extname(filePath)

    // 设置默认Content-Type
    let contentType = 'text/html'

    // 根据文件扩展名设置正确的MIME类型
    switch (extname) {
        case '.js':
            contentType = 'text/javascript'// JavaScript文件
            break
        case '.css':
            contentType = 'text/css'// CSS样式文件
            break
        case '.json':
            contentType = 'application/json'// JSON配置文件
            break
        case '.png':
            contentType = 'image/png'// PNG图片
            break
        case '.jpg':
            contentType = 'image/jpg'// JPG图片
            break
        case '.ico':
            contentType = 'image/x-icon'// 网站图标
            break
        case '.svg':
            contentType = 'image/svg+xml;charset=utf-8'// SVG图片
            break
    }

    // 读取并返回文件内容
    fs.readFile(filePath, (err, content) => {
        if (err) {
            // 文件不存在错误
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' })
                res.end('<h1>404 - File Not Found</h1>')
            } else {
                // 服务器内部错误
                res.writeHead(500)
                res.end(`Server Error: ${err.code}`)
            }
        } else {
            // 成功返回文件内容
            res.writeHead(200, { 'Content-Type': contentType })
            res.end(content, 'utf-8')
        }
    })
})

// ====================== 服务器启动 ======================

/**
 * 启动服务器前检查是否有构建产物
 * 如有 output.html 则优先使用
 */
const outputPath = path.join(__dirname, 'output.html')
const hasOutputFile = fs.existsSync(outputPath)

/**
 * 启动HTTP服务器
 * 监听指定端口，提供Web服务
 */
server.listen(PORT, () => {
    // 输出文件检查结果
    if (!hasOutputFile) {
        logger.warn('未找到output.html文件，将使用index.html提供对外服务')
        logger.warn('如在生产环境部署请执行 npm run build 命令以优化性能')
    }
    logger.info(`${plugin_name}服务已启动，监听端口 ${PORT}`)
    logger.info(`访问 http://localhost:${PORT} 使用${plugin_name}`)
})

/**
 * 服务器错误处理
 * 监听服务器级别的错误事件
 */
server.on('error', (error) => {
    logger.error('服务器错误:', error)
})

/**
 * ====================== 服务器启动完成 ======================
 * 
 * 服务器现在可以处理以下请求：
 * 1. GET / - 返回主页
 * 2. GET /* - 返回静态文件
 * 
 * 使用方法：
 * 1. 启动服务器：node server.js
 * 2. 访问：http://localhost:7860
 */
