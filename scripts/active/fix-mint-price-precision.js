const hre = require("hardhat");

async function main() {
  console.log('🔧 修復 Hero 鑄造價格精度問題');
  console.log('===============================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('執行賬戶:', signer.address);
  console.log('');
  
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  
  try {
    const hero = await hre.ethers.getContractAt('Hero', heroAddress);
    
    const currentPrice = await hero.mintPriceUSD();
    console.log('當前錯誤價格:', hre.ethers.formatEther(currentPrice), 'USD');
    console.log('當前錯誤價格 (wei):', currentPrice.toString());
    
    // 正確的 2 USD 應該是 2 * 10^18 = 2000000000000000000
    // 但是我們之前錯誤地設定了，現在需要設定為正確的值
    const correctPrice = hre.ethers.parseEther('2'); // 2 * 10^18
    
    console.log('正確價格應該是:', hre.ethers.formatEther(correctPrice), 'USD');
    console.log('正確價格 (wei):', correctPrice.toString());
    
    if (currentPrice !== correctPrice) {
      console.log('🔧 設定正確的價格...');
      const tx = await hero.setMintPriceUSD(correctPrice);
      console.log('交易哈希:', tx.hash);
      await tx.wait();
      
      const newPrice = await hero.mintPriceUSD();
      console.log('✅ 新價格:', hre.ethers.formatEther(newPrice), 'USD');
      
      // 測試合約計算結果
      const testAmount = await hero.getRequiredSoulShardAmount(50);
      console.log('修復後 50 個 Hero 需要:', hre.ethers.formatEther(testAmount), 'SOUL');
      
      // 與用戶餘額對比
      const userBalance = 651462529.77114398013948026; // 從前端日誌獲取
      const requiredAmount = Number(hre.ethers.formatEther(testAmount));
      
      console.log('\n💰 餘額檢查:');
      console.log('用戶餘額:', userBalance.toFixed(2), 'SOUL');
      console.log('需要數量:', requiredAmount.toFixed(2), 'SOUL');
      console.log('餘額足夠:', userBalance >= requiredAmount ? '✅ 是' : '❌ 否');
      
    } else {
      console.log('✅ 價格已經正確');
    }
    
  } catch (error) {
    console.error('❌ 修復失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });