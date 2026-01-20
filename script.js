// ================= 图片加载优化 =================
document.addEventListener('DOMContentLoaded', function() {
    // 给所有图片添加加载完成后的淡入效果
    const images = document.querySelectorAll('.photo-img, .p-image');
    images.forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            });
            img.addEventListener('error', function() {
                this.classList.add('loaded');
            });
        }
    });
    
    // 预加载重要的首屏图片
    const importantImages = [
        './jiayee.png',
        './dm.jpg',
        './skinlab.jpg'
    ];
    
    importantImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
});

// ================= 灵动岛功能 =================
document.addEventListener('DOMContentLoaded', function() {
    const dynamicIsland = document.getElementById('dynamic-island');
    const islandClose = document.getElementById('island-close');
    const quickContactBtn = document.getElementById('quick-contact');
    const viewProjectsBtn = document.getElementById('view-projects');
    
    let isExpanded = false;
    
    // 修复灵动岛点击事件 - 确保不会阻止按钮点击
    dynamicIsland.addEventListener('click', function(e) {
        if (e.target.closest('.island-btn') || 
            e.target.closest('.island-close') ||
            e.target.closest('#quick-contact') || 
            e.target.closest('#view-projects')) {
            return;
        }
        
        if (isExpanded) {
            collapseIsland();
        } else {
            expandIsland();
        }
    });
    
    // 关闭按钮点击事件
    islandClose.addEventListener('click', function(e) {
        e.stopPropagation();
        collapseIsland();
    });
    
    // 快速联系按钮
    quickContactBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        collapseIsland();
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    });
    
    // 查看作品按钮
    viewProjectsBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        collapseIsland();
        document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
    });
    
    function expandIsland() {
        dynamicIsland.classList.remove('collapsed');
        dynamicIsland.classList.add('expanded');
        isExpanded = true;
    }
    
    function collapseIsland() {
        dynamicIsland.classList.remove('expanded');
        dynamicIsland.classList.add('collapsed');
        isExpanded = false;
    }
    
    // 初始显示灵动岛
    setTimeout(() => {
        expandIsland();
        setTimeout(() => {
            collapseIsland();
        }, 3000);
    }, 1000);
});

// ================= AI聊天功能 =================
const GEMINI_API_KEY = "AIzaSyBjJnbtiAA5IvjXHZZDINOpjLN7gSnp9QI";
let aiActiveModel = "";
let aiChatHistory = [];

document.addEventListener('DOMContentLoaded', function() {
    const aiChatWindow = document.getElementById('ai-chat-window');
    const aiFloatingBtn = document.getElementById('ai-floating-btn');
    const aiCloseBtn = document.getElementById('ai-close-btn');
    const aiSendBtn = document.getElementById('ai-send-btn');
    const aiUserInput = document.getElementById('ai-user-input');
    const aiChatMessages = document.getElementById('ai-chat-messages');
    const aiChatStatus = document.getElementById('ai-chat-status');
    
    let isAiChatOpen = false;
    
    // AI悬浮按钮点击事件
    aiFloatingBtn.addEventListener('click', function() {
        if (!isAiChatOpen) {
            openAiChat();
        } else {
            closeAiChat();
        }
    });
    
    // AI关闭按钮
    aiCloseBtn.addEventListener('click', closeAiChat);
    
    // AI发送按钮
    aiSendBtn.addEventListener('click', sendAiMessage);
    
    // AI输入框回车发送
    aiUserInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendAiMessage();
        }
    });
    
    // 初始化AI模型
    initAiModel();
    
    function openAiChat() {
        aiChatWindow.classList.add('active');
        isAiChatOpen = true;
        aiFloatingBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg><span>关闭AI</span>';
        setTimeout(() => {
            aiUserInput.focus();
        }, 300);
    }
    
    function closeAiChat() {
        aiChatWindow.classList.remove('active');
        isAiChatOpen = false;
        aiFloatingBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg><span>AI助手</span>';
    }
    
    async function initAiModel() {
        try {
            aiChatStatus.innerHTML = '<span class="ai-status-dot"></span> 正在连接AI模型...';
            
            // 检测可用模型
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
            const data = await res.json();
            
            // 寻找支持generateContent的模型
            const model = data.models.find(m => 
                m.supportedGenerationMethods && 
                m.supportedGenerationMethods.includes("generateContent") &&
                (m.name.includes("flash") || m.name.includes("pro"))
            );
            
            if (model) {
                aiActiveModel = model.name;
                aiChatStatus.innerHTML = '<span class="ai-status-dot"></span> AI助手已就绪 - 可以开始对话';
                aiSendBtn.disabled = false;
                
                // 添加欢迎消息
                addAiMessage("您好！我是Jiayee的AI助手，专门回答关于网页设计、Landing Page优化、用户体验和技术实现的问题。我了解Jiayee的设计哲学和作品案例，可以为您提供专业的建议。", true);
            } else {
                aiChatStatus.innerHTML = '<span style="color:#ef4444">⚠️ 暂时无法连接AI服务，请稍后重试</span>';
                aiSendBtn.disabled = true;
            }
        } catch (error) {
            console.error('AI初始化失败:', error);
            aiChatStatus.innerHTML = '<span style="color:#ef4444">⚠️ 网络连接异常</span>';
            aiSendBtn.disabled = true;
        }
    }
    
    function addAiMessage(text, isBot = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${isBot ? 'ai-bot-message' : 'ai-user-message'}`;
        
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');
        
        messageDiv.innerHTML = `
            <div class="ai-avatar">${isBot ? 'AI' : '你'}</div>
            <div class="ai-message-content">
                <p>${text}</p>
                <div class="ai-message-time">${timeString}</div>
            </div>
        `;
        
        aiChatMessages.appendChild(messageDiv);
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
        
        return messageDiv;
    }
    
    async function sendAiMessage() {
        const message = aiUserInput.value.trim();
        if (!message || !aiActiveModel) return;
        
        // 添加用户消息
        addAiMessage(message, false);
        
        // 清空输入框
        aiUserInput.value = '';
        
        // 添加加载动画
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-message ai-bot-message';
        loadingDiv.innerHTML = `
            <div class="ai-avatar">AI</div>
            <div class="ai-message-content ai-loading">
                <div class="ai-loading-dot"></div>
                <div class="ai-loading-dot"></div>
                <div class="ai-loading-dot"></div>
            </div>
        `;
        aiChatMessages.appendChild(loadingDiv);
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
        
        try {
            // 构建上下文
            const context = `你是一位专业的网页设计师AI助手，专门帮助用户了解Jiayee的设计服务。以下是关于Jiayee的信息：
            
姓名：Jiayee
专业：Landing Page设计与转化优化
设计哲学：用户旅程优化、数据驱动决策、心理学驱动设计
专业技能：转化率优化(CRO)、3D交互视觉、销售型文案策划、前端开发
代表作：Digital Marketing网站（转化率提升18%）、SkinLab护肤品牌（表单提交率提升25%）
服务承诺：专注可量化的业务增长，100%项目满意度

请基于以上信息回答用户的问题，保持专业、有帮助的态度。`;
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: `${context}\n\n用户提问：${message}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            };
            
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/${aiActiveModel}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                }
            );
            
            const data = await response.json();
            
            // 移除加载动画
            loadingDiv.remove();
            
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                addAiMessage(aiResponse, true);
                
                // 保存到聊天历史
                aiChatHistory.push({
                    user: message,
                    ai: aiResponse,
                    timestamp: new Date().toISOString()
                });
            } else {
                addAiMessage("抱歉，我暂时无法回答这个问题。请尝试重新提问，或直接通过下方联系表单与Jiayee沟通。", true);
            }
            
        } catch (error) {
            console.error('AI请求失败:', error);
            
            // 移除加载动画
            loadingDiv.remove();
            
            // 添加错误消息
            addAiMessage("网络连接出现问题，请稍后重试。您也可以直接通过联系表单与Jiayee沟通。", true);
        }
    }
});

// ================= 表单处理（使用Python Flask后端） =================
// 确保表单提交事件监听器已正确绑定
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', submitForm);
    }
    
    const closeSuccessBtn = document.getElementById('close-success-btn');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', function(e) {
            console.log('点击关闭按钮');
            e.stopPropagation();
            e.preventDefault();
            closeSuccessPage();
            return false;
        });
    }
    
    // 点击成功页面背景关闭
    const successContainer = document.getElementById('success-page');
    if (successContainer) {
        successContainer.addEventListener('click', function(e) {
            console.log('点击成功页面背景');
            // 如果点击的是背景（不是内容区域），则关闭
            if (e.target === successContainer) {
                e.stopPropagation();
                closeSuccessPage();
            }
        });
    }
    
    // 防止成功页面内容区域的点击事件冒泡
    const successContent = document.querySelector('.success-content');
    if (successContent) {
        successContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});

// 防止重复提交的标记
let isSubmitting = false;

