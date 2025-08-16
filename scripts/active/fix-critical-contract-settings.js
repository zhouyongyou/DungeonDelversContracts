const hre = require("hardhat");

// V25 合約地址
const CONTRACTS = {
  DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
  DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
  ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF'
};

async function main() {
  console.log('🚨 緊急修復關鍵合約設定');
  console.log('===========================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('執行賬戶:', signer.address);
  console.log('');
  
  // 1. 修復 AltarOfAscension 的 DungeonCore 設定
  console.log('1️⃣ 修復 AltarOfAscension DungeonCore 設定:');
  console.log('   AltarOfAscension:', CONTRACTS.ALTAROFASCENSION);
  console.log('   目標 DungeonCore:', CONTRACTS.DUNGEONCORE);
  
  try {
    const altar = await hre.ethers.getContractAt('AltarOfAscensionVRF', CONTRACTS.ALTAROFASCENSION);
    
    // 檢查當前設定
    const currentDungeonCore = await altar.dungeonCore();
    console.log('   當前 DungeonCore:', currentDungeonCore);
    
    if (currentDungeonCore.toLowerCase() !== CONTRACTS.DUNGEONCORE.toLowerCase()) {
      console.log('   ⚠️ DungeonCore 設定不正確，正在修復...');
      const tx1 = await altar.setDungeonCore(CONTRACTS.DUNGEONCORE);
      console.log('   交易哈希:', tx1.hash);
      await tx1.wait();
      
      const newDungeonCore = await altar.dungeonCore();
      console.log('   ✅ 新的 DungeonCore:', newDungeonCore);
    } else {
      console.log('   ✅ DungeonCore 已正確設定');
    }
    
  } catch (error) {
    console.log('   ❌ AltarOfAscension 設定失敗:', error.message);
  }
  
  console.log('');
  
  // 2. 修復 DungeonMaster 的 SoulShard 設定
  console.log('2️⃣ 修復 DungeonMaster SoulShard 設定:');
  console.log('   DungeonMaster:', CONTRACTS.DUNGEONMASTER);
  console.log('   目標 SoulShard:', CONTRACTS.SOULSHARD);
  
  try {
    const dungeonMaster = await hre.ethers.getContractAt('DungeonMaster', CONTRACTS.DUNGEONMASTER);
    
    // 檢查當前設定
    try {
      const currentSoulShard = await dungeonMaster.soulShardToken();
      console.log('   當前 SoulShard:', currentSoulShard);
      
      if (currentSoulShard.toLowerCase() !== CONTRACTS.SOULSHARD.toLowerCase()) {
        console.log('   ⚠️ SoulShard 設定不正確，正在修復...');
        const tx2 = await dungeonMaster.setSoulShardToken(CONTRACTS.SOULSHARD);
        console.log('   交易哈希:', tx2.hash);
        await tx2.wait();
        
        const newSoulShard = await dungeonMaster.soulShardToken();
        console.log('   ✅ 新的 SoulShard:', newSoulShard);
      } else {
        console.log('   ✅ SoulShard 已正確設定');
      }
    } catch (readError) {
      console.log('   ⚠️ 無法讀取當前 SoulShard 設定，嘗試設定...');
      const tx2 = await dungeonMaster.setSoulShardToken(CONTRACTS.SOULSHARD);
      console.log('   交易哈希:', tx2.hash);
      await tx2.wait();
      console.log('   ✅ SoulShard 已設定');
    }
    
  } catch (error) {
    console.log('   ❌ DungeonMaster 設定失敗:', error.message);
  }
  
  console.log('');
  
  // 3. 檢查 Hero 合約的費用計算邏輯
  console.log('3️⃣ 檢查 Hero 合約費用相關設定:');
  
  try {
    const hero = await hre.ethers.getContractAt('Hero', '0xD48867dbac5f1c1351421726B6544f847D9486af');
    
    const platformFee = await hero.platformFee();
    const vrfManager = await hero.vrfManager();
    const dungeonCore = await hero.dungeonCore();
    
    console.log('   Hero 平台費:', hre.ethers.formatEther(platformFee), 'BNB');
    console.log('   Hero VRFManager:', vrfManager);
    console.log('   Hero DungeonCore:', dungeonCore);
    
    // 檢查 VRF 費用
    if (vrfManager !== '0x0000000000000000000000000000000000000000') {
      const vrfManagerContract = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManager);
      const vrfFee = await vrfManagerContract.vrfRequestPrice();
      console.log('   VRF 費用:', hre.ethers.formatEther(vrfFee), 'BNB');
      
      const totalExpectedFee = platformFee + vrfFee;
      console.log('   預期總費用:', hre.ethers.formatEther(totalExpectedFee), 'BNB');
      console.log('   失敗交易支付:', '0.005 BNB');
      
      if (totalExpectedFee > hre.ethers.parseEther('0.005')) {
        console.log('   🚨 問題發現：預期費用大於支付的 0.005 BNB！');
      }
    }
    
  } catch (error) {
    console.log('   ❌ Hero 合約檢查失敗:', error.message);
  }
  
  console.log('');
  
  // 4. 驗證修復結果
  console.log('📋 最終驗證:');
  console.log('============');
  
  try {
    const altar = await hre.ethers.getContractAt('AltarOfAscensionVRF', CONTRACTS.ALTAROFASCENSION);
    const dungeonMaster = await hre.ethers.getContractAt('DungeonMaster', CONTRACTS.DUNGEONMASTER);
    
    console.log('AltarOfAscension DungeonCore:', await altar.dungeonCore());
    console.log('DungeonMaster SoulShard:', await dungeonMaster.soulShardToken());
    
    console.log('\n✅ 關鍵設定修復完成！');
    console.log('\n🔧 請重新測試鑄造功能');
    
  } catch (error) {
    console.log('驗證失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });