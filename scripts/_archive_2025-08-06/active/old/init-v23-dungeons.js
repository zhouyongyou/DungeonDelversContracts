#!/usr/bin/env node

// V23 地城初始化腳本 - 修復 USD 精度問題

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// 地城配置（與 V22 相同）
const DUNGEON_CONFIG = [
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

// DungeonMaster ABI
const DUNGEON_MASTER_ABI = [
  'function adminSetDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external',
  'function owner() public view returns (address)'
];

// DungeonStorage ABI
const DUNGEON_STORAGE_ABI = [
  'function dungeons(uint256) public view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized)'
];

async function initV23Dungeons() {
  console.log('🏰 V23 地城初始化腳本\n');
  console.log('📝 修復 USD 精度問題版本\n');

  // 檢查是否有部署信息
  const deploymentFiles = fs.readdirSync(path.join(__dirname, '../../deployments'))
    .filter(f => f.startsWith('v23-deployment-'))
    .sort();
  
  if (deploymentFiles.length === 0) {
    console.error('❌ 找不到 V23 部署文件');
    console.log('   請先執行: node scripts/active/deploy-v23-complete.js');
    return;
  }

  // 讀取最新的部署信息
  const latestDeployment = deploymentFiles[deploymentFiles.length - 1];
  const deploymentData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../deployments', latestDeployment), 'utf8')
  );

  console.log(`📄 使用部署文件: ${latestDeployment}`);
  console.log(`⏰ 部署時間: ${deploymentData.timestamp}\n`);

  // 連接到 BSC
  const RPC_URL = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error('請設置 PRIVATE_KEY 環境變數');
  }
  
  const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`🏰 DungeonMaster 地址: ${deploymentData.contracts.DUNGEONMASTER}`);
  console.log(`📦 DungeonStorage 地址: ${deploymentData.contracts.DUNGEONSTORAGE}\n`);

  const dungeonMaster = new ethers.Contract(
    deploymentData.contracts.DUNGEONMASTER,
    DUNGEON_MASTER_ABI,
    deployer
  );

  const dungeonStorage = new ethers.Contract(
    deploymentData.contracts.DUNGEONSTORAGE,
    DUNGEON_STORAGE_ABI,
    provider
  );

  try {
    // 檢查權限
    const owner = await dungeonMaster.owner();
    console.log(`🔑 DungeonMaster Owner: ${owner}`);
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error('執行者不是 DungeonMaster 的 Owner');
    }

    console.log('\n📋 開始初始化地城...\n');
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const dungeon of DUNGEON_CONFIG) {
      console.log(`🏰 地城 ${dungeon.id}: ${dungeon.name}`);
      
      try {
        // 檢查當前狀態
        const [currentPower, currentRewardUSD, currentSuccessRate, isInitialized] = 
          await dungeonStorage.dungeons(dungeon.id);
        
        const currentUSDFormatted = parseFloat(ethers.formatUnits(currentRewardUSD, 18));
        
        if (isInitialized && Math.abs(currentUSDFormatted - dungeon.rewardUSD) < 0.01) {
          console.log(`   ✅ 已正確初始化 (USD: $${currentUSDFormatted})`);
          successCount++;
          continue;
        }
        
        // 需要初始化或更新
        console.log(`   當前狀態: ${isInitialized ? '已初始化' : '未初始化'}`);
        console.log(`   當前 USD 獎勵: $${currentUSDFormatted}`);
        console.log(`   預期 USD 獎勵: $${dungeon.rewardUSD}`);
        
        // 準備正確的 USD 獎勵值（轉換為 wei）
        const rewardAmountUSD = ethers.parseUnits(dungeon.rewardUSD.toString(), 18);
        
        console.log(`   設置參數:`);
        console.log(`     - 戰力需求: ${dungeon.requiredPower}`);
        console.log(`     - USD 獎勵: ${dungeon.rewardUSD} USD (${rewardAmountUSD.toString()} wei)`);
        console.log(`     - 成功率: ${dungeon.successRate}%`);
        
        // 發送交易
        const tx = await dungeonMaster.adminSetDungeon(
          dungeon.id,
          dungeon.requiredPower,
          rewardAmountUSD,
          dungeon.successRate
        );
        
        console.log(`   交易哈希: ${tx.hash}`);
        console.log('   等待確認...');
        
        const receipt = await tx.wait();
        console.log(`   ✅ 成功！區塊: ${receipt.blockNumber}\n`);
        
        successCount++;
        
        // 等待一下避免太快
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ 失敗: ${error.message}\n`);
        failureCount++;
      }
    }

    // 驗證結果
    console.log('\n🔍 驗證初始化結果...');
    console.log('ID | 名稱 | 戰力需求 | USD獎勵 | 成功率 | 狀態');
    console.log('---|------|----------|---------|--------|------');
    
    for (const dungeon of DUNGEON_CONFIG) {
      const [requiredPower, rewardUSD, successRate, isInitialized] = 
        await dungeonStorage.dungeons(dungeon.id);
      
      const usdFormatted = parseFloat(ethers.formatUnits(rewardUSD, 18));
      const status = isInitialized && Math.abs(usdFormatted - dungeon.rewardUSD) < 0.01 ? '✅' : '❌';
      
      console.log(
        `${dungeon.id.toString().padStart(2)} | ${dungeon.name.padEnd(12)} | ${requiredPower.toString().padStart(8)} | $${usdFormatted.toFixed(2).padStart(6)} | ${successRate.toString().padStart(6)}% | ${status}`
      );
    }

    // 總結
    console.log('\n📊 初始化總結：');
    console.log(`   ✅ 成功: ${successCount} 個地城`);
    console.log(`   ❌ 失敗: ${failureCount} 個地城`);
    
    if (failureCount === 0) {
      console.log('\n🎉 所有地城初始化成功！');
      console.log('💡 USD 精度問題已修復');
      console.log('✅ 地城獎勵將正確顯示');
    } else {
      console.log('\n⚠️  部分地城初始化失敗，請檢查錯誤並重試');
    }

    // 額外提醒
    console.log('\n📌 重要提醒：');
    console.log('1. DungeonStorage 儲存的是 rewardAmountUSD (USD 值，18位小數)');
    console.log('2. 前端會根據 Oracle 價格計算對應的 SOUL 數量');
    console.log('3. 確保 Oracle 正常運作才能正確顯示獎勵');

  } catch (error) {
    console.error('\n❌ 初始化失敗:', error.message);
  }
}

// 執行初始化
if (require.main === module) {
  initV23Dungeons().catch(console.error);
}

module.exports = { initV23Dungeons };