const hre = require("hardhat");

async function main() {
  console.log('🔍 調試 SoulShard 需求設定');
  console.log('=========================\n');
  
  const hero = await hre.ethers.getContractAt('Hero', '0xD48867dbac5f1c1351421726B6544f847D9486af');
  const userAddress = '0xEbCF4A36Ad1485A9737025e9d72186b604487274';
  
  try {
    // 檢查鑄造價格設定（USD）
    const mintPriceUSD = await hero.mintPriceUSD();
    console.log('Mint Price USD:', hre.ethers.formatEther(mintPriceUSD));
    
    // 檢查需要的 SoulShard 數量
    const quantity = 50;
    const requiredSoulShard = await hero.getRequiredSoulShardAmount(quantity);
    console.log(`Required SoulShard for ${quantity} heroes:`, hre.ethers.formatEther(requiredSoulShard));
    
    // 檢查用戶 SoulShard 餘額和授權
    const soulShardToken = await hre.ethers.getContractAt('SoulShardToken', '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF');
    const balance = await soulShardToken.balanceOf(userAddress);
    const allowance = await soulShardToken.allowance(userAddress, hero.target);
    
    console.log('\n📊 用戶 SoulShard 狀態:');
    console.log('餘額:', hre.ethers.formatEther(balance));
    console.log('授權:', hre.ethers.formatEther(allowance));
    console.log('需求:', hre.ethers.formatEther(requiredSoulShard));
    
    console.log('\n🚨 問題分析:');
    if (requiredSoulShard > 0n) {
      console.log('鑄造需要 SoulShard！這是阻擋的主要原因');
      
      if (balance < requiredSoulShard) {
        console.log('❌ SoulShard 餘額不足');
      }
      if (allowance < requiredSoulShard) {
        console.log('❌ SoulShard 授權不足');
      }
      
      console.log('\n🔧 建議解決方案:');
      console.log('1. 將 mintPriceUSD 設為 0（暫時移除 SoulShard 需求）');
      console.log('2. 或者為測試帳戶提供足夠的 SoulShard');
    } else {
      console.log('✅ 不需要 SoulShard');
    }
    
  } catch (error) {
    console.error('調試失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });