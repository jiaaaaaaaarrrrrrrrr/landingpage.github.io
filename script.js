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
    }, 1000);
});

// ================= AI聊天功能（使用稳定连接方案） =================
const GEMINI_API_KEY = "AIzaSyCZ4_ed8dmVg2BpwAd2CBHvoCiHpgObMyk";
let activeModel = ""; // 自动探测的可用模型
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
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
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
            aiChatStatus.innerHTML = '<span class="ai-status-dot"></span> 正在探测可用模型...';
            
            // 自动探测该 Key 到底拥有哪个模型的权限
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
            const data = await res.json();
            
            // 寻找一个支持生成内容且包含 flash 或 pro 的模型
            const model = data.models.find(m => 
                m.supportedGenerationMethods && 
                m.supportedGenerationMethods.includes("generateContent") &&
                (m.name.includes("flash") || m.name.includes("pro") || m.name.includes("gemini"))
            );
            
            if (model) {
                activeModel = model.name; // 例如：models/gemini-1.5-flash
                aiChatStatus.innerHTML = '<span style="color:#10b981">● 已锁定可用模型: ' + model.name.split('/').pop() + '</span>';
                aiSendBtn.disabled = false;
                
                // 添加欢迎消息
                setTimeout(() => {
                    addAiMessage("您好！我是Jiayee的AI助手，专门回答关于网页设计、Landing Page优化、用户体验和技术实现的问题。我了解Jiayee的设计哲学和作品案例，可以为您提供专业的建议。", true);
                }, 500);
            } else {
                aiChatStatus.innerHTML = '<span style="color:#ef4444">❌ 您的Key暂无可用模型权限</span>';
                aiSendBtn.disabled = true;
            }
            
        } catch (error) {
            console.error('AI初始化失败:', error);
            aiChatStatus.innerHTML = '<span style="color:#ef4444">❌ 网络连接异常</span>';
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
        if (!message || !activeModel) return;
        
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
            
            const url = `https://generativelanguage.googleapis.com/v1beta/${activeModel}:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
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

// ================= 表单处理（使用本地后端API） =================
document.addEventListener('DOMContentLoaded', function() {
    // 绑定表单提交事件
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
        console.log('✅ 表单事件监听器已绑定');
    }
    
    // 绑定成功页面关闭事件
    const closeSuccessBtn = document.getElementById('close-success-btn');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', function(e) {
            console.log('关闭按钮被点击');
            closeSuccessPage();
        });
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
            console.log('ESC键被按下，关闭成功页面');
            closeSuccessPage();
        }
    });
    
    // 点击成功页面背景关闭
    const successPage = document.getElementById('success-page');
    if (successPage) {
        successPage.addEventListener('click', function(e) {
            if (e.target === successPage) {
                console.log('点击背景，关闭成功页面');
                closeSuccessPage();
            }
        });
    }
    
    // 检查后端连接状态（静默连接，不显示提示）
    checkBackendConnection();
    
    console.log('✅ script.js 完全加载完成');
});

// 防止重复提交
let isSubmitting = false;

// 后端API配置
const API_CONFIG = {
    BASE_URL: 'http://127.0.0.1:5000',
    ENDPOINTS: {
        HEALTH: '/api/health',
        SUBMIT: '/api/submit',
        CONTACTS: '/api/contacts'
    },
    isBackendAvailable: false
};

// 检查后端连接
async function checkBackendConnection() {
    try {
        console.log('🔍 检查后端连接...');
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            timeout: 5000 // 5秒超时
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ 后端连接正常:', data);
            API_CONFIG.isBackendAvailable = true;
            // 静默连接，不显示提示
            return true;
        } else {
            console.warn('⚠️ 后端连接状态异常:', response.status);
            API_CONFIG.isBackendAvailable = false;
            return false;
        }
    } catch (error) {
        console.warn('⚠️ 后端连接失败:', error.message);
        API_CONFIG.isBackendAvailable = false;
        return false;
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // 防止重复提交
    if (isSubmitting) {
        console.log('⏳ 正在提交中，请稍候...');
        showToast('正在提交中，请稍候...', 'info');
        return false;
    }
    
    isSubmitting = true;
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const formStatus = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');
    
    // 验证必填字段
    if (!name || !email || !message) {
        formStatus.innerHTML = '<strong style="color:#ef4444">请填写所有必填字段</strong>';
        formStatus.className = 'form-status error';
        formStatus.style.display = 'block';
        isSubmitting = false;
        return false;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        formStatus.innerHTML = '<strong style="color:#ef4444">请输入有效的邮箱地址</strong>';
        formStatus.className = 'form-status error';
        formStatus.style.display = 'block';
        isSubmitting = false;
        return false;
    }
    
    // 验证消息长度
    if (message.length < 3) {
        formStatus.innerHTML = '<strong style="color:#ef4444">请详细描述您的项目需求（至少3个字符）</strong>';
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
            timestamp: new Date().toISOString()
        };
        
        console.log('📤 正在提交数据:', formData);
        
        // 尝试后端API
        if (API_CONFIG.isBackendAvailable) {
            console.log('🚀 使用后端API提交...');
            
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUBMIT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            console.log('📥 响应状态:', response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                console.log('📦 响应数据:', result);
                
                if (result.success) {
                    // 提交成功
                    console.log('✅ 后端提交成功');
                    
                    // 显示成功页面（不会自动关闭）
                    showSuccessPage();
                    
                    // 重置表单
                    document.getElementById('contact-form').reset();
                    
                    // 隐藏表单状态消息
                    if (formStatus.style.display !== 'none') {
                        formStatus.style.display = 'none';
                    }
                    
                    // 显示成功消息
                    showToast('✅ 提交成功！邮件已发送。', 'success');
                    
                    isSubmitting = false;
                    submitBtn.querySelector('.btn-text').textContent = originalText;
                    submitBtn.classList.remove('loading');
                    return true;
                } else {
                    throw new Error(result.error || '后端处理失败');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } else {
            throw new Error('后端服务不可用');
        }
        
    } catch (error) {
        console.error('❌ 后端提交失败:', error.message);
        
        // 使用备用方案：邮件客户端
        console.log('📧 切换到邮件备用方案...');
        
        const mailtoSuccess = useMailtoFallback(name, email, message);
        
        if (mailtoSuccess) {
            // 显示成功页面（不会自动关闭）
            showSuccessPage();
            
            // 重置表单
            document.getElementById('contact-form').reset();
            
            // 隐藏表单状态消息
            if (formStatus.style.display !== 'none') {
                formStatus.style.display = 'none';
            }
            
            showToast('📧 请检查邮件客户端发送邮件！', 'info');
        } else {
            // 显示错误信息
            formStatus.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
                    <strong style="color: #ef4444;">⚠️ 提交失败</strong>
                    <p style="margin: 10px 0; color: #cbd5e1; font-size: 0.9rem;">
                        ${error.message}<br>
                        请尝试手动发送邮件到：<a href="mailto:jiayee344@gmail.com" style="color: #6366f1;">jiayee344@gmail.com</a>
                    </p>
                    <button onclick="manualEmailFallback()" 
                            style="background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px; font-size: 0.9rem;">
                        📧 手动发送邮件
                    </button>
                </div>
            `;
            formStatus.className = 'form-status error';
            formStatus.style.display = 'block';
        }
        
    } finally {
        submitBtn.querySelector('.btn-text').textContent = originalText;
        submitBtn.classList.remove('loading');
        isSubmitting = false;
    }
}

function useMailtoFallback(name, email, message) {
    try {
        const timestamp = new Date().toLocaleString('zh-CN');
        
        // 1. 创建给管理员的邮件链接
        const adminSubject = `🎯 新咨询：${name}`;
        const adminBody = `
新咨询通知
============

👤 姓名：${name}
📧 邮箱：${email}
💬 咨询内容：
${message}

🌐 来源：${window.location.href}
🕐 时间：${timestamp}
        `;
        
        const adminMailtoLink = `mailto:jiayee344@gmail.com?subject=${encodeURIComponent(adminSubject)}&body=${encodeURIComponent(adminBody)}`;
        
        // 2. 创建给客户的确认邮件链接
        const customerSubject = `✅ 感谢您的咨询 - Jiayee Design`;
        const customerBody = `
尊敬的 ${name}，

感谢您通过我的作品集网站提交咨询！

您的咨询内容：
${message}

我将在24小时内通过您提供的邮箱地址与您联系：
${email}

请留意您的邮箱收件箱（包括垃圾邮件箱）。

期待与您合作！

--
Jiayee
创意 Landing Page 设计专家
专注 Landing Page 设计与转化优化
        `;
        
        const customerMailtoLink = `mailto:${email}?subject=${encodeURIComponent(customerSubject)}&body=${encodeURIComponent(customerBody)}`;
        
        // 保存到全局变量
        window._mailtoLinks = {
            admin: adminMailtoLink,
            customer: customerMailtoLink,
            name: name,
            email: email
        };
        
        // 打开邮件客户端
        setTimeout(() => {
            window.open(adminMailtoLink, '_blank');
        }, 100);
        
        setTimeout(() => {
            window.open(customerMailtoLink, '_blank');
        }, 600);
        
        return true;
        
    } catch (error) {
        console.error('邮件备用方案失败:', error);
        return false;
    }
}

// 手动邮件备用方案
function manualEmailFallback() {
    const name = document.getElementById('name').value.trim() || '客户';
    const email = document.getElementById('email').value.trim() || '未提供邮箱';
    const message = document.getElementById('message').value.trim() || '未提供咨询内容';
    
    const emailContent = `
请发送以下信息到 jiayee344@gmail.com：

主题：新咨询 - ${name}

内容：
姓名：${name}
邮箱：${email}
咨询内容：
${message}

来源：${window.location.href}
时间：${new Date().toLocaleString()}
    `;
    
    alert(`📧 请手动发送邮件：\n\n${emailContent}`);
    
    // 复制到剪贴板
    navigator.clipboard.writeText(emailContent).then(() => {
        showToast('📋 邮件内容已复制到剪贴板', 'info');
    });
}

function showSuccessPage() {
    console.log('🎉 显示成功页面');
    const successPage = document.getElementById('success-page');
    if (successPage) {
        // 显示页面
        successPage.style.display = 'flex';
        successPage.style.opacity = '1';
        
        // 防止页面滚动
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // 滚动到顶部
        window.scrollTo(0, 0);
        
        // 添加邮件发送提示（如果使用了备用方案）
        if (window._mailtoLinks) {
            setTimeout(() => {
                const successContent = document.querySelector('.success-content');
                if (successContent) {
                    const mailSection = document.createElement('div');
                    mailSection.style.marginTop = '25px';
                    mailSection.style.paddingTop = '20px';
                    mailSection.style.borderTop = '1px solid rgba(255,255,255,0.1)';
                    mailSection.innerHTML = `
                        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 12px; text-align: center;">
                            📧 邮件发送提示
                        </p>
                        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="resendAdminEmail()" 
                                    style="background: rgba(99, 102, 241, 0.2); color: #6366f1; border: 1px solid #6366f1; 
                                           padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; 
                                           transition: all 0.3s ease;">
                                重新发送给Jiayee
                            </button>
                            <button onclick="resendCustomerEmail()" 
                                    style="background: rgba(6, 182, 212, 0.2); color: #06b6d4; border: 1px solid #06b6d4; 
                                           padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; 
                                           transition: all 0.3s ease;">
                                重新发送确认信
                            </button>
                        </div>
                        <p style="color: #64748b; font-size: 0.8rem; margin-top: 12px; text-align: center;">
                            如果邮件客户端未自动打开，请点击上方按钮
                        </p>
                    `;
                    successContent.appendChild(mailSection);
                }
            }, 500);
        }
        
        console.log('✅ 成功页面已显示');
    } else {
        console.error('❌ 找不到成功页面元素');
        alert('✅ 提交成功！Jiayee将在24小时内回复您。');
    }
}

function closeSuccessPage() {
    console.log('🔒 关闭成功页面');
    const successPage = document.getElementById('success-page');
    if (successPage) {
        successPage.style.display = 'none';
        
        // 恢复页面滚动
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        
        console.log('✅ 成功页面已关闭');
    }
}

// 重新发送邮件函数
function resendAdminEmail() {
    if (window._mailtoLinks && window._mailtoLinks.admin) {
        window.open(window._mailtoLinks.admin, '_blank');
        showToast('📧 重新打开管理员邮件', 'info');
    }
}

function resendCustomerEmail() {
    if (window._mailtoLinks && window._mailtoLinks.customer) {
        window.open(window._mailtoLinks.customer, '_blank');
        showToast('📧 重新打开客户确认邮件', 'info');
    }
}

// Toast通知函数
function showToast(message, type = 'info') {
    // 移除现有的toast
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 创建新的toast
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    
    // 设置样式
    const styles = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        zIndex: '99999',
        animation: 'toastFadeIn 0.3s ease',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        maxWidth: '300px',
        fontSize: '0.9rem',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    };
    
    // 根据类型设置颜色
    let backgroundColor, color, icon;
    switch (type) {
        case 'success':
            backgroundColor = 'rgba(16, 185, 129, 0.9)';
            color = 'white';
            icon = '✅';
            break;
        case 'error':
            backgroundColor = 'rgba(239, 68, 68, 0.9)';
            color = 'white';
            icon = '❌';
            break;
        case 'warning':
            backgroundColor = 'rgba(245, 158, 11, 0.9)';
            color = 'white';
            icon = '⚠️';
            break;
        default: // info
            backgroundColor = 'rgba(99, 102, 241, 0.9)';
            color = 'white';
            icon = 'ℹ️';
    }
    
    Object.assign(toast.style, styles, {
        backgroundColor,
        color
    });
    
    toast.innerHTML = `${icon} ${message}`;
    
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toastFadeOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 3000);
}

// 添加CSS动画（如果不存在）
if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes toastFadeIn {
            from { 
                opacity: 0; 
                transform: translateY(-20px) scale(0.95); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0) scale(1); 
            }
        }
        @keyframes toastFadeOut {
            from { 
                opacity: 1; 
                transform: translateY(0) scale(1); 
            }
            to { 
                opacity: 0; 
                transform: translateY(-20px) scale(0.95); 
            }
        }
    `;
    document.head.appendChild(style);
}

// 调试函数
window.debugForm = function() {
    console.log('=== 表单调试信息 ===');
    console.log('表单元素:', document.getElementById('contact-form'));
    console.log('成功页面元素:', document.getElementById('success-page'));
    console.log('后端连接状态:', API_CONFIG.isBackendAvailable);
    console.log('当前URL:', window.location.href);
    console.log('后端配置:', API_CONFIG);
};

window.testSuccessPage = function() {
    console.log('测试显示成功页面');
    showSuccessPage();
};

window.testBackendConnection = async function() {
    const result = await checkBackendConnection();
    alert(result ? '✅ 后端连接正常' : '❌ 后端连接失败');
    return result;
};

window.testFormSubmit = async function() {
    const testData = {
        name: "测试用户",
        email: "test@example.com",
        message: "这是一个API测试提交",
        source: "debug-test",
        website: window.location.href
    };
    
    console.log('🧪 测试表单提交:', testData);
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUBMIT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📥 测试响应状态:', response.status);
        const result = await response.json();
        console.log('📦 测试响应数据:', result);
        
        if (result.success) {
            showToast('✅ 测试提交成功！', 'success');
        } else {
            showToast(`❌ 测试提交失败: ${result.error}`, 'error');
        }
        
        return result;
    } catch (error) {
        console.error('💥 测试请求错误:', error);
        showToast(`💥 测试失败: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
};

window.testAiApi = async function() {
    console.log('🤖 测试AI API连接...');
    const API_KEY = "AIzaSyCZ4_ed8dmVg2BpwAd2CBHvoCiHpgObMyk";
    
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await res.json();
        
        if (data.models) {
            const model = data.models.find(m => 
                m.supportedGenerationMethods && 
                m.supportedGenerationMethods.includes("generateContent")
            );
            
            if (model) {
                alert(`✅ AI API连接成功！\n可用模型: ${model.name}`);
            } else {
                alert(`⚠️ 没有可用的生成模型`);
            }
        } else {
            alert(`❌ API响应异常: ${JSON.stringify(data)}`);
        }
    } catch (error) {
        alert(`❌ 请求失败: ${error.message}`);
    }
};

console.log('🚀 script.js 加载完成');
console.log('🌐 当前页面:', window.location.href);
console.log('🔗 后端API:', API_CONFIG.BASE_URL);
console.log('🤖 AI密钥已配置');