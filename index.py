from flask import Flask, request, jsonify
import json
import os
import sys
from datetime import datetime
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading

app = Flask(__name__)

# 允许所有跨域请求
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"]
    }
})

@app.after_request
def after_request(response):
    """添加CORS头到所有响应"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# 配置文件路径
DATA_DIR = "data"
CONTACTS_FILE = os.path.join(DATA_DIR, "contacts.json")

# 配置信息
CONFIG = {
    "gmail_sender": "jiayee344@gmail.com",
    "gmail_password": "jzhz qeil gbdq rdjy",
    "admin_email": "jiayee344@gmail.com"
}

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """健康检查端点"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    return jsonify({
        'status': 'healthy',
        'service': 'jiayee-contact-api',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'data_file': os.path.abspath(CONTACTS_FILE),
        'features': ['form_submission', 'email_notification', 'local_storage']
    })

@app.route('/api/submit', methods=['POST', 'OPTIONS'])
def submit_contact():
    """处理表单提交"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        # 记录请求信息
        print(f"📨 收到表单提交请求")
        print(f"📦 请求头: {dict(request.headers)}")
        print(f"📦 请求方法: {request.method}")
        print(f"📦 内容类型: {request.content_type}")
        
        if not request.is_json:
            print("❌ 请求不是JSON格式")
            print(f"📦 实际内容: {request.data[:500]}")
            return jsonify({
                'success': False,
                'error': '请求必须是JSON格式'
            }), 400
        
        data = request.get_json()
        print(f"📨 收到表单数据: {json.dumps(data, ensure_ascii=False, indent=2)}")
        
        # 验证必要字段
        required_fields = ['name', 'email', 'message']
        for field in required_fields:
            if field not in data:
                error_msg = f'缺少必填字段: {field}'
                print(f"❌ {error_msg}")
                return jsonify({
                    'success': False,
                    'error': error_msg
                }), 400
            
            value = str(data[field]).strip()
            if not value:
                error_msg = f'字段不能为空: {field}'
                print(f"❌ {error_msg}")
                return jsonify({
                    'success': False,
                    'error': error_msg
                }), 400
        
        # 提取和清理数据
        form_data = {
            'name': str(data['name']).strip(),
            'email': str(data['email']).strip(),
            'message': str(data['message']).strip(),
            'source': data.get('source', 'jiayee-portfolio'),
            'website': data.get('website', '')
        }
        
        # 验证邮箱格式
        if '@' not in form_data['email'] or '.' not in form_data['email']:
            error_msg = '邮箱格式无效'
            print(f"❌ {error_msg}: {form_data['email']}")
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
        
        # 验证消息长度
        if len(form_data['message']) < 3:
            error_msg = '消息内容太短，请详细描述您的需求（至少3个字符）'
            print(f"❌ {error_msg}")
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
        
        print(f"✅ 数据验证通过")
        
        # 保存到本地文件
        save_result = save_contact_to_file(form_data)
        
        # 启动邮件发送线程
        email_thread = threading.Thread(
            target=send_email_notifications,
            args=(form_data,)
        )
        email_thread.daemon = True
        email_thread.start()
        
        print(f"✅ 所有任务已启动")
        
        # 返回成功响应
        response_data = {
            'success': True,
            'message': '咨询提交成功！您将收到确认邮件。',
            'data': {
                'name': form_data['name'],
                'email': form_data['email'],
                'timestamp': datetime.now().isoformat()
            },
            'storage': {
                'local_file': save_result,
                'emails_sent': True
            }
        }
        
        return jsonify(response_data), 200
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON解析错误: {str(e)}")
        print(f"📦 原始数据: {request.data[:500]}")
        return jsonify({
            'success': False,
            'error': 'JSON数据格式错误'
        }), 400
    except Exception as e:
        print(f"❌ 服务器错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'服务器内部错误: {str(e)}'
        }), 500

@app.route('/api/contacts', methods=['GET', 'OPTIONS'])
def get_contacts():
    """获取所有联系人"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        contacts = load_contacts()
        return jsonify({
            'success': True,
            'count': len(contacts),
            'contacts': contacts
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def load_contacts():
    """加载联系人数据"""
    if os.path.exists(CONTACTS_FILE):
        try:
            with open(CONTACTS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"⚠️ 文件格式错误，返回空列表")
            return []
    return []

def save_contact_to_file(form_data):
    """保存联系人到文件"""
    try:
        contacts = load_contacts()
        
        contact_record = {
            'id': datetime.now().strftime('%Y%m%d%H%M%S%f'),
            'name': form_data['name'],
            'email': form_data['email'],
            'message': form_data['message'],
            'source': form_data.get('source', 'jiayee-portfolio'),
            'website': form_data.get('website', ''),
            'timestamp': datetime.now().isoformat(),
            'status': 'new'
        }
        
        contacts.append(contact_record)
        
        with open(CONTACTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(contacts, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 本地保存成功: {contact_record['id']}")
        print(f"📊 当前记录总数: {len(contacts)}")
        
        # 打印文件路径
        print(f"📁 文件路径: {os.path.abspath(CONTACTS_FILE)}")
        
        return True
        
    except Exception as e:
        print(f"❌ 本地保存失败: {str(e)}")
        return False

def send_email_notifications(form_data):
    """发送邮件通知"""
    try:
        # 发送管理员通知
        send_gmail(
            to_email=CONFIG["admin_email"],
            subject=f"🎯 新咨询：{form_data['name']}",
            is_admin=True,
            form_data=form_data
        )
        
        # 发送客户确认
        send_gmail(
            to_email=form_data['email'],
            subject=f"✅ 感谢您的咨询 - Jiayee Design",
            is_admin=False,
            form_data=form_data
        )
        
        print(f"✅ 邮件发送完成")
        return True
        
    except Exception as e:
        print(f"❌ 邮件发送失败: {str(e)}")
        return False

def send_gmail(to_email, subject, is_admin, form_data):
    """发送Gmail"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = CONFIG["gmail_sender"]
        msg['To'] = to_email
        
        if is_admin:
            # 管理员邮件
            plain_content = f"""
新咨询通知
============

姓名: {form_data['name']}
邮箱: {form_data['email']}
需求: {form_data['message']}
来源: {form_data.get('website', 'Jiayee作品集网站')}
时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
            
            html_content = f"""
<html>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #6366f1; margin-top: 0;">🎯 新咨询通知</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>👤 姓名：</strong>{form_data['name']}</p>
            <p><strong>📧 邮箱：</strong><a href="mailto:{form_data['email']}">{form_data['email']}</a></p>
            <p><strong>💬 需求：</strong></p>
            <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
                {form_data['message'].replace('\n', '<br>')}
            </div>
            <p><strong>🌐 来源：</strong>{form_data.get('website', 'Jiayee作品集网站')}</p>
            <p><strong>🕐 时间：</strong>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 12px;">
            <p>此邮件由Jiayee作品集网站自动发送</p>
        </div>
    </div>
</body>
</html>
            """
        else:
            # 客户确认邮件
            plain_content = f"""
感谢您的咨询 - Jiayee Design
============================

尊敬的 {form_data['name']}，

感谢您通过我的作品集网站提交咨询！我已收到您的信息。

您的咨询内容：
{form_data['message']}

我将在24小时内通过您提供的邮箱地址与您联系：
{form_data['email']}

请留意您的邮箱收件箱（包括垃圾邮件箱）。

期待与您合作！

--
Jiayee
创意 Landing Page 设计专家
专注 Landing Page 设计与转化优化
            """
            
            html_content = f"""
<html>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #6366f1; margin-top: 0;">✅ 感谢您的咨询！</h2>
        
        <p>尊敬的 <strong>{form_data['name']}</strong>，</p>
        
        <p>感谢您通过我的作品集网站提交咨询。我已收到您的信息。</p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #06b6d4;">
            <p><strong>📋 您的咨询内容：</strong></p>
            <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
                {form_data['message'].replace('\n', '<br>')}
            </div>
        </div>
        
        <p>我将在 <strong style="color: #06b6d4;">24小时内</strong> 通过以下邮箱与您联系：</p>
        <p style="font-weight: bold;">{form_data['email']}</p>
        
        <p>请留意您的邮箱收件箱（包括垃圾邮件箱）。</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>💡 温馨提示：</strong> 如有任何问题，请随时通过网站表单再次联系。</p>
        </div>
        
        <p>期待与您合作，打造高转化的创意Landing Page！</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 12px;">
            <p>Jiayee Design · 创意 Landing Page 设计专家<br>
            专注 Landing Page 设计与转化优化</p>
        </div>
    </div>
</body>
</html>
            """
        
        # 添加纯文本和HTML版本
        msg.attach(MIMEText(plain_content, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))
        
        # 发送邮件
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(CONFIG["gmail_sender"], CONFIG["gmail_password"])
            server.send_message(msg)
        
        print(f"📧 邮件发送成功: {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ 发送邮件失败 [{to_email}]: {str(e)}")
        return False

@app.route('/')
def index():
    """主页"""
    return '''
<!DOCTYPE html>
<html>
<head>
    <title>Jiayee Contact API</title>
    <style>
        body {
            font-family: 'Inter', Arial, sans-serif;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            color: white;
            margin: 0;
            padding: 40px;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        h1 {
            color: #6366f1;
            margin-bottom: 30px;
        }
        .endpoint {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .method {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 5px;
            font-weight: bold;
            margin-right: 10px;
        }
        .get { background: #10b981; color: white; }
        .post { background: #6366f1; color: white; }
        code {
            background: rgba(0,0,0,0.3);
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            margin-left: 10px;
        }
        .online { background: #10b981; color: white; }
        .test-btn {
            background: #6366f1;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 10px;
            font-family: inherit;
        }
        .test-btn:hover {
            background: #4f46e5;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Jiayee Contact API</h1>
        <p>表单提交和邮件通知服务</p>
        
        <div class="endpoint">
            <div>
                <span class="method get">GET</span> 
                <code>/api/health</code>
                <span class="status online">在线</span>
            </div>
            <p>健康检查端点</p>
            <button class="test-btn" onclick="testHealth()">测试连接</button>
        </div>
        
        <div class="endpoint">
            <div>
                <span class="method post">POST</span> 
                <code>/api/submit</code>
            </div>
            <p>表单提交端点</p>
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin: 10px 0;">
                <strong>请求体示例：</strong>
                <pre><code>{
    "name": "张三",
    "email": "zhangsan@example.com",
    "message": "我想咨询Landing Page设计..."
}</code></pre>
            </div>
            <button class="test-btn" onclick="testSubmit()">测试提交</button>
        </div>
        
        <div class="endpoint">
            <div>
                <span class="method get">GET</span> 
                <code>/api/contacts</code>
            </div>
            <p>查看所有提交的联系人</p>
            <button class="test-btn" onclick="testContacts()">查看记录</button>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
            <h3>📊 系统信息</h3>
            <p><strong>状态：</strong> <span id="status">正在检查...</span></p>
            <p><strong>服务地址：</strong> <code id="api-url">正在获取...</code></p>
            <p><strong>数据文件：</strong> <code id="data-file">正在获取...</code></p>
            <p><strong>记录数量：</strong> <span id="record-count">正在获取...</span></p>
        </div>
    </div>
    
    <script>
        // 测试健康检查
        async function testHealth() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                alert(`✅ 连接成功！\n状态: ${data.status}\n版本: ${data.version}`);
            } catch (error) {
                alert(`❌ 连接失败: ${error.message}`);
            }
        }
        
        // 测试提交
        async function testSubmit() {
            const testData = {
                name: "测试用户",
                email: "test@example.com",
                message: "这是一个API测试提交",
                source: "api-test",
                website: window.location.href
            };
            
            try {
                const response = await fetch('/api/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testData)
                });
                
                const data = await response.json();
                if (data.success) {
                    alert(`✅ 提交成功！\nID: ${data.data.timestamp}\n${data.message}`);
                } else {
                    alert(`❌ 提交失败: ${data.error}`);
                }
            } catch (error) {
                alert(`❌ 请求失败: ${error.message}`);
            }
        }
        
        // 查看联系人
        async function testContacts() {
            try {
                const response = await fetch('/api/contacts');
                const data = await response.json();
                if (data.success) {
                    alert(`✅ 获取成功！\n记录数量: ${data.count}`);
                    console.log('联系人记录:', data.contacts);
                } else {
                    alert(`❌ 获取失败: ${data.error}`);
                }
            } catch (error) {
                alert(`❌ 请求失败: ${error.message}`);
            }
        }
        
        // 页面加载时获取状态
        window.addEventListener('load', async () => {
            try {
                // 获取健康状态
                const healthRes = await fetch('/api/health');
                const healthData = await healthRes.json();
                
                document.getElementById('status').innerHTML = 
                    `<span style="color:#10b981">● 在线</span> ${healthData.version}`;
                document.getElementById('api-url').textContent = window.location.href;
                document.getElementById('data-file').textContent = healthData.data_file;
                
                // 获取联系人数量
                const contactsRes = await fetch('/api/contacts');
                const contactsData = await contactsRes.json();
                if (contactsData.success) {
                    document.getElementById('record-count').textContent = contactsData.count;
                }
            } catch (error) {
                document.getElementById('status').innerHTML = 
                    `<span style="color:#ef4444">● 离线</span>`;
                document.getElementById('record-count').textContent = '无法获取';
            }
        });
    </script>
</body>
</html>
'''

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 启动Jiayee联系表单后端...")
    print("=" * 60)
    print("📧 Gmail发件人:", CONFIG["gmail_sender"])
    print("📧 管理员邮箱:", CONFIG["admin_email"])
    print("🌐 服务地址: http://127.0.0.1:5000")
    print("🔧 健康检查: http://127.0.0.1:5000/api/health")
    print("📁 数据文件:", os.path.abspath(CONTACTS_FILE))
    print("=" * 60)
    
    # 检查数据文件
    contacts = load_contacts()
    print(f"📊 现有记录数量: {len(contacts)}")
    
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)