#!/usr/bin/env node

// 檢查地城獎勵設置

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

// DungeonStorage ABI
const DUNGEON_STORAGE_ABI = [
  'function getDungeonBaseReward(uint256 dungeonId) public view returns (uint256)',
  'function getDungeon(uint256 dungeonId) public view returns (uint256 requiredPower, uint256 baseSoulReward, uint256 cooldownTime, uint256 successRate, bool isActive)',
  'function dungeonNames(uint256 dungeonId) public view returns (string memory)'
];

// Oracle ABI
const ORACLE_ABI = [
  'function getSoulShardPriceInUSD() external view returns (uint256 price)',
  'function getRequiredSoulShardAmount(uint256 usdAmount) public view returns (uint256)'
];

async function checkDungeonRewards() {
  console.log('🏰 檢查地城獎勵設置...\n');

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
    console.log('ID | 名稱 | 戰力需求 | SOUL獎勵 | USD價值 | 預期USD | 狀態');
    console.log('---|------|----------|----------|---------|---------|------');

    let hasZeroRewards = false;
    
    for (let i = 1; i <= 10; i++) {
      const [requiredPower, baseSoulReward, cooldownTime, successRate, isActive] = await dungeonStorage.getDungeon(i);
      const name = await dungeonStorage.dungeonNames(i);
      
      // 計算 USD 價值
      const soulRewardFormatted = parseFloat(ethers.formatUnits(baseSoulReward, 18));
      const usdValue = soulRewardFormatted * soulPriceUSD;
      
      // 從配置獲取預期值
      const expectedDungeon = v22Config.parameters.dungeons.find(d => d.id === i);
      const expectedUSD = expectedDungeon ? expectedDungeon.rewardUSD : 0;
      
      const status = Math.abs(usdValue - expectedUSD) < 0.1 ? '✅' : '❌';
      
      if (soulRewardFormatted === 0) {
        hasZeroRewards = true;
      }
      
      console.log(`${i.toString().padStart(2)} | ${name.padEnd(12)} | ${requiredPower.toString().padStart(8)} | ${soulRewardFormatted.toFixed(4).padStart(8)} | $${usdValue.toFixed(2).padStart(6)} | $${expectedUSD.toString().padStart(6)} | ${status}`);
    }

    // 3. 分析結果
    console.log('\n📊 分析結果：');
    if (hasZeroRewards) {
      console.log('❌ 發現有地城的 SOUL 獎勵為 0');
      console.log('   這會導致前端顯示 ~0 SOUL($0.00)');
      
      console.log('\n🔧 可能的原因：');
      console.log('1. 初始化時未正確設置 baseSoulReward');
      console.log('2. 有人手動將獎勵設置為 0');
      console.log('3. 合約邏輯問題');
      
      console.log('\n💡 解決方案：');
      console.log('需要執行修復腳本來設置正確的獎勵值');
    } else {
      console.log('✅ 所有地城都有獎勵設置');
      console.log('   如果前端仍顯示 $0.00，可能是計算邏輯問題');
    }

    // 4. 測試獎勵計算
    console.log('\n🧮 測試獎勵計算（以地城 1 為例）：');
    const [, baseSoulReward1] = await dungeonStorage.getDungeon(1);
    const soulAmount = parseFloat(ethers.formatUnits(baseSoulReward1, 18));
    
    if (soulAmount > 0) {
      // 計算該 SOUL 數量對應的 USD 價值
      const usdValue = soulAmount * soulPriceUSD;
      
      console.log(`   基礎 SOUL 獎勵: ${soulAmount} SOUL`);
      console.log(`   USD 價值: $${usdValue.toFixed(2)}`);
      console.log(`   需要多少 SOUL 換 1 USD: ${(1/soulPriceUSD).toFixed(2)} SOUL`);
    } else {
      console.log('   ❌ 地城 1 的 SOUL 獎勵為 0，無法測試計算');
    }

  } catch (error) {
    console.error('\n❌ 檢查失敗:', error.message);
  }
}

// 執行檢查
if (require.main === module) {
  checkDungeonRewards().catch(console.error);
}

module.exports = { checkDungeonRewards };