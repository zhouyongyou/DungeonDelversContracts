const hre = require("hardhat");

async function main() {
  console.log('🔍 前端 vs 合約價格對比調試');
  console.log('=============================\n');
  
  const userAddress = '0x10925A7138649C7E1794CE646182eeb5BF8ba647';
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  const dungeonCoreAddress = '0x8a2D2b1961135127228EdD71Ff98d6B097915a13';
  const soulShardAddress = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
  
  const hero = await hre.ethers.getContractAt('Hero', heroAddress);
  const dungeonCore = await hre.ethers.getContractAt('DungeonCore', dungeonCoreAddress);
  const soulShard = await hre.ethers.getContractAt('@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20', soulShardAddress);
  
  const quantity = 50;
  
  console.log('🔍 1. 檢查基礎價格設定:');
  const mintPriceUSD = await hero.mintPriceUSD();
  console.log('Hero mintPriceUSD:', hre.ethers.formatEther(mintPriceUSD), 'USD');
  
  console.log('\n🔍 2. 通過 DungeonCore 計算價格 (前端邏輯):');
  const totalUSDAmount = BigInt(quantity * 2) * BigInt(10) ** BigInt(18); // 2 USD per NFT
  console.log('Total USD amount:', hre.ethers.formatEther(totalUSDAmount), 'USD');
  
  const frontendPrice = await dungeonCore.getSoulShardAmountForUSD(totalUSDAmount);
  console.log('前端計算結果:', hre.ethers.formatEther(frontendPrice), 'SOUL');
  
  console.log('\n🔍 3. 通過 Hero 合約計算價格 (合約邏輯):');
  const contractPrice = await hero.getRequiredSoulShardAmount(quantity);
  console.log('合約計算結果:', hre.ethers.formatEther(contractPrice), 'SOUL');
  
  console.log('\n🔍 4. 價格對比:');
  const difference = contractPrice - frontendPrice;
  const differenceEther = Number(hre.ethers.formatEther(difference));
  
  console.log('價格差異:', hre.ethers.formatEther(difference), 'SOUL');
  console.log('差異百分比:', ((differenceEther / Number(hre.ethers.formatEther(frontendPrice))) * 100).toFixed(2), '%');
  
  if (difference > 0n) {
    console.log('⚠️ 合約價格高於前端價格！');
  } else if (difference < 0n) {
    console.log('⚠️ 前端價格高於合約價格！');
  } else {
    console.log('✅ 前端和合約價格完全一致');
  }
  
  console.log('\n🔍 5. 用戶餘額檢查:');
  const balance = await soulShard.balanceOf(userAddress);
  const allowance = await soulShard.allowance(userAddress, heroAddress);
  
  console.log('用戶餘額:', hre.ethers.formatEther(balance), 'SOUL');
  console.log('授權額度:', hre.ethers.formatEther(allowance), 'SOUL');
  console.log('合約需要:', hre.ethers.formatEther(contractPrice), 'SOUL');
  
  const hasEnoughBalance = balance >= contractPrice;
  const hasEnoughAllowance = allowance >= contractPrice;
  
  console.log('\n🔍 6. 最終診斷:');
  console.log('餘額足夠:', hasEnoughBalance ? '✅ 是' : '❌ 否');
  console.log('授權足夠:', hasEnoughAllowance ? '✅ 是' : '❌ 否');
  
  if (hasEnoughBalance && hasEnoughAllowance) {
    console.log('💡 理論上可以鑄造，錯誤可能在其他地方');
    
    // 檢查合約狀態
    console.log('\n🔍 7. 合約狀態檢查:');
    const isPaused = await hero.paused();
    const commitment = await hero.userCommitments(userAddress);
    const hasPendingMint = commitment.blockNumber > 0n && !commitment.fulfilled;
    
    console.log('合約是否暫停:', isPaused);
    console.log('用戶有待處理鑄造:', hasPendingMint);
    
    if (hasPendingMint) {
      console.log('待處理鑄造詳情:', {
        blockNumber: commitment.blockNumber.toString(),
        quantity: commitment.quantity.toString(),
        fulfilled: commitment.fulfilled
      });
    }
    
  } else {
    if (!hasEnoughBalance) {
      const deficit = contractPrice - balance;
      console.log('❌ 餘額不足，缺少:', hre.ethers.formatEther(deficit), 'SOUL');
    }
    if (!hasEnoughAllowance) {
      const authDeficit = contractPrice - allowance;
      console.log('❌ 授權不足，需要額外:', hre.ethers.formatEther(authDeficit), 'SOUL');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });