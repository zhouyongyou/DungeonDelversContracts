#!/usr/bin/env node

// V23 修復剩餘問題的腳本

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
const v23Config = require('../../config/v23-config');

async function fixRemainingIssues() {
  console.log('🔧 修復 V23 剩餘問題...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  const contracts = v23Config.contracts;
  
  console.log(`📝 執行者地址: ${deployer.address}\n`);
  
  const results = {
    success: [],
    failed: []
  };
  
  // 1. 修復 Party.dungeonCoreContract
  console.log('📌 修復 Party 合約設置');
  console.log('='.repeat(50));
  
  try {
    const partyABI = ["function setDungeonCoreContract(address _dungeonCore) external"];
    const party = new ethers.Contract(contracts.PARTY.address, partyABI, deployer);
    
    console.log('🔧 設置 Party.dungeonCoreContract...');
    const tx1 = await party.setDungeonCoreContract(contracts.DUNGEONCORE.address);
    await tx1.wait();
    console.log('   ✅ 成功');
    results.success.push('Party.dungeonCoreContract');
  } catch (error) {
    console.log(`   ❌ 失敗: ${error.message}`);
    results.failed.push({ name: 'Party.dungeonCoreContract', error: error.message });
  }
  
  // 2. 修復價格設置（使用正確的單位）
  console.log('\n📌 修復鑄造價格');
  console.log('='.repeat(50));
  
  const correctPrice = ethers.parseUnits('2', 18); // 2 USD
  console.log(`正確價格: ${correctPrice.toString()} (2 USD)`);
  
  for (const [name, address] of [['Hero', contracts.HERO.address], ['Relic', contracts.RELIC.address]]) {
    try {
      console.log(`\n🔧 設置 ${name} 鑄造價格...`);
      
      // 先檢查當前價格
      const checkPriceABI = ["function mintPriceUSD() view returns (uint256)"];
      const nftCheck = new ethers.Contract(address, checkPriceABI, provider);
      const currentPrice = await nftCheck.mintPriceUSD();
      console.log(`   當前價格: ${currentPrice.toString()}`);
      
      if (currentPrice !== correctPrice) {
        const setPriceABI = ["function setMintPriceUSD(uint256 _price) external"];
        const nft = new ethers.Contract(address, setPriceABI, deployer);
        const tx = await nft.setMintPriceUSD(correctPrice);
        await tx.wait();
        console.log('   ✅ 價格已更新為 2 USD');
        results.success.push(`${name}.mintPriceUSD`);
      } else {
        console.log('   ✅ 價格已正確');
      }
    } catch (error) {
      console.log(`   ❌ 失敗: ${error.message}`);
      results.failed.push({ name: `${name}.mintPriceUSD`, error: error.message });
    }
  }
  
  // 3. 檢查 PlayerVault 初始化狀態
  console.log('\n📌 檢查 PlayerVault 狀態');
  console.log('='.repeat(50));
  
  try {
    // 嘗試不同的初始化方法
    const vaultABI = [
      "function initialize() external",
      "function setDungeonCore(address _dungeonCore) external",
      "function setSoulShardToken(address _token) external"
    ];
    const vault = new ethers.Contract(contracts.PLAYERVAULT.address, vaultABI, deployer);
    
    // 檢查是否需要初始化
    try {
      console.log('🔧 嘗試初始化 PlayerVault...');
      const tx = await vault.initialize();
      await tx.wait();
      console.log('   ✅ 初始化成功');
      results.success.push('PlayerVault.initialize');
    } catch (error) {
      if (error.message.includes('Initializable')) {
        console.log('   ℹ️ 已經初始化');
      } else {
        console.log('   ℹ️ 不需要初始化或已完成');
      }
    }
  } catch (error) {
    console.log(`   ❌ PlayerVault 檢查失敗: ${error.message}`);
    results.failed.push({ name: 'PlayerVault', error: error.message });
  }
  
  // 4. 嘗試使用不同方法設置 DungeonMaster 參數
  console.log('\n📌 嘗試 DungeonMaster 替代設置方法');
  console.log('='.repeat(50));
  
  try {
    // 檢查是否有 initialize 或 setup 函數
    const dmABI = [
      "function initialize(address _dungeonCore, address _dungeonStorage, address _soulShardToken, address _dungeonMasterWallet) external",
      "function setup(address _dungeonCore, address _dungeonStorage, address _soulShardToken, address _dungeonMasterWallet) external"
    ];
    const dm = new ethers.Contract(contracts.DUNGEONMASTER.address, dmABI, deployer);
    
    try {
      console.log('🔧 嘗試 initialize DungeonMaster...');
      const tx = await dm.initialize(
        contracts.DUNGEONCORE.address,
        contracts.DUNGEONSTORAGE.address,
        contracts.SOULSHARD.address,
        contracts.DUNGEONMASTERWALLET.address
      );
      await tx.wait();
      console.log('   ✅ 初始化成功');
      results.success.push('DungeonMaster.initialize');
    } catch (error) {
      if (error.message.includes('Initializable') || error.message.includes('already initialized')) {
        console.log('   ℹ️ 已經初始化');
      } else {
        console.log('   ℹ️ 使用其他初始化方法');
      }
    }
  } catch (error) {
    console.log(`   ❌ DungeonMaster 初始化檢查失敗: ${error.message}`);
  }
  
  // 5. 檢查 DungeonCore 的實際接口
  console.log('\n📌 診斷 DungeonCore 接口');
  console.log('='.repeat(50));
  
  try {
    const coreAddress = contracts.DUNGEONCORE.address;
    const code = await provider.getCode(coreAddress);
    
    if (code !== '0x') {
      console.log('✅ DungeonCore 合約存在');
      
      // 嘗試不同的 getter 函數名稱
      const possibleGetters = [
        { name: 'hero', abi: ["function hero() view returns (address)"] },
        { name: 'heroContract', abi: ["function heroContract() view returns (address)"] },
        { name: 'getHero', abi: ["function getHero() view returns (address)"] },
        { name: 'getHeroContract', abi: ["function getHeroContract() view returns (address)"] }
      ];
      
      console.log('\n檢查可能的 Hero getter 函數:');
      for (const getter of possibleGetters) {
        try {
          const core = new ethers.Contract(coreAddress, getter.abi, provider);
          const result = await core[getter.name]();
          console.log(`   ✅ ${getter.name}(): ${result}`);
          break;
        } catch (e) {
          console.log(`   ❌ ${getter.name}(): 不存在`);
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ DungeonCore 診斷失敗: ${error.message}`);
  }
  
  // 總結
  console.log('\n\n========== 修復結果 ==========');
  console.log(`✅ 成功: ${results.success.length} 項`);
  if (results.success.length > 0) {
    results.success.forEach(item => console.log(`   - ${item}`));
  }
  
  console.log(`\n❌ 失敗: ${results.failed.length} 項`);
  if (results.failed.length > 0) {
    results.failed.forEach(item => console.log(`   - ${item.name}: ${item.error}`));
  }
  console.log('===============================\n');
  
  console.log('💡 建議：');
  console.log('1. 如果 DungeonCore 使用不同的 getter 函數名，需要更新驗證腳本');
  console.log('2. 某些合約可能有特殊的初始化順序要求');
  console.log('3. 檢查合約源碼以確認正確的函數簽名');
  
  console.log('\n📌 下一步：');
  console.log('1. 測試前端功能: cd /Users/sotadic/Documents/GitHub/DungeonDelvers && npm run dev');
  console.log('2. 部署子圖: cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers && npm run deploy');
  console.log('3. 測試批量鑄造: node scripts/active/test-v23-batch-minting.js');
}

// 執行
if (require.main === module) {
  fixRemainingIssues().catch(console.error);
}

module.exports = { fixRemainingIssues };