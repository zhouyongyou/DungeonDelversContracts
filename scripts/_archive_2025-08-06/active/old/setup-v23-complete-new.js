#!/usr/bin/env node

// V23 完整設置腳本 - 包含所有初始化步驟

const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;

// 載入 V23 配置
const v23Config = require('../../config/v23-config');

// 設置參數
const SETUP_PARAMS = {
  // Base URIs
  BASE_URIS: {
    HERO: 'https://dungeon-delvers-metadata-server.onrender.com/api/hero/',
    RELIC: 'https://dungeon-delvers-metadata-server.onrender.com/api/relic/',
    PARTY: 'https://dungeon-delvers-metadata-server.onrender.com/api/party/',
    VIPSTAKING: 'https://dungeon-delvers-metadata-server.onrender.com/api/vip/',
    PLAYERPROFILE: 'https://dungeon-delvers-metadata-server.onrender.com/api/profile/'
  },
  // 價格設置 (USD)
  MINT_PRICES: {
    HERO: '2',  // $2 USD
    RELIC: '2'  // $2 USD
  },
  // 費用設置
  PLATFORM_FEE: '200', // 2%
  VIP_UNSTAKE_COOLDOWN: '86400', // 1 天
  // 地城配置
  DUNGEONS: [
    { id: 1, power: 0, reward: '1', successRate: 95 },
    { id: 2, power: 10, reward: '2', successRate: 90 },
    { id: 3, power: 20, reward: '3', successRate: 85 },
    { id: 4, power: 50, reward: '5', successRate: 80 },
    { id: 5, power: 100, reward: '10', successRate: 75 },
  ]
};

