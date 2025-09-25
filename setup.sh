#!/bin/bash

# Webhook Deployment Setup Script
# Script untuk setup dan menjalankan webhook deployment system

echo "🚀 Webhook Deployment Setup Script"
echo "=================================="

# Cek apakah Node.js terinstall
if ! command -v node &> /dev/null; then
    echo "❌ Node.js tidak ditemukan. Silakan install Node.js terlebih dahulu."
    exit 1
fi

# Cek apakah npm terinstall
if ! command -v npm &> /dev/null; then
    echo "❌ npm tidak ditemukan. Silakan install npm terlebih dahulu."
    exit 1
fi

echo "✅ Node.js dan npm sudah terinstall"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Cek apakah file config.env ada
if [ ! -f "config.env" ]; then
    echo "❌ File config.env tidak ditemukan!"
    echo "📝 Silakan copy config.env.example ke config.env dan edit sesuai kebutuhan"
    exit 1
fi

# Cek apakah file .env ada, jika tidak copy dari config.env
if [ ! -f ".env" ]; then
    echo "📋 Copying config.env to .env..."
    cp config.env .env
fi

echo "✅ Setup selesai!"
echo ""
echo "🔧 Langkah selanjutnya:"
echo "1. Edit file .env sesuai dengan project Anda"
echo "2. Jalankan: npm start"
echo "3. Server akan berjalan di port 9522"
echo ""
echo "📡 Endpoints yang tersedia:"
echo "   POST http://localhost:9522/webhook/deploy/:project"
echo "   GET  http://localhost:9522/webhook/projects"
echo "   POST http://localhost:9522/webhook/test/:project"
echo "   GET  http://localhost:9522/health"
echo ""
echo "📖 Lihat README.md untuk dokumentasi lengkap"
