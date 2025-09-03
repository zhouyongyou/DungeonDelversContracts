// verify-frontend-deployment.js - 驗證前端部署狀態
const fs = require('fs');
const path = require('path');

// 前端專案路徑 (從 .env 讀取)
const frontendPath = "/Users/sotadic/Documents/GitHub/SoulboundSaga";

// 檢查前端 .env 文件
function checkFrontendEnv() {
  console.log("🔍 檢查前端環境變數");
  console.log("=".repeat(50));
  
  const frontendEnvPath = path.join(frontendPath, '.env');
  
  if (!fs.existsSync(frontendEnvPath)) {
    console.log("❌ 前端 .env 文件不存在");
    return false;
  }
  
  const envContent = fs.readFileSync(frontendEnvPath, 'utf-8');
  const lines = envContent.split('\n');
  
  // 檢查關鍵合約地址 - 從 ENV 讀取（避免硬編碼）
  const expectedAddresses = {
    'VITE_DUNGEONCORE_ADDRESS': process.env.DUNGEONCORE_ADDRESS,
    'VITE_ORACLE_ADDRESS': process.env.ORACLE_ADDRESS,
    'VITE_HERO_ADDRESS': process.env.HERO_ADDRESS,
    'VITE_SOULSHARD_ADDRESS': process.env.SOULSHARD_ADDRESS,
    'VITE_RELIC_ADDRESS': process.env.RELIC_ADDRESS,
    'VITE_PARTY_ADDRESS': process.env.PARTY_ADDRESS,
    'VITE_PLAYERPROFILE_ADDRESS': process.env.PLAYERPROFILE_ADDRESS,
    'VITE_VIPSTAKING_ADDRESS': process.env.VIPSTAKING_ADDRESS,
    'VITE_PLAYERVAULT_ADDRESS': process.env.PLAYERVAULT_ADDRESS,
    'VITE_USD_ADDRESS': process.env.USD_ADDRESS
  };
  
  // 驗證所有必要地址都存在
  const missingEnvVars = Object.entries(expectedAddresses)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  if (missingEnvVars.length > 0) {
    console.log('❌ 缺少以下環境變數:');
    missingEnvVars.forEach(envVar => console.log(`   - ${envVar.replace('VITE_', '')}`))
    return false;
  }
  
  const foundAddresses = {};
  lines.forEach(line => {
    if (line.includes('=') && !line.trim().startsWith('#')) {
      const [key, value] = line.split('=', 2);
      if (key && value && expectedAddresses[key.trim()]) {
        foundAddresses[key.trim()] = value.trim();
      }
    }
  });
  
  console.log("📋 合約地址檢查：");
  let allCorrect = true;
  
  Object.entries(expectedAddresses).forEach(([key, expected]) => {
    const found = foundAddresses[key];
    const isCorrect = found && found.toLowerCase() === expected.toLowerCase();
    
    console.log(`${isCorrect ? '✅' : '❌'} ${key}: ${found || 'NOT_FOUND'}`);
    if (!isCorrect) allCorrect = false;
  });
  
  return allCorrect;
}

// 檢查 ABI 文件
function checkAbiFiles() {
  console.log("\n🔧 檢查 ABI 文件同步狀態");
  console.log("=".repeat(50));
  
  const abiPath = path.join(frontendPath, 'src', 'contracts', 'abi');
  
  if (!fs.existsSync(abiPath)) {
    console.log("❌ contracts 目錄不存在");
    return false;
  }
  
  const requiredAbis = [
    'DungeonCore.json',
    'Oracle.json', 
    'Hero.json',
    'PlayerVault.json'
  ];
  
  let allPresent = true;
  
  requiredAbis.forEach(fileName => {
    const filePath = path.join(abiPath, fileName);
    const exists = fs.existsSync(filePath);
    
    console.log(`${exists ? '✅' : '❌'} ${fileName}`);
    if (!exists) allPresent = false;
  });
  
  return allPresent;
}

// 檢查 package.json 版本
function checkVersion() {
  console.log("\n📦 檢查版本資訊");
  console.log("=".repeat(50));
  
  const packagePath = path.join(frontendPath, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log("❌ package.json 不存在");
    return false;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  console.log(`📋 專案名稱: ${pkg.name}`);
  console.log(`🏷️  版本: ${pkg.version}`);
  console.log(`⚡ 構建腳本: ${pkg.scripts?.build || 'Not found'}`);
  
  return true;
}

// 生成 Vercel 環境變數清單
function generateVercelEnvList() {
  console.log("\n🌐 Vercel 環境變數建議");
  console.log("=".repeat(50));
  
  // 從環境變數產生 Vercel 環境變數清單（避免硬編碼）
  const contractEnvVars = {
    'VITE_DUNGEONCORE_ADDRESS': process.env.DUNGEONCORE_ADDRESS,
    'VITE_ORACLE_ADDRESS': process.env.ORACLE_ADDRESS,
    'VITE_HERO_ADDRESS': process.env.HERO_ADDRESS,
    'VITE_RELIC_ADDRESS': process.env.RELIC_ADDRESS,
    'VITE_PARTY_ADDRESS': process.env.PARTY_ADDRESS,
    'VITE_PLAYERPROFILE_ADDRESS': process.env.PLAYERPROFILE_ADDRESS,
    'VITE_VIPSTAKING_ADDRESS': process.env.VIPSTAKING_ADDRESS,
    'VITE_PLAYERVAULT_ADDRESS': process.env.PLAYERVAULT_ADDRESS,
    'VITE_SOULSHARD_ADDRESS': process.env.SOULSHARD_ADDRESS,
    'VITE_USD_ADDRESS': process.env.USD_ADDRESS,
    'VITE_CONTRACT_VERSION': 'v1.3.3'
  };
  
  // 檢查環境變數是否存在
  const missingForVercel = Object.entries(contractEnvVars)
    .filter(([key, value]) => !value && key !== 'VITE_CONTRACT_VERSION')
    .map(([key]) => key);
  
  if (missingForVercel.length > 0) {
    console.log('❌ 無法產生 Vercel 清單，缺少環境變數:');
    missingForVercel.forEach(envVar => console.log(`   - ${envVar.replace('VITE_', '')}`))
    return;
  }
  
  console.log("請確認以下環境變數在 Vercel 中已正確設置：");
  console.log("");
  
  Object.entries(contractEnvVars).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  
  console.log("\n💡 設置方法：");
  console.log("1. 前往 Vercel Dashboard");
  console.log("2. 選擇專案 > Settings > Environment Variables");
  console.log("3. 添加/更新上述變數");
  console.log("4. 重新部署專案");
}

function main() {
  console.log("🚀 DungeonDelvers 前端部署驗證");
  console.log("版本: V1.3.3 | 檢查時間:", new Date().toISOString());
  console.log("=".repeat(60));
  
  let issues = [];
  
  // 檢查前端環境
  if (!checkFrontendEnv()) {
    issues.push("前端環境變數配置不正確");
  }
  
  // 檢查 ABI 文件
  if (!checkAbiFiles()) {
    issues.push("ABI 文件缺失或未同步");
  }
  
  // 檢查版本
  checkVersion();
  
  // 生成 Vercel 配置建議
  generateVercelEnvList();
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 驗證結果");
  console.log("=".repeat(60));
  
  if (issues.length === 0) {
    console.log("🎉 前端配置檢查通過！");
    console.log("\n✅ 建議操作：");
    console.log("1. 確認 Vercel 環境變數已更新");
    console.log("2. 訪問前端網站測試合約連接");
    console.log("3. 測試基本功能如錢包連接、NFT 顯示等");
  } else {
    console.log(`⚠️  發現 ${issues.length} 個潛在問題：`);
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }
}

if (require.main === module) {
  main();
}