async function setupV23Complete() {
  console.log('🚀 開始 V23 完整設置...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  const contracts = v23Config.contracts;
  
  console.log(`📝 部署者地址: ${deployer.address}`);
  console.log(`📋 版本: ${v23Config.version}`);
  console.log(`🌐 網路: ${v23Config.network}\n`);
  
  const results = {
    totalSteps: 0,
    successCount: 0,
    failedSteps: []
  };
  
  try {
    // Phase 1: 設置合約連接
    console.log('🔗 Phase 1: 設置合約連接');
    console.log('='.repeat(60));
    await setupContractConnections(deployer, contracts, results);
    
    // Phase 2: 設置 Base URIs
    console.log('\n\n🎨 Phase 2: 設置 Base URIs');
    console.log('='.repeat(60));
    await setupBaseURIs(deployer, contracts, results);
    
    // Phase 3: 設置價格和費用
    console.log('\n\n💰 Phase 3: 設置價格和費用');
    console.log('='.repeat(60));
    await setupPricesAndFees(deployer, contracts, results);
    
    // Phase 4: 設置地城數據
    console.log('\n\n🏰 Phase 4: 設置地城數據');
    console.log('='.repeat(60));
    await setupDungeons(deployer, contracts, results);
    
    // 顯示結果
    console.log('\n\n========== 設置完成 ==========');
    console.log(`總步驟: ${results.totalSteps}`);
    console.log(`✅ 成功: ${results.successCount}`);
    console.log(`❌ 失敗: ${results.totalSteps - results.successCount}`);
    console.log('===============================\n');
    
    if (results.failedSteps.length > 0) {
      console.log('⚠️ 失敗的步驟:');
      results.failedSteps.forEach(step => {
        console.log(`   - ${step.name}: ${step.error}`);
      });
    } else {
      console.log('🎉 所有設置步驟成功完成！');
    }
    
    console.log('\n📌 下一步:');
    console.log('1. 執行驗證: node scripts/active/verify-v23-setup.js');
    console.log('2. 同步配置: node scripts/active/v23-sync-config.js');
    console.log('3. 測試功能: node scripts/active/test-v23-batch-minting.js');
    
  } catch (error) {
    console.error('\n❌ 設置失敗:', error);
    process.exit(1);
  }
}

// Phase 1: 設置合約連接
async function setupContractConnections(deployer, contracts, results) {
  // 1. 檢查並初始化 DungeonCore
  const dungeonCoreABI = [
    "function oracleAddress() view returns (address)",
    "function heroContract() view returns (address)",
    "function initialize(address _owner, address _usd, address _soulShard) external",
    "function setHeroContract(address _hero) external",
    "function setRelicContract(address _relic) external",
    "function setPartyContract(address _party) external",
    "function setDungeonMaster(address _dungeonMaster) external",
    "function setPlayerVault(address _playerVault) external",
    "function setPlayerProfile(address _playerProfile) external",
    "function updateOracleAddress(address _newOracle) external",
    "function setVIPStaking(address _vipStaking) external",
    "function setAltarOfAscension(address _altar) external"
  ];
  
  const dungeonCore = new ethers.Contract(contracts.DUNGEONCORE.address, dungeonCoreABI, deployer);
  
  // 檢查是否需要初始化
  try {
    const oracleAddr = await dungeonCore.oracleAddress();
    console.log('\n✅ DungeonCore 已初始化');
  } catch (error) {
    if (error.message.includes("missing revert data")) {
      console.log('\n⚠️ DungeonCore 需要初始化...');
      await executeStep('初始化 DungeonCore', async () => {
        const tx = await dungeonCore.initialize(
          deployer.address,
          contracts.USD.address,
          contracts.SOULSHARD.address
        );
        await tx.wait();
      }, results);
    }
  }
  
  // 設置 DungeonCore 連接
  const coreSetups = [
    { method: 'setHeroContract', param: contracts.HERO.address, name: 'Hero' },
    { method: 'setRelicContract', param: contracts.RELIC.address, name: 'Relic' },
    { method: 'setPartyContract', param: contracts.PARTY.address, name: 'Party' },
    { method: 'setDungeonMaster', param: contracts.DUNGEONMASTER.address, name: 'DungeonMaster' },
    { method: 'setPlayerVault', param: contracts.PLAYERVAULT.address, name: 'PlayerVault' },
    { method: 'setPlayerProfile', param: contracts.PLAYERPROFILE.address, name: 'PlayerProfile' },
    { method: 'updateOracleAddress', param: contracts.ORACLE.address, name: 'Oracle' },
    { method: 'setVIPStaking', param: contracts.VIPSTAKING.address, name: 'VIPStaking' },
    { method: 'setAltarOfAscension', param: contracts.ALTAROFASCENSION.address, name: 'AltarOfAscension' }
  ];
  
  for (const setup of coreSetups) {
    await executeStep(`設置 DungeonCore.${setup.name}`, async () => {
      const tx = await dungeonCore[setup.method](setup.param);
      await tx.wait();
    }, results);
  }
  
  // 2. 設置各模組的 DungeonCore
  const setDungeonCoreABI = ["function setDungeonCore(address _dungeonCore) external"];
  const modules = [
    { name: 'Hero', address: contracts.HERO.address },
    { name: 'Relic', address: contracts.RELIC.address },
    { name: 'PlayerVault', address: contracts.PLAYERVAULT.address },
    { name: 'PlayerProfile', address: contracts.PLAYERPROFILE.address },
    { name: 'VIPStaking', address: contracts.VIPSTAKING.address },
    { name: 'DungeonMaster', address: contracts.DUNGEONMASTER.address }
  ];
  
  for (const module of modules) {
    await executeStep(`設置 ${module.name}.dungeonCore`, async () => {
      const contract = new ethers.Contract(module.address, setDungeonCoreABI, deployer);
      const tx = await contract.setDungeonCore(contracts.DUNGEONCORE.address);
      await tx.wait();
    }, results);
  }
  
  // 3. 設置 Party 特殊連接
  const partyABI = [
    "function setHeroContract(address _hero) external",
    "function setRelicContract(address _relic) external",
    "function setDungeonCoreContract(address _dungeonCore) external"
  ];
  
  const party = new ethers.Contract(contracts.PARTY.address, partyABI, deployer);
  
  await executeStep('設置 Party.heroContract', async () => {
    const tx = await party.setHeroContract(contracts.HERO.address);
    await tx.wait();
  }, results);
  
  await executeStep('設置 Party.relicContract', async () => {
    const tx = await party.setRelicContract(contracts.RELIC.address);
    await tx.wait();
  }, results);
  
  await executeStep('設置 Party.dungeonCoreContract', async () => {
    const tx = await party.setDungeonCoreContract(contracts.DUNGEONCORE.address);
    await tx.wait();
  }, results);
  
  // 4. 設置 DungeonMaster 連接
  const dmABI = [
    "function setDungeonStorage(address _storage) external",
    "function setSoulShardToken(address _token) external",
    "function setDungeonMasterWallet(address _wallet) external"
  ];
  
  const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER.address, dmABI, deployer);
  
  await executeStep('設置 DungeonMaster.dungeonStorage', async () => {
    const tx = await dungeonMaster.setDungeonStorage(contracts.DUNGEONSTORAGE.address);
    await tx.wait();
  }, results);
  
  await executeStep('設置 DungeonMaster.soulShardToken', async () => {
    const tx = await dungeonMaster.setSoulShardToken(contracts.SOULSHARD.address);
    await tx.wait();
  }, results);
  
  await executeStep('設置 DungeonMaster.dungeonMasterWallet', async () => {
    const tx = await dungeonMaster.setDungeonMasterWallet(contracts.DUNGEONMASTERWALLET.address);
    await tx.wait();
  }, results);
  
  // 5. 設置 DungeonStorage
  const storageABI = ["function setLogicContract(address _logic) external"];
  const storage = new ethers.Contract(contracts.DUNGEONSTORAGE.address, storageABI, deployer);
  
  await executeStep('設置 DungeonStorage.logicContract', async () => {
    const tx = await storage.setLogicContract(contracts.DUNGEONMASTER.address);
    await tx.wait();
  }, results);
  
  // 6. 設置 NFT 合約的 Token 和 Altar
  const nftABI = [
    "function setSoulShardToken(address _token) external",
    "function setAscensionAltar(address _altar) external"
  ];
  
  for (const [name, address] of [['Hero', contracts.HERO.address], ['Relic', contracts.RELIC.address]]) {
    const nft = new ethers.Contract(address, nftABI, deployer);
    
    await executeStep(`設置 ${name}.soulShardToken`, async () => {
      const tx = await nft.setSoulShardToken(contracts.SOULSHARD.address);
      await tx.wait();
    }, results);
    
    await executeStep(`設置 ${name}.ascensionAltar`, async () => {
      const tx = await nft.setAscensionAltar(contracts.ALTAROFASCENSION.address);
      await tx.wait();
    }, results);
  }
  
  // 7. 設置其他模組的 SoulShard
  const setSoulShardABI = ["function setSoulShardToken(address _token) external"];
  
  for (const [name, address] of [['PlayerVault', contracts.PLAYERVAULT.address], ['VIPStaking', contracts.VIPSTAKING.address]]) {
    await executeStep(`設置 ${name}.soulShardToken`, async () => {
      const contract = new ethers.Contract(address, setSoulShardABI, deployer);
      const tx = await contract.setSoulShardToken(contracts.SOULSHARD.address);
      await tx.wait();
    }, results);
  }
}

// Phase 2: 設置 Base URIs
async function setupBaseURIs(deployer, contracts, results) {
  const setBaseURIABI = ["function setBaseURI(string memory _baseURI) external"];
  
  const uriSetups = [
    { name: 'Hero', address: contracts.HERO.address, uri: SETUP_PARAMS.BASE_URIS.HERO },
    { name: 'Relic', address: contracts.RELIC.address, uri: SETUP_PARAMS.BASE_URIS.RELIC },
    { name: 'Party', address: contracts.PARTY.address, uri: SETUP_PARAMS.BASE_URIS.PARTY },
    { name: 'VIPStaking', address: contracts.VIPSTAKING.address, uri: SETUP_PARAMS.BASE_URIS.VIPSTAKING },
    { name: 'PlayerProfile', address: contracts.PLAYERPROFILE.address, uri: SETUP_PARAMS.BASE_URIS.PLAYERPROFILE }
  ];
  
  for (const setup of uriSetups) {
    await executeStep(`設置 ${setup.name}.baseURI`, async () => {
      const contract = new ethers.Contract(setup.address, setBaseURIABI, deployer);
      const tx = await contract.setBaseURI(setup.uri);
      await tx.wait();
    }, results);
  }
}

// Phase 3: 設置價格和費用
async function setupPricesAndFees(deployer, contracts, results) {
  // 設置 Hero 和 Relic 鑄造價格
  const setPriceABI = ["function setMintPriceUSD(uint256 _price) external"];
  
  for (const [name, address] of [['Hero', contracts.HERO.address], ['Relic', contracts.RELIC.address]]) {
    await executeStep(`設置 ${name} 鑄造價格`, async () => {
      const contract = new ethers.Contract(address, setPriceABI, deployer);
      const tx = await contract.setMintPriceUSD(ethers.parseUnits(SETUP_PARAMS.MINT_PRICES[name.toUpperCase()], 18));
      await tx.wait();
    }, results);
  }
  
  // 設置 DungeonMaster 平台費用
  const setFeeABI = ["function setPlatformFee(uint256 _fee) external"];
  const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER.address, setFeeABI, deployer);
  
  await executeStep('設置 DungeonMaster 平台費用', async () => {
    const tx = await dungeonMaster.setPlatformFee(SETUP_PARAMS.PLATFORM_FEE);
    await tx.wait();
  }, results);
  
  // 設置 VIPStaking 解鎖冷卻時間
  const setCooldownABI = ["function setUnstakeCooldown(uint256 _cooldown) external"];
  const vipStaking = new ethers.Contract(contracts.VIPSTAKING.address, setCooldownABI, deployer);
  
  await executeStep('設置 VIPStaking 解鎖冷卻時間', async () => {
    const tx = await vipStaking.setUnstakeCooldown(SETUP_PARAMS.VIP_UNSTAKE_COOLDOWN);
    await tx.wait();
  }, results);
}

// Phase 4: 設置地城數據
async function setupDungeons(deployer, contracts, results) {
  const dungeonMasterABI = [
    "function setDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint256 _baseSuccessRate) external"
  ];
  
  const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER.address, dungeonMasterABI, deployer);
  
  for (const dungeon of SETUP_PARAMS.DUNGEONS) {
    await executeStep(`設置地城 ${dungeon.id}`, async () => {
      const tx = await dungeonMaster.setDungeon(
        dungeon.id,
        dungeon.power,
        ethers.parseUnits(dungeon.reward, 18),
        dungeon.successRate
      );
      await tx.wait();
    }, results);
  }
}

// 執行單個步驟的輔助函數
async function executeStep(name, fn, results) {
  results.totalSteps++;
  console.log(`\n   🔧 ${name}...`);
  
  try {
    await fn();
    console.log(`      ✅ 成功`);
    results.successCount++;
  } catch (error) {
    console.log(`      ❌ 失敗: ${error.message}`);
    results.failedSteps.push({ name, error: error.message });
  }
}

// 執行
if (require.main === module) {
  setupV23Complete().catch(console.error);
}

module.exports = { setupV23Complete };