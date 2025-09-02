const hre = require("hardhat");

async function main() {
  console.log('🔍 調試 Relic 合約配置');
  console.log('======================\n');
  
  const userAddress = '0xEbCF4A36Ad1485A9737025e9d72186b604487274';
  const relicAddress = '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce';
  const vrfManagerAddress = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';
  const soulShardAddress = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
  
  console.log('Relic 合約:', relicAddress);
  console.log('用戶:', userAddress);
  console.log('');
  
  try {
    const relic = await hre.ethers.getContractAt('Relic', relicAddress);
    const vrfManager = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManagerAddress);
    const soulShard = await hre.ethers.getContractAt('@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20', soulShardAddress);
    
    console.log('🔍 1. Relic 合約基礎配置:');
    const mintPriceUSD = await relic.mintPriceUSD();
    const platformFee = await relic.platformFee();
    const vrfManagerInRelic = await relic.vrfManager();
    const isPaused = await relic.paused();
    
    console.log('   mintPriceUSD:', hre.ethers.formatEther(mintPriceUSD), 'USD');
    console.log('   platformFee:', hre.ethers.formatEther(platformFee), 'BNB');
    console.log('   vrfManager:', vrfManagerInRelic);
    console.log('   期望 VRF Manager:', vrfManagerAddress);
    console.log('   VRF Manager 正確:', vrfManagerInRelic.toLowerCase() === vrfManagerAddress.toLowerCase());
    console.log('   合約暫停:', isPaused);
    
    console.log('\n🔍 2. 計算 Relic 的費用需求:');
    const quantity = 50;
    const requiredSoulShard = await relic.getRequiredSoulShardAmount(quantity);
    console.log('   需要 SoulShard:', hre.ethers.formatEther(requiredSoulShard), 'SOUL');
    
    // BNB 費用計算
    let requiredPayment = platformFee * BigInt(quantity);
    const vrfFee = await vrfManager.getVrfRequestPrice();
    requiredPayment += vrfFee;
    
    console.log('   平台費總計:', hre.ethers.formatEther(platformFee * BigInt(quantity)), 'BNB');
    console.log('   VRF 費用:', hre.ethers.formatEther(vrfFee), 'BNB');
    console.log('   總 BNB 需求:', hre.ethers.formatEther(requiredPayment), 'BNB');
    
    console.log('\n🔍 3. 用戶狀態檢查:');
    const balance = await soulShard.balanceOf(userAddress);
    const allowance = await soulShard.allowance(userAddress, relicAddress);
    const bnbBalance = await hre.ethers.provider.getBalance(userAddress);
    
    console.log('   SoulShard 餘額:', hre.ethers.formatEther(balance), 'SOUL');
    console.log('   SoulShard 授權:', hre.ethers.formatEther(allowance), 'SOUL');
    console.log('   BNB 餘額:', hre.ethers.formatEther(bnbBalance), 'BNB');
    
    console.log('\n🔍 4. 問題診斷:');
    
    if (isPaused) {
      console.log('❌ 合約被暫停');
    }
    
    if (requiredSoulShard > balance) {
      console.log('❌ SoulShard 餘額不足');
      console.log('   差額:', hre.ethers.formatEther(requiredSoulShard - balance), 'SOUL');
    }
    
    if (requiredSoulShard > allowance) {
      console.log('❌ SoulShard 授權不足');
      console.log('   需要授權:', hre.ethers.formatEther(requiredSoulShard), 'SOUL');
    }
    
    if (requiredPayment > bnbBalance) {
      console.log('❌ BNB 餘額不足');
    }
    
    if (vrfManagerInRelic.toLowerCase() !== vrfManagerAddress.toLowerCase()) {
      console.log('❌ VRF Manager 地址不正確');
    }
    
    // 檢查待處理鑄造
    const commitment = await relic.userCommitments(userAddress);
    const hasPendingMint = commitment.blockNumber > 0n && !commitment.fulfilled;
    
    if (hasPendingMint) {
      console.log('❌ 有待處理的鑄造');
      console.log('   詳情:', {
        blockNumber: commitment.blockNumber.toString(),
        quantity: commitment.quantity.toString(),
        fulfilled: commitment.fulfilled
      });
    }
    
    // 檢查 VRF Manager 授權
    const isRelicAuthorized = await vrfManager.authorizedContracts(relicAddress);
    if (!isRelicAuthorized) {
      console.log('❌ Relic 合約未被 VRF Manager 授權');
    }
    
    console.log('\n🎯 最可能的問題:');
    if (mintPriceUSD > hre.ethers.parseEther('2')) {
      console.log('🚨 Relic mintPriceUSD 可能有精度問題！');
      console.log('   當前值:', mintPriceUSD.toString(), 'wei');
      console.log('   期望值:', hre.ethers.parseEther('2').toString(), 'wei (2 USD)');
    }
    
    if (requiredSoulShard === 0n && allowance === 0n) {
      console.log('🚨 即使需求為 0，仍需要授權才能執行 safeTransferFrom(user, relic, 0)');
    }
    
  } catch (error) {
    console.error('❌ 調試失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });