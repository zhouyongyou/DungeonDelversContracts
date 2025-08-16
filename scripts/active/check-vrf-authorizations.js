const hre = require("hardhat");

async function main() {
  console.log('🔐 檢查 VRF Manager 授權狀態');
  console.log('===========================\n');
  
  const vrfManagerAddress = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  const relicAddress = '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce';
  
  const vrfManager = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManagerAddress);
  
  console.log('VRF Manager:', vrfManagerAddress);
  console.log('Hero 合約:', heroAddress);
  console.log('Relic 合約:', relicAddress);
  console.log('');
  
  try {
    // 檢查授權狀態
    const heroAuthorized = await vrfManager.authorizedContracts(heroAddress);
    const relicAuthorized = await vrfManager.authorizedContracts(relicAddress);
    
    console.log('📋 當前授權狀態:');
    console.log('   Hero 合約:', heroAuthorized ? '✅ 已授權' : '❌ 未授權');
    console.log('   Relic 合約:', relicAuthorized ? '✅ 已授權' : '❌ 未授權');
    
    // 如果有任何合約未授權，進行授權
    let needsAuth = false;
    
    if (!heroAuthorized) {
      console.log('\n🔧 授權 Hero 合約...');
      const tx1 = await vrfManager.setAuthorizedContract(heroAddress, true);
      console.log('   Hero 授權交易:', tx1.hash);
      await tx1.wait();
      needsAuth = true;
    }
    
    if (!relicAuthorized) {
      console.log('\n🔧 授權 Relic 合約...');
      const tx2 = await vrfManager.setAuthorizedContract(relicAddress, true);
      console.log('   Relic 授權交易:', tx2.hash);
      await tx2.wait();
      needsAuth = true;
    }
    
    if (needsAuth) {
      console.log('\n📋 授權完成後狀態:');
      const heroAuthorizedNew = await vrfManager.authorizedContracts(heroAddress);
      const relicAuthorizedNew = await vrfManager.authorizedContracts(relicAddress);
      
      console.log('   Hero 合約:', heroAuthorizedNew ? '✅ 已授權' : '❌ 仍未授權');
      console.log('   Relic 合約:', relicAuthorizedNew ? '✅ 已授權' : '❌ 仍未授權');
    }
    
    console.log('\n🔍 額外檢查:');
    
    // 檢查 VRF Manager 的費用設定
    const vrfRequestPrice = await vrfManager.vrfRequestPrice();
    const platformFee = await vrfManager.platformFee();
    const totalFee = await vrfManager.getTotalFee();
    
    console.log('   VRF Request Price:', hre.ethers.formatEther(vrfRequestPrice), 'BNB');
    console.log('   VRF Platform Fee:', hre.ethers.formatEther(platformFee), 'BNB');
    console.log('   VRF Total Fee:', hre.ethers.formatEther(totalFee), 'BNB');
    
    if (totalFee > vrfRequestPrice) {
      console.log('   🚨 問題：總費用大於請求價格，這會導致 "Insufficient fee" 錯誤');
      console.log('   建議：將 VRF Manager 的 platformFee 設為 0');
    }
    
    // 檢查 VRF Manager 本身的狀態
    const vrfBalance = await hre.ethers.provider.getBalance(vrfManagerAddress);
    console.log('   VRF Manager BNB 餘額:', hre.ethers.formatEther(vrfBalance), 'BNB');
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });