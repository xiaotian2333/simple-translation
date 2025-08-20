// 获取DOM元素
const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const swapBtn = document.getElementById('swapBtn');
const sourceText = document.getElementById('sourceText');
const loading = document.getElementById('loading');
const resultArea = document.getElementById('resultArea');
const copyBtn = document.getElementById('copySourceBtn');
const charCount = document.getElementById('charCount');
const modelSelect = document.getElementById('modelSelect');
const tokenStatus = document.getElementById('tokenStatus');
const tokenCount = document.getElementById('tokenCount');

// HTML转义函数
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 配置变量
let config = {};
let currentToken = '';
let tokenExpireTime = 0;

// 语言名称映射
const languageNames = {
    'zh': '中文',
    'en': '英语',
    'ja': '日语',
    'ko': '韩语',
    'fr': '法语',
    'de': '德语',
    'es': '西班牙语',
    'ru': '俄语'
};


// 字符计数和自动翻译
sourceText.addEventListener('input', () => {
    charCount.textContent = `${sourceText.value.length} 字符`;
    adjustTextareaHeight(sourceText);
    triggerAutoTranslate();
});

// 粘贴事件监听
sourceText.addEventListener('paste', () => {
    // 延迟执行以确保粘贴内容已经插入
    setTimeout(() => {
        charCount.textContent = `${sourceText.value.length} 字符`;
        adjustTextareaHeight(sourceText);
        triggerAutoTranslate();
    }, 10);
});

// 语言切换功能
swapBtn.addEventListener('click', () => {
    const temp = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = temp;
    
    // 交换文本内容，保留换行符
    const tempText = sourceText.value;
    // 从resultArea获取纯文本内容，将<br>转换回换行符
    const resultText = resultArea.innerText.replace(/<br>/g, '\n');
    sourceText.value = resultText;
    // 将源文本转义后设置到结果区域，并处理换行符
    const escapedText = escapeHtml(tempText);
    resultArea.innerHTML = escapedText.replace(/\n/g, '<br>');
    
    // 更新字符计数
    charCount.textContent = `${sourceText.value.length} 字符`;
    
    // 隐藏token计数，因为这是交换内容而不是新的翻译
    tokenCount.style.display = 'none';
    
    // 调整两个区域的高度
    adjustTextareaHeight(sourceText);
    adjustResultAreaHeight();
});

// 复制功能
copyBtn.addEventListener('click', () => {
    // 使用innerText获取纯文本内容，它已经正确处理了换行符
    const text = resultArea.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已复制';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    });
});

// 打字机效果函数
function typeWriter(element, text, speed = 30) {
    let i = 0;
    element.textContent = '';
    element.classList.add('typing-cursor');
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            // 打字完成后移除光标效果
            element.classList.remove('typing-cursor');
        }
    }
    
    type();
}

// 自动翻译功能
let translateTimeout;
function triggerAutoTranslate() {
    const text = sourceText.value.trim();
    if (!text) {
        resultArea.innerHTML = '';
        tokenCount.style.display = 'none';
        adjustResultAreaHeight();
        return;
    }

    // 清除之前的定时器
    clearTimeout(translateTimeout);
    
    // 设置新的定时器，延迟500ms执行翻译
    translateTimeout = setTimeout(async () => {
        // 显示加载状态
        loading.classList.add('show');
        resultArea.textContent = '准备翻译...';
        tokenCount.style.display = 'none';

        try {
            await translateWithGLM(text, sourceLang.value, targetLang.value);
            // 流式传输会在函数内部实时显示，无需额外处理
        } catch (error) {
            console.error('翻译失败:', error);
            tokenCount.style.display = 'none';
            // resultArea.textContent = `翻译失败: ${error.message}`; // 错误提示已有另外的代码处理
        } finally {
            loading.classList.remove('show');
        }
    }, 500);
}

