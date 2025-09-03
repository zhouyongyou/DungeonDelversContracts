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
  
  // 檢查關鍵合約地址
  const expectedAddresses = {
    'VITE_DUNGEONCORE_ADDRESS': '0xa94b609310f8fe9a6db5cd66faaf64cd0189581f',
    'VITE_ORACLE_ADDRESS': '0x21928de992cb31ede864b62bc94002fb449c2738',
    'VITE_HERO_ADDRESS': '0xdb40cb3a1ba6fd3e8e6323c296f3f17cc7ec9c0e',
    'VITE_SOULSHARD_ADDRESS': '0x1a98769b8034d400745cc658dc204cd079de36fa'
  };
  
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
  
  const abiPath = path.join(frontendPath, 'src', 'contracts');
  
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
  
  const contractEnvVars = {
    'VITE_DUNGEONCORE_ADDRESS': '0xa94b609310f8fe9a6db5cd66faaf64cd0189581f',
    'VITE_ORACLE_ADDRESS': '0x21928de992cb31ede864b62bc94002fb449c2738',
    'VITE_HERO_ADDRESS': '0xdb40cb3a1ba6fd3e8e6323c296f3f17cc7ec9c0e',
    'VITE_RELIC_ADDRESS': '0xb6038db5c6a168c74995dc9a0c8a6ab1910198fd',
    'VITE_PARTY_ADDRESS': '0xb393e482495bacde5aaf08d25323146cc5b9567f',
    'VITE_PLAYERPROFILE_ADDRESS': '0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b',
    'VITE_VIPSTAKING_ADDRESS': '0x409d964675235a5a00f375053535fce9f6e79882',
    'VITE_PLAYERVAULT_ADDRESS': '0xe3c03d3e270d7eb3f8e27017790135f5a885a66f',
    'VITE_SOULSHARD_ADDRESS': '0x1a98769b8034d400745cc658dc204cd079de36fa',
    'VITE_USD_ADDRESS': '0x916a2a1eb605e88561139c56af0698de241169f2',
    'VITE_CONTRACT_VERSION': 'v1.3.3'
  };
  
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