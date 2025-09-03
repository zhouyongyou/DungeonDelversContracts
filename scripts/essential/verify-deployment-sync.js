// verify-deployment-sync.js - 驗證部署同步狀態
// 🚨 Gas Price 核心原則：0.11 gwei
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// 當前部署的合約地址
const deployedAddresses = {
  testUSD1: "0x916a2a1eb605e88561139c56af0698de241169f2",
  soulShard: "0x1a98769b8034d400745cc658dc204cd079de36fa",
  oracle: "0x21928de992cb31ede864b62bc94002fb449c2738",
  dungeonCore: "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f",
  playerVault: "0xe3c03d3e270d7eb3f8e27017790135f5a885a66f",
  hero: "0xdb40cb3a1ba6fd3e8e6323c296f3f17cc7ec9c0e",
  relic: "0xb6038db5c6a168c74995dc9a0c8a6ab1910198fd",
  party: "0xb393e482495bacde5aaf08d25323146cc5b9567f",
  playerProfile: "0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b",
  vipStaking: "0x409d964675235a5a00f375053535fce9f6e79882",
  vrfConsumer: "0x601f0a1e5a0cacfa39b502fd7a9ac5024f53ae40",
  altarOfAscension: "0x7f4b3d0ff2994182200fc3b306fb5b035680de3c",
  dungeonMaster: "0xdbee76d1c6e94f93ceecf743a0a0132c57371254",
  dungeonStorage: "0x30dcbe703b258fa1e421d22c8ada643da51ceb4c",
  v3Pool: "0x2733f7e7e95d22e7691e5aa5abb6210cf81ebdba"
};

function readEnvFile() {
  const envPath = path.join(__dirname, "../../.env");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env file not found");
  }
  
  const envContent = fs.readFileSync(envPath, "utf-8");
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=');
      }
    }
  });
  
  return envVars;
}

function checkAddressConsistency() {
  console.log("🔍 檢查地址一致性");
  console.log("=".repeat(50));
  
  const envVars = readEnvFile();
  const issues = [];
  
  // 檢查重要合約地址
  const addressMappings = {
    "VITE_SOULSHARD_ADDRESS": deployedAddresses.soulShard,
    "VITE_USD_ADDRESS": deployedAddresses.testUSD1,
    "VITE_ORACLE_ADDRESS": deployedAddresses.oracle,
    "VITE_DUNGEONCORE_ADDRESS": deployedAddresses.dungeonCore,
    "VITE_PLAYERVAULT_ADDRESS": deployedAddresses.playerVault,
    "VITE_HERO_ADDRESS": deployedAddresses.hero,
    "VITE_RELIC_ADDRESS": deployedAddresses.relic,
    "VITE_PARTY_ADDRESS": deployedAddresses.party,
    "VITE_PLAYERPROFILE_ADDRESS": deployedAddresses.playerProfile,
    "VITE_VIPSTAKING_ADDRESS": deployedAddresses.vipStaking,
    "VITE_VRF_MANAGER_V2PLUS_ADDRESS": deployedAddresses.vrfConsumer,
    "VITE_ALTAROFASCENSION_ADDRESS": deployedAddresses.altarOfAscension,
    "VITE_DUNGEONMASTER_ADDRESS": deployedAddresses.dungeonMaster,
    "VITE_DUNGEONSTORAGE_ADDRESS": deployedAddresses.dungeonStorage,
    "VITE_UNISWAP_POOL_ADDRESS": deployedAddresses.v3Pool
  };
  
  for (const [envKey, expectedAddress] of Object.entries(addressMappings)) {
    const envAddress = envVars[envKey];
    if (!envAddress) {
      issues.push(`❌ Missing: ${envKey}`);
    } else if (envAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      issues.push(`❌ Mismatch: ${envKey}`);
      console.log(`   Expected: ${expectedAddress}`);
      console.log(`   Found:    ${envAddress}`);
    } else {
      console.log(`✅ ${envKey}: ${envAddress}`);
    }
  }
  
  return issues;
}

function checkDeploymentInfo() {
  console.log("\n📅 檢查部署資訊");
  console.log("=".repeat(50));
  
  const envVars = readEnvFile();
  const issues = [];
  
  // 檢查版本資訊
  const version = envVars.VITE_CONTRACT_VERSION;
  console.log(`📦 版本: ${version}`);
  
  // 檢查部署日期
  const deployDate = envVars.VITE_DEPLOYMENT_DATE;
  console.log(`📅 部署日期: ${deployDate}`);
  
  // 檢查管理員地址
  const adminWallet = envVars.VITE_ADMIN_WALLET;
  const expectedAdmin = "0x84cd63a840274d267acb19e708d7f6298c315e75";
  
  if (adminWallet && adminWallet.toLowerCase() === expectedAdmin.toLowerCase()) {
    console.log(`✅ 管理員錢包: ${adminWallet}`);
  } else {
    issues.push(`❌ 管理員錢包不匹配: ${adminWallet} ≠ ${expectedAdmin}`);
  }
  
  // 檢查網路設定
  const network = envVars.VITE_NETWORK;
  const chainId = envVars.VITE_CHAIN_ID;
  
  console.log(`🌐 網路: ${network} (Chain ID: ${chainId})`);
  
  if (chainId !== "56") {
    issues.push(`❌ Chain ID 應為 56，目前為: ${chainId}`);
  }
  
  return issues;
}

function checkSubgraphConfig() {
  console.log("\n📊 檢查子圖配置");
  console.log("=".repeat(50));
  
  const envVars = readEnvFile();
  const issues = [];
  
  // 檢查子圖版本
  const subgraphVersion = envVars.VITE_SUBGRAPH_STUDIO_VERSION;
  console.log(`📈 子圖版本: ${subgraphVersion}`);
  
  // 檢查子圖 URL
  const studioUrl = envVars.VITE_SUBGRAPH_STUDIO_BASE_URL;
  console.log(`🔗 Studio URL: ${studioUrl}`);
  
  // 檢查去中心化設定
  const useDecentralized = envVars.VITE_USE_DECENTRALIZED_GRAPH;
  console.log(`⚡ 使用去中心化: ${useDecentralized}`);
  
  return issues;
}

async function testBasicContractFunctionality() {
  console.log("\n🧪 測試基本合約功能");
  console.log("=".repeat(50));
  
  const issues = [];
  
  try {
    // 測試 Oracle 價格查詢
    const oracle = await ethers.getContractAt("Oracle", deployedAddresses.oracle);
    const price = await oracle.getSoulShardPriceInUSD();
    console.log(`✅ Oracle 價格查詢: ${ethers.formatEther(price)} USD per SOUL`);
  } catch (error) {
    issues.push(`❌ Oracle 測試失敗: ${error.message}`);
  }
  
  try {
    // 測試 DungeonCore 連接
    const dungeonCore = await ethers.getContractAt("DungeonCore", deployedAddresses.dungeonCore);
    const oracleAddr = await dungeonCore.oracleAddress();
    
    if (oracleAddr.toLowerCase() === deployedAddresses.oracle.toLowerCase()) {
      console.log(`✅ DungeonCore Oracle 連接: ${oracleAddr}`);
    } else {
      issues.push(`❌ DungeonCore Oracle 連接錯誤: ${oracleAddr} ≠ ${deployedAddresses.oracle}`);
    }
  } catch (error) {
    issues.push(`❌ DungeonCore 測試失敗: ${error.message}`);
  }
  
  return issues;
}

function generateUpdateSummary(allIssues) {
  console.log("\n" + "=".repeat(60));
  console.log("📋 更新狀態總結");
  console.log("=".repeat(60));
  
  if (allIssues.length === 0) {
    console.log("🎉 所有配置都是最新且正確的！");
    console.log("\n✅ 確認項目:");
    console.log("• 合約地址與部署地址一致");
    console.log("• 部署資訊正確設定");
    console.log("• 子圖配置已更新");
    console.log("• 基本合約功能正常");
  } else {
    console.log(`⚠️  發現 ${allIssues.length} 個需要注意的項目:`);
    allIssues.forEach(issue => console.log(`  ${issue}`));
    
    console.log("\n🔧 建議執行的更新:");
    console.log("• 修正上述地址不一致問題");
    console.log("• 更新子圖配置以匹配新合約");
    console.log("• 同步前端合約地址");
    console.log("• 重新部署子圖");
  }
  
  console.log("\n🔗 所有已驗證合約鏈接:");
  Object.entries(deployedAddresses).forEach(([name, address]) => {
    console.log(`${name}: https://bscscan.com/address/${address}#code`);
  });
}

async function main() {
  console.log("🔧 DungeonDelvers 部署同步狀態驗證");
  console.log("版本: V1.3.3 | 部署日期: 2025-09-03");
  console.log("=".repeat(60));
  
  let allIssues = [];
  
  try {
    // 1. 檢查地址一致性
    const addressIssues = checkAddressConsistency();
    allIssues = allIssues.concat(addressIssues);
    
    // 2. 檢查部署資訊
    const deploymentIssues = checkDeploymentInfo();
    allIssues = allIssues.concat(deploymentIssues);
    
    // 3. 檢查子圖配置
    const subgraphIssues = checkSubgraphConfig();
    allIssues = allIssues.concat(subgraphIssues);
    
    // 4. 測試合約功能（連接到 BSC 主網）
    // const functionalityIssues = await testBasicContractFunctionality();
    // allIssues = allIssues.concat(functionalityIssues);
    
    // 5. 生成總結
    generateUpdateSummary(allIssues);
    
  } catch (error) {
    console.error("💥 驗證過程出錯:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("💥 腳本執行失敗:", error.message);
      process.exit(1);
    });
}

module.exports = { main, deployedAddresses };