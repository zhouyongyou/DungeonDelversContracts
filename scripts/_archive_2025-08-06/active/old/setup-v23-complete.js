#!/usr/bin/env node

// V23 完整設置腳本 - 確保所有合約依賴關係正確設置
// 此腳本在部署後執行，設置所有必要的連接和參數

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// Base URI 配置
const BASE_URIS = {
  HERO: 'https://dungeon-delvers-metadata-server.onrender.com/api/hero/',
  RELIC: 'https://dungeon-delvers-metadata-server.onrender.com/api/relic/',
  PARTY: 'https://dungeon-delvers-metadata-server.onrender.com/api/party/',
  VIPSTAKING: 'https://dungeon-delvers-metadata-server.onrender.com/api/vip/',
  PLAYERPROFILE: 'https://dungeon-delvers-metadata-server.onrender.com/api/profile/'
};

// 費用參數
const FEE_PARAMS = {
  HERO_MINT_PRICE_USD: ethers.parseUnits('2', 18), // 2 USD
  RELIC_MINT_PRICE_USD: ethers.parseUnits('2', 18), // 2 USD
  DUNGEONMASTER_WALLET: '0xEbCF4A36Ad1485A9737025e9d72186b604487274'
};

async function setupV23Contracts() {
  console.log('🔧 開始 V23 合約設置...\n');
  
  // 載入 V23 配置
  const configPath = path.join(__dirname, '..', '..', 'config', 'v23-config.js');
  if (!fs.existsSync(configPath)) {
    console.error('❌ 錯誤: 找不到 V23 配置文件，請先執行部署腳本');
    process.exit(1);
  }
  
  const v23Config = require(configPath);
  console.log(`📋 版本: ${v23Config.version}`);
  console.log(`📅 部署時間: ${v23Config.lastUpdated}`);
  console.log(`🌐 網路: ${v23Config.network}\n`);
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 設置者地址: ${deployer.address}\n`);
  
  // ★★★ V23 新增：結構驗證 ★★★
  console.log('🔍 執行結構驗證...');
  try {
    await validateStructCompatibility(v23Config, provider);
    console.log('✅ 結構相容性驗證通過\n');
  } catch (error) {
    console.error('❌ 結構驗證失敗:', error.message);
    console.error('⚠️  這可能導致類似 V22 的結構不匹配問題！');
    process.exit(1);
  }
  
  const setupState = {
    totalSteps: 0,
    completedSteps: 0,
    failedSteps: []
  };
  
  try {
    // Phase 1: 設置 DungeonStorage
    console.log('\n📌 Phase 1: 設置 DungeonStorage');
    console.log('='.repeat(50));
    await setupDungeonStorage(v23Config.contracts, deployer, setupState);
    
    // Phase 2: 設置 DungeonCore 連接
    console.log('\n📌 Phase 2: 設置 DungeonCore 連接');
    console.log('='.repeat(50));
    await setupDungeonCore(v23Config.contracts, deployer, setupState);
    
    // Phase 3: 設置各模組的反向連接
    console.log('\n📌 Phase 3: 設置模組反向連接');
    console.log('='.repeat(50));
    await setupModuleConnections(v23Config.contracts, deployer, setupState);
    
    // Phase 4: 設置特定依賴
    console.log('\n📌 Phase 4: 設置特定依賴');
    console.log('='.repeat(50));
    await setupSpecificDependencies(v23Config.contracts, deployer, setupState);
    
    // Phase 5: 設置 BaseURI
    console.log('\n📌 Phase 5: 設置 BaseURI');
    console.log('='.repeat(50));
    await setupBaseURIs(v23Config.contracts, deployer, setupState);
    
    // Phase 6: 設置費用參數
    console.log('\n📌 Phase 6: 設置費用參數');
    console.log('='.repeat(50));
    await setupFeeParameters(v23Config.contracts, deployer, setupState);
    
    // Phase 7: 初始化地城數據
    console.log('\n📌 Phase 7: 初始化地城數據');
    console.log('='.repeat(50));
    await initializeDungeons(v23Config.contracts, deployer, setupState);
    
    // 保存設置結果
    const setupResult = {
      version: 'V23',
      timestamp: new Date().toISOString(),
      setupBy: deployer.address,
      totalSteps: setupState.totalSteps,
      completedSteps: setupState.completedSteps,
      failedSteps: setupState.failedSteps,
      contracts: v23Config.contracts
    };
    
    const resultPath = path.join(__dirname, '..', 'deployments', `v23-setup-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
    fs.writeFileSync(resultPath, JSON.stringify(setupResult, null, 2));
    
    // 顯示結果
    console.log('\n\n✅ V23 設置完成！');
    console.log('='.repeat(50));
    console.log(`📊 總步驟: ${setupState.totalSteps}`);
    console.log(`✅ 成功: ${setupState.completedSteps}`);
    console.log(`❌ 失敗: ${setupState.failedSteps.length}`);
    
    if (setupState.failedSteps.length > 0) {
      console.log('\n⚠️ 失敗的步驟:');
      setupState.failedSteps.forEach(step => {
        console.log(`   - ${step.name}: ${step.error}`);
      });
    }
    
    console.log(`\n📄 設置結果: ${resultPath}`);
    console.log('\n📌 下一步:');
    console.log('1. 執行驗證腳本: node scripts/active/verify-v23-setup.js');
    console.log('2. 同步配置: node scripts/active/v23-sync-config.js');
    console.log('\n💡 注意: 地城初始化已整合在設置流程中，無需單獨執行');
    
  } catch (error) {
    console.error('\n❌ 設置失敗:', error);
    process.exit(1);
  }
}

// Phase 1: 設置 DungeonStorage
async function setupDungeonStorage(contracts, deployer, state) {
  const steps = [
    {
      name: 'DungeonStorage.setLogicContract',
      contract: contracts.DUNGEONSTORAGE.address,
      method: 'setLogicContract',
      args: [contracts.DUNGEONMASTER.address],
      description: '設置 DungeonMaster 為邏輯合約'
    }
  ];
  
  await executeSteps(steps, deployer, state);
}

// Phase 2: 設置 DungeonCore 連接
async function setupDungeonCore(contracts, deployer, state) {
  const steps = [
    {
      name: 'DungeonCore.setOracle',
      contract: contracts.DUNGEONCORE.address,
      method: 'updateOracleAddress',
      args: [contracts.ORACLE.address],
      description: '設置 Oracle 地址'
    },
    {
      name: 'DungeonCore.setHeroContract',
      contract: contracts.DUNGEONCORE.address,
      method: 'setHeroContract',
      args: [contracts.HERO.address],
      description: '設置 Hero NFT 地址'
    },
    {
      name: 'DungeonCore.setRelicContract',
      contract: contracts.DUNGEONCORE.address,
      method: 'setRelicContract',
      args: [contracts.RELIC.address],
      description: '設置 Relic NFT 地址'
    },
    {
      name: 'DungeonCore.setPartyContract',
      contract: contracts.DUNGEONCORE.address,
      method: 'setPartyContract',
      args: [contracts.PARTY.address],
      description: '設置 Party NFT 地址'
    },
    {
      name: 'DungeonCore.setDungeonMaster',
      contract: contracts.DUNGEONCORE.address,
      method: 'setDungeonMaster',
      args: [contracts.DUNGEONMASTER.address],
      description: '設置 DungeonMaster 地址'
    },
    {
      name: 'DungeonCore.setPlayerVault',
      contract: contracts.DUNGEONCORE.address,
      method: 'setPlayerVault',
      args: [contracts.PLAYERVAULT.address],
      description: '設置 PlayerVault 地址'
    },
    {
      name: 'DungeonCore.setPlayerProfile',
      contract: contracts.DUNGEONCORE.address,
      method: 'setPlayerProfile',
      args: [contracts.PLAYERPROFILE.address],
      description: '設置 PlayerProfile 地址'
    },
    {
      name: 'DungeonCore.setVipStaking',
      contract: contracts.DUNGEONCORE.address,
      method: 'setVipStaking',
      args: [contracts.VIPSTAKING.address],
      description: '設置 VIPStaking 地址'
    },
    {
      name: 'DungeonCore.setAltarOfAscension',
      contract: contracts.DUNGEONCORE.address,
      method: 'setAltarOfAscension',
      args: [contracts.ALTAROFASCENSION.address],
      description: '設置 AltarOfAscension 地址'
    }
  ];
  
  await executeSteps(steps, deployer, state);
}

// Phase 3: 設置模組反向連接
async function setupModuleConnections(contracts, deployer, state) {
  const steps = [
    // Hero 設置
    {
      name: 'Hero.setDungeonCore',
      contract: contracts.HERO.address,
      method: 'setDungeonCore',
      args: [contracts.DUNGEONCORE.address],
      description: 'Hero 設置 DungeonCore'
    },
    {
      name: 'Hero.setSoulShardToken',
      contract: contracts.HERO.address,
      method: 'setSoulShardToken',
      args: [contracts.SOULSHARD.address],
      description: 'Hero 設置 SoulShard Token'
    },
    {
      name: 'Hero.setAscensionAltarAddress',
      contract: contracts.HERO.address,
      method: 'setAscensionAltarAddress',
      args: [contracts.ALTAROFASCENSION.address],
      description: 'Hero 設置 AltarOfAscension'
    },
    
    // Relic 設置
    {
      name: 'Relic.setDungeonCore',
      contract: contracts.RELIC.address,
      method: 'setDungeonCore',
      args: [contracts.DUNGEONCORE.address],
      description: 'Relic 設置 DungeonCore'
    },
    {
      name: 'Relic.setSoulShardToken',
      contract: contracts.RELIC.address,
      method: 'setSoulShardToken',
      args: [contracts.SOULSHARD.address],
      description: 'Relic 設置 SoulShard Token'
    },
    {
      name: 'Relic.setAscensionAltarAddress',
      contract: contracts.RELIC.address,
      method: 'setAscensionAltarAddress',
      args: [contracts.ALTAROFASCENSION.address],
      description: 'Relic 設置 AltarOfAscension'
    },
    
    // Party 設置 - 使用正確的函數名
    {
      name: 'Party.setDungeonCore',
      contract: contracts.PARTY.address,
      method: 'setDungeonCore',
      args: [contracts.DUNGEONCORE.address],
      description: 'Party 設置 DungeonCore'
    },
    {
      name: 'Party.setHeroContract',
      contract: contracts.PARTY.address,
      method: 'setHeroContract',
      args: [contracts.HERO.address],
      description: 'Party 設置 Hero 合約'
    },
    {
      name: 'Party.setRelicContract',
      contract: contracts.PARTY.address,
      method: 'setRelicContract',
      args: [contracts.RELIC.address],
      description: 'Party 設置 Relic 合約'
    },
    
    // PlayerVault 設置
    {
      name: 'PlayerVault.setDungeonCore',
      contract: contracts.PLAYERVAULT.address,
      method: 'setDungeonCore',
      args: [contracts.DUNGEONCORE.address],
      description: 'PlayerVault 設置 DungeonCore'
    },
    {
      name: 'PlayerVault.setSoulShardToken',
      contract: contracts.PLAYERVAULT.address,
      method: 'setSoulShardToken',
      args: [contracts.SOULSHARD.address],
      description: 'PlayerVault 設置 SoulShard Token'
    },
    
    // PlayerProfile 設置
    {
      name: 'PlayerProfile.setDungeonCore',
      contract: contracts.PLAYERPROFILE.address,
      method: 'setDungeonCore',
      args: [contracts.DUNGEONCORE.address],
      description: 'PlayerProfile 設置 DungeonCore'
    },
    
    // VIPStaking 設置
    {
      name: 'VIPStaking.setDungeonCore',
      contract: contracts.VIPSTAKING.address,
      method: 'setDungeonCore',
      args: [contracts.DUNGEONCORE.address],
      description: 'VIPStaking 設置 DungeonCore'
    },
    {
      name: 'VIPStaking.setSoulShardToken',
      contract: contracts.VIPSTAKING.address,
      method: 'setSoulShardToken',
      args: [contracts.SOULSHARD.address],
      description: 'VIPStaking 設置 SoulShard Token'
    },
    
    // DungeonMaster 設置
    {
      name: 'DungeonMaster.setDungeonCore',
      contract: contracts.DUNGEONMASTER.address,
      method: 'setDungeonCore',
      args: [contracts.DUNGEONCORE.address],
      description: 'DungeonMaster 設置 DungeonCore'
    },
    {
      name: 'DungeonMaster.setDungeonStorage',
      contract: contracts.DUNGEONMASTER.address,
      method: 'setDungeonStorage',
      args: [contracts.DUNGEONSTORAGE.address],
      description: 'DungeonMaster 設置 DungeonStorage'
    },
    {
      name: 'DungeonMaster.setSoulShardToken',
      contract: contracts.DUNGEONMASTER.address,
      method: 'setSoulShardToken',
      args: [contracts.SOULSHARD.address],
      description: 'DungeonMaster 設置 SoulShard Token'
    },
    {
      name: 'DungeonMaster.setDungeonMasterWallet',
      contract: contracts.DUNGEONMASTER.address,
      method: 'setDungeonMasterWallet',
      args: [FEE_PARAMS.DUNGEONMASTER_WALLET],
      description: 'DungeonMaster 設置費用錢包'
    }
  ];
  
  await executeSteps(steps, deployer, state);
}

// Phase 4: 設置特定依賴
async function setupSpecificDependencies(contracts, deployer, state) {
  const steps = [
    // Party 需要 Hero 和 Relic
    {
      name: 'Party.setHeroContract',
      contract: contracts.PARTY.address,
      method: 'setHeroContract',
      args: [contracts.HERO.address],
      description: 'Party 設置 Hero 合約'
    },
    {
      name: 'Party.setRelicContract',
      contract: contracts.PARTY.address,
      method: 'setRelicContract',
      args: [contracts.RELIC.address],
      description: 'Party 設置 Relic 合約'
    },
    
    // AltarOfAscension 需要各個合約
    {
      name: 'AltarOfAscension.setContracts',
      contract: contracts.ALTAROFASCENSION.address,
      method: 'setContracts',
      args: [
        contracts.HERO.address,
        contracts.RELIC.address,
        contracts.SOULSHARD.address,
        contracts.DUNGEONCORE.address
      ],
      description: 'AltarOfAscension 設置所有相關合約'
    }
  ];
  
  await executeSteps(steps, deployer, state);
}

// Phase 5: 設置 BaseURI
async function setupBaseURIs(contracts, deployer, state) {
  const steps = [
    {
      name: 'Hero.setBaseURI',
      contract: contracts.HERO.address,
      method: 'setBaseURI',
      args: [BASE_URIS.HERO],
      description: 'Hero 設置 BaseURI'
    },
    {
      name: 'Relic.setBaseURI',
      contract: contracts.RELIC.address,
      method: 'setBaseURI',
      args: [BASE_URIS.RELIC],
      description: 'Relic 設置 BaseURI'
    },
    {
      name: 'Party.setBaseURI',
      contract: contracts.PARTY.address,
      method: 'setBaseURI',
      args: [BASE_URIS.PARTY],
      description: 'Party 設置 BaseURI'
    },
    {
      name: 'VIPStaking.setBaseURI',
      contract: contracts.VIPSTAKING.address,
      method: 'setBaseURI',
      args: [BASE_URIS.VIPSTAKING],
      description: 'VIPStaking 設置 BaseURI'
    },
    {
      name: 'PlayerProfile.setBaseURI',
      contract: contracts.PLAYERPROFILE.address,
      method: 'setBaseURI',
      args: [BASE_URIS.PLAYERPROFILE],
      description: 'PlayerProfile 設置 BaseURI'
    }
  ];
  
  await executeSteps(steps, deployer, state);
}

// Phase 6: 設置費用參數
async function setupFeeParameters(contracts, deployer, state) {
  // Hero 和 Relic 的 mintPriceUSD 已在合約中預設為 2 USD，不需要額外設置
  // platformFee 和 explorationFee 也已在合約中設置，不需要額外設置
  console.log('   ℹ️  Hero/Relic mintPriceUSD 已預設為 2 USD');
  console.log('   ℹ️  platformFee 和 explorationFee 已在合約中設置');
  console.log('   ✅ 費用參數無需額外設置');
}

// 執行步驟輔助函數
async function executeSteps(steps, deployer, state) {
  for (const step of steps) {
    state.totalSteps++;
    
    try {
      console.log(`\n⚙️  ${step.description}`);
      console.log(`   合約: ${step.contract}`);
      console.log(`   方法: ${step.method}`);
      console.log(`   參數: ${JSON.stringify(step.args)}`);
      
      // 建立合約實例
      const abi = [`function ${step.method}(...) external`];
      const contract = new ethers.Contract(step.contract, abi, deployer);
      
      // 執行交易
      const tx = await contract[step.method](...step.args);
      console.log(`   交易: ${tx.hash}`);
      
      // 等待確認
      const receipt = await tx.wait();
      console.log(`   ✅ 成功 (Gas: ${ethers.formatUnits(receipt.gasUsed, 'gwei')} Gwei)`);
      
      state.completedSteps++;
    } catch (error) {
      console.log(`   ❌ 失敗: ${error.message}`);
      state.failedSteps.push({
        name: step.name,
        error: error.message
      });
    }
  }
}

