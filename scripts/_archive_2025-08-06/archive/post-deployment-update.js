// 部署後自動更新配置的輔助腳本
const fs = require('fs');
const path = require('path');

async function updateConfigurations() {
  console.log('📋 讀取部署結果...\n');
  
  // 讀取部署地址
  const deploymentPath = path.join(__dirname, 'deployments/bsc_all_addresses.json');
  if (!fs.existsSync(deploymentPath)) {
    console.error('❌ 找不到部署文件！請先執行部署腳本。');
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const addresses = deployment.addresses;
  
  console.log('✅ 成功讀取部署地址\n');
  
  // 1. 生成前端更新指令
  console.log('📝 前端配置更新：');
  console.log('================\n');
  console.log('請更新 /Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts：\n');
  
  console.log('```typescript');
  console.log('export const CONTRACT_ADDRESSES = {');
  console.log('  [bsc.id]: {');
  console.log(`    dungeonCore: "${addresses.DUNGEONCORE_ADDRESS}",`);
  console.log(`    dungeonMaster: "${addresses.DUNGEONMASTER_ADDRESS}",`);
  console.log(`    dungeonStorage: "${addresses.DUNGEONSTORAGE_ADDRESS}",`);
  console.log(`    hero: "${addresses.HERO_ADDRESS}",`);
  console.log(`    relic: "${addresses.RELIC_ADDRESS}",`);
  console.log(`    party: "${addresses.PARTY_ADDRESS}",`);
  console.log(`    soulShard: "${addresses.SOULSHARD_ADDRESS}",`);
  console.log(`    playerVault: "${addresses.PLAYERVAULT_ADDRESS}",`);
  console.log(`    playerProfile: "${addresses.PLAYERPROFILE_ADDRESS}",`);
  console.log(`    vipStaking: "${addresses.VIPSTAKING_ADDRESS}",`);
  console.log(`    altarOfAscension: "${addresses.ALTAROFASCENSION_ADDRESS}",`);
  console.log(`    oracle: "${addresses.ORACLE_ADDRESS}",`);
  console.log('  }');
  console.log('};');
  console.log('```\n');
  
  // 2. 生成環境變數更新
  console.log('🔧 環境變數更新：');
  console.log('================\n');
  console.log('Vercel 環境變數：');
  console.log(`VITE_DUNGEON_MASTER_ADDRESS=${addresses.DUNGEONMASTER_ADDRESS}`);
  console.log(`VITE_PARTY_ADDRESS=${addresses.PARTY_ADDRESS}`);
  console.log(`VITE_HERO_ADDRESS=${addresses.HERO_ADDRESS}`);
  console.log(`VITE_RELIC_ADDRESS=${addresses.RELIC_ADDRESS}\n`);
  
  console.log('Render 環境變數：');
  console.log(`DUNGEON_MASTER_ADDRESS=${addresses.DUNGEONMASTER_ADDRESS}`);
  console.log(`PARTY_CONTRACT_ADDRESS=${addresses.PARTY_ADDRESS}`);
  console.log(`HERO_CONTRACT_ADDRESS=${addresses.HERO_ADDRESS}`);
  console.log(`RELIC_CONTRACT_ADDRESS=${addresses.RELIC_ADDRESS}\n`);
  
  // 3. 生成驗證命令
  console.log('🔍 合約驗證命令：');
  console.log('================\n');
  
  const owner = addresses.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
  const usdToken = "0x55d398326f99059fF775485246999027B3197955";
  
  console.log('```bash');
  console.log('# DungeonCore');
  console.log(`npx hardhat verify --network bsc ${addresses.DUNGEONCORE_ADDRESS} "${owner}" "${usdToken}" "${addresses.SOULSHARD_ADDRESS}"`);
  console.log('\n# DungeonMasterV8');
  console.log(`npx hardhat verify --network bsc ${addresses.DUNGEONMASTER_ADDRESS} "${owner}"`);
  console.log('\n# 其他合約');
  console.log(`npx hardhat verify --network bsc ${addresses.HERO_ADDRESS} "${owner}"`);
  console.log(`npx hardhat verify --network bsc ${addresses.PARTY_ADDRESS} "${owner}"`);
  console.log('```\n');
  
  // 4. 測試連結
  console.log('🌐 BSCScan 連結：');
  console.log('================\n');
  console.log(`DungeonMaster: https://bscscan.com/address/${addresses.DUNGEONMASTER_ADDRESS}`);
  console.log(`Party: https://bscscan.com/address/${addresses.PARTY_ADDRESS}`);
  console.log(`PlayerProfile: https://bscscan.com/address/${addresses.PLAYERPROFILE_ADDRESS}\n`);
  
  // 5. 快速測試腳本
  const testScriptPath = path.join(__dirname, 'quick-test.js');
  const testScript = `
const { ethers } = require("hardhat");

async function quickTest() {
  console.log("🧪 快速測試新部署的合約...\\n");
  
  // 測試 DungeonCore
  const dungeonCore = await ethers.getContractAt("DungeonCore", "${addresses.DUNGEONCORE_ADDRESS}");
  const dungeonMaster = await dungeonCore.dungeonMasterAddress();
  console.log("✅ DungeonCore 正確指向 DungeonMaster:", dungeonMaster === "${addresses.DUNGEONMASTER_ADDRESS}");
  
  // 測試 PlayerProfile
  const playerProfile = await ethers.getContractAt("PlayerProfile", "${addresses.PLAYERPROFILE_ADDRESS}");
  const profileCore = await playerProfile.dungeonCore();
  console.log("✅ PlayerProfile 正確連接到 DungeonCore:", profileCore === "${addresses.DUNGEONCORE_ADDRESS}");
  
  console.log("\\n測試完成！");
}

quickTest().catch(console.error);
`;
  
  fs.writeFileSync(testScriptPath, testScript);
  console.log(`✅ 已生成快速測試腳本: ${testScriptPath}`);
  console.log('執行測試: npx hardhat run scripts/quick-test.js --network bsc\n');
}

updateConfigurations();