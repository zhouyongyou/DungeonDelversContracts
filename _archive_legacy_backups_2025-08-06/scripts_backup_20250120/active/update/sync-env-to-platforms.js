#!/usr/bin/env node

// 同步環境變量到 Vercel 和 Render 的腳本
// 注意：需要先安裝 Vercel CLI 和設定 API tokens

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 配置
const VERCEL_PROJECT_NAME = 'your-vercel-project-name';
const RENDER_SERVICE_ID = 'your-render-service-id';
const RENDER_API_KEY = process.env.RENDER_API_KEY;

// 讀取 .env 文件
function readEnvFile(filePath) {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        if (line && !line.startsWith('#') && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            envVars[key.trim()] = value.trim();
        }
    });
    
    return envVars;
}

// 同步到 Vercel
async function syncToVercel(envVars) {
    console.log('🚀 同步環境變量到 Vercel...');
    
    // 需要先安裝 Vercel CLI: npm i -g vercel
    // 並且登入: vercel login
    
    try {
        // 先列出現有變量
        execSync(`vercel env ls --production`, { stdio: 'inherit' });
        
        // 更新每個變量
        for (const [key, value] of Object.entries(envVars)) {
            if (key.startsWith('VITE_')) {
                console.log(`  更新 ${key}...`);
                // 先刪除舊的（如果存在）
                try {
                    execSync(`echo "${value}" | vercel env rm ${key} production -y`, { stdio: 'pipe' });
                } catch (e) {
                    // 變量不存在，忽略錯誤
                }
                // 添加新的
                execSync(`echo "${value}" | vercel env add ${key} production`, { stdio: 'pipe' });
            }
        }
        
        console.log('✅ Vercel 環境變量更新完成！');
        console.log('⚠️  請在 Vercel 控制台觸發重新部署');
    } catch (error) {
        console.error('❌ Vercel 同步失敗:', error.message);
    }
}

// 同步到 Render (使用 API)
async function syncToRender(envVars) {
    console.log('🚀 同步環境變量到 Render...');
    
    if (!RENDER_API_KEY) {
        console.error('❌ 請設定 RENDER_API_KEY 環境變量');
        return;
    }
    
    try {
        const renderEnvVars = [];
        
        for (const [key, value] of Object.entries(envVars)) {
            if (key.startsWith('VITE_')) {
                renderEnvVars.push({
                    key: key,
                    value: value
                });
            }
        }
        
        // 使用 Render API 更新環境變量
        const response = await fetch(`https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${RENDER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(renderEnvVars)
        });
        
        if (response.ok) {
            console.log('✅ Render 環境變量更新完成！');
            console.log('ℹ️  Render 會自動觸發重新部署');
        } else {
            console.error('❌ Render API 錯誤:', await response.text());
        }
    } catch (error) {
        console.error('❌ Render 同步失敗:', error.message);
    }
}

// 主函數
async function main() {
    console.log('📋 環境變量同步工具\n');
    
    // 讀取各個 .env 文件
    const contractsEnv = readEnvFile(path.join(__dirname, '../.env'));
    const frontendEnv = readEnvFile(path.join(__dirname, '../../GitHub/DungeonDelvers/.env'));
    const backendEnv = readEnvFile(path.join(__dirname, '../../dungeon-delvers-metadata-server/.env'));
    
    // 合併環境變量（前端優先）
    const allEnvVars = {
        ...contractsEnv,
        ...backendEnv,
        ...frontendEnv
    };
    
    console.log(`找到 ${Object.keys(allEnvVars).length} 個環境變量\n`);
    
    // 同步到各平台
    await syncToVercel(allEnvVars);
    console.log('');
    await syncToRender(allEnvVars);
    
    console.log('\n✅ 同步完成！');
}

// 執行
main().catch(console.error);