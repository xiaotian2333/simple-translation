const http = require('http')
const jwt = require('jsonwebtoken')
const winston = require('winston')
const fs = require('fs')
const path = require('path')

// 配置参数
const PORT = 7860
const EXPIRE_TIME = 300 // 单位：秒
const API_KEY = process.env.API_KEY
const log_level = 'http'; // 日志级别 debug/http/info/warn/error
const log_file = false;
const plugin_name = '简单翻译'

// 初始化日志系统
const logger = winston.createLogger({
  level: log_level,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}][${level}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ]
});

if (log_file) {
  logger.add(
    new winston.transports.File({
      filename: `${plugin_name}.log`,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}][${level.toUpperCase()}] ${message}`;
        })
      )
    })
  );
}


/**
 * 生成JWT token
 * @param {string} apiKey - API Key，格式为 id.secret
 * @param {number} expSeconds - 过期时间，单位为秒
 * @returns {string} 生成的JWT token
 */
function generateToken(apiKey, expSeconds) {
    try {
        const [id, secret] = apiKey.split('.')
        
        const payload = {
            api_key: id,
            device_id: "immersive-B1HPtVIFRVwOB98Z0ubB2YMhIb8tunc1",
            exp: Math.round(Date.now()) + expSeconds * 1000,
            timestamp: Math.round(Date.now()),
            // msg: '网页翻译专用'
        }

        return jwt.sign(
            payload,
            secret,
            {
                algorithm: 'HS256',
                header: {
                    alg: 'HS256',
                    sign_type: 'SIGN'
                }
            }
        )
    } catch (e) {
        throw new Error('无效的API Key')
    }
}

// 获取用户真实IP
function getip(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'unknown';
  return ip;
}


// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', 'translate.xt-url.com')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
    }

    // 获取用户IP
    const ip = getip(req);
    logger.info(`请求来自IP: ${ip}`);

    // 处理/get_token路径的GET请求
    if (req.method === 'GET' && req.url === '/get_token') {
        res.setHeader('Content-Type', 'application/json')
        
        try {
            const token = generateToken(API_KEY, EXPIRE_TIME)
            const responseData = {
                apiToken: token,
                expireTime: EXPIRE_TIME
            }
            
            res.writeHead(200)
            res.end(JSON.stringify(responseData))
        } catch (error) {
            const errorResponse = {
                error: error.message,
                expireTime: EXPIRE_TIME
            }
            res.writeHead(500)
            res.end(JSON.stringify(errorResponse))
        }
    } else {
        // 处理静态文件请求
        let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url)
        
        // 获取文件扩展名
        const extname = path.extname(filePath)
        
        // 设置默认Content-Type
        let contentType = 'text/html'
        
        // 根据文件扩展名设置Content-Type
        switch (extname) {
            case '.js':
                contentType = 'text/javascript'
                break
            case '.css':
                contentType = 'text/css'
                break
            case '.json':
                contentType = 'application/json'
                break
            case '.png':
                contentType = 'image/png'
                break
            case '.jpg':
                contentType = 'image/jpg'
                break
            case '.ico':
                contentType = 'image/x-icon'
                break
        }

        // 读取文件
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' })
                    res.end('<h1>404 - File Not Found</h1>')
                } else {
                    res.writeHead(500)
                    res.end(`Server Error: ${err.code}`)
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType })
                res.end(content, 'utf-8')
            }
        })
    }
})

// 启动服务器前检查环境变量
if (!process.env.API_KEY) {
    logger.error('未设置API_KEY环境变量，请先设置环境变量')
}

// 启动服务器
server.listen(PORT, () => {
    logger.info(`${plugin_name}服务已启动，监听端口 ${PORT}`)
    logger.info(`访问 http://localhost:${PORT} 使用${plugin_name}`)
    logger.info(`访问 http://localhost:${PORT}/get_token 获取token`)
})

// 错误处理
server.on('error', (error) => {
    logger.error('服务器错误:', error)
})
