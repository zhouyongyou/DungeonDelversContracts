#!/usr/bin/env node

// 檢查地城獎勵設置 V2

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

// DungeonStorage ABI - 基於合約結構
const DUNGEON_STORAGE_ABI = [
  'function dungeons(uint256) public view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized)',
  'function getDungeon(uint256 _dungeonId) external view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))'
];

// Oracle ABI
const ORACLE_ABI = [
  'function getSoulShardPriceInUSD() external view returns (uint256 price)',
  'function getRequiredSoulShardAmount(uint256 usdAmount) public view returns (uint256)'
];

async function checkDungeonRewardsV2() {
  console.log('🏰 檢查地城獎勵設置 V2...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const dungeonStorage = new ethers.Contract(
    v22Config.contracts.DUNGEONSTORAGE.address,
    DUNGEON_STORAGE_ABI,
    provider
  );

  const oracle = new ethers.Contract(
    v22Config.contracts.ORACLE.address,
    ORACLE_ABI,
    provider
  );

  try {
    // 1. 先檢查 Oracle 狀態
    console.log('📊 Oracle 狀態：');
    const soulPrice = await oracle.getSoulShardPriceInUSD();
    const soulPriceUSD = parseFloat(ethers.formatUnits(soulPrice, 18));
    console.log(`   SOUL 價格: $${soulPriceUSD.toFixed(6)} USD`);
    console.log(`   1 USD = ${(1/soulPriceUSD).toFixed(2)} SOUL`);

    // 2. 檢查地城獎勵
    console.log('\n🏰 地城獎勵檢查：');
    console.log('ID | 名稱 | 戰力需求 | USD獎勵 | SOUL獎勵 | 預期USD | 狀態');
    console.log('---|------|----------|---------|----------|---------|------');

    let hasZeroRewards = false;
    let totalIssues = 0;
    
    for (let i = 1; i <= 10; i++) {
      try {
        // 使用 dungeons mapping 直接讀取
        const [requiredPower, rewardAmountUSD, baseSuccessRate, isInitialized] = await dungeonStorage.dungeons(i);
        
        // 格式化 USD 獎勵
        const usdReward = parseFloat(ethers.formatUnits(rewardAmountUSD, 18));
        
        // 計算對應的 SOUL 數量
        const soulReward = usdReward > 0 ? usdReward / soulPriceUSD : 0;
        
        // 從配置獲取預期值
        const expectedDungeon = v22Config.parameters.dungeons.find(d => d.id === i);
        const expectedUSD = expectedDungeon ? expectedDungeon.rewardUSD : 0;
        const dungeonName = expectedDungeon ? expectedDungeon.name : `地城 ${i}`;
        
        const status = Math.abs(usdReward - expectedUSD) < 0.1 ? '✅' : '❌';
        
        if (usdReward === 0) {
          hasZeroRewards = true;
          totalIssues++;
        }
        
        console.log(`${i.toString().padStart(2)} | ${dungeonName.padEnd(12)} | ${requiredPower.toString().padStart(8)} | $${usdReward.toFixed(2).padStart(6)} | ${soulReward.toFixed(0).padStart(8)} | $${expectedUSD.toString().padStart(6)} | ${status}`);
        
      } catch (error) {
        console.log(`${i.toString().padStart(2)} | 錯誤 | 無法讀取地城 ${i} 資料: ${error.message}`);
        totalIssues++;
      }
    }

    // 3. 分析結果
    console.log('\n📊 分析結果：');
    if (hasZeroRewards) {
      console.log('❌ 發現有地城的 USD 獎勵為 0');
      console.log('   這會導致前端顯示 ~0 SOUL($0.00)');
      
      console.log('\n🔧 問題分析：');
      console.log('1. DungeonStorage 儲存的是 rewardAmountUSD (USD 值)');
      console.log('2. 所有地城的 rewardAmountUSD 都是 0');
      console.log('3. 需要執行初始化腳本設置正確的 USD 獎勵');
      
      console.log('\n💡 解決方案：');
      console.log('執行修復腳本來設置正確的 USD 獎勵值');
    } else if (totalIssues === 0) {
      console.log('✅ 所有地城都有正確的獎勵設置');
    }

    // 4. 建議修復腳本
    if (hasZeroRewards) {
      console.log('\n📝 建議修復步驟：');
      console.log('1. 創建修復腳本 fix-dungeon-rewards.js');
      console.log('2. 從 v22-config.js 讀取正確的 USD 獎勵值');
      console.log('3. 調用 DungeonMaster 的 updateDungeon 函數');
      console.log('4. 設置每個地城的 rewardAmountUSD');
    }

  } catch (error) {
    console.error('\n❌ 檢查失敗:', error.message);
  }
}

// 執行檢查
if (require.main === module) {
  checkDungeonRewardsV2().catch(console.error);
}

module.exports = { checkDungeonRewardsV2 };