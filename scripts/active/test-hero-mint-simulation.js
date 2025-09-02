const hre = require("hardhat");

async function main() {
  console.log('🧪 模擬 Hero 合約鑄造流程');
  console.log('========================\n');
  
  const userAddress = '0xEbCF4A36Ad1485A9737025e9d72186b604487274';
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  const vrfManagerAddress = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';
  const soulShardAddress = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
  
  const hero = await hre.ethers.getContractAt('Hero', heroAddress);
  const vrfManager = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManagerAddress);
  const soulShard = await hre.ethers.getContractAt('@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20', soulShardAddress);
  
  const quantity = 50;
  
  console.log('🔍 1. 檢查 Hero 合約狀態:');
  const mintPriceUSD = await hero.mintPriceUSD();
  const platformFee = await hero.platformFee();
  const vrfManagerInHero = await hero.vrfManager();
  
  console.log('mintPriceUSD:', hre.ethers.formatEther(mintPriceUSD), 'USD');
  console.log('platformFee:', hre.ethers.formatEther(platformFee), 'BNB');
  console.log('vrfManager:', vrfManagerInHero);
  console.log('期望 VRF Manager:', vrfManagerAddress);
  console.log('VRF Manager 匹配:', vrfManagerInHero.toLowerCase() === vrfManagerAddress.toLowerCase());
  
  console.log('\n🔍 2. 計算 Hero 合約的費用邏輯:');
  
  // 模擬 Hero 合約內部的計算
  const requiredSoulShard = await hero.getRequiredSoulShardAmount(quantity);
  console.log('需要 SoulShard:', hre.ethers.formatEther(requiredSoulShard), 'SOUL');
  
  // 模擬 BNB 費用計算
  let requiredPayment = platformFee * BigInt(quantity);
  console.log('平台費總計:', hre.ethers.formatEther(requiredPayment), 'BNB');
  
  if (vrfManagerInHero !== '0x0000000000000000000000000000000000000000') {
    const vrfFee = await vrfManager.getVrfRequestPrice();
    requiredPayment += vrfFee;
    console.log('VRF 費用:', hre.ethers.formatEther(vrfFee), 'BNB');
    console.log('總 BNB 需求:', hre.ethers.formatEther(requiredPayment), 'BNB');
  }
  
  console.log('\n🔍 3. 檢查用戶狀態:');
  const balance = await soulShard.balanceOf(userAddress);
  const allowance = await soulShard.allowance(userAddress, heroAddress);
  const bnbBalance = await hre.ethers.provider.getBalance(userAddress);
  
  console.log('SoulShard 餘額:', hre.ethers.formatEther(balance), 'SOUL');
  console.log('SoulShard 授權:', hre.ethers.formatEther(allowance), 'SOUL');
  console.log('BNB 餘額:', hre.ethers.formatEther(bnbBalance), 'BNB');
  
  console.log('\n🔍 4. 檢查可能的失敗點:');
  
  // 檢查 SoulShard 轉移（第197行）
  if (requiredSoulShard > 0n) {
    console.log('❌ SoulShard 轉移會執行，需要餘額和授權');
    if (balance < requiredSoulShard) {
      console.log('❌ SoulShard 餘額不足');
    }
    if (allowance < requiredSoulShard) {
      console.log('❌ SoulShard 授權不足');
    }
  } else {
    console.log('⚠️ SoulShard 需求為 0，但合約仍會嘗試 safeTransferFrom(user, hero, 0)');
    console.log('   這可能需要授權，即使轉移 0 個代幣');
  }
  
  // 檢查 BNB 費用（第194行）
  console.log('\nBNB 費用檢查:');
  console.log('需要:', hre.ethers.formatEther(requiredPayment), 'BNB');
  console.log('持有:', hre.ethers.formatEther(bnbBalance), 'BNB');
  console.log('足夠:', bnbBalance >= requiredPayment ? '✅ 是' : '❌ 否');
  
  // 檢查 VRF 調用（第205行）
  console.log('\nVRF 調用檢查:');
  const vrfTotalFee = await vrfManager.getTotalFee();
  const vrfRequestPrice = await vrfManager.vrfRequestPrice();
  const vrfPlatformFee = await vrfManager.platformFee();
  
  console.log('VRF 總費用 (Manager 計算):', hre.ethers.formatEther(vrfTotalFee), 'BNB');
  console.log('VRF Request Price:', hre.ethers.formatEther(vrfRequestPrice), 'BNB');
  console.log('VRF Platform Fee:', hre.ethers.formatEther(vrfPlatformFee), 'BNB');
  console.log('Hero 會發送:', hre.ethers.formatEther(vrfRequestPrice), 'BNB');
  console.log('VRF 期待:', hre.ethers.formatEther(vrfTotalFee), 'BNB');
  console.log('匹配:', vrfRequestPrice >= vrfTotalFee ? '✅ 是' : '❌ 否');
  
  console.log('\n🔍 5. 檢查用戶待處理狀態:');
  const commitment = await hero.userCommitments(userAddress);
  const hasPendingMint = commitment.blockNumber > 0n && !commitment.fulfilled;
  
  console.log('有待處理鑄造:', hasPendingMint);
  if (hasPendingMint) {
    console.log('待處理詳情:', {
      blockNumber: commitment.blockNumber.toString(),
      quantity: commitment.quantity.toString(),
      fulfilled: commitment.fulfilled
    });
  }
  
  console.log('\n📋 診斷結論:');
  if (requiredSoulShard === 0n && bnbBalance >= requiredPayment && vrfRequestPrice >= vrfTotalFee && !hasPendingMint) {
    console.log('✅ 理論上應該可以鑄造');
    console.log('💡 如果仍然失敗，問題可能在合約內部邏輯或授權');
  } else {
    console.log('❌ 發現問題，需要解決後才能鑄造');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });