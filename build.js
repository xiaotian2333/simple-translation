/**
 * 构建和压缩脚本
 * 1. 手动内联CSS和JavaScript到HTML文件
 * 2. 对CSS进行压缩
 * 3. 对HTML进行基本压缩优化
 */

const fs = require('fs');
const path = require('path');

// 日志函数
function log(message) {
    console.log(`[构建] ${message}`);
}

function logError(message) {
    console.error(`[构建错误] ${message}`);
}

// 清理函数 - 删除临时文件
function cleanup(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            log(`删除临时文件: ${filePath}`);
        }
    } catch (error) {
        logError(`删除临时文件失败: ${error.message}`);
    }
}

// 主要构建函数
function build() {
    const finalFile = 'output.html';
    
    try {
        log('开始构建...');
        
        // 步骤1: 读取原始HTML文件
        log('步骤1: 读取HTML文件...');
        let htmlContent = fs.readFileSync('index.html', 'utf8');
        log(`HTML文件大小: ${Math.round(htmlContent.length / 1024)}KB`);
        
        // 步骤2: 内联CSS
        log('步骤2: 内联CSS...');
        const cssContent = fs.readFileSync('css/style.css', 'utf8');
        log(`CSS文件大小: ${Math.round(cssContent.length / 1024)}KB`);
        htmlContent = htmlContent.replace(
            /<link[^>]*href="css\/style\.css"[^>]*>/,
            `<style>${compressCSS(cssContent)}</style>`
        );
        
        // 步骤3: 内联JavaScript
        log('步骤3: 内联JavaScript...');
        const jsContent = fs.readFileSync('js/script.min.js', 'utf8');
        log(`JavaScript文件大小: ${Math.round(jsContent.length / 1024)}KB`);
        
        // 替换HTML中的script标签
        htmlContent = htmlContent.replace(
            /<script[^>]*src="js\/script\.js"[^>]*><\/script>/,
            `<script>${jsContent}</script>`
        );
        
        // 步骤4: 应用基本压缩
        log('步骤4: 应用HTML压缩...');
        htmlContent = compressHTML(htmlContent);
        
        // 步骤5: 写入最终文件
        log('步骤5: 写入最终文件...');
        fs.writeFileSync(finalFile, htmlContent, 'utf8');
        
        const compressedSize = fs.statSync(finalFile).size;
        
        log(`构建完成!`);
        log(`压缩后大小: ${Math.round(compressedSize / 1024)}KB`);
        log(`输出文件: ${finalFile}`);
        
    } catch (error) {
        logError(`构建失败: ${error.message}`);
        process.exit(1);
    } finally {
        // 清理临时文件
        cleanup('js/script.min.js');
    }
}

// HTML压缩函数
function compressHTML(html) {
    return html
        // 移除注释 (保留重要的条件注释)
        .replace(/<!--[\s\S]*?(?<!<!\-\-)-->/g, '')
        
        // 压缩空白字符
        .replace(/\s+/g, ' ')
        
        // 移除标签间的空格
        .replace(/>\s+</g, '><')
        
        // 移除行首行尾空格
        .replace(/^\s+|\s+$/g, '')
        
        // 压缩CSS和JavaScript (在style和script标签内)
        .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, function(match, content) {
            return '<style>' + compressCSS(content) + '</style>';
        })
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(match, content) {
            return '<script>' + content + '</script>';
        })
        
        // 移除属性值的引号 (当安全时)
        .replace(/([a-zA-Z-]+)=["']([^"'<>]*)["']/g, function(match, attr, value) {
            // 只对安全的属性值移除引号
            if (/^[a-zA-Z0-9_-]+$/.test(value)) {
                return attr + '=' + value;
            }
            return match;
        })
        
        // 压缩布尔属性
        .replace(/checked="checked"/g, 'checked')
        .replace(/readonly="readonly"/g, 'readonly')
        .replace(/disabled="disabled"/g, 'disabled');
}

// CSS压缩函数
function compressCSS(css) {
    return css
        // 移除注释
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // 压缩空白
        .replace(/\s+/g, ' ')
        // 移除不必要的空格
        .replace(/\s*([{}:;,])\s*/g, '$1')
        // 移除最后的分号
        .replace(/;}/g, '}')
        .trim();
}


// 如果直接运行此脚本
if (require.main === module) {
    build();
}

module.exports = { build, compressHTML, compressCSS };