const fs = require('fs');
const path = require('path');

// 讀取合約地址配置
const contractConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../config/contracts.json'), 'utf8')
);

// 環境變數格式轉換
function generateEnvFormat(contracts) {
  return Object.entries(contracts)
    .map(([key, value]) => `VITE_MAINNET_${key}=${value}`)
    .join('\n');
}

// 更新前端 .env
function updateFrontendEnv() {
  const frontendEnvPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/.env';
  const envContent = generateEnvFormat(contractConfig.contracts);
  
  // 讀取現有 .env 並替換合約地址部分
  let existingEnv = '';
  if (fs.existsSync(frontendEnvPath)) {
    existingEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  }
  
  // 移除舊的合約地址
  const nonContractLines = existingEnv
    .split('\n')
    .filter(line => !line.startsWith('VITE_MAINNET_') || line.includes('_RPC_') || line.includes('_API_'));
  
  const newEnv = [...nonContractLines, '', '# Contract Addresses', envContent].join('\n');
  
  fs.writeFileSync(frontendEnvPath, newEnv);
  console.log('✅ 前端 .env 已更新');
}

// 更新後端 .env
function updateBackendEnv() {
  const backendEnvPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env';
  const envContent = Object.entries(contractConfig.contracts)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  let existingEnv = '';
  if (fs.existsSync(backendEnvPath)) {
    existingEnv = fs.readFileSync(backendEnvPath, 'utf8');
  }
  
  // 移除舊的合約地址
  const nonContractLines = existingEnv
    .split('\n')
    .filter(line => !Object.keys(contractConfig.contracts).some(key => line.startsWith(key + '=')));
  
  const newEnv = [...nonContractLines, '', '# Contract Addresses', envContent].join('\n');
  
  fs.writeFileSync(backendEnvPath, newEnv);
  console.log('✅ 後端 .env 已更新');
}

// 生成 Vercel 環境變數命令
function generateVercelCommands() {
  const commands = Object.entries(contractConfig.contracts)
    .map(([key, value]) => `vercel env add VITE_MAINNET_${key} production <<< "${value}"`)
    .join('\n');
  
  fs.writeFileSync(
    path.join(__dirname, '../vercel-env-update.sh'),
    `#!/bin/bash\n# Auto-generated Vercel environment update\n${commands}`
  );
  console.log('✅ Vercel 更新腳本已生成: scripts/vercel-env-update.sh');
}

// 生成子圖配置更新
function updateSubgraphConfig() {
  const subgraphPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml';
  
  // 這裡需要根據具體的 subgraph.yaml 結構來實現
  console.log('⚠️ 子圖配置需要手動更新，地址已保存在 contracts.json');
}

// 主執行函數
async function main() {
  console.log(`\n🔄 開始更新合約地址 (${contractConfig.version})`);
  console.log('=' .repeat(50));
  
  try {
    updateFrontendEnv();
    updateBackendEnv();
    generateVercelCommands();
    updateSubgraphConfig();
    
    console.log('\n🎉 地址更新完成！');
    console.log('📋 下一步：');
    console.log('1. git add . && git commit -m "Update contract addresses to ' + contractConfig.version + '"');
    console.log('2. chmod +x scripts/vercel-env-update.sh && ./scripts/vercel-env-update.sh');
    console.log('3. 手動更新 Render 環境變數');
    console.log('4. 重新部署子圖');
    
  } catch (error) {
    console.error('❌ 更新失敗:', error.message);
    process.exit(1);
  }
}

main();