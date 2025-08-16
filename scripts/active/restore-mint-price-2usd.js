const hre = require("hardhat");

async function main() {
  console.log('🔄 恢復鑄造價格為 2 USD');
  console.log('========================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('執行賬戶:', signer.address);
  console.log('');
  
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  
  try {
    const hero = await hre.ethers.getContractAt('Hero', heroAddress);
    
    const currentPrice = await hero.mintPriceUSD();
    console.log('當前價格:', hre.ethers.formatEther(currentPrice), 'USD');
    
    if (currentPrice !== hre.ethers.parseEther('2')) {
      console.log('🔧 設定價格為 2 USD...');
      const tx = await hero.setMintPriceUSD(hre.ethers.parseEther('2'));
      console.log('交易哈希:', tx.hash);
      await tx.wait();
      
      const newPrice = await hero.mintPriceUSD();
      console.log('✅ 新價格:', hre.ethers.formatEther(newPrice), 'USD');
      
      // 測試 SoulShard 需求
      const requiredSoulShard = await hero.getRequiredSoulShardAmount(1);
      console.log('1 個 Hero 需要 SoulShard:', hre.ethers.formatEther(requiredSoulShard));
      
    } else {
      console.log('✅ 價格已經是 2 USD');
    }
    
    console.log('\n💡 現在前端需要處理:');
    console.log('1. 檢查用戶 SoulShard 餘額');
    console.log('2. 檢查 SoulShard 授權額度');
    console.log('3. 如果授權不足，先調用 approve');
    console.log('4. 然後調用 mintFromWallet，同時發送正確的 BNB 數量');
    
    console.log('\n📋 前端需要的完整流程:');
    console.log('```javascript');
    console.log('// 1. 計算需要的 SoulShard');
    console.log('const requiredSoulShard = await heroContract.getRequiredSoulShardAmount(quantity);');
    console.log('');
    console.log('// 2. 檢查餘額和授權');
    console.log('const balance = await soulShardContract.balanceOf(userAddress);');
    console.log('const allowance = await soulShardContract.allowance(userAddress, heroAddress);');
    console.log('');
    console.log('// 3. 如果需要授權');
    console.log('if (allowance < requiredSoulShard) {');
    console.log('  await soulShardContract.approve(heroAddress, requiredSoulShard);');
    console.log('}');
    console.log('');
    console.log('// 4. 計算 BNB 費用');
    console.log('const platformFee = await heroContract.platformFee();');
    console.log('const vrfFee = await vrfManagerContract.getVrfRequestPrice();');
    console.log('const totalBNB = platformFee * quantity + vrfFee;');
    console.log('');
    console.log('// 5. 執行鑄造');
    console.log('await heroContract.mintFromWallet(quantity, { value: totalBNB });');
    console.log('```');
    
  } catch (error) {
    console.error('❌ 恢復價格失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });