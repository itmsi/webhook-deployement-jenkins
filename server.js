const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 9522;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS untuk mengizinkan request dari Jenkins
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Fungsi untuk mendapatkan konfigurasi project
function getProjectConfig(projectName) {
    // Normalize project name: convert dash to underscore and uppercase
    const normalizedName = projectName.replace(/-/g, '_').toUpperCase();
    
    const projectPath = process.env[`${normalizedName}_PATH`];
    const projectCommands = process.env[`${normalizedName}_COMMANDS`];
    
    if (!projectPath || !projectCommands) {
        return null;
    }
    
    return {
        path: projectPath,
        commands: projectCommands.split(';').map(cmd => cmd.trim())
    };
}

// Fungsi untuk menjalankan deployment
async function deployProject(projectName, config) {
    return new Promise((resolve, reject) => {
        console.log(`🚀 Memulai deployment untuk ${projectName}...`);
        console.log(`📁 Path: ${config.path}`);
        console.log(`⚡ Commands: ${config.commands.join(' && ')}`);
        
        // Buat command untuk menjalankan semua perintah secara berurutan
        const fullCommand = `cd ${config.path} && ${config.commands.join(' && ')}`;
        
        exec(fullCommand, { 
            timeout: 300000, // 5 menit timeout
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Deployment gagal untuk ${projectName}:`, error);
                console.error('Stderr:', stderr);
                reject({
                    success: false,
                    project: projectName,
                    error: error.message,
                    stderr: stderr,
                    stdout: stdout
                });
            } else {
                console.log(`✅ Deployment berhasil untuk ${projectName}`);
                console.log('Output:', stdout);
                resolve({
                    success: true,
                    project: projectName,
                    stdout: stdout,
                    stderr: stderr
                });
            }
        });
    });
}

// Fungsi untuk mendapatkan daftar project dalam deployment chain
function getDeploymentChain(chainName = 'DEPLOYMENT_CHAIN_DEFAULT') {
    const chainConfig = process.env[chainName] || process.env.DEPLOYMENT_CHAIN_DEFAULT;
    
    if (!chainConfig) {
        return null;
    }
    
    return chainConfig.split(',').map(name => name.trim());
}

// Fungsi untuk menjalankan deployment berurutan
async function deployChain(chainName = 'DEPLOYMENT_CHAIN_DEFAULT', webhookData = {}) {
    const chain = getDeploymentChain(chainName);
    
    if (!chain || chain.length === 0) {
        throw new Error('Deployment chain tidak ditemukan atau kosong');
    }
    
    console.log(`🔗 Melakukan deployment chain: ${chain.join(' → ')}`);
    
    const results = [];
    let allSuccessful = true;
    
    for (const projectName of chain) {
        try {
            const config = getProjectConfig(projectName);
            
            if (!config) {
                console.error(`❌ Project ${projectName} tidak ditemukan dalam konfigurasi`);
                results.push({
                    success: false,
                    project: projectName,
                    error: 'Project tidak ditemukan dalam konfigurasi'
                });
                allSuccessful = false;
                continue;
            }
            
            // Cek apakah path project ada
            if (!fs.existsSync(config.path)) {
                console.error(`❌ Path ${config.path} tidak ditemukan untuk ${projectName}`);
                results.push({
                    success: false,
                    project: projectName,
                    error: `Path ${config.path} tidak ditemukan`
                });
                allSuccessful = false;
                continue;
            }
            
            const result = await deployProject(projectName, config);
            results.push(result);
            
            console.log(`✅ ${projectName} selesai, melanjutkan ke yang berikutnya...`);
            
        } catch (error) {
            console.error(`❌ Error dalam deployment ${projectName}:`, error);
            results.push({
                success: false,
                project: projectName,
                error: error.message || error
            });
            allSuccessful = false;
            
            // Optional: uncomment jika ingin tetap melanjutkan meskipun ada error
            // continue;
            // Atau stop pada error pertama (default behavior)
            break;
        }
    }
    
    return {
        success: allSuccessful,
        chain: chain,
        results: results,
        webhookData: webhookData,
        timestamp: new Date().toISOString()
    };
}

// Endpoint utama untuk webhook deployment (single project)
app.post('/webhook/deploy/:project', async (req, res) => {
    const projectName = req.params.project;
    const webhookData = req.body;
    
    console.log(`🔔 Webhook diterima untuk project: ${projectName}`);
    console.log('📦 Data webhook:', JSON.stringify(webhookData, null, 2));
    
    try {
        // Cek apakah project terdaftar
        const config = getProjectConfig(projectName);
        
        if (!config) {
            console.error(`❌ Project ${projectName} tidak ditemukan dalam konfigurasi`);
            return res.status(404).json({
                success: false,
                message: `Project ${projectName} tidak ditemukan dalam konfigurasi`,
                availableProjects: getAvailableProjects()
            });
        }
        
        // Cek apakah path project ada
        if (!fs.existsSync(config.path)) {
            console.error(`❌ Path ${config.path} tidak ditemukan`);
            return res.status(404).json({
                success: false,
                message: `Path ${config.path} tidak ditemukan`
            });
        }
        
        // Jalankan deployment
        const result = await deployProject(projectName, config);
        
        res.json({
            success: true,
            message: `Deployment berhasil untuk ${projectName}`,
            project: projectName,
            timestamp: new Date().toISOString(),
            result: result
        });
        
    } catch (error) {
        console.error(`❌ Error dalam deployment ${projectName}:`, error);
        
        res.status(500).json({
            success: false,
            message: `Deployment gagal untuk ${projectName}`,
            project: projectName,
            timestamp: new Date().toISOString(),
            error: error
        });
    }
});

// Endpoint untuk deployment chain (berurutan)
app.post('/webhook/deploy-chain/:chain?', async (req, res) => {
    const chainName = req.params.chain ? `DEPLOYMENT_CHAIN_${req.params.chain.toUpperCase('_')}` : 'DEPLOYMENT_CHAIN_DEFAULT';
    const webhookData = req.body;
    
    console.log(`🔔 Webhook deployment chain diterima untuk: ${chainName}`);
    console.log('📦 Data webhook:', JSON.stringify(webhookData, null, 2));
    
    try {
        const result = await deployChain(chainName, webhookData);
        
        const successCount = result.results.filter(r => r.success).length;
        const totalCount = result.results.length;
        
        res.json({
            success: result.success,
            message: `Deployment chain ${result.success ? 'berhasil' : 'gagal'}: ${successCount}/${totalCount} projects berhasil`,
            chain: result.chain,
            results: result.results,
            timestamp: result.timestamp,
            webhookData: webhookData
        });
        
    } catch (error) {
        console.error(`❌ Error dalam deployment chain:`, error);
        
        res.status(500).json({
            success: false,
            message: `Deployment chain gagal: ${error.message}`,
            chain: getDeploymentChain(chainName) || [],
            timestamp: new Date().toISOString(),
            error: error.message,
            webhookData: webhookData
        });
    }
});

// Endpoint untuk mendapatkan daftar project yang tersedia
app.get('/webhook/projects', (req, res) => {
    const projects = getAvailableProjects();
    res.json({
        success: true,
        projects: projects,
        count: projects.length
    });
});

// Endpoint untuk melihat deployment chains yang tersedia
app.get('/webhook/chains', (req, res) => {
    const chains = {};
    const envVars = Object.keys(process.env);
    
    envVars.forEach(key => {
        if (key.startsWith('DEPLOYMENT_CHAIN_')) {
            const chainName = key.replace('DEPLOYMENT_CHAIN_', '');
            const chain = getDeploymentChain(key);
            if (chain) {
                chains[chainName.toLowerCase()] = {
                    name: chainName.toLowerCase(),
                    envVar: key,
                    projects: chain,
                    count: chain.length
                };
            }
        }
    });
    
    res.json({
        success: true,
        chains: chains,
        count: Object.keys(chains).length
    });
});

// Fungsi untuk mendapatkan daftar project yang tersedia
function getAvailableProjects() {
    const projects = [];
    const envVars = Object.keys(process.env);
    
    envVars.forEach(key => {
        if (key.endsWith('_PATH')) {
            const projectName = key.replace('_PATH', '').toLowerCase();
            const config = getProjectConfig(projectName);
            if (config) {
                projects.push({
                    name: projectName,
                    path: config.path,
                    commands: config.commands,
                    exists: fs.existsSync(config.path)
                });
            }
        }
    });
    
    return projects;
}

// Endpoint untuk health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        port: PORT,
        projects: getAvailableProjects().length
    });
});

// Endpoint untuk test deployment (tanpa benar-benar menjalankan)
app.post('/webhook/test/:project', (req, res) => {
    const projectName = req.params.project;
    const config = getProjectConfig(projectName);
    
    if (!config) {
        return res.status(404).json({
            success: false,
            message: `Project ${projectName} tidak ditemukan dalam konfigurasi`
        });
    }
    
    res.json({
        success: true,
        message: `Konfigurasi ditemukan untuk ${projectName}`,
        project: projectName,
        config: {
            path: config.path,
            commands: config.commands,
            pathExists: fs.existsSync(config.path)
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tidak ditemukan',
        availableEndpoints: [
            'POST /webhook/deploy/:project',
            'POST /webhook/deploy-chain/:chain?',
            'GET /webhook/projects',
            'GET /webhook/chains',
            'POST /webhook/test/:project',
            'GET /health'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Webhook Deployment Server berjalan!');
    console.log(`🔗 Server running on port ${PORT}`);
    console.log(`📋 Available projects: ${getAvailableProjects().length}`);
    
    // Tampilkan deployment chains yang tersedia
    const defaultChain = getDeploymentChain('DEPLOYMENT_CHAIN_DEFAULT');
    if (defaultChain) {
        console.log(`🔗 Default deployment chain: ${defaultChain.join(' → ')}`);
    }
    
    console.log('📡 Endpoints:');
    console.log(`   POST http://localhost:${PORT}/webhook/deploy/:project`);
    console.log(`   POST http://localhost:${PORT}/webhook/deploy-chain/:chain?`);
    console.log(`   GET  http://localhost:${PORT}/webhook/projects`);
    console.log(`   GET  http://localhost:${PORT}/webhook/chains`);
    console.log(`   POST http://localhost:${PORT}/webhook/test/:project`);
    console.log(`   GET  http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Server shutting down gracefully...');
    process.exit(0);
});
