#!/usr/bin/env node

/**
 * V25 完整設置驗證腳本
 * 檢查所有必要的設置是否完成
 */

require('dotenv').config();
const { ethers } = require('ethers');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function main() {
  console.log(`${colors.cyan}🔍 V25 完整設置驗證${colors.reset}`);
  console.log('=====================================\n');

  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ 請在 .env 文件中設置 PRIVATE_KEY');
    process.exit(1);
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  
  // V25 合約地址
  const contracts = {
    HERO: process.env.VITE_HERO_ADDRESS,
    RELIC: process.env.VITE_RELIC_ADDRESS,
    PARTY: process.env.VITE_PARTY_ADDRESS,
    DUNGEONMASTER: process.env.VITE_DUNGEONMASTER_ADDRESS,
    DUNGEONSTORAGE: process.env.VITE_DUNGEONSTORAGE_ADDRESS,
    ALTAROFASCENSION: process.env.VITE_ALTAROFASCENSION_ADDRESS,
    DUNGEONCORE: process.env.VITE_DUNGEONCORE_ADDRESS,
    PLAYERVAULT: process.env.VITE_PLAYERVAULT_ADDRESS,
    PLAYERPROFILE: process.env.VITE_PLAYERPROFILE_ADDRESS,
    VIPSTAKING: process.env.VITE_VIPSTAKING_ADDRESS,
    ORACLE: process.env.VITE_ORACLE_ADDRESS,
    VRFMANAGER: process.env.VITE_VRFMANAGER_ADDRESS,
    SOULSHARD: process.env.VITE_SOULSHARD_ADDRESS
  };

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // ========== 1. 檢查 DungeonCore 設置 ==========
  console.log(`${colors.blue}1️⃣ 檢查 DungeonCore 中央配置...${colors.reset}\n`);
  
  const dungeonCoreABI = [
    'function owner() view returns (address)',
    'function heroContract() view returns (address)',
    'function relicContract() view returns (address)',
    'function partyContract() view returns (address)',
    'function dungeonMaster() view returns (address)',
    'function altarOfAscension() view returns (address)',
    'function dungeonStorage() view returns (address)',
    'function playerVault() view returns (address)',
    'function playerProfile() view returns (address)',
    'function vipStaking() view returns (address)',
    'function oracle() view returns (address)',
    'function vrfManager() view returns (address)',
    'function soulShardToken() view returns (address)'
  ];

  try {
    const dungeonCore = new ethers.Contract(contracts.DUNGEONCORE, dungeonCoreABI, provider);
    
    const checks = [
      { name: 'Hero', getter: 'heroContract', expected: contracts.HERO },
      { name: 'Relic', getter: 'relicContract', expected: contracts.RELIC },
      { name: 'Party', getter: 'partyContract', expected: contracts.PARTY },
      { name: 'DungeonMaster', getter: 'dungeonMaster', expected: contracts.DUNGEONMASTER },
      { name: 'AltarOfAscension', getter: 'altarOfAscension', expected: contracts.ALTAROFASCENSION },
      { name: 'DungeonStorage', getter: 'dungeonStorage', expected: contracts.DUNGEONSTORAGE },
      { name: 'PlayerVault', getter: 'playerVault', expected: contracts.PLAYERVAULT },
      { name: 'PlayerProfile', getter: 'playerProfile', expected: contracts.PLAYERPROFILE },
      { name: 'VipStaking', getter: 'vipStaking', expected: contracts.VIPSTAKING },
      { name: 'Oracle', getter: 'oracle', expected: contracts.ORACLE },
      { name: 'VRFManager', getter: 'vrfManager', expected: contracts.VRFMANAGER },
      { name: 'SoulShard', getter: 'soulShardToken', expected: contracts.SOULSHARD }
    ];

    for (const check of checks) {
      try {
        const actual = await dungeonCore[check.getter]();
        if (actual.toLowerCase() === check.expected.toLowerCase()) {
          console.log(`   ${colors.green}✅ ${check.name}: ${actual}${colors.reset}`);
          results.passed.push(`DungeonCore.${check.name}`);
        } else {
          console.log(`   ${colors.red}❌ ${check.name}: 期望 ${check.expected}, 實際 ${actual}${colors.reset}`);
          results.failed.push(`DungeonCore.${check.name}`);
        }
      } catch (error) {
        console.log(`   ${colors.yellow}⚠️ ${check.name}: 無法讀取 (${error.message})${colors.reset}`);
        results.warnings.push(`DungeonCore.${check.name}`);
      }
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ 無法連接 DungeonCore: ${error.message}${colors.reset}`);
    results.failed.push('DungeonCore connection');
  }

  // ========== 2. 檢查各合約的 DungeonCore 設置 ==========
  console.log(`\n${colors.blue}2️⃣ 檢查各合約的 DungeonCore 連接...${colors.reset}\n`);
  
  const dungeonCoreCheckABI = [
    'function dungeonCore() view returns (address)'
  ];

  const contractsToCheck = [
    { name: 'Hero', address: contracts.HERO },
    { name: 'Relic', address: contracts.RELIC },
    { name: 'Party', address: contracts.PARTY },
    { name: 'DungeonMaster', address: contracts.DUNGEONMASTER },
    { name: 'DungeonStorage', address: contracts.DUNGEONSTORAGE },
    { name: 'AltarOfAscension', address: contracts.ALTAROFASCENSION },
    { name: 'PlayerVault', address: contracts.PLAYERVAULT },
    { name: 'PlayerProfile', address: contracts.PLAYERPROFILE },
    { name: 'VipStaking', address: contracts.VIPSTAKING }
  ];

  for (const contract of contractsToCheck) {
    try {
      const instance = new ethers.Contract(contract.address, dungeonCoreCheckABI, provider);
      const dungeonCoreAddr = await instance.dungeonCore();
      
      if (dungeonCoreAddr.toLowerCase() === contracts.DUNGEONCORE.toLowerCase()) {
        console.log(`   ${colors.green}✅ ${contract.name}: DungeonCore 設置正確${colors.reset}`);
        results.passed.push(`${contract.name}.dungeonCore`);
      } else {
        console.log(`   ${colors.red}❌ ${contract.name}: DungeonCore 錯誤 (${dungeonCoreAddr})${colors.reset}`);
        results.failed.push(`${contract.name}.dungeonCore`);
      }
    } catch (error) {
      console.log(`   ${colors.yellow}⚠️ ${contract.name}: 無法檢查 DungeonCore${colors.reset}`);
      results.warnings.push(`${contract.name}.dungeonCore`);
    }
  }

  // ========== 3. 檢查 DungeonMaster 特殊設置 ==========
  console.log(`\n${colors.blue}3️⃣ 檢查 DungeonMaster 特殊設置...${colors.reset}\n`);
  
  const dungeonMasterABI = [
    'function dungeonStorage() view returns (address)'
  ];

  try {
    const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER, dungeonMasterABI, provider);
    const storageAddr = await dungeonMaster.dungeonStorage();
    
    if (storageAddr.toLowerCase() === contracts.DUNGEONSTORAGE.toLowerCase()) {
      console.log(`   ${colors.green}✅ DungeonStorage: 設置正確${colors.reset}`);
      results.passed.push('DungeonMaster.dungeonStorage');
    } else {
      console.log(`   ${colors.red}❌ DungeonStorage: 期望 ${contracts.DUNGEONSTORAGE}, 實際 ${storageAddr}${colors.reset}`);
      results.failed.push('DungeonMaster.dungeonStorage');
    }
  } catch (error) {
    console.log(`   ${colors.yellow}⚠️ 無法檢查 DungeonStorage 設置${colors.reset}`);
    results.warnings.push('DungeonMaster.dungeonStorage');
  }

  // ========== 4. 檢查 DungeonStorage 邏輯合約 ==========
  console.log(`\n${colors.blue}4️⃣ 檢查 DungeonStorage 邏輯合約...${colors.reset}\n`);
  
  const storageABI = [
    'function logicContract() view returns (address)'
  ];

  try {
    const storage = new ethers.Contract(contracts.DUNGEONSTORAGE, storageABI, provider);
    const logicAddr = await storage.logicContract();
    
    if (logicAddr.toLowerCase() === contracts.DUNGEONMASTER.toLowerCase()) {
      console.log(`   ${colors.green}✅ 邏輯合約: 設置正確${colors.reset}`);
      results.passed.push('DungeonStorage.logicContract');
    } else {
      console.log(`   ${colors.red}❌ 邏輯合約: 期望 ${contracts.DUNGEONMASTER}, 實際 ${logicAddr}${colors.reset}`);
      results.failed.push('DungeonStorage.logicContract');
    }
  } catch (error) {
    console.log(`   ${colors.yellow}⚠️ 無法檢查邏輯合約設置${colors.reset}`);
    results.warnings.push('DungeonStorage.logicContract');
  }

  // ========== 5. 檢查 VRF Manager 授權 ==========
  console.log(`\n${colors.blue}5️⃣ 檢查 VRF Manager 授權...${colors.reset}\n`);
  
  const vrfManagerABI = [
    'function authorizedContracts(address) view returns (bool)'
  ];

  try {
    const vrfManager = new ethers.Contract(contracts.VRFMANAGER, vrfManagerABI, provider);
    
    const contractsToAuth = [
      { name: 'Hero', address: contracts.HERO },
      { name: 'Relic', address: contracts.RELIC },
      { name: 'DungeonMaster', address: contracts.DUNGEONMASTER },
      { name: 'AltarOfAscension', address: contracts.ALTAROFASCENSION }
    ];

    for (const contract of contractsToAuth) {
      try {
        const isAuthorized = await vrfManager.authorizedContracts(contract.address);
        if (isAuthorized) {
          console.log(`   ${colors.green}✅ ${contract.name}: 已授權${colors.reset}`);
          results.passed.push(`VRF.${contract.name}`);
        } else {
          console.log(`   ${colors.red}❌ ${contract.name}: 未授權${colors.reset}`);
          results.failed.push(`VRF.${contract.name}`);
        }
      } catch (error) {
        console.log(`   ${colors.yellow}⚠️ ${contract.name}: 無法檢查授權${colors.reset}`);
        results.warnings.push(`VRF.${contract.name}`);
      }
    }
  } catch (error) {
    console.log(`   ${colors.yellow}⚠️ 無法連接 VRF Manager${colors.reset}`);
    results.warnings.push('VRF Manager connection');
  }

  // ========== 6. 檢查其他重要設置 ==========
  console.log(`\n${colors.blue}6️⃣ 檢查其他重要設置...${colors.reset}\n`);

  // 檢查 Oracle TWAP 設置
  try {
    const oracleABI = ['function twapPeriod() view returns (uint32)'];
    const oracle = new ethers.Contract(contracts.ORACLE, oracleABI, provider);
    const twapPeriod = await oracle.twapPeriod();
    console.log(`   ${colors.cyan}ℹ️ Oracle TWAP Period: ${twapPeriod} 秒${colors.reset}`);
    if (twapPeriod > 0) {
      results.passed.push('Oracle.twapPeriod');
    } else {
      results.warnings.push('Oracle.twapPeriod');
    }
  } catch (error) {
    console.log(`   ${colors.yellow}⚠️ 無法檢查 Oracle TWAP${colors.reset}`);
    results.warnings.push('Oracle.twapPeriod');
  }

  // 檢查 VIPStaking 冷卻期
  try {
    const vipABI = ['function unstakeCooldown() view returns (uint256)'];
    const vip = new ethers.Contract(contracts.VIPSTAKING, vipABI, provider);
    const cooldown = await vip.unstakeCooldown();
    console.log(`   ${colors.cyan}ℹ️ VIP Unstake Cooldown: ${cooldown} 秒${colors.reset}`);
    if (cooldown > 0) {
      results.passed.push('VIPStaking.cooldown');
    } else {
      results.warnings.push('VIPStaking.cooldown');
    }
  } catch (error) {
    console.log(`   ${colors.yellow}⚠️ 無法檢查 VIP 冷卻期${colors.reset}`);
    results.warnings.push('VIPStaking.cooldown');
  }

  // ========== 總結報告 ==========
  console.log(`\n${colors.cyan}=====================================`);
  console.log('📊 驗證總結');
  console.log(`=====================================${colors.reset}\n`);
  
  console.log(`${colors.green}✅ 通過: ${results.passed.length} 項${colors.reset}`);
  if (results.passed.length > 0) {
    results.passed.forEach(item => console.log(`   - ${item}`));
  }
  
  console.log(`\n${colors.red}❌ 失敗: ${results.failed.length} 項${colors.reset}`);
  if (results.failed.length > 0) {
    results.failed.forEach(item => console.log(`   - ${item}`));
  }
  
  console.log(`\n${colors.yellow}⚠️ 警告: ${results.warnings.length} 項${colors.reset}`);
  if (results.warnings.length > 0) {
    results.warnings.forEach(item => console.log(`   - ${item}`));
  }

  // ========== 建議 ==========
  console.log(`\n${colors.cyan}💡 建議：${colors.reset}`);
  
  if (results.failed.length > 0) {
    console.log(`${colors.red}• 有 ${results.failed.length} 項設置失敗，需要修正${colors.reset}`);
  }
  
  if (results.warnings.length > 10) {
    console.log(`${colors.yellow}• 有較多警告，可能是 ABI 不匹配或合約結構差異${colors.reset}`);
  }
  
  if (results.passed.length > 20) {
    console.log(`${colors.green}• 大部分核心設置已完成，系統應該可以正常運作${colors.reset}`);
  }

  // 關鍵檢查
  const criticalChecks = [
    'DungeonCore.Hero',
    'DungeonCore.Relic', 
    'DungeonCore.DungeonMaster',
    'DungeonMaster.dungeonStorage',
    'DungeonStorage.logicContract'
  ];

  const criticalPassed = criticalChecks.filter(check => 
    results.passed.includes(check)
  ).length;

  console.log(`\n${colors.cyan}🔑 關鍵設置: ${criticalPassed}/${criticalChecks.length} 完成${colors.reset}`);
  
  if (criticalPassed === criticalChecks.length) {
    console.log(`${colors.green}✨ 所有關鍵設置已完成，系統應該可以正常運作！${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️ 部分關鍵設置未完成，可能影響系統功能${colors.reset}`);
  }
}

main().catch(console.error);