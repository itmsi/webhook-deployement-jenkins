# Panduan Penggunaan Deployment Chain

## Ringkasan

Webhook deployment server sekarang mendukung deployment berurutan (sequential deployment) untuk beberapa sistem dalam satu request.

## Konfigurasi

### 1. Deployment Chain di config.env

```bash
# Deployment Chain Configuration
# Format: CHAIN_NAME=sistem1,sistem2,sistem3
DEPLOYMENT_CHAIN_DEFAULT=sistem-a,sistem-b,sistem-c

# Anda juga bisa membuat chain custom
DEPLOYMENT_CHAIN_FRONTEND=sistem-b,sistem-c
DEPLOYMENT_CHAIN_BACKEND=sistem-a
```

## Endpoint Baru

### 1. Deployment Chain (Berurutan)

**POST** `/webhook/deploy-chain/:chain?`

- `chain` (optional): Nama chain (tanpa "DEPLOYMENT_CHAIN_" prefix)
- Jika tidak ada chain yang ditentukan, akan menggunakan `DEPLOYMENT_CHAIN_DEFAULT`

#### Contoh Request:

```bash
# Menggunakan default chain (sistem-a → sistem-b → sistem-c)
curl -X POST http://localhost:9522/webhook/deploy-chain

# Menggunakan chain custom
curl -X POST http://localhost:9522/webhook/deploy-chain/frontend
```

#### Response:

```json
{
  "success": true,
  "message": "Deployment chain berhasil: 3/3 projects berhasil",
  "chain": ["sistem-a", "sistem-b", "sistem-c"],
  "results": [
    {
      "success": true,
      "project": "sistem-a",
      "stdout": "Output dari sistem-a..."
    },
    {
      "success": true,
      "project": "sistem-b", 
      "stdout": "Output dari sistem-b..."
    },
    {
      "success": true,
      "project": "sistem-c",
      "stdout": "Output dari sistem-c..."
    }
  ],
  "timestamp": "2025-01-26T10:30:00.000Z",
  "webhookData": {}
}
```

### 2. Lihat Deployment Chains Tersedia

**GET** `/webhook/chains`

Mengecek deployment chains yang dikonfigurasi.

#### Response:

```json
{
  "success": true,
  "chains": {
    "default": {
      "name": "default",
      "envVar": "DEPLOYMENT_CHAIN_DEFAULT",
      "projects": ["sistem-a", "sistem-b", "sistem-c"],
      "count": 3
    },
    "frontend": {
      "name": "frontend", 
      "envVar": "DEPLOYMENT_CHAIN_FRONTEND",
      "projects": ["sistem-b", "sistem-c"],
      "count": 2
    }
  },
  "count": 2
}
```

## Cara Kerja Deployment Chain

1. **Sequential Execution**: Sistem akan deploy ke setiap project secara berurutan
2. **Error Handling**: Jika ada error di satu sistem, deployment akan berhenti (fail-fast)
3. **Logging**: Setiap langkah deployment akan dicatat dalam log
4. **Response**: Mengembalikan status success/failure untuk setiap project dalam chain

## Contoh Integrasi dengan GitHub Webhook

Untuk menggunakan deployment chain dengan GitHub webhook, ubah URL webhook dari:
```
http://localhost:9522/webhook/deploy/sistem-a
```

Menjadi:
```  
http://localhost:9522/webhook/deploy-chain/default
```

Atau jika ingin chain khusus:
```
http://localhost:9522/webhook/deploy-chain/frontend
```

## Log Output

Ketika menggunakan deployment chain, Anda akan melihat output seperti ini:

```
🔔 Webhook deployment chain diterima untuk: DEPLOYMENT_CHAIN_DEFAULT
🔗 Melakukan deployment chain: sistem-a → sistem-b → sistem-c

🚀 Memulai deployment untuk sistem-a...
📁 Path: /home/msiserver/sso/gate
⚡ Commands: git pull origin develop
✅ Deployment berhasil untuk sistem-a
✅ sistem-a selesai, melanjutkan ke yang berikutnya...

🚀 Memulai deployment untuk sistem-b...
📁 Path: /var/www/html/sistem-b
⚡ Commands: git pull origin main && npm install && npm run build && pm2 restart sistem-b
✅ Deployment berhasil untuk sistem-b
✅ sistem-b selesai, melanjutkan ke yang berikutnya...

🚀 Memulai deployment untuk sistem-c...
📁 Path: /var/www/html/sistem-c
⚡ Commands: git pull origin master && composer install && php artisan cache:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache
✅ Deployment berhasil untuk sistem-c
✅ sistem-c selesai, melanjutkan ke yang berikutnya...
```

## Troubleshooting

1. **Project tidak ditemukan**: Pastikan nama project di chain matches dengan yang ada di config.env
2. **Path tidak ditemukan**: Pastikan path di `SISTEM_X_PATH` benar dan dapat diakses
3. **Commands gagal**: Periksa apakah commands di `SISTEM_X_COMMANDS` valid
4. **Chain kosong**: Pastikan environment variable `DEPLOYMENT_CHAIN_DEFAULT` sudah dikonfigurasi

## Endpoints Lengkap

- `POST /webhook/deploy/:project` - Deploy single project
- `POST /webhook/deploy-chain/:chain?` - Deploy chain of projects  
- `GET /webhook/projects` - List available projects
- `GET /webhook/chains` - List available chains
- `POST /webhook/test/:project` - Test project configuration
- `GET /health` - Health check