async function submitForm(event) {
    // 防止重复提交
    if (isSubmitting) {
        console.log('正在提交中，请稍候...');
        return false;
    }
    
    event.preventDefault();
    console.log('表单提交开始...');
    
    isSubmitting = true;
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const formStatus = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');
    
    // 验证必填字段
    if (!name || !email || !message) {
        formStatus.innerHTML = '请填写所有必填字段';
        formStatus.className = 'form-status error';
        formStatus.style.display = 'block';
        isSubmitting = false;
        return false;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        formStatus.innerHTML = '请输入有效的邮箱地址';
        formStatus.className = 'form-status error';
        formStatus.style.display = 'block';
        isSubmitting = false;
        return false;
    }
    
    // 验证消息长度
    if (message.length < 3) {
        formStatus.innerHTML = '请详细描述您的项目需求（至少3个字符）';
        formStatus.className = 'form-status error';
        formStatus.style.display = 'block';
        isSubmitting = false;
        return false;
    }
    
    // 显示加载状态
    const originalText = submitBtn.querySelector('.btn-text').textContent;
    submitBtn.querySelector('.btn-text').textContent = '发送中...';
    submitBtn.classList.add('loading');
    
    try {
        // 准备表单数据
        const formData = {
            name: name,
            email: email,
            message: message,
            source: 'jiayee-portfolio',
            website: window.location.href,
            timestamp: new Date().toISOString(),
            status: 'new'
        };
        
        console.log('准备发送表单数据:', formData);
        
        // 发送到Python Flask后端
        const apiUrl = 'http://127.0.0.1:5000/api/submit';
        console.log('发送请求到:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('响应状态:', response.status, response.statusText);
        
        if (!response.ok) {
            // 尝试获取错误信息
            let errorMessage = `HTTP错误: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // 如果无法解析JSON，使用默认错误信息
                console.log('无法解析错误响应:', e);
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('响应结果:', result);
        
        if (result && result.success) {
            console.log('表单提交成功，准备显示成功页面');
            
            // 重置表单
            document.getElementById('contact-form').reset();
            
            // 隐藏表单状态消息
            if (formStatus.style.display !== 'none') {
                formStatus.style.display = 'none';
            }
            
            // 显示成功页面
            setTimeout(() => {
                showSuccessPage();
            }, 100);
            
        } else {
            const errorMsg = result ? (result.error || '提交失败') : '未知错误';
            formStatus.innerHTML = '提交失败：' + errorMsg;
            formStatus.className = 'form-status error';
            formStatus.style.display = 'block';
        }
        
    } catch (error) {
        console.error('表单提交失败:', error);
        formStatus.innerHTML = `提交失败：${error.message}<br>请确保Python后端已启动（运行 python api/index.py）<br>或直接发送邮件到：jiayee344@gmail.com`;
        formStatus.className = 'form-status error';
        formStatus.style.display = 'block';
    } finally {
        submitBtn.querySelector('.btn-text').textContent = originalText;
        submitBtn.classList.remove('loading');
        isSubmitting = false;
    }
}

function showSuccessPage() {
    console.log('显示成功页面函数被调用');
    const successPage = document.getElementById('success-page');
    if (successPage) {
        // 先设置显示，再添加动画
        successPage.style.display = 'flex';
        successPage.style.opacity = '0';
        
        // 强制浏览器重绘
        successPage.getBoundingClientRect();
        
        // 设置动画
        setTimeout(() => {
            successPage.style.transition = 'opacity 0.5s ease';
            successPage.style.opacity = '1';
            
            // 防止页面滚动
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        }, 10);
        
        console.log('成功页面已显示');
    } else {
        console.error('找不到成功页面元素 #success-page');
    }
}

function closeSuccessPage() {
    console.log('关闭成功页面函数被调用');
    const successPage = document.getElementById('success-page');
    if (successPage) {
        // 添加淡出动画
        successPage.style.transition = 'opacity 0.3s ease';
        successPage.style.opacity = '0';
        
        // 等待动画完成后再隐藏
        setTimeout(() => {
            successPage.style.display = 'none';
            
            // 恢复页面滚动
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }, 300);
        
        console.log('成功页面已关闭');
    }
}

// 输入时隐藏状态消息
document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', function() {
        const formStatus = document.getElementById('form-status');
        if (formStatus && formStatus.style.display !== 'none') {
            formStatus.style.display = 'none';
        }
    });
});

// ESC键关闭成功页面
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        console.log('按ESC键关闭成功页面');
        closeSuccessPage();
    }
});

// 调试函数：手动测试成功页面
window.testSuccessPage = function() {
    console.log('手动测试成功页面');
    showSuccessPage();
};

// 检查页面元素
window.checkPageElements = function() {
    console.log('检查页面元素:');
    console.log('1. contact-form:', document.getElementById('contact-form'));
    console.log('2. success-page:', document.getElementById('success-page'));
    console.log('3. close-success-btn:', document.getElementById('close-success-btn'));
    console.log('4. 成功页面样式:', document.getElementById('success-page')?.style?.display);
};

console.log('✅ 网站完全加载完成！表单功能已初始化');

// 页面加载完成后检查元素
setTimeout(() => {
    window.checkPageElements();
}, 1000);