// Phase 7: 初始化地城數據
async function initializeDungeons(contracts, deployer, state) {
  // 地城配置
  const dungeons = [
    { id: 1, name: "新手礦洞", requiredPower: 300, rewardUSD: 6, successRate: 89 },
    { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardUSD: 12, successRate: 83 },
    { id: 3, name: "食人魔山谷", requiredPower: 900, rewardUSD: 20, successRate: 78 },
    { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardUSD: 27, successRate: 74 },
    { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardUSD: 35, successRate: 70 },
    { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardUSD: 60, successRate: 66 },
    { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardUSD: 82, successRate: 62 },
    { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardUSD: 103, successRate: 58 },
    { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardUSD: 136, successRate: 54 },
    { id: 10, name: "混沌深淵", requiredPower: 3000, rewardUSD: 225, successRate: 50 }
  ];
  
  const steps = [];
  
  for (const dungeon of dungeons) {
    // 重要：正確轉換 USD 到 wei (18 位小數)
    const rewardAmountUSD = ethers.parseUnits(dungeon.rewardUSD.toString(), 18);
    
    steps.push({
      name: `DungeonMaster.adminSetDungeon[${dungeon.id}]`,
      contract: contracts.DUNGEONMASTER.address,
      method: 'adminSetDungeon',
      args: [
        dungeon.id,
        dungeon.requiredPower,
        rewardAmountUSD, // 已轉換為 wei
        dungeon.successRate
      ],
      description: `初始化地城 ${dungeon.id}: ${dungeon.name} (獎勵: ${dungeon.rewardUSD} USD)`
    });
  }
  
  console.log(`   ℹ️ 初始化 ${dungeons.length} 個地城`);
  console.log('   ⚠️ 注意：rewardAmountUSD 需要轉換為 wei (18位小數)');
  await executeSteps(steps, deployer, state);
}

// ★★★ V23 新增：結構相容性驗證函數 ★★★
async function validateStructCompatibility(config, provider) {
  console.log('  🔍 驗證 DungeonMaster 和 DungeonStorage 結構相容性...');
  
  // 檢查 DungeonMaster 是否能正確讀取 DungeonStorage 的結構
  const dungeonMaster = new ethers.Contract(
    config.contracts.DUNGEONMASTER.address,
    [
      'function getDungeon(uint256 _dungeonId) external view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))',
      'function getPartyStatus(uint256 _partyId) external view returns (tuple(uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 unclaimedRewards, uint8 fatigueLevel))'
    ],
    provider
  );
  
  const dungeonStorage = new ethers.Contract(
    config.contracts.DUNGEONSTORAGE.address,
    [
      'function getDungeon(uint256 _dungeonId) external view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))',
      'function getPartyStatus(uint256 _partyId) external view returns (tuple(uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 unclaimedRewards, uint8 fatigueLevel))'
    ],
    provider
  );
  
  try {
    // 測試讀取地城數據（地城 ID 1）
    const dungeonFromMaster = await dungeonMaster.getDungeon(1);
    const dungeonFromStorage = await dungeonStorage.getDungeon(1);
    
    console.log('    ✅ 地城結構讀取測試通過');
    
    // 測試讀取隊伍狀態（隊伍 ID 1）
    const partyFromMaster = await dungeonMaster.getPartyStatus(1);
    const partyFromStorage = await dungeonStorage.getPartyStatus(1);
    
    console.log('    ✅ 隊伍狀態結構讀取測試通過');
    
    // 驗證結構字段數量
    if (dungeonFromMaster.length !== dungeonFromStorage.length) {
      throw new Error(`地城結構字段數量不匹配: Master=${dungeonFromMaster.length}, Storage=${dungeonFromStorage.length}`);
    }
    
    if (partyFromMaster.length !== partyFromStorage.length) {
      throw new Error(`隊伍狀態結構字段數量不匹配: Master=${partyFromMaster.length}, Storage=${partyFromStorage.length}`);
    }
    
    console.log('    ✅ 結構字段數量驗證通過');
    
  } catch (error) {
    throw new Error(`結構相容性測試失敗: ${error.message}`);
  }
}

// 執行設置
if (require.main === module) {
  setupV23Contracts().catch(console.error);
}

module.exports = { setupV23Contracts, validateStructCompatibility };