const hre = require("hardhat");

async function main() {
  console.log('🔧 修復 VRF Manager 平台費問題');
  console.log('================================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('執行賬戶:', signer.address);
  console.log('');
  
  const vrfManagerAddress = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';
  console.log('VRF Manager 地址:', vrfManagerAddress);
  
  try {
    const vrfManager = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManagerAddress);
    
    // 檢查當前費用
    const currentVrfPrice = await vrfManager.vrfRequestPrice();
    const currentPlatformFee = await vrfManager.platformFee();
    const currentTotal = currentVrfPrice + currentPlatformFee;
    
    console.log('📊 當前 VRF Manager 費用狀態:');
    console.log('   VRF Request Price:', hre.ethers.formatEther(currentVrfPrice), 'BNB');
    console.log('   Platform Fee:', hre.ethers.formatEther(currentPlatformFee), 'BNB');
    console.log('   總計:', hre.ethers.formatEther(currentTotal), 'BNB');
    console.log('');
    
    if (currentPlatformFee > 0n) {
      console.log('🚨 發現問題：VRF Manager 的 platformFee > 0');
      console.log('   這導致雙重收費：Hero 收平台費 + VRF Manager 也收平台費');
      console.log('');
      console.log('🔧 修復：將 VRF Manager 的 platformFee 設為 0...');
      
      // 檢查是否有 setPlatformFee 函數
      try {
        const tx = await vrfManager.setPlatformFee(0);
        console.log('   交易哈希:', tx.hash);
        await tx.wait();
        
        const newPlatformFee = await vrfManager.platformFee();
        console.log('   ✅ VRF Platform Fee 已設為:', hre.ethers.formatEther(newPlatformFee), 'BNB');
        
        const newTotal = currentVrfPrice + newPlatformFee;
        console.log('   ✅ 新的總費用:', hre.ethers.formatEther(newTotal), 'BNB');
        
      } catch (error) {
        console.log('   ❌ 設定失敗:', error.message);
        if (error.message.includes('function selector was not recognized')) {
          console.log('   ⚠️ VRF Manager 沒有 setPlatformFee 函數');
          console.log('   需要重新部署或者修改 Hero 合約的支付邏輯');
        }
      }
    } else {
      console.log('✅ VRF Manager 的 platformFee 已經是 0，問題可能在其他地方');
    }
    
    // 測試驗證
    console.log('\n📋 修復後驗證:');
    console.log('================');
    
    const finalVrfPrice = await vrfManager.vrfRequestPrice();
    const finalPlatformFee = await vrfManager.platformFee();
    const finalTotal = finalVrfPrice + finalPlatformFee;
    
    console.log('最終 VRF Request Price:', hre.ethers.formatEther(finalVrfPrice), 'BNB');
    console.log('最終 Platform Fee:', hre.ethers.formatEther(finalPlatformFee), 'BNB');
    console.log('最終總費用:', hre.ethers.formatEther(finalTotal), 'BNB');
    
    if (finalTotal <= hre.ethers.parseEther('0.005')) {
      console.log('\n🎉 問題已修復！Hero 合約傳遞的 0.005 BNB 現在足夠了');
    } else {
      console.log('\n⚠️ 問題仍然存在，需要其他解決方案');
    }
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });