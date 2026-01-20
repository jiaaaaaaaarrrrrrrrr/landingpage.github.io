from flask import Flask, request, jsonify
import json
import os
import sys
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)

# 允许跨域请求
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5000", "http://localhost:5000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"]
    }
})

# 数据存储路径
DATA_DIR = "data"
CONTACTS_FILE = os.path.join(DATA_DIR, "contacts.json")

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)

def load_contacts():
    """加载已有的联系人数据"""
    if os.path.exists(CONTACTS_FILE):
        try:
            with open(CONTACTS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"警告: {CONTACTS_FILE} 文件格式错误，将创建新文件")
            return []
    return []

def save_contacts(contacts):
    """保存联系人数据"""
    try:
        with open(CONTACTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(contacts, f, ensure_ascii=False, indent=2)
        print(f"✅ 成功保存 {len(contacts)} 条记录到 {CONTACTS_FILE}")
    except Exception as e:
        print(f"❌ 保存文件失败: {str(e)}")

@app.before_request
def handle_preflight():
    """处理OPTIONS预检请求"""
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Accept")
        response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        return response

@app.route('/api/submit', methods=['POST', 'OPTIONS'])
def submit_contact():
    """处理表单提交"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        # 获取JSON数据
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': '请求必须是JSON格式'
            }), 400
        
        data = request.get_json()
        print(f"📨 收到表单数据: {json.dumps(data, ensure_ascii=False)}")
        
        # 验证必要字段
        required_fields = ['name', 'email', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'缺少必填字段: {field}'
                }), 400
            
            value = str(data[field]).strip()
            if not value:
                return jsonify({
                    'success': False,
                    'error': f'字段不能为空: {field}'
                }), 400
        
        name = str(data['name']).strip()
        email = str(data['email']).strip()
        message = str(data['message']).strip()
        
        # 验证邮箱格式
        if '@' not in email or '.' not in email:
            return jsonify({
                'success': False,
                'error': '邮箱格式无效'
            }), 400
        
        # 验证消息长度
        if len(message) < 3:
            return jsonify({
                'success': False,
                'error': '消息内容太短，请详细描述您的需求（至少3个字符）'
            }), 400
        
        # 创建联系记录
        contact_record = {
            'id': datetime.now().strftime('%Y%m%d%H%M%S'),
            'name': name,
            'email': email,
            'message': message,
            'source': data.get('source', 'jiayee-portfolio'),
            'website': data.get('website', ''),
            'timestamp': data.get('timestamp', datetime.now().isoformat()),
            'status': 'new',
            'created_at': datetime.now().isoformat()
        }
        
        # 加载现有数据并添加新记录
        contacts = load_contacts()
        contacts.append(contact_record)
        
        # 保存数据
        save_contacts(contacts)
        
        print(f"✅ 咨询已保存: {name} ({email})")
        
        # 返回成功响应
        response = jsonify({
            'success': True,
            'message': '咨询提交成功！Jiayee将在24小时内回复您。',
            'data': {
                'id': contact_record['id'],
                'name': contact_record['name'],
                'timestamp': contact_record['timestamp']
            }
        })
        
        # 设置CORS头
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Accept")
        response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        
        return response
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON解析错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'JSON数据格式错误'
        }), 400
    except Exception as e:
        print(f"❌ 表单处理错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'服务器内部错误: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    response = jsonify({
        'status': 'healthy',
        'service': 'jiayee-contact-api',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'data_file': CONTACTS_FILE,
        'contacts_count': len(load_contacts())
    })
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    """获取联系人列表（用于测试）"""
    contacts = load_contacts()
    response = jsonify({
        'success': True,
        'count': len(contacts),
        'contacts': contacts
    })
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@app.route('/')
def home():
    """主页"""
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Jiayee Form API</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
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
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Jiayee Form API 服务已启动</h1>
            <p>这是一个为Jiayee作品集网站提供表单处理的后端服务。</p>
            
            <div class="endpoint">
                <div><span class="method get">GET</span> <code>/api/health</code></div>
                <p>健康检查端点</p>
            </div>
            
            <div class="endpoint">
                <div><span class="method post">POST</span> <code>/api/submit</code></div>
                <p>表单提交端点，接受JSON格式的数据</p>
                <p><strong>请求体示例：</strong></p>
                <pre><code>{
    "name": "张三",
    "email": "zhangsan@example.com",
    "message": "我想咨询关于Landing Page设计的事宜..."
}</code></pre>
            </div>
            
            <div class="endpoint">
                <div><span class="method get">GET</span> <code>/api/contacts</code></div>
                <p>查看所有提交的联系信息（开发环境使用）</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <p><strong>状态：</strong> ✅ 服务正常运行中</p>
                <p><strong>数据文件：</strong> <code>data/contacts.json</code></p>
                <p><strong>端口：</strong> 5000</p>
            </div>
        </div>
    </body>
    </html>
    '''

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 启动Jiayee联系表单后端...")
    print("=" * 60)
    print("🔗 前端访问地址: http://127.0.0.1:5500/index.html")
    print("⚙️  后端访问地址: http://127.0.0.1:5000")
    print("📊 健康检查: http://127.0.0.1:5000/api/health")
    print("💾 数据存储: data/contacts.json")
    print("=" * 60)
    
    # 检查数据目录
    if os.path.exists(CONTACTS_FILE):
        contacts = load_contacts()
        print(f"📁 已有联系记录: {len(contacts)} 条")
    else:
        print("📁 数据文件不存在，将自动创建")
    
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)