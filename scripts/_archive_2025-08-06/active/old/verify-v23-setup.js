#!/usr/bin/env node

// V23 設置驗證腳本 - 檢查所有合約連接和參數是否正確設置

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
// 修復 BigInt 序列化問題
BigInt.prototype.toJSON = function() { return this.toString(); };


const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 預期的設置值
const EXPECTED_VALUES = {
  BASE_URIS: {
    HERO: 'https://dungeon-delvers-metadata-server.onrender.com/api/hero/',
    RELIC: 'https://dungeon-delvers-metadata-server.onrender.com/api/relic/',
    PARTY: 'https://dungeon-delvers-metadata-server.onrender.com/api/party/',
    VIPSTAKING: 'https://dungeon-delvers-metadata-server.onrender.com/api/vip/',
    PLAYERPROFILE: 'https://dungeon-delvers-metadata-server.onrender.com/api/profile/'
  },
  MINT_PRICES: {
    HERO: ethers.parseUnits('2', 18),
    RELIC: ethers.parseUnits('2', 18)
  },
  DUNGEONMASTER_WALLET: '0xEbCF4A36Ad1485A9737025e9d72186b604487274'
};


// 自定義 JSON replacer 處理 BigInt
const jsonReplacer = (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

async function verifyV23Setup() {
  console.log('🔍 開始驗證 V23 合約設置...\n');
  
  // 載入 V23 配置
  const configPath = path.join(__dirname, '..', '..', 'config', 'v23-config.js');
  if (!fs.existsSync(configPath)) {
    console.error('❌ 錯誤: 找不到 V23 配置文件');
    process.exit(1);
  }
  
  const v23Config = require(configPath);
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  console.log(`📋 版本: ${v23Config.version}`);
  console.log(`📅 部署時間: ${v23Config.lastUpdated}`);
  console.log(`🌐 網路: ${v23Config.network}\n`);
  
  const verificationState = {
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: []
  };
  
  try {
    // 1. 驗證 DungeonCore 設置
    console.log('\n📌 驗證 DungeonCore 設置');
    console.log('='.repeat(50));
    await verifyDungeonCore(v23Config.contracts, provider, verificationState);
    
    // 2. 驗證各模組的反向連接
    console.log('\n📌 驗證模組反向連接');
    console.log('='.repeat(50));
    await verifyModuleConnections(v23Config.contracts, provider, verificationState);
    
    // 3. 驗證特定依賴
    console.log('\n📌 驗證特定依賴');
    console.log('='.repeat(50));
    await verifySpecificDependencies(v23Config.contracts, provider, verificationState);
    
    // 4. 驗證 BaseURI
    console.log('\n📌 驗證 BaseURI 設置');
    console.log('='.repeat(50));
    await verifyBaseURIs(v23Config.contracts, provider, verificationState);
    
    // 5. 驗證費用參數
    console.log('\n📌 驗證費用參數');
    console.log('='.repeat(50));
    await verifyFeeParameters(v23Config.contracts, provider, verificationState);
    
    // 6. 驗證關鍵功能
    console.log('\n📌 驗證關鍵功能');
    console.log('='.repeat(50));
    await verifyKeyFunctions(v23Config.contracts, provider, verificationState);
    
    // 顯示結果
    console.log('\n\n📊 驗證結果');
    console.log('='.repeat(50));
    console.log(`總檢查項目: ${verificationState.totalChecks}`);
    console.log(`✅ 通過: ${verificationState.passedChecks}`);
    console.log(`❌ 失敗: ${verificationState.failedChecks.length}`);
    
    if (verificationState.failedChecks.length > 0) {
      console.log('\n⚠️ 失敗的檢查:');
      verificationState.failedChecks.forEach(check => {
        console.log(`\n   ❌ ${check.name}`);
        console.log(`      預期: ${check.expected}`);
        console.log(`      實際: ${check.actual}`);
        if (check.error) {
          console.log(`      錯誤: ${check.error}`);
        }
      });
      
      console.log('\n🔧 建議修復步驟:');
      console.log('1. 執行設置腳本: node scripts/active/setup-v23-complete.js');
      console.log('2. 檢查特定失敗的設置');
    } else {
      console.log('\n✅ 所有檢查通過！V23 合約設置完整且正確。');
    }
    
    // 保存驗證結果
    const resultPath = path.join(__dirname, '..', 'deployments', `v23-verification-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
    fs.writeFileSync(resultPath, JSON.stringify({
      version: 'V23',
      timestamp: new Date().toISOString(),
      totalChecks: verificationState.totalChecks,
      passedChecks: verificationState.passedChecks,
      failedChecks: verificationState.failedChecks
    }, null, 2));
    
    console.log(`\n📄 驗證結果已保存: ${resultPath}`);
    
  } catch (error) {
    console.error('\n❌ 驗證失敗:', error);
    process.exit(1);
  }
}

// 驗證 DungeonCore 設置
async function verifyDungeonCore(contracts, provider, state) {
  const dungeonCoreABI = [
    "function oracleAddress() view returns (address)",
    "function heroContractAddress() view returns (address)",
    "function relicContractAddress() view returns (address)",
    "function partyContractAddress() view returns (address)",
    "function dungeonMasterAddress() view returns (address)",
    "function playerVaultAddress() view returns (address)",
    "function playerProfileAddress() view returns (address)",
    "function vipStakingAddress() view returns (address)",
    "function altarOfAscensionAddress() view returns (address)"
  ];
  
  const dungeonCore = new ethers.Contract(contracts.DUNGEONCORE.address, dungeonCoreABI, provider);
  
  const checks = [
    { name: 'DungeonCore.oracleAddress', getter: 'oracleAddress', expected: contracts.ORACLE.address },
    { name: 'DungeonCore.heroContract', getter: 'heroContractAddress', expected: contracts.HERO.address },
    { name: 'DungeonCore.relicContract', getter: 'relicContractAddress', expected: contracts.RELIC.address },
    { name: 'DungeonCore.partyContract', getter: 'partyContractAddress', expected: contracts.PARTY.address },
    { name: 'DungeonCore.dungeonMaster', getter: 'dungeonMasterAddress', expected: contracts.DUNGEONMASTER.address },
    { name: 'DungeonCore.playerVault', getter: 'playerVaultAddress', expected: contracts.PLAYERVAULT.address },
    { name: 'DungeonCore.playerProfile', getter: 'playerProfileAddress', expected: contracts.PLAYERPROFILE.address },
    { name: 'DungeonCore.vipStaking', getter: 'vipStakingAddress', expected: contracts.VIPSTAKING.address },
    { name: 'DungeonCore.altarOfAscension', getter: 'altarOfAscensionAddress', expected: contracts.ALTAROFASCENSION.address }
  ];
  
  await performChecks(dungeonCore, checks, state);
}

// 驗證模組反向連接
async function verifyModuleConnections(contracts, provider, state) {
  // Hero 檢查
  const heroABI = [
    "function dungeonCore() view returns (address)",
    "function soulShardToken() view returns (address)",
    "function ascensionAltarAddress() view returns (address)"
  ];
  const hero = new ethers.Contract(contracts.HERO.address, heroABI, provider);
  
  await performChecks(hero, [
    { name: 'Hero.dungeonCore', getter: 'dungeonCore', expected: contracts.DUNGEONCORE.address },
    { name: 'Hero.soulShardToken', getter: 'soulShardToken', expected: contracts.SOULSHARD.address },
    { name: 'Hero.ascensionAltarAddress', getter: 'ascensionAltarAddress', expected: contracts.ALTAROFASCENSION.address }
  ], state);
  
  // Relic 檢查
  const relic = new ethers.Contract(contracts.RELIC.address, heroABI, provider);
  await performChecks(relic, [
    { name: 'Relic.dungeonCore', getter: 'dungeonCore', expected: contracts.DUNGEONCORE.address },
    { name: 'Relic.soulShardToken', getter: 'soulShardToken', expected: contracts.SOULSHARD.address },
    { name: 'Relic.ascensionAltarAddress', getter: 'ascensionAltarAddress', expected: contracts.ALTAROFASCENSION.address }
  ], state);
  
  // VIPStaking 檢查
  const vipABI = [
    "function dungeonCore() view returns (address)",
    "function soulShardToken() view returns (address)"
  ];
  const vip = new ethers.Contract(contracts.VIPSTAKING.address, vipABI, provider);
  await performChecks(vip, [
    { name: 'VIPStaking.dungeonCore', getter: 'dungeonCore', expected: contracts.DUNGEONCORE.address },
    { name: 'VIPStaking.soulShardToken', getter: 'soulShardToken', expected: contracts.SOULSHARD.address }
  ], state);
  
  // PlayerVault 檢查
  const vault = new ethers.Contract(contracts.PLAYERVAULT.address, vipABI, provider);
  await performChecks(vault, [
    { name: 'PlayerVault.dungeonCore', getter: 'dungeonCore', expected: contracts.DUNGEONCORE.address },
    { name: 'PlayerVault.soulShardToken', getter: 'soulShardToken', expected: contracts.SOULSHARD.address }
  ], state);
  
  // PlayerProfile 檢查
  const profileABI = ["function dungeonCore() view returns (address)"];
  const profile = new ethers.Contract(contracts.PLAYERPROFILE.address, profileABI, provider);
  await performChecks(profile, [
    { name: 'PlayerProfile.dungeonCore', getter: 'dungeonCore', expected: contracts.DUNGEONCORE.address }
  ], state);
}

// 驗證特定依賴
async function verifySpecificDependencies(contracts, provider, state) {
  // Party 檢查
  const partyABI = [
    "function heroContractAddress() view returns (address)",
    "function relicContractAddress() view returns (address)",
    "function dungeonCoreContract() view returns (address)"
  ];
  const party = new ethers.Contract(contracts.PARTY.address, partyABI, provider);
  
  await performChecks(party, [
    { name: 'Party.heroContract', getter: 'heroContractAddress', expected: contracts.HERO.address },
    { name: 'Party.relicContract', getter: 'relicContractAddress', expected: contracts.RELIC.address },
    { name: 'Party.dungeonCoreContract', getter: 'dungeonCoreContract', expected: contracts.DUNGEONCORE.address }
  ], state);
  
  // DungeonMaster 檢查
  const dmABI = [
    "function dungeonCore() view returns (address)",
    "function dungeonStorage() view returns (address)",
    "function soulShardToken() view returns (address)",
    "function dungeonMasterWallet() view returns (address)"
  ];
  const dm = new ethers.Contract(contracts.DUNGEONMASTER.address, dmABI, provider);
  
  await performChecks(dm, [
    { name: 'DungeonMaster.dungeonCore', getter: 'dungeonCore', expected: contracts.DUNGEONCORE.address },
    { name: 'DungeonMaster.dungeonStorage', getter: 'dungeonStorage', expected: contracts.DUNGEONSTORAGE.address },
    { name: 'DungeonMaster.soulShardToken', getter: 'soulShardToken', expected: contracts.SOULSHARD.address },
    { name: 'DungeonMaster.dungeonMasterWallet', getter: 'dungeonMasterWallet', expected: EXPECTED_VALUES.DUNGEONMASTER_WALLET }
  ], state);
  
  // DungeonStorage 檢查
  const storageABI = ["function logicContract() view returns (address)"];
  const storage = new ethers.Contract(contracts.DUNGEONSTORAGE.address, storageABI, provider);
  
  await performChecks(storage, [
    { name: 'DungeonStorage.logicContract', getter: 'logicContract', expected: contracts.DUNGEONMASTER.address }
  ], state);
}

// 驗證 BaseURI
async function verifyBaseURIs(contracts, provider, state) {
  const baseURIABI = ["function baseURI() view returns (string)"];
  
  const nftContracts = [
    { name: 'Hero', address: contracts.HERO.address, expectedURI: EXPECTED_VALUES.BASE_URIS.HERO },
    { name: 'Relic', address: contracts.RELIC.address, expectedURI: EXPECTED_VALUES.BASE_URIS.RELIC },
    { name: 'Party', address: contracts.PARTY.address, expectedURI: EXPECTED_VALUES.BASE_URIS.PARTY },
    { name: 'VIPStaking', address: contracts.VIPSTAKING.address, expectedURI: EXPECTED_VALUES.BASE_URIS.VIPSTAKING },
    { name: 'PlayerProfile', address: contracts.PLAYERPROFILE.address, expectedURI: EXPECTED_VALUES.BASE_URIS.PLAYERPROFILE }
  ];
  
  for (const nft of nftContracts) {
    const contract = new ethers.Contract(nft.address, baseURIABI, provider);
    await performChecks(contract, [
      { name: `${nft.name}.baseURI`, getter: 'baseURI', expected: nft.expectedURI }
    ], state);
  }
}

// 驗證費用參數
async function verifyFeeParameters(contracts, provider, state) {
  const priceABI = ["function mintPriceUSD() view returns (uint256)"];
  
  // Hero mintPriceUSD
  const hero = new ethers.Contract(contracts.HERO.address, priceABI, provider);
  await performChecks(hero, [
    { name: 'Hero.mintPriceUSD', getter: 'mintPriceUSD', expected: EXPECTED_VALUES.MINT_PRICES.HERO }
  ], state);
  
  // Relic mintPriceUSD
  const relic = new ethers.Contract(contracts.RELIC.address, priceABI, provider);
  await performChecks(relic, [
    { name: 'Relic.mintPriceUSD', getter: 'mintPriceUSD', expected: EXPECTED_VALUES.MINT_PRICES.RELIC }
  ], state);
}

// 驗證關鍵功能
async function verifyKeyFunctions(contracts, provider, state) {
  // 檢查 Oracle 功能
  console.log('\n   🔍 檢查 Oracle 功能...');
  const oracleABI = [
    "function getPriceAdaptive() view returns (uint256 price, uint32 usedPeriod)",
    "function getSoulShardPriceInUSD() view returns (uint256)"
  ];
  const oracle = new ethers.Contract(contracts.ORACLE.address, oracleABI, provider);
  
  try {
    const [price, period] = await oracle.getPriceAdaptive();
    if (price > 0) {
      console.log(`      ✅ Oracle 價格查詢正常: ${ethers.formatUnits(price, 18)} USD (週期: ${period}秒)`);
      state.totalChecks++;
      state.passedChecks++;
    } else {
      throw new Error('價格為 0');
    }
  } catch (error) {
    console.log(`      ❌ Oracle 價格查詢失敗: ${error.message}`);
    state.totalChecks++;
    state.failedChecks.push({
      name: 'Oracle.getPriceAdaptive',
      error: error.message
    });
  }
  
  // 檢查 PlayerVault 就緒狀態
  console.log('\n   🔍 檢查 PlayerVault 就緒狀態...');
  const vaultABI = ["function isReadyToOperate() view returns (bool)"];
  const vault = new ethers.Contract(contracts.PLAYERVAULT.address, vaultABI, provider);
  
  try {
    const isReady = await vault.isReadyToOperate();
    if (isReady) {
      console.log(`      ✅ PlayerVault 已就緒`);
      state.totalChecks++;
      state.passedChecks++;
    } else {
      throw new Error('PlayerVault 未就緒');
    }
  } catch (error) {
    console.log(`      ❌ PlayerVault 就緒檢查失敗: ${error.message}`);
    state.totalChecks++;
    state.failedChecks.push({
      name: 'PlayerVault.isReadyToOperate',
      error: error.message
    });
  }
}

// 執行檢查輔助函數
async function performChecks(contract, checks, state) {
  for (const check of checks) {
    state.totalChecks++;
    
    try {
      console.log(`\n   🔍 檢查 ${check.name}...`);
      const actual = await contract[check.getter]();
      
      // 處理地址比較
      let actualValue = actual;
      let expectedValue = check.expected;
      
      if (typeof actual === 'string' && actual.startsWith('0x')) {
        actualValue = actual.toLowerCase();
        expectedValue = check.expected.toLowerCase();
      }
      
      if (actualValue === expectedValue || actualValue.toString() === expectedValue.toString()) {
        console.log(`      ✅ 正確: ${actualValue}`);
        state.passedChecks++;
      } else {
        console.log(`      ❌ 不正確`);
        console.log(`         預期: ${expectedValue}`);
        console.log(`         實際: ${actualValue}`);
        state.failedChecks.push({
          name: check.name,
          expected: expectedValue,
          actual: actualValue
        });
      }
    } catch (error) {
      console.log(`      ❌ 檢查失敗: ${error.message}`);
      state.failedChecks.push({
        name: check.name,
        expected: check.expected,
        error: error.message
      });
    }
  }
}

// 執行驗證
if (require.main === module) {
  verifyV23Setup().catch(console.error);
}

module.exports = { verifyV23Setup };