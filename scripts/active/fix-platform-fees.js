const hre = require("hardhat");

// V25 合約地址
const CONTRACTS = {
  HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af',
  RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce'
};

async function main() {
  console.log('🔧 修復平台費設定');
  console.log('==================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('執行賬戶:', signer.address);
  console.log('');
  
  // 修復 Hero 合約平台費
  console.log('1️⃣ Hero 合約平台費修復:');
  console.log('   地址:', CONTRACTS.HERO);
  
  try {
    const hero = await hre.ethers.getContractAt('Hero', CONTRACTS.HERO);
    
    // 檢查當前狀態
    const currentFee = await hero.platformFee();
    const owner = await hero.owner();
    
    console.log('   當前平台費:', hre.ethers.formatEther(currentFee), 'BNB');
    console.log('   合約 Owner:', owner);
    console.log('   執行賬戶:', signer.address);
    
    if (currentFee > 0n) {
      console.log('   設定平台費為 0...');
      try {
        const tx = await hero.setPlatformFee(0);
        console.log('   交易哈希:', tx.hash);
        
        console.log('   ⏳ 等待交易確認...');
        await tx.wait();
        
        const newFee = await hero.platformFee();
        console.log('   ✅ Hero 平台費已設定為:', hre.ethers.formatEther(newFee), 'BNB');
      } catch (error) {
        console.log('   ❌ Hero 平台費設定失敗:', error.message);
        if (error.message.includes('Ownable')) {
          console.log('   ⚠️ 權限不足：需要 Owner 權限');
        }
      }
    } else {
      console.log('   ✅ Hero 平台費已經是 0，無需修改');
    }
    
  } catch (error) {
    console.log('   ❌ Hero 合約連接失敗:', error.message);
  }
  
  console.log('');
  
  // 修復 Relic 合約平台費
  console.log('2️⃣ Relic 合約平台費修復:');
  console.log('   地址:', CONTRACTS.RELIC);
  
  try {
    const relic = await hre.ethers.getContractAt('Relic', CONTRACTS.RELIC);
    
    // 檢查當前狀態
    const currentFee = await relic.platformFee();
    const owner = await relic.owner();
    
    console.log('   當前平台費:', hre.ethers.formatEther(currentFee), 'BNB');
    console.log('   合約 Owner:', owner);
    
    if (currentFee > 0n) {
      console.log('   設定平台費為 0...');
      try {
        const tx = await relic.setPlatformFee(0);
        console.log('   交易哈希:', tx.hash);
        
        console.log('   ⏳ 等待交易確認...');
        await tx.wait();
        
        const newFee = await relic.platformFee();
        console.log('   ✅ Relic 平台費已設定為:', hre.ethers.formatEther(newFee), 'BNB');
      } catch (error) {
        console.log('   ❌ Relic 平台費設定失敗:', error.message);
        if (error.message.includes('Ownable')) {
          console.log('   ⚠️ 權限不足：需要 Owner 權限');
        }
      }
    } else {
      console.log('   ✅ Relic 平台費已經是 0，無需修改');
    }
    
  } catch (error) {
    console.log('   ❌ Relic 合約連接失敗:', error.message);
  }
  
  console.log('');
  
  // 驗證修復結果
  console.log('📋 修復結果驗證:');
  console.log('================');
  
  try {
    const hero = await hre.ethers.getContractAt('Hero', CONTRACTS.HERO);
    const relic = await hre.ethers.getContractAt('Relic', CONTRACTS.RELIC);
    
    const heroFee = await hero.platformFee();
    const relicFee = await relic.platformFee();
    
    console.log('Hero 最終平台費:', hre.ethers.formatEther(heroFee), 'BNB');
    console.log('Relic 最終平台費:', hre.ethers.formatEther(relicFee), 'BNB');
    
    if (heroFee === 0n && relicFee === 0n) {
      console.log('\n🎉 所有平台費已成功設定為 0！');
      console.log('\n📌 現在管理後台和合約狀態一致');
      console.log('   前端鑄造頁面應該顯示：');
      console.log('   $SoulShard + 0.005 BNB (0 平台費 + 0.005 VRF費)');
    } else {
      console.log('\n⚠️ 部分設定可能未成功，請手動檢查');
    }
    
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