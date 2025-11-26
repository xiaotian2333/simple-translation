/**
 * ====================== DOM元素引用 ======================
 * 获取页面中需要操作的DOM元素，统一管理便于维护
 */

// 语言选择相关元素
const sourceLang = document.getElementById('sourceLang');      // 源语言选择下拉框
const targetLang = document.getElementById('targetLang');      // 目标语言选择下拉框
const swapBtn = document.getElementById('swapBtn');            // 语言交换按钮

// 文本输入输出相关元素
const sourceText = document.getElementById('sourceText');      // 源文本输入框
const loading = document.getElementById('loading');            // 加载状态提示
const resultArea = document.getElementById('resultArea');      // 翻译结果显示区域
const copyBtn = document.getElementById('copySourceBtn');      // 复制按钮

// 状态显示相关元素
const charCount = document.getElementById('charCount');        // 字符计数显示
const modelSelect = document.getElementById('modelSelect');    // 模型选择下拉框
const tokenStatus = document.getElementById('tokenStatus');    // Token状态显示
const tokenCount = document.getElementById('tokenCount');      // Token计数显示

// 错误提示相关元素
const errorToast = document.getElementById('errorToast');      // 错误提示容器
const errorMessage = document.getElementById('errorMessage');  // 错误提示消息
const errorClose = document.getElementById('errorClose');      // 错误提示关闭按钮

// 设置面板相关元素
const settingsHeader = document.getElementById('settingsHeader');    // 设置面板头部
const settingsContent = document.getElementById('settingsContent');  // 设置面板内容
const settingsToggle = document.getElementById('settingsToggle');      // 设置折叠按钮

// API Key相关元素
const apiKeyInput = document.getElementById('apiKeyInput');          // API Key输入框
const apiKeySave = document.getElementById('apiKeySave');              // API Key保存按钮

// 关于弹窗相关元素
const aboutBtn = document.getElementById('aboutBtn');                  // 关于按钮
const aboutModal = document.getElementById('aboutModal');              // 关于弹窗容器
const aboutModalClose = document.getElementById('aboutModalClose');    // 关于弹窗关闭按钮
const aboutLogo = document.getElementById('aboutLogo');                // 关于Logo容器
const aboutDescription = document.getElementById('aboutDescription');  // 关于描述
const aboutAuthor = document.getElementById('aboutAuthor');            // 关于作者
const aboutVersion = document.getElementById('aboutVersion');          // 关于版本
const aboutLinks = document.getElementById('aboutLinks');              // 关于链接容器

/**
 * ====================== 工具函数 ======================
 */

/**
 * HTML转义函数 - 防止XSS攻击
 * @param {string} text - 需要转义的文本
 * @returns {string} 转义后的安全文本
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',    // 和号
        '<': '&lt;',     // 小于号
        '>': '&gt;',     // 大于号
        '"': '&quot;',   // 双引号
        "'": '&#039;'    // 单引号
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 显示错误提示
 * @param {string} message - 错误消息
 * @param {number} duration - 显示持续时间（毫秒），默认5000ms
 */
function showErrorToast(message, duration = 5000) {
    // 设置错误消息
    errorMessage.textContent = message;

    // 显示错误提示
    errorToast.classList.add('show');

    // 设置自动隐藏定时器
    setTimeout(() => {
        hideErrorToast();
    }, duration);
}

/**
 * 隐藏错误提示
 */
function hideErrorToast() {
    errorToast.classList.remove('show');
}

/**
 * 显示关于弹窗
 */
function showAboutModal() {
    if (!config.About) return;

    // 清空并填充弹窗内容
    aboutLogo.innerHTML = '';
    aboutDescription.textContent = '';
    aboutAuthor.textContent = '';
    aboutVersion.textContent = '';
    aboutLinks.innerHTML = '';

    // 加载Logo
    if (config.About.logo) {
        const img = document.createElement('img');
        img.src = config.About.logo;
        img.alt = 'Logo';
        aboutLogo.appendChild(img);
    }

    // 加载描述
    if (config.About.description) {
        aboutDescription.textContent = config.About.description;
    }

    // 加载作者信息
    if (config.About.author) {
        aboutAuthor.textContent = `作者：${config.About.author}`;
    }

    // 加载链接
    if (config.About.links && Array.isArray(config.About.links)) {
        config.About.links.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.textContent = link.name;
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.className = 'about-link';
            aboutLinks.appendChild(linkElement);
        });
    }

    // 显示弹窗
    aboutModal.classList.add('show');
}

/**
 * 隐藏关于弹窗
 */
function hideAboutModal() {
    aboutModal.classList.remove('show');
}

/**
 * ====================== 常量定义 ======================
 */

/**
 * 语言代码到语言名称的映射
 * 用于构建翻译提示词和界面显示
 */
const languageNames = {
    'zh': '中文',        // Chinese
    'en': '英语',        // English
    'ja': '日语',        // Japanese
    'ko': '韩语',        // Korean
    'fr': '法语',        // French
    'de': '德语',        // German
    'es': '西班牙语',    // Spanish
    'ru': '俄语'         // Russian
};

/** 
 * Token状态枚举 
 * 用于管理JWT token的状态
 */
const TOKEN_STATUS = {
    CONFIGURED: 'configured', // 已配置API密钥
    FETCHING: 'fetching', // 正在获取token
    FETCH_FAILED: 'fetch_failed', // 获取token失败
    UNFETCHED: 'unfetched', // token未获取
    VALID: 'valid', // token有效
    EXPIRED: 'expired' // token已过期
};

/**
 * ====================== 全局状态变量 ======================
 */

// 配置相关变量
let config = {};                           // 应用配置对象，从config.json加载
let currentToken = '';                     // 当前有效的JWT token
let tokenExpireTime = 0;                   // token过期时间戳

// 当前token状态
let currentTokenStatus = TOKEN_STATUS.UNFETCHED;

/**
 * ====================== 主题管理功能 ======================
 */

/**
 * 初始化主题设置
 * 检测系统主题偏好并应用到页面
 */
function initTheme() {
    // 检测系统主题偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.className = prefersDark ? 'dark-mode' : '';
}

/**
 * 监听系统主题变化
 * 当系统主题设置改变时自动更新页面主题
 */
function listenForSystemThemeChanges() {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    darkModeMediaQuery.addEventListener('change', (e) => {
        // 根据系统主题变化更新页面主题
        document.body.className = e.matches ? 'dark-mode' : '';
    });
}


/**
 * ====================== 事件监听器 ======================
 */

/**
 * 文本输入事件监听器
 * 监听用户输入，更新字符计数、调整文本框高度并触发自动翻译
 */
sourceText.addEventListener('input', () => {
    // 更新字符计数显示
    charCount.textContent = `${sourceText.value.length} 字符`;
    // 动态调整文本框高度
    adjustTextareaHeight(sourceText);
    // 触发自动翻译（有防抖）
    triggerAutoTranslate();
});

/**
 * 粘贴事件监听器
 * 监听粘贴操作，确保粘贴内容正确处理并更新相关UI
 */
sourceText.addEventListener('paste', () => {
    // 延迟执行以确保粘贴内容已经插入到DOM中
    setTimeout(() => {
        charCount.textContent = `${sourceText.value.length} 字符`;
        adjustTextareaHeight(sourceText);
        triggerAutoTranslate();
    }, 10);
});


/**
 * 语言切换功能事件监听器
 * 点击交换按钮时交换源语言和目标语言，同时交换文本内容
 */