// 智谱GLM翻译函数
async function translateWithGLM(text, from, to) {
    const url = config.api_url;
    
    // 获取有效的Token
    const token = await getValidToken();
    
    // 构建提示词
    const sourceLangName = languageNames[from] || '自动检测';
    const targetLangName = languageNames[to] || '目标语言';
    
    const systemPromptText = config.system_prompt
        .replace('{{to}}', targetLangName)
        .replace('{{text}}', text)
        .replace('{{from}}', sourceLangName);
    
    const userPromptText = config.user_prompt
        .replace('{{to}}', targetLangName)
        .replace('{{text}}', text)
        .replace('{{from}}', sourceLangName);

    const requestBody = {
        model: modelSelect.value,
        messages: [
            {
                role: "system",
                content: systemPromptText
            },
            {
                role: "user",
                content: userPromptText
            }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        top_p: 0.1,
        stream: true,
        thinking:{ 
            type: config.thinking  // glm 4.5 新增参数，控制模型是否思考
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let thinkingContent = '';
    let isThinking = false;
    let totalTokens = 0;

    return new Promise((resolve, reject) => {
        function processStream() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    // 流结束，返回最终结果
                    updateTokenDisplay(totalTokens);
                    if (config.thinkPrint && thinkingContent) {
                        resolve(`思考过程：\n${thinkingContent}\n\n翻译结果：\n${fullContent}`);
                    } else {
                        resolve(fullContent);
                    }
                    return;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            const delta = json.choices[0].delta;
                            
                            // 统计token消耗
                            if (json.usage) {
                                totalTokens = json.usage.total_tokens || 0;
                            }
                            
                            if (delta.thinking_content) {
                                isThinking = true;
                                thinkingContent += delta.thinking_content;
                                // 实时显示思考过程
                                if (config.thinkPrint) {
                                    resultArea.innerHTML = `<div style="color: #666; font-style: italic;">思考中...\n${thinkingContent}</div>`;
                                    resultArea.scrollTop = resultArea.scrollHeight;
                                }
                            } else if (delta.content) {
                                isThinking = false;
                                fullContent += delta.content;
                                
                                // 立即显示内容
                                updateDisplay();
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }

                processStream(); // 继续处理下一个chunk
            }).catch(reject);
        }

        function updateDisplay() {
            if (config.thinkPrint && thinkingContent) {
                const escapedThinkingContent = escapeHtml(thinkingContent);
                const escapedFullContent = escapeHtml(fullContent);
                const htmlContent = `<div style="color: #666; font-style: italic; white-space: pre-wrap;">思考过程：\n${escapedThinkingContent}</div><hr style="margin: 10px 0;"><div style="white-space: pre-wrap;">${escapedFullContent}</div>`;
                resultArea.innerHTML = htmlContent;
            } else {
                // 先转义HTML，然后将换行符转换为<br>标签
                const escapedContent = escapeHtml(fullContent);
                resultArea.innerHTML = escapedContent.replace(/\n/g, '<br>');
            }
            
            // 延迟调整高度，确保DOM更新完成
            setTimeout(() => {
                resultArea.scrollTop = resultArea.scrollHeight;
                adjustResultAreaHeight();
            }, 10);
        }

        processStream(); // 开始处理流
    });
}

// 更新token显示
function updateTokenDisplay(tokens) {
    if (tokens > 0) {
        tokenCount.textContent = `Token: ${tokens}`;
        tokenCount.style.display = 'inline';
    } else {
        tokenCount.style.display = 'none';
    }
}

// 获取API Token
async function getApiToken() {
    try {
        const response = await fetch(config.token_api);
        const data = await response.json();
        
        if (data.apiToken && data.expireTime) {
            currentToken = data.apiToken;
            tokenExpireTime = Date.now() + (data.expireTime * 1000);
            updateTokenStatus();
            return currentToken;
        } else {
            throw new Error('Token API返回格式错误');
        }
    } catch (error) {
        console.error('获取Token失败:', error);
        throw error;
    }
}

// 检查Token是否有效
function isTokenValid() {
    return currentToken && Date.now() < tokenExpireTime;
}

// 更新Token状态显示
function updateTokenStatus() {
    if (!currentToken) {
        tokenStatus.textContent = 'Token: 未获取';
        tokenStatus.className = 'token-status';
    } else if (isTokenValid()) {
        const remainingTime = Math.floor((tokenExpireTime - Date.now()) / 1000);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        tokenStatus.textContent = `Token: 有效 (${minutes}:${seconds.toString().padStart(2, '0')})`;
        tokenStatus.className = 'token-status valid';
    } else {
        tokenStatus.textContent = 'Token: 已过期';
        tokenStatus.className = 'token-status expired';
    }
}

// 获取有效的Token
async function getValidToken() {
    if (!isTokenValid()) {
        await getApiToken();
    }
    return currentToken;
}

// 初始化模型选择器
function initModelSelector() {
    if (config.model && Array.isArray(config.model)) {
        modelSelect.innerHTML = '';
        config.model.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
        // 默认选择第一个模型
        if (config.model.length > 0) {
            modelSelect.value = config.model[0];
        }
    }
}

// 加载配置
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        config = await response.json();
        
        // 初始化模型选择器
        initModelSelector();
        
        // 初始获取Token
        await getApiToken();
        
        // 定时更新Token状态显示
        setInterval(updateTokenStatus, 1000);
        
    } catch (error) {
        console.error('加载配置文件失败:', error);
        if (error.message.includes('Failed to fetch')) {
            resultArea.textContent = '网络连接失败，请检查网络连接或服务器状态';
        } else if (error.message.includes('Token')) {
            resultArea.textContent = '获取Token失败，请检查Token API配置是否正确';
        } else {
            resultArea.textContent = '加载配置文件失败，请检查config.json是否存在且格式正确';
        }
    }
}

// 动态调整文本区域高度
function adjustTextareaHeight(textarea) {
    // 重置高度为auto以获取正确的scrollHeight
    textarea.style.height = 'auto';
    
    const minHeight = 100;
    const maxHeight = 600;
    
    // 使用scrollHeight获取实际内容高度
    const contentHeight = textarea.scrollHeight;
    let newHeight = Math.max(minHeight, contentHeight);
    newHeight = Math.min(maxHeight, newHeight);
    
    textarea.style.height = newHeight + 'px';
}

// 动态调整结果区域高度
function adjustResultAreaHeight() {
    const resultArea = document.getElementById('resultArea');
    
    // 临时移除高度限制，获取实际内容高度
    const originalHeight = resultArea.style.height;
    resultArea.style.height = 'auto';
    
    const minHeight = 100;
    const maxHeight = 600;
    
    // 使用scrollHeight获取实际内容高度
    const contentHeight = resultArea.scrollHeight;
    let newHeight = Math.max(minHeight, contentHeight);
    newHeight = Math.min(maxHeight, newHeight);
    
    resultArea.style.height = newHeight + 'px';
}

// 设置默认语言
function setDefaultLanguages() {
    sourceLang.value = 'en';  // 默认源语言为英语
    targetLang.value = 'zh';  // 默认目标语言为中文
}

// 定时检查输入框是否为空，如为空则清空输出框
function startInputCheckInterval() {
    setInterval(() => {
        if (sourceText.value.trim() === '') {
            resultArea.innerHTML = '';
            tokenCount.style.display = 'none';
            adjustResultAreaHeight();
        }
    }, 1000); // 每秒检查一次
}

// 页面加载时加载配置
window.addEventListener('load', () => {
    setDefaultLanguages();
    loadConfig();
    // 设置初始高度
    adjustTextareaHeight(sourceText);
    adjustResultAreaHeight();
    // 启动定时检查
    startInputCheckInterval();
});