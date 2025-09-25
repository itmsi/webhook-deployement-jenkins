# Webhook Deployment System

Sistem webhook deployment yang fleksibel untuk multiple project dengan berbagai teknologi (Node.js, React, Laravel, Vue.js, dll).

## 🚀 Fitur

- ✅ Support multiple project dengan teknologi berbeda
- ✅ Konfigurasi melalui file environment
- ✅ Endpoint untuk setiap project
- ✅ Health check dan monitoring
- ✅ Error handling yang robust
- ✅ Logging yang detail
- ✅ CORS support untuk Jenkins integration

## 📋 Teknologi yang Didukung

- **Node.js Express** - npm install, npm run build
- **React.js** - npm install, npm run build
- **Laravel** - composer install, php artisan cache:clear
- **Vue.js** - npm install, npm run build:production
- **Next.js** - npm install, npm run build
- **Django** - pip install, python manage.py migrate
- **Flask** - pip install, systemctl restart
- **Angular** - npm install, ng build --prod
- **Nuxt.js** - npm install, npm run build
- **Spring Boot** - mvn clean package

## 🛠️ Instalasi

1. **Clone atau download project ini**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Konfigurasi environment:**
   ```bash
   cp config.env .env
   ```

4. **Edit file `.env` sesuai dengan project Anda:**
   ```env
   PORT=9522
   
   # Contoh konfigurasi project
   SISTEM_A_PATH=/var/www/html/sistem-a
   SISTEM_A_COMMANDS=git pull origin develop;npm install;npm run build;pm2 restart sistem-a
   
   SISTEM_B_PATH=/var/www/html/sistem-b
   SISTEM_B_COMMANDS=git pull origin main;npm install;npm run build;pm2 restart sistem-b
   ```

5. **Jalankan server:**
   ```bash
   npm start
   ```

## 📡 API Endpoints

### 1. Deploy Project
```http
POST /webhook/deploy/:project
```

**Contoh:**
```bash
curl -X POST http://localhost:9522/webhook/deploy/sistem-a \
  -H "Content-Type: application/json" \
  -d '{"branch": "develop", "commit": "abc123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Deployment berhasil untuk sistem-a",
  "project": "sistem-a",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "result": {
    "success": true,
    "project": "sistem-a",
    "stdout": "git pull output...",
    "stderr": ""
  }
}
```

### 2. Daftar Project
```http
GET /webhook/projects
```

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "name": "sistem-a",
      "path": "/var/www/html/sistem-a",
      "commands": ["git pull origin develop", "npm install", "npm run build"],
      "exists": true
    }
  ],
  "count": 1
}
```

### 3. Test Konfigurasi
```http
POST /webhook/test/:project
```

**Response:**
```json
{
  "success": true,
  "message": "Konfigurasi ditemukan untuk sistem-a",
  "project": "sistem-a",
  "config": {
    "path": "/var/www/html/sistem-a",
    "commands": ["git pull origin develop", "npm install", "npm run build"],
    "pathExists": true
  }
}
```

### 4. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "port": 9522,
  "projects": 5
}
```

## ⚙️ Konfigurasi Project

### Format Konfigurasi

Setiap project memerlukan 2 environment variables:

```env
# Format: PROJECT_NAME_PATH=path_to_directory
SISTEM_A_PATH=/var/www/html/sistem-a

# Format: PROJECT_NAME_COMMANDS=command1;command2;command3
SISTEM_A_COMMANDS=git pull origin develop;npm install;npm run build;pm2 restart sistem-a
```

### Contoh Konfigurasi Berbagai Teknologi

#### Node.js Express
```env
SISTEM_A_PATH=/var/www/html/sistem-a
SISTEM_A_COMMANDS=git pull origin develop;npm install;npm run build;pm2 restart sistem-a
```

#### React.js
```env
SISTEM_B_PATH=/var/www/html/sistem-b
SISTEM_B_COMMANDS=git pull origin main;npm install;npm run build;pm2 restart sistem-b
```

#### Laravel
```env
SISTEM_C_PATH=/var/www/html/sistem-c
SISTEM_C_COMMANDS=git pull origin master;composer install;php artisan cache:clear;php artisan config:cache;php artisan route:cache;php artisan view:cache
```

#### Vue.js
```env
SISTEM_D_PATH=/var/www/html/sistem-d
SISTEM_D_COMMANDS=git pull origin develop;npm install;npm run build:production;pm2 restart sistem-d
```

#### Django
```env
SISTEM_F_PATH=/var/www/html/sistem-f
SISTEM_F_COMMANDS=git pull origin main;pip install -r requirements.txt;python manage.py collectstatic --noinput;python manage.py migrate;sudo systemctl restart sistem-f
```

## 🔧 Integrasi dengan Jenkins

### 1. Setup Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Deploy') {
            steps {
                script {
                    def webhookUrl = "http://your-server:9522/webhook/deploy/sistem-a"
                    def payload = [
                        branch: env.BRANCH_NAME,
                        commit: env.GIT_COMMIT,
                        buildNumber: env.BUILD_NUMBER
                    ]
                    
                    httpRequest(
                        url: webhookUrl,
                        httpMethod: 'POST',
                        contentType: 'APPLICATION_JSON',
                        requestBody: groovy.json.JsonBuilder(payload).toString()
                    )
                }
            }
        }
    }
}
```

### 2. Setup Jenkins Webhook

1. Di Jenkins, buka project Anda
2. Pergi ke **Configure** → **Build Triggers**
3. Centang **GitHub hook trigger for GITScm polling**
4. Atau gunakan **Generic Webhook Trigger** plugin

### 3. Setup GitHub Webhook

1. Pergi ke repository GitHub Anda
2. Settings → Webhooks → Add webhook
3. Payload URL: `http://your-server:9522/webhook/deploy/sistem-a`
4. Content type: `application/json`
5. Events: Push events

## 🐳 Docker Support

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 9522

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  webhook-deployment:
    build: .
    ports:
      - "9522:9522"
    volumes:
      - ./config.env:/app/.env
      - /var/www/html:/var/www/html
    restart: unless-stopped
```

## 📊 Monitoring dan Logging

### Log Format
```
🚀 Memulai deployment untuk sistem-a...
📁 Path: /var/www/html/sistem-a
⚡ Commands: git pull origin develop && npm install && npm run build
✅ Deployment berhasil untuk sistem-a
```

### Monitoring dengan PM2
```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start server.js --name webhook-deployment

# Monitor
pm2 monit

# Logs
pm2 logs webhook-deployment
```

## 🔒 Security

### 1. Authentication (Opsional)
Tambahkan middleware authentication:

```javascript
// Middleware untuk authentication
const authenticateWebhook = (req, res, next) => {
    const token = req.headers['x-webhook-token'];
    const validToken = process.env.WEBHOOK_TOKEN;
    
    if (!token || token !== validToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
};

// Gunakan middleware
app.post('/webhook/deploy/:project', authenticateWebhook, async (req, res) => {
    // ... deployment logic
});
```

### 2. IP Whitelist
```javascript
const allowedIPs = ['192.168.1.100', '10.0.0.50'];

app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
});
```

## 🚨 Troubleshooting

### 1. Permission Error
```bash
# Pastikan user memiliki permission ke directory project
sudo chown -R $USER:$USER /var/www/html/sistem-a
chmod -R 755 /var/www/html/sistem-a
```

### 2. Git Authentication
```bash
# Setup SSH key atau personal access token
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Node Modules Error
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules dan reinstall
rm -rf node_modules
npm install
```

### 4. PM2 Not Found
```bash
# Install PM2 globally
npm install -g pm2

# Atau gunakan npx
npx pm2 restart sistem-a
```

## 📝 Changelog

### v1.0.0
- ✅ Initial release
- ✅ Support multiple project types
- ✅ Environment-based configuration
- ✅ Health check endpoint
- ✅ Error handling
- ✅ CORS support

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail.

## 📞 Support

Jika ada masalah atau pertanyaan, silakan buat issue di repository ini.