swapBtn.addEventListener('click', () => {
    // 交换语言选择
    const temp = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = temp;

    // 交换文本内容，保留换行符格式
    const tempText = sourceText.value;
    // 从结果区域获取纯文本内容，将<br>标签转换回换行符
    const resultText = resultArea.innerText.replace(/<br>/g, '\n');
    sourceText.value = resultText;
    // 将源文本设置到结果区域
    setTranslationResult(tempText);

    // 更新字符计数显示
    charCount.textContent = `${sourceText.value.length} 字符`;

    // 隐藏token计数显示，因为这是交换内容而不是新的翻译
    tokenCount.style.display = 'none';

    // 调整输入框和结果区域的高度
    adjustTextareaHeight(sourceText);
    adjustResultAreaHeight();
});

/**
 * 复制功能事件监听器
 * 点击复制按钮时将翻译结果复制到剪贴板
 */
copyBtn.addEventListener('click', () => {
    // 使用innerText获取纯文本内容，自动处理换行符格式
    const text = resultArea.innerText;
    navigator.clipboard.writeText(text).then(() => {
        // 复制成功后显示反馈
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已复制';
        // 2秒后恢复原始按钮文本
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    });
});

/**
 * 设置面板折叠功能
 * 点击设置面板头部时切换展开/折叠状态
 */
settingsHeader.addEventListener('click', () => {
    // 切换展开状态
    settingsContent.classList.toggle('expanded');

    // 更新折叠按钮图标
    if (settingsContent.classList.contains('expanded')) {
        settingsToggle.textContent = '▲';
    } else {
        settingsToggle.textContent = '▼';
    }
});

/**
 * 保存API Key到localStorage
 */
function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();

    // 保存到localStorage（不验证格式）
    localStorage.setItem('apiKey', apiKey);

    // 显示保存成功状态
    apiKeySave.classList.add('success');
    apiKeySave.textContent = '已保存';

    // 立即更新token状态显示
    updateTokenStatus(hasApiKeyConfigured() || TOKEN_STATUS.CONFIGURED);

    // 2秒后恢复按钮状态
    setTimeout(() => {
        apiKeySave.classList.remove('success');
        apiKeySave.textContent = '保存';
    }, 2000);
}

/**
 * 从localStorage加载API Key
 */
function loadApiKey() {
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
}

/**
 * 模型选择事件监听器
 * 用户选择不同模型时保存到localStorage并触发翻译
 */
modelSelect.addEventListener('change', () => {
    // 保存用户选择的模型到localStorage
    localStorage.setItem('preferredModel', modelSelect.value);
    // 如果已输入文本，立即触发翻译
    if (sourceText.value.trim()) {
        triggerAutoTranslate();
    }
});

/**
 * 源语言选择事件监听器
 * 用户选择不同源语言时触发翻译
 */
sourceLang.addEventListener('change', () => {
    // 如果已输入文本，立即触发翻译
    if (sourceText.value.trim()) {
        triggerAutoTranslate();
    }
});

/**
 * 目标语言选择事件监听器
 * 用户选择不同目标语言时触发翻译
 */
targetLang.addEventListener('change', () => {
    // 如果已输入文本，立即触发翻译
    if (sourceText.value.trim()) {
        triggerAutoTranslate();
    }
});

/**
 * API Key保存按钮事件监听器
 */
apiKeySave.addEventListener('click', saveApiKey);

/**
 * API Key输入框回车事件监听器
 */
apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveApiKey();
    }
});

/**
 * 错误提示关闭按钮事件监听器
 */
errorClose.addEventListener('click', hideErrorToast);

/**
 * 关于按钮事件监听器
 */
aboutBtn.addEventListener('click', showAboutModal);

/**
 * 关于弹窗关闭按钮事件监听器
 */
aboutModalClose.addEventListener('click', hideAboutModal);

/**
 * 点击弹窗背景关闭弹窗
 */
aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) {
        hideAboutModal();
    }
});

/**
 * ESC键关闭弹窗
 */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aboutModal.classList.contains('show')) {
        hideAboutModal();
    }
});

/**
 * ====================== 打字机效果 ======================
 */

/**
 * 打字机效果函数 - 逐字显示文本
 * @param {HTMLElement} element - 目标DOM元素
 * @param {string} text - 要显示的文本
 * @param {number} speed - 打字速度（毫秒）
 */
function typeWriter(element, text, speed = 30) {
    let i = 0;
    element.textContent = '';
    element.classList.add('typing-cursor'); // 添加光标效果

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

/**
 * ====================== 自动翻译功能 ======================
 */

// 自动翻译相关变量
let translateTimeout;                    // 防抖定时器
let currentAbortController = null;       // 用于取消正在进行的流式传输

/**
 * 触发自动翻译（带防抖）
 * 监听文本输入，延迟500ms后执行翻译，避免频繁请求
 */
function triggerAutoTranslate() {
    const text = sourceText.value.trim();

    // 如果输入为空，清除结果和正在进行的翻译
    if (!text) {
        // 中断正在进行的流式传输
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
        }
        setTranslationResult('');
        tokenCount.style.display = 'none';
        adjustResultAreaHeight();
        return;
    }

    // 清除之前的防抖定时器
    clearTimeout(translateTimeout);

    // 取消正在进行的流式传输，确保同一时间只有一个翻译请求
    if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
    }

    // 设置新的防抖定时器，延迟配置文件设置的时间执行翻译，单位ms
    translateTimeout = setTimeout(async () => {
        // 显示加载状态
        loading.classList.add('show');
        setTranslationResult('准备翻译...');
        tokenCount.style.display = 'none';

        try {
            // 调用GLM翻译API
            await translateWithGLM(text, sourceLang.value, targetLang.value);
            // 流式传输会在函数内部实时显示，无需额外处理
        } catch (error) {
            // 用数组includes简化判断，直接处理非取消错误
            if (!['signal is aborted without reason', '翻译被取消'].includes(error?.message)) {
                console.error('翻译失败:', error);
                tokenCount.style.display = 'none';
                showErrorToast(`翻译失败: ${error.message}`);
            }
        } finally {
            loading.classList.remove('show');
        }
    }, config.wait_time);
}

/**
 * ====================== GLM翻译核心功能 ======================
 */

/**
 * 智谱GLM翻译函数 - 使用流式传输实现实时翻译效果
 * @param {string} text - 要翻译的文本
 * @param {string} from - 源语言代码
 * @param {string} to - 目标语言代码
 * @returns {Promise<string>} 翻译结果
 */
async function translateWithGLM(text, from, to) {
    // 创建新的AbortController用于取消请求
    currentAbortController = new AbortController();
    const { signal } = currentAbortController;

    const url = config.api_url;

    // 获取有效的Token，如果用户配置了API密钥则使用空字符串
    const token = await getValidToken();

    // 构建提示词，使用语言名称映射
    const sourceLangName = languageNames[from] || '自动检测';
    const targetLangName = languageNames[to] || '目标语言';

    // 替换系统提示词中的变量
    const systemPromptText = config.system_prompt
        .replace('{{to}}', targetLangName)
        .replace('{{text}}', text)
        .replace('{{from}}', sourceLangName);

    // 替换用户提示词中的变量
    const userPromptText = config.user_prompt
        .replace('{{to}}', targetLangName)
        .replace('{{text}}', text)
        .replace('{{from}}', sourceLangName);

    // 构建API请求体
    const requestBody = {
        model: modelSelect.value,                    // 选择的模型
        messages: [
            {
                role: "system",                       // 系统提示词
                content: systemPromptText
            },
            {
                role: "user",                         // 用户提示词
                content: userPromptText
            }
        ],
        temperature: 0.1,                            // 温度参数，控制随机性
        max_tokens: 2000,                           // 最大token数
        top_p: 0.1,                                 // 采样参数
        max_tokens: config.max_tokens[modelSelect.value] || 65536, // 最大token数
        stream: true,                               // 启用流式传输
        thinking: {                                   // GLM-4.5思考模式
            type: config.thinking                   // 控制模型是否思考
        }
    };

    // 发送HTTP请求到智谱GLM API
    // 如果用户配置了API密钥，则使用API密钥认证，否则使用JWT token
    const authorization = token ? `Bearer ${token}` : `Bearer ${localStorage.getItem('apiKey')}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': authorization,               // API密钥或JWT token认证
            'Content-Type': 'application/json'            // JSON格式
        },
        body: JSON.stringify(requestBody),               // 请求体
        signal: signal                                   // 可取消信号
    });

    // 检查HTTP响应状态
    if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
        showErrorToast(`翻译API错误: ${errorMsg}`);
        throw new Error(errorMsg);
    }

    // 设置流式读取器
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';                                 // 完整翻译内容
    let thinkingContent = '';                             // 思考过程内容
    let isThinking = false;                              // 是否正在思考
    let totalTokens = 0;                                 // 总token消耗

    // 返回Promise处理流式数据
    return new Promise((resolve, reject) => {
        // 添加取消事件监听
        signal.addEventListener('abort', () => {
            currentAbortController = null;
            reject(new Error('翻译被取消'));
        });

        /**
         * 处理流式数据
         * 递归读取数据流直到完成
         */
        function processStream() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    // 流结束，清除AbortController并返回最终结果
                    currentAbortController = null;
                    updateTokenDisplay(totalTokens);
                    if (config.thinkPrint && thinkingContent) {
                        // 如果启用思考过程显示，返回包含思考过程的完整结果
                        resolve(`思考过程：\n${thinkingContent}\n\n翻译结果：\n${fullContent}`);
                    } else {
                        resolve(fullContent);
                    }
                    return;
                }

                // 解码数据块
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                // 解析每一行数据
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue; // 跳过结束标记

                        try {
                            const json = JSON.parse(data);
                            const delta = json.choices[0].delta;

                            // 统计token消耗
                            if (json.usage) {
                                totalTokens = json.usage.total_tokens || 0;
                            }

                            // 处理思考过程内容（GLM-4.5特有功能）
                            if (delta.thinking_content) {
                                isThinking = true;
                                thinkingContent += delta.thinking_content;
                                // 实时显示思考过程
                                if (config.thinkPrint) {
                                    setTranslationResult(`思考中...\n${thinkingContent}`, true);
                                    resultArea.scrollTop = resultArea.scrollHeight;
                                }
                            } else if (delta.content) {
                                isThinking = false;
                                fullContent += delta.content;

                                // 立即显示内容
                                updateDisplay();
                            }
                        } catch (e) {
                            // 忽略解析错误，继续处理下一行
                        }
                    }
                }

                processStream(); // 递归处理下一个数据块
            }).catch((error) => {
                // 如果是网络错误或取消错误，显示错误提示
                if (error.name !== 'AbortError') {
                    showErrorToast('网络连接失败，请检查网络连接');
                }
                reject(error);
            });
        }

        /**
         * 更新显示内容
         * 根据配置显示思考过程和翻译结果
         */
        function updateDisplay() {
            if (config.thinkPrint && thinkingContent) {
                // 显示思考过程和翻译结果
                const escapedThinkingContent = escapeHtml(thinkingContent);
                const escapedFullContent = escapeHtml(fullContent);
                const htmlContent = `<div style="color: #666; font-style: italic; white-space: pre-wrap;">思考过程：\n${escapedThinkingContent}</div><hr style="margin: 10px 0;"><div style="white-space: pre-wrap;">${escapedFullContent}</div>`;
                setTranslationResult(htmlContent, true);
            } else {
                // 只显示翻译结果
                setTranslationResult(fullContent);
            }

            // 延迟调整高度和滚动位置，确保DOM更新完成
            setTimeout(() => {
                resultArea.scrollTop = resultArea.scrollHeight;
                adjustResultAreaHeight();
            }, 10);
        }

        processStream(); // 开始处理流数据
    });
}

/**
 * ====================== Token管理功能 ======================
 */

/**
 * 更新Token消耗显示
 * @param {number} tokens - token消耗数量
 */
function updateTokenDisplay(tokens) {
    if (tokens > 0) {
        tokenCount.textContent = `Token: ${tokens}`;
        tokenCount.style.display = 'inline';
    } else {
        tokenCount.style.display = 'none';
    }
}

/**
 * 获取API Token
 * 从后端API获取JWT token用于智谱API认证
 * @returns {Promise<string>} 有效的JWT token
 */
async function getApiToken() {
    try {
        // 设置正在获取状态
        updateTokenStatus(TOKEN_STATUS.FETCHING);

        const response = await fetch(config.token_api);
        const data = await response.json();

        if (data.apiToken && data.expireTime) {
            // 保存token和过期时间
            currentToken = data.apiToken;
            tokenExpireTime = data.expireTime * 1000; // 直接使用后端返回的时间戳（转换为毫秒）
            updateTokenStatus(TOKEN_STATUS.VALID);
            return currentToken;
        } else {
            throw new Error('Token API返回格式错误');
        }
    } catch (error) {
        console.error('获取Token失败:', error);
        updateTokenStatus(TOKEN_STATUS.FETCH_FAILED);
        showErrorToast('获取Token失败，请检查服务器配置');
        throw error;
    }
}

/**
 * 检查Token是否有效
 * @returns {boolean} token是否有效且未过期
 */
function isTokenValid() {
    return currentToken && Date.now() < tokenExpireTime;
}

/**
 * 检查是否已配置API密钥
 * @returns {boolean} 是否已配置API密钥
 */
function hasApiKeyConfigured() {
    const apiKey = localStorage.getItem('apiKey');
    return apiKey && apiKey.trim() !== '';
}

/**
 * 更新Token状态显示
 * @param {string} status - token状态，使用TOKEN_STATUS枚举
 * @param {Object} options - 可选参数
 * @param {number} options.remainingTime - 剩余时间（秒），仅VALID状态需要
 */
function updateTokenStatus(status, options = {}) {
    // 更新全局状态
    currentTokenStatus = status;

    const { remainingTime } = options;

    switch (status) {
        case TOKEN_STATUS.CONFIGURED:
            // 已配置API密钥状态
            tokenStatus.textContent = 'Token: 已配置key';
            tokenStatus.className = 'token-status configured';
            break;
        case TOKEN_STATUS.FETCHING:
            // Token正在获取状态
            tokenStatus.textContent = 'Token: 获取中';
            tokenStatus.className = 'token-status fetching';
            break;
        case TOKEN_STATUS.FETCH_FAILED:
            // Token获取失败状态
            tokenStatus.textContent = 'Token: 获取失败';
            tokenStatus.className = 'token-status expired';
            break;
        case TOKEN_STATUS.UNFETCHED:
            // Token未获取状态
            tokenStatus.textContent = 'Token: 未获取';
            tokenStatus.className = 'token-status';
            break;
        case TOKEN_STATUS.VALID:
            // Token有效状态，显示剩余时间
            if (remainingTime !== undefined) {
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                tokenStatus.textContent = `Token: 有效 (${minutes}:${seconds.toString().padStart(2, '0')})`;
            } else {
                tokenStatus.textContent = 'Token: 有效';
            }
            tokenStatus.className = 'token-status valid';
            break;
        case TOKEN_STATUS.EXPIRED:
            // Token过期状态
            tokenStatus.textContent = 'Token: 已过期';
            tokenStatus.className = 'token-status expired';
            break;
        default:
            // 默认状态
            tokenStatus.textContent = 'Token: 未知状态';
            tokenStatus.className = 'token-status';
    }
}

/**
 * 获取有效的Token
 * 检查当前token是否有效，如果无效或获取失败则重新获取
 * 如果用户已配置API密钥，则返回空字符串
 * @returns {Promise<string>} 有效的JWT token或空字符串
 */
async function getValidToken() {
    // 如果用户已配置API密钥，直接返回空字符串
    if (hasApiKeyConfigured()) {
        return '';
    }

    if (!isTokenValid() || currentTokenStatus === TOKEN_STATUS.FETCH_FAILED) {
        await getApiToken();
    }
    return currentToken;
}

/**
 * 初始化模型选择器
 * 根据配置文件中的模型列表动态生成下拉框选项
 */
function initModelSelector() {
    if (config.model && Array.isArray(config.model)) {
        modelSelect.innerHTML = '';
        config.model.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });

        // 从localStorage加载用户保存的模型偏好
        const savedModel = localStorage.getItem('preferredModel');
        if (savedModel && config.model.includes(savedModel)) {
            modelSelect.value = savedModel;
        } else {
            // 默认选择第一个模型
            if (config.model.length > 0) {
                modelSelect.value = config.model[0];
            }
        }
    }
}

/**
 * ====================== 配置和初始化功能 ======================
 */

/**
 * 加载应用配置
 * 从config.json加载配置并初始化相关组件
 */
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        config = await response.json();

        // 初始化模型选择器
        initModelSelector();

        // 如果用户未配置API密钥，则获取Token
        if (!hasApiKeyConfigured()) {
            await getApiToken();
        }

        // 定时更新Token状态显示（每秒更新一次）
        setInterval(() => {
            if (hasApiKeyConfigured()) {
                updateTokenStatus(TOKEN_STATUS.CONFIGURED);
            } else if (isTokenValid()) {
                const remainingTime = Math.floor((tokenExpireTime - Date.now()) / 1000);
                updateTokenStatus(TOKEN_STATUS.VALID, { remainingTime });
            } else if (currentTokenStatus === TOKEN_STATUS.FETCH_FAILED) {
                // updateTokenStatus(TOKEN_STATUS.FETCH_FAILED); // 获取失败，此状态无需触发更新
            } else if (currentTokenStatus === TOKEN_STATUS.FETCHING) {
                // updateTokenStatus(TOKEN_STATUS.FETCHING); // 获取中，此状态无需触发更新
            } else if (!currentToken) {
                updateTokenStatus(TOKEN_STATUS.UNFETCHED);
            } else {
                updateTokenStatus(TOKEN_STATUS.EXPIRED);
            }
        }, 1000);

    } catch (error) {
        console.error('加载配置文件失败:', error);
        // 根据错误类型显示不同的用户提示
        if (error.message.includes('Failed to fetch')) {
            showErrorToast('网络连接失败，请检查网络连接或服务器状态');
        } else if (error.message.includes('Token')) {
            showErrorToast('获取Token失败，请检查Token API配置是否正确');
        } else {
            showErrorToast('加载配置文件失败，请检查config.json是否存在且格式正确');
        }
    }
}

/**
 * ====================== UI工具函数 ======================
 */

/**
 * 动态调整文本区域高度
 * 根据内容自动调整文本框高度，避免出现滚动条
 * @param {HTMLTextAreaElement} textarea - 需要调整高度的文本框
 */
function adjustTextareaHeight(textarea) {
    // 重置高度为auto以获取正确的scrollHeight
    textarea.style.height = 'auto';

    const minHeight = 100;
    const maxHeight = 600;

    // 使用scrollHeight获取实际内容高度，增加80像素缓冲避免滚动条
    const contentHeight = textarea.scrollHeight;
    let newHeight = Math.max(minHeight, contentHeight + 80);
    newHeight = Math.min(maxHeight, newHeight);

    textarea.style.height = newHeight + 'px';
}

/**
 * 动态调整结果区域高度
 * 根据内容自动调整结果显示区域的高度
 */
function adjustResultAreaHeight() {
    const resultArea = document.getElementById('resultArea');

    // 临时移除高度限制，获取实际内容高度
    const originalHeight = resultArea.style.height;
    resultArea.style.height = 'auto';

    const minHeight = 100;
    const maxHeight = 600;

    // 使用scrollHeight获取实际内容高度，增加80像素缓冲避免滚动条
    const contentHeight = resultArea.scrollHeight;
    let newHeight = Math.max(minHeight, contentHeight + 80);
    newHeight = Math.min(maxHeight, newHeight);

    resultArea.style.height = newHeight + 'px';
}

/**
 * 设置默认语言
 * 初始化页面时的默认语言设置
 */
function setDefaultLanguages() {
    sourceLang.value = 'en';  // 默认源语言为英语
    targetLang.value = 'zh';  // 默认目标语言为中文
}

/**
 * 定时检查输入框状态
 * 每秒检查一次输入框是否为空，如果为空则清空输出框
 */
function startInputCheckInterval() {
    setInterval(() => {
        if (sourceText.value.trim() === '') {
            // 中断正在进行的流式传输
            if (currentAbortController) {
                currentAbortController.abort();
                currentAbortController = null;
            }
            // 清除翻译定时器
            clearTimeout(translateTimeout);
            setTranslationResult('');
            tokenCount.style.display = 'none';
            adjustResultAreaHeight();
        }
    }, 1000); // 每秒检查一次
}

/**
 * ====================== 页面初始化 ======================
 */

/**
 * 页面加载完成后的初始化操作
 * 设置主题、默认语言、加载配置等
 */
window.addEventListener('load', () => {
    // 初始化主题系统
    initTheme();
    listenForSystemThemeChanges();

    // 设置默认语言
    setDefaultLanguages();

    // 加载保存的API Key
    loadApiKey();

    // 加载应用配置
    loadConfig();

    // 设置文本区域初始高度
    adjustTextareaHeight(sourceText);
    adjustResultAreaHeight();

    // 阻止翻译结果区域的用户输入，但允许选择文本
    preventResultAreaInput();

    // 启动输入框状态定时检查
    startInputCheckInterval();
});

/**
 * 阻止翻译结果区域的用户输入，但允许选择文本和复制
 */
function preventResultAreaInput() {
    // 保存原始内容，当内容被修改时恢复
    let originalContent = '';

    // 监听内容变化，如果有修改就恢复
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData' || mutation.type === 'childList') {
                // 如果内容被修改，恢复原始内容
                if (resultArea.textContent !== originalContent) {
                    resultArea.textContent = originalContent;
                }
            }
        });
    });

    // 开始观察DOM变化
    observer.observe(resultArea, {
        characterData: true,
        childList: true,
        subtree: true
    });

    // 更新原始内容的函数
    window.updateOriginalContent = function (content) {
        originalContent = content;
    };

    // 设置翻译结果内容的函数
    window.setTranslationResult = function (content, isHtml = false) {
        if (isHtml) {
            resultArea.innerHTML = content;
        } else {
            // 先转义HTML，然后将换行符转换为<br>标签
            const escapedContent = escapeHtml(content);
            resultArea.innerHTML = escapedContent.replace(/\n/g, '<br>');
        }
        // 更新原始内容（使用纯文本格式）
        originalContent = content;
    };

    // 阻止输入法事件（移动端键盘弹出）
    resultArea.addEventListener('compositionstart', (e) => {
        e.preventDefault();
        return false;
    });

    // 阻止粘贴事件
    resultArea.addEventListener('paste', (e) => {
        e.preventDefault();
        return false;
    });

    // 阻止拖拽事件
    resultArea.addEventListener('drop', (e) => {
        e.preventDefault();
        return false;
    });

    // 阻止回车键事件
    resultArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            return false;
        }
    });

    // 添加一个样式来阻止移动端键盘弹出
    resultArea.setAttribute('readonly', 'true');
    resultArea.style.imeMode = 'disabled';
}