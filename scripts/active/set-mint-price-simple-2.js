const hre = require("hardhat");

async function main() {
  console.log('🔧 設定 Hero 鑄造價格為簡單的 2');
  console.log('===============================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('執行賬戶:', signer.address);
  console.log('');
  
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  
  try {
    const hero = await hre.ethers.getContractAt('Hero', heroAddress);
    
    const currentPrice = await hero.mintPriceUSD();
    console.log('當前價格 (wei):', currentPrice.toString());
    console.log('當前價格 (格式化):', hre.ethers.formatEther(currentPrice), 'USD');
    
    // 設定為簡單的 2 (不是 2 * 10^18，就是 2)
    const correctPrice = 2n;
    
    console.log('設定價格為:', correctPrice.toString());
    
    const tx = await hero.setMintPriceUSD(correctPrice);
    console.log('交易哈希:', tx.hash);
    await tx.wait();
    
    const newPrice = await hero.mintPriceUSD();
    console.log('✅ 新價格 (wei):', newPrice.toString());
    console.log('✅ 新價格 (格式化):', hre.ethers.formatEther(newPrice), 'USD');
    
    // 測試合約計算結果
    console.log('\n🧪 測試計算結果:');
    for (let qty of [1, 10, 50]) {
      const testAmount = await hero.getRequiredSoulShardAmount(qty);
      const amountInEther = Number(hre.ethers.formatEther(testAmount));
      console.log(`${qty} 個 Hero: ${amountInEther.toFixed(2)} SOUL (每個 ${(amountInEther/qty).toFixed(2)} SOUL)`);
    }
    
    // 與用戶餘額對比
    const userBalance = 651462529.77;
    const requiredFor50 = await hero.getRequiredSoulShardAmount(50);
    const requiredAmount = Number(hre.ethers.formatEther(requiredFor50));
    
    console.log('\n💰 最終餘額檢查:');
    console.log('用戶餘額:', userBalance.toFixed(2), 'SOUL');
    console.log('50 個 Hero 需要:', requiredAmount.toFixed(2), 'SOUL');
    console.log('餘額足夠:', userBalance >= requiredAmount ? '✅ 是' : '❌ 否');
    
    if (userBalance >= requiredAmount) {
      console.log('\n🎉 問題已解決！現在可以嘗試鑄造了');
    }
    
  } catch (error) {
    console.error('❌ 設定失